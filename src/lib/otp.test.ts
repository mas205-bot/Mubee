import test from 'node:test';
import assert from 'node:assert/strict';

import { generateOtp, isOtpExpired, sanitizeEmail } from './otp';

test('generateOtp produces a 6-digit code', () => {
  const code = generateOtp();
  assert.equal(code.length, 6);
  assert.match(code, /^\d{6}$/);
});

test('sanitizeEmail normalizes address for OTP lookups', () => {
  assert.equal(sanitizeEmail('  User@Example.com  '), 'user@example.com');
});

test('isOtpExpired returns true when code is stale', () => {
  const createdAt = Date.now() - 10 * 60 * 1000;
  assert.equal(isOtpExpired(createdAt), true);
});
