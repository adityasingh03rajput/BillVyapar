# BillVyapar ↔ Master Admin — Relation Test Report

**Date:** 16 March 2026  
**Scope:** Code-level audit of all integration points between the BillVyapar app and the Master Admin console.

**All known issues have been resolved. No open issues remain.**

---

## Fixed Issues (this session)

| # | Issue | Severity | Fix |
|---|-------|----------|-----|
| 1 | `licenses.js` orphaned — wrote to `TenantLicense`, had no effect on access | HIGH | Rewired to write `LicenseKey` directly |
| 2 | `subscription.js` broken comment/code merge — `extensionDays` was undefined | HIGH | Split onto separate line |
| 3 | Audit log missing `tenantId` on license key generation | LOW | Subscriber lookup now runs before `AuditLog.create()` |
| 4 | Plan limits defined but never applied to subscribers | LOW | Admin license assign now copies `plan.limits` into `Subscriber.limits` |

## Previously Fixed Issues

| # | Issue | Severity |
|---|-------|----------|
| Dual subscription systems — old `Subscription` model still queried | HIGH | Fixed Task 9 |
| `SubscriberLicense.tenantId` wrong `ref: 'Tenant'` | MEDIUM | Fixed Task 9 |
| Master admin and app users shared same JWT secret | MEDIUM | Fixed Task 9 |
| Trial users had no `Subscriber` record | MEDIUM | Fixed Task 9 |
| `Subscriber.status` never auto-set to `'expired'` | LOW | Fixed Task 9 |
| Dashboard subscriber growth chart used `Math.random()` | MEDIUM | Fixed Task 9 |
| Users page showed stale `subscription` field | MEDIUM | Fixed Task 10 |
| `analytics.js` allowed GET when expired | MEDIUM | Fixed Task 9 |
| `AuditLog` model had `ref: 'Tenant'` | HIGH | Fixed Task 6 |
| Reset password wrote to wrong field (`password` vs `passwordHash`) | HIGH | Fixed Task 7 |
