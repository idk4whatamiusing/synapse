// test/nlp.test.js - Unit tests for NLP intent classification (task 6.1)
const test = require('node:test');
const assert = require('node:assert');
const nlp = require('../src/services/nlpProcessor');

test('detectIntent classifies hostel queries', () => {
  assert.strictEqual(nlp.detectIntent('boys hostel near main gate').intent, 'hostel');
});

test('detectIntent classifies transport queries', () => {
  assert.strictEqual(nlp.detectIntent('bus route to kolkata').intent, 'transport');
});

test('detectIntent classifies academics queries', () => {
  assert.strictEqual(nlp.detectIntent('departments in school of engineering').intent, 'academics');
});

test('detectIntent defaults to general for unrelated text', () => {
  assert.strictEqual(nlp.detectIntent('what is the meaning of life').intent, 'general');
});

test('entity extraction finds hostel room type', () => {
  const e = nlp.extractEntities('double room in aurobindo hostel', 'hostel');
  assert.match(e.roomType || '', /double/);
});

test('fallback returns a non-empty string', () => {
  assert.ok(typeof nlp.getFallbackResponse('hello', {}) === 'string');
});
