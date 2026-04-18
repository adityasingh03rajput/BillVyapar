import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { Employee } from '../models/Employee.js';
import { Attendance } from '../models/Attendance.js';
import { Role } from '../models/Role.js';
import { requireAuth, invalidateEmployeeActiveCache } from '../middleware/auth.js';
import { signAccessToken } from '../lib/jwt.js';

export const employeesRouter = Router();

// ── Owner routes (require owner auth) ────────────────────────────────────────

// GET /employees?profileId=xxx  — list employees for a profile
employeesRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const { profileId, search } = req.query;
    const filter = { ownerUserId: req.userId };
    if (profileId) filter.profileId = profileId;
    
    if (search) {
      const regex = new RegExp(String(search), 'i');
      filter.$or = [
        { name: regex },
        { email: regex },
        { phone: regex },
      ];
    }

    const employees = await Employee.find(filter)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .lean();
    res.json(employees);
  } catch (err) { next(err); }
});

// POST /employees  — create employee
employeesRouter.post('/', requireAuth, async (req, res, next) => {
  try {
    const { name, email, phone, password, role, profileId, customRoleId } = req.body || {};
    if (!name || !email || !password || !profileId) {
      return res.status(400).json({ error: 'name, email, password and profileId are required' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = await Employee.findOne({
      ownerUserId: req.userId,
      email: String(email).toLowerCase(),
    });
    if (existing) {
      return res.status(400).json({ error: 'An employee with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const employee = await Employee.create({
      ownerUserId: req.userId,
      profileId,
      name: String(name).trim(),
      email: String(email).toLowerCase().trim(),
      phone: phone ? String(phone).trim() : null,
      passwordHash,
      role: role || 'salesperson',
      customRoleId: customRoleId || null,
    });

    const { passwordHash: _, ...safe } = employee.toObject();
    res.status(201).json(safe);
  } catch (err) { next(err); }
});

// PATCH /employees/:id  — update employee
employeesRouter.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const { name, email, phone, role, isActive, password, customRoleId, schedule } = req.body || {};
    const employee = await Employee.findOne({ _id: req.params.id, ownerUserId: req.userId });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    if (name !== undefined) employee.name = String(name).trim();
    if (phone !== undefined) employee.phone = phone ? String(phone).trim() : null;
    if (role !== undefined) employee.role = role;
    if (customRoleId !== undefined) employee.customRoleId = customRoleId || null;

    // ── Flaw #13 fix: allow email updates ────────────────────────────────────
    if (email !== undefined) {
      const normalized = String(email).toLowerCase().trim();
      if (normalized !== employee.email) {
        const conflict = await Employee.findOne({ ownerUserId: req.userId, email: normalized, _id: { $ne: employee._id } });
        if (conflict) return res.status(400).json({ error: 'An employee with this email already exists' });
        employee.email = normalized;
      }
    }

    if (isActive !== undefined) {
      employee.isActive = Boolean(isActive);
      // ── Flaw #15 fix: invalidate the isActive cache immediately on deactivation
      // so the 60s TTL doesn't keep a deactivated employee's session alive.
      if (!employee.isActive) invalidateEmployeeActiveCache(employee._id);
    }
    if (password) {
      if (String(password).length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
      employee.passwordHash = await bcrypt.hash(String(password), 10);
    }

    // ── Manager-controlled attendance schedule ─────────────────────────────
    if (schedule && typeof schedule === 'object') {
      if (!employee.schedule) employee.schedule = {};
      // Validate time format HH:MM
      const timeRe = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (schedule.checkInTime !== undefined) {
        if (schedule.checkInTime && !timeRe.test(schedule.checkInTime))
          return res.status(400).json({ error: 'checkInTime must be in HH:MM format' });
        employee.schedule.checkInTime = schedule.checkInTime || null;
      }
      if (schedule.checkOutTime !== undefined) {
        if (schedule.checkOutTime && !timeRe.test(schedule.checkOutTime))
          return res.status(400).json({ error: 'checkOutTime must be in HH:MM format' });
        employee.schedule.checkOutTime = schedule.checkOutTime || null;
      }
      if (schedule.geofenceMeters !== undefined) {
        employee.schedule.geofenceMeters = schedule.geofenceMeters != null
          ? Math.max(0, Number(schedule.geofenceMeters))
          : null;
      }
      if (schedule.workLocation !== undefined) {
        employee.schedule.workLocation = schedule.workLocation || { lat: null, lng: null, address: null };
      }
    }

    await employee.save();
    const { passwordHash: _, ...safe } = employee.toObject();
    res.json(safe);
  } catch (err) { next(err); }
});

// DELETE /employees/:id
employeesRouter.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const result = await Employee.deleteOne({ _id: req.params.id, ownerUserId: req.userId });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Employee not found' });

    // ── Flaw #16 fix: anonymize attendance records (GDPR) ────────────────────
    // Preserve aggregate data (dates, check-in times, km) but strip personal GPS trail.
    await Attendance.updateMany(
      { employeeId: req.params.id },
      { $unset: { locationHistory: 1, checkInLocation: 1, checkOutLocation: 1, checkInAddress: 1, checkOutAddress: 1, lastLocation: 1 }, $set: { anonymized: true } }
    );

    // Invalidate any cached isActive state for this employee
    invalidateEmployeeActiveCache(req.params.id);

    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ── Employee login (no owner auth needed) ────────────────────────────────────

// POST /employees/login  — employee signs in with email + password
employeesRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const employee = await Employee.findOne({ email: String(email).toLowerCase() });

    // ── Flaw #4 fix: always verify password before revealing account state ────
    // Checking password first prevents email enumeration via different status codes.
    // An attacker cannot distinguish "no account" from "wrong password".
    const passwordOk = employee
      ? await bcrypt.compare(String(password), employee.passwordHash)
      : false;

    if (!employee || !passwordOk) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Only after password is verified: reveal deactivation (the user knows the password)
    if (!employee.isActive) {
      return res.status(403).json({ error: 'Your account has been deactivated. Contact your employer.' });
    }

    // Resolve permissions from custom role if applicable
    let permissions = [];
    let roleName = employee.role;
    if (employee.customRoleId) {
      const customRole = await Role.findById(employee.customRoleId).lean();
      if (customRole) {
        permissions = customRole.permissions || [];
        roleName = customRole.name;
      }
    }

    const token = signAccessToken({
      sub: String(employee._id),
      userType: 'employee',
      role: roleName,
      permissions,
      ownerUserId: String(employee.ownerUserId),
      profileId: String(employee.profileId),
      user: {
        id: String(employee._id),
        email: employee.email,
        name: employee.name,
        role: roleName,
        permissions,
        userType: 'employee',
        ownerUserId: String(employee.ownerUserId),
        profileId: String(employee.profileId),
      },
    });

    res.json({
      session: { access_token: token },
      user: {
        id: String(employee._id),
        email: employee.email,
        name: employee.name,
        role: roleName,
        permissions,
        userType: 'employee',
        ownerUserId: String(employee.ownerUserId),
        profileId: String(employee.profileId),
      },
    });
  } catch (err) { next(err); }
});
