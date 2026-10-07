import test from 'node:test';
import assert from 'node:assert/strict';

import { buildUserName } from './profileName';

test('buildUserName prefers the provided full name over stale defaults', () => {
  assert.equal(buildUserName('Alex Morgan', 'marcus'), 'Alex Morgan');
  assert.equal(buildUserName('   Alex Morgan   ', 'marcus'), 'Alex Morgan');
});

test('buildUserName falls back to the stored or email-based name when no explicit name is given', () => {
  assert.equal(buildUserName('', 'marcus'), 'marcus');
  assert.equal(buildUserName(undefined, 'marcus'), 'marcus');
  assert.equal(buildUserName(null, 'user-name'), 'user-name');
});
