// src/services/improvementPipeline.js - Feedback-driven improvement queue (task 7.4)
const feedbackStore = require('./feedbackStore');

class ImprovementPipeline {
  // ponytail: no live model retraining here (needs LLaMA backend + dataset).
  // We surface low-rated turns as review items and can export a correction set.
  reviewItems(threshold = 3) {
    return feedbackStore.getRecent(200).filter(f => f.rating != null && f.rating < threshold);
  }

  exportCorpus() {
    return this.reviewItems().map(f => ({
      input: f.message,
      rating: f.rating,
      comment: f.comment
    }));
  }
}

module.exports = new ImprovementPipeline();