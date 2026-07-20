// src/services/feedbackStore.js - User feedback collection
class FeedbackStore {
  constructor() {
    this.feedback = [];
  }

  add({ userId, message, rating, comment }) {
    const entry = {
      userId,
      message,
      rating: rating || null,
      comment: comment || null,
      timestamp: new Date().toISOString()
    };
    this.feedback.push(entry);
    return entry;
  }

  getRecent(limit = 50) {
    return this.feedback.slice(-limit);
  }

  summary() {
    const ratings = this.feedback.map(f => f.rating).filter(Boolean);
    const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
    return { count: this.feedback.length, averageRating: avg };
  }
}

module.exports = new FeedbackStore();