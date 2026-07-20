// src/services/metrics.js - Basic usage metrics (task 7.1, 6.5)
class Metrics {
  constructor() {
    this.counters = { chat_requests: 0, feedback: 0, errors: 0 };
    this.byIntent = {};
    this.latencySamples = [];
  }

  inc(name, n = 1) {
    this.counters[name] = (this.counters[name] || 0) + n;
  }

  recordIntent(intent) {
    this.byIntent[intent] = (this.byIntent[intent] || 0) + 1;
  }

  recordLatency(ms) {
    this.latencySamples.push(ms);
    if (this.latencySamples.length > 1000) this.latencySamples.shift();
  }

  snapshot() {
    const samples = this.latencySamples;
    const avg = samples.length ? samples.reduce((a, b) => a + b, 0) / samples.length : 0;
    const p95 = samples.length
      ? samples.slice().sort((a, b) => a - b)[Math.floor(samples.length * 0.95)]
      : 0;
    return {
      counters: this.counters,
      byIntent: this.byIntent,
      latency_avg_ms: Number(avg.toFixed(2)),
      latency_p95_ms: p95
    };
  }
}

module.exports = new Metrics();