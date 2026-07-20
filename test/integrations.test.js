// test/integrations.test.js - Integration tests for campus API clients (task 6.2)
const test = require('node:test');
const assert = require('node:assert');
const hostel = require('../integrations/hostel');
const transport = require('../integrations/transport');
const academics = require('../integrations/academics');
const notices = require('../integrations/notices');
const clubs = require('../integrations/clubs');

test('hostel integration returns error object on unavailable service (graceful)', async () => {
  const r = await hostel.searchHostels('boys');
  assert.ok(r && typeof r === 'object');
  assert.ok('error' in r);
});

test('transport integration returns error object on unavailable service (graceful)', async () => {
  const r = await transport.getRoutes('kolkata');
  assert.ok(r && typeof r === 'object');
  assert.ok('error' in r);
});

test('academics integration returns error object on unavailable service (graceful)', async () => {
  const r = await academics.getDepartments('engineering');
  assert.ok(r && typeof r === 'object');
  assert.ok('error' in r);
});

test('notices integration returns error object on unavailable service (graceful)', async () => {
  const r = await notices.getNotices();
  assert.ok(r && typeof r === 'object');
  assert.ok('error' in r);
});

test('clubs integration returns error object on unavailable service (graceful)', async () => {
  const r = await clubs.getClubs();
  assert.ok(r && typeof r === 'object');
  assert.ok('error' in r);
});
