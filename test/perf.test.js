// test/perf.test.js - Performance test for retrieval + intent (task 6.3)
const test = require('node:test');
const assert = require('node:assert');
const nlp = require('../src/services/nlpProcessor');
const retrieval = require('../src/services/retrieval');

test('intent detection under 5ms for 100 queries', () => {
  const start = process.hrtime.bigint();
  for (let i = 0; i < 100; i++) nlp.detectIntent('hostel availability for boys');
  const ms = Number(process.hrtime.bigint() - start) / 1e6;
  assert.ok(ms < 5, `took ${ms}ms`);
});

test('retrieval under 20ms for 100 queries', () => {
  const start = process.hrtime.bigint();
  for (let i = 0; i < 100; i++) retrieval.retrieve('boys hostel near main gate', 'hostel');
  const ms = Number(process.hrtime.bigint() - start) / 1e6;
  assert.ok(ms < 20, `took ${ms}ms`);
});
