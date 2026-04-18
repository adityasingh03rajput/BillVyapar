# Employee System — Security & Logic Flaws

Scanned files: `backend/src/routes/employees.js`, `attendance.js`, `roles.js`, `backend/src/models/Employee.js`, `Attendance.js`, `Role.js`, `backend/src/index.js`, `backend/src/middleware/auth.js`, `backend/src/lib/jwt.js`, `src/app/contexts/AuthContext.tsx`, `src/app/pages/EmployeesPage.tsx`, `EmployeeAttendancePage.tsx`, `AttendancePage.tsx`, `EmployeeTrackingMap.tsx`

---

## Critical Security Flaws

### 1. `/attendance/live-location` — No Authentication
**File:** `backend/src/routes/attendance.js`

The native Android tracking endpoint accepts GPS data with zero authentication. Anyone who knows an `employeeId` and `ownerUserId` (both MongoDB ObjectIDs, which are guessable/enumerable) can:
- Spoof an employee's location on the owner's live map
- Flood the DB with fake location history
- Manipulate `totalKm` calculations

```js
// No requireAuth — only checks body fields exist
attendanceRouter.post('/live-location', async (req, res) => {
  const { employeeId, ownerUserId, ... } = req.body;
  // No verification that employeeId belongs to ownerUserId
```

**Fix:** Require a pre-shared secret or a short-lived token issued at check-in time. At minimum, verify `Employee.findOne({ _id: employeeId, ownerUserId })` before trusting the data.

---

### 2. Socket.io — No Authentication on `join-owner` / `employee-join`
**File:** `backend/src/index.js`

Any socket client can join any owner's room by emitting `join-owner` with an arbitrary `ownerUserId`. This means:
- Anyone can eavesdrop on all live employee locations for any business
- Anyone can emit `employee-location` events and inject fake positions into the owner's map

```js
socket.on("join-owner", (ownerUserId) => {
  if (ownerUserId) socket.join(`owner:${ownerUserId}`); // no token check
});
socket.on("employee-location", (data) => {
  // data.ownerUserId is fully trusted from the client
  io.to(`owner:${ownerUserId}`).emit("employee-location", { ... });
});
```

**Fix:** Require a valid JWT on socket connection (`io.use(authMiddleware)`). Derive `ownerUserId` from the verified token, never from client-supplied data.

---

### 3. JWT Tokens Never Expire in Practice (7-Day Tokens, No Revocation)
**File:** `backend/src/lib/jwt.js`, `backend/src/middleware/auth.js`

Tokens are signed with a 7-day expiry and `requireAuth` only verifies the signature — it never checks a revocation list or session table. If an employee is deactivated (`isActive: false`), their existing token remains valid for up to 7 days. The `requireValidDeviceSession` middleware exists but is **not applied to any employee route**.

```js
// requireAuth — no DB lookup, no revocation check
req.userId = payload.sub;
req.user = payload.user;
next(); // token is trusted until expiry
```

**Fix:** On employee routes, check `employee.isActive` on each request, or maintain a token blacklist/revocation set. Apply `requireValidDeviceSession` to employee routes.

---

### 4. Employee Login Leaks Existence via Different Error Messages
**File:** `backend/src/routes/employees.js`

```js
const employee = await Employee.findOne({ email });
if (!employee) return res.status(400).json({ error: 'Invalid credentials' });
if (!employee.isActive) return res.status(403).json({ error: 'Your account has been deactivated...' });
```

The `403` status for deactivated accounts vs `400` for unknown email allows an attacker to enumerate which emails are registered employees. The deactivation message also confirms the account exists.

**Fix:** Return the same `400 Invalid credentials` for all failure cases. Only show the deactivation message after a successful password check.

---

### 5. Gemini API Key Exposed in Frontend Bundle
**File:** `src/app/pages/EmployeesPage.tsx`

```js
const GEMINI_KEY = (import.meta as any).env?.VITE_GEMINI_KEY || "";
```

`VITE_` prefixed env vars are bundled into the client-side JavaScript and visible to anyone who inspects the app. The key is used directly from the browser to call Google's Generative Language API.

**Fix:** Proxy Gemini calls through the backend (like the existing `/attendance/places/autocomplete` pattern). Never expose API keys in frontend code.

---

### 6. Google Maps API Key Exposed in Frontend Bundle
**File:** `src/app/components/EmployeeTrackingMap.tsx`

```js
const GOOGLE_MAPS_KEY = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY ?? "";
```

Same issue — the Maps API key is visible in the client bundle. Without HTTP referrer restrictions configured in Google Cloud Console, this key can be abused for unlimited Maps/Places API calls billed to the owner.

**Fix:** Restrict the key to specific HTTP referrers in Google Cloud Console. For Places/Geocoding calls, route through the backend (already partially done for autocomplete).

---

## Logic & Data Integrity Flaws

### 7. Employee Can Mark Attendance Multiple Times if `checkOutTime` is Set
**File:** `backend/src/routes/attendance.js`

The `POST /attendance/mark` flow:
- No check-in → creates record (check-in)
- Existing record, no checkout → sets checkout
- Existing record with checkout → returns `already_complete`

But there's no protection against an employee checking out and then the record being manually reset by the owner (via `PATCH /attendance/:id`). More critically, the `already_complete` path returns `200 ok` silently — the frontend shows no error, which can confuse employees who think they've re-checked-in.

---

### 8. `totalKm` Can Be Manipulated via Socket
**File:** `backend/src/index.js` (socket `employee-location` handler)

The km calculation in the socket handler uses a **5m minimum threshold** (`addedKm < 0.005`), but the HTTP `/live-location` handler uses a **20m threshold** (`addedKm < 0.020`). These are inconsistent. An employee rapidly emitting small GPS jitter via socket will accumulate fake km that the HTTP path would filter out.

---

### 9. Task Geofence Check is Skipped on `cycleTaskStatus` in Employee UI
**File:** `src/app/pages/EmployeeAttendancePage.tsx`

```js
const cycleTaskStatus = async (taskId, current) => {
  const next = current === "pending" ? "in_progress" : ...;
  // No GPS coordinates sent
  const res = await fetch(`/attendance/my/tasks/${taskId}`, {
    body: JSON.stringify({ status: next }) // no lat/lng
  });
```

The `PATCH /attendance/my/tasks/:taskId` endpoint enforces geofencing only when `status === 'done'` AND `lat/lng` are provided. Since `cycleTaskStatus` never sends coordinates, an employee can mark a task `done` from anywhere by cycling through statuses. The dedicated `taskCheckout` function does send GPS, but `cycleTaskStatus` bypasses it entirely.

**Fix:** Either always send GPS coordinates in `cycleTaskStatus`, or disable the cycle-to-done path when a task has geofencing enabled and force use of the checkout endpoint.

---

### 10. Owner Can Assign Tasks to Any Attendance Record (Cross-Profile)
**File:** `backend/src/routes/attendance.js`

```js
attendanceRouter.post('/:id/tasks', requireAuth, async (req, res) => {
  const record = await Attendance.findOneAndUpdate(
    { _id: req.params.id, ownerUserId: req.userId }, ...
  );
```

This correctly scopes by `ownerUserId`, but does **not** verify that the attendance record's `profileId` matches the owner's currently active profile. An owner with multiple business profiles can add tasks to employees of a different profile.

---

### 11. `httpOnlineTimers` Map Lives In-Memory — Lost on Server Restart
**File:** `backend/src/routes/attendance.js`

```js
const httpOnlineTimers = new Map();
```

When the server restarts (deploy, crash, scale-up), all in-memory online timers are lost. Employees who were actively tracking will appear offline on the dashboard until their next GPS ping arrives (~15s). In a multi-instance deployment (horizontal scaling), each instance has its own map — an employee pinging instance A will never appear online to an owner connected to instance B.

**Fix:** Use Redis pub/sub or a shared store for online state in production. At minimum, document the single-instance limitation.

---

### 12. No Rate Limiting on `/attendance/live-location`
**File:** `backend/src/routes/attendance.js`, `backend/src/index.js`

The unauthenticated `/attendance/live-location` endpoint is not covered by the `authLimiter` (only `/employees/login` and `/auth` are). The general `apiLimiter` (600 req/min per IP) applies, but since this endpoint requires no auth, a single IP can flood it with 600 fake location updates per minute for any employee.

---

### 13. Employee Email Cannot Be Changed After Creation
**File:** `backend/src/routes/employees.js`

The `PATCH /employees/:id` handler accepts `name`, `phone`, `role`, `isActive`, `password`, `customRoleId`, `schedule` — but not `email`. If an employee changes their email address, the owner must delete and recreate the account, losing all attendance history linked to the old `employeeId`.

---

## Frontend / UX Flaws

### 14. `currentProfile` Parsed with Double JSON.parse
**File:** `src/app/pages/EmployeesPage.tsx`

```js
const p = raw ? JSON.parse(raw) : null;
const pid = (typeof p === 'string' ? JSON.parse(p) : p)?.id ?? '';
```

This double-parse pattern appears in multiple places (`loadEmployees`, `saveEmp`). It suggests `currentProfile` is sometimes stored as a JSON string inside a JSON string — a serialization bug. If the format ever normalizes, this will silently break profile scoping for all employee operations.

---

### 15. Employee Deactivation Doesn't Terminate Active Sessions
**File:** `backend/src/routes/employees.js`, `backend/src/middleware/auth.js`

When an owner sets `isActive: false` via `PATCH /employees/:id`, the employee's JWT remains valid. The deactivation check only happens at login (`POST /employees/login`). A deactivated employee with an active session can continue to mark attendance, update tasks, and stream GPS for up to 7 days.

**Fix:** Add an `isActive` check inside `requireAuth` for employee-type tokens, or store a `deactivatedAt` timestamp and reject tokens issued before it.

---

### 16. Location History Not Cleaned Up When Employee is Deleted
**File:** `backend/src/routes/employees.js`

```js
employeesRouter.delete('/:id', requireAuth, async (req, res) => {
  const result = await Employee.deleteOne({ _id: req.params.id, ownerUserId: req.userId });
```

Deleting an employee does not cascade-delete their `Attendance` records. Orphaned attendance records remain in the DB with a dangling `employeeId` reference. The attendance queries handle this gracefully (returning `null` for the employee field), but the data accumulates indefinitely and may contain personal GPS data (GDPR concern).

---

### 17. Gemini Geocoding Used for Work Location Coordinates (Unreliable)
**File:** `src/app/pages/EmployeesPage.tsx`

The `smartGeocode` function uses Gemini (an LLM) to resolve addresses to lat/lng coordinates. LLMs are not geocoding engines — they hallucinate coordinates. A hallucinated work location will cause all employees at that site to fail geofence checks, blocking legitimate check-ins silently.

**Fix:** Use the existing Google Places API proxy (`/attendance/places/autocomplete` + `/attendance/places/details`) which is already implemented and returns real coordinates.

---

### 18. Socket.io CORS Set to Wildcard `"*"`
**File:** `backend/src/index.js`

```js
const io = new SocketIOServer(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});
```

While the HTTP CORS is properly restricted to known origins, the Socket.io CORS is open to all origins. This means any website can establish a socket connection to the backend and join owner rooms (see Flaw #2).

---

## Summary Table

| # | Severity | Category | Description |
|---|----------|----------|-------------|
| 1 | Critical | Security | Unauthenticated GPS injection via `/live-location` |
| 2 | Critical | Security | Socket.io rooms joinable without authentication |
| 3 | High | Security | Deactivated employees retain valid 7-day tokens |
| 4 | High | Security | Login response leaks account existence |
| 5 | High | Security | Gemini API key exposed in client bundle |
| 6 | High | Security | Google Maps API key exposed in client bundle |
| 7 | Medium | Logic | Silent `already_complete` on re-check-in attempt |
| 8 | Medium | Logic | Inconsistent km thresholds between socket and HTTP paths |
| 9 | Medium | Logic | Task geofence bypassed via status cycling |
| 10 | Medium | Logic | Cross-profile task assignment not blocked |
| 11 | Medium | Reliability | Online presence state lost on server restart / multi-instance |
| 12 | Medium | Security | No rate limit on unauthenticated `/live-location` |
| 13 | Low | UX | Employee email immutable after creation |
| 14 | Low | Bug | Double JSON.parse on `currentProfile` is fragile |
| 15 | High | Security | Deactivation doesn't invalidate active sessions |
| 16 | Low | Data | Orphaned attendance records on employee delete (GDPR) |
| 17 | Medium | Reliability | LLM used for geocoding — coordinates may be hallucinated |
| 18 | High | Security | Socket.io CORS wildcard bypasses HTTP CORS restrictions |
