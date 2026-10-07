import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeResetEmail, buildPasswordResetMessage } from './passwordReset';

test('normalizeResetEmail trims whitespace and lowercases the address', () => {
  assert.equal(normalizeResetEmail('  User@Example.com  '), 'user@example.com');
});

test('buildPasswordResetMessage includes the user email and reset instructions', () => {
  assert.match(buildPasswordResetMessage('user@example.com'), /user@example.com/);
  assert.match(buildPasswordResetMessage('user@example.com'), /reset/i);
});
