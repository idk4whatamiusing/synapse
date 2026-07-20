// src/services/retrieval.js - Knowledge retrieval with fuzzy matching
const knowledgeBase = require('./knowledgeBase');

function tokenize(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function scoreMatch(queryTokens, recordText) {
  const recordTokens = new Set(tokenize(recordText));
  if (recordTokens.size === 0) return 0;
  let hits = 0;
  for (const t of queryTokens) {
    if (recordTokens.has(t)) hits++;
    else {
      // ponytail: naive prefix fuzzy — cheap, no dep; swap for fuse.js if needed
      for (const rt of recordTokens) {
        if (rt.startsWith(t.slice(0, 4)) && t.length > 3) { hits += 0.5; break; }
      }
    }
  }
  return hits / queryTokens.length;
}

function searchSection(section, queryTokens, query, threshold = 0.2) {
  const results = [];
  for (const record of section) {
    const text = JSON.stringify(record);
    const score = scoreMatch(queryTokens, text);
    if (score >= threshold) results.push({ record, score });
  }
  return results.sort((a, b) => b.score - a.score);
}

class Retrieval {
  retrieve(message, intent, limit = 3) {
    const queryTokens = tokenize(message);
    const map = {
      hostel: knowledgeBase.hostels,
      transport: knowledgeBase.transport,
      academics: knowledgeBase.academics,
      clubs: knowledgeBase.clubs,
      notices: knowledgeBase.notices
    };
    const section = map[intent] || null;
    if (!section) {
      // general: scan facilities + everything lightly
      const all = [
        ...knowledgeBase.facilities,
        ...knowledgeBase.notices,
        ...knowledgeBase.clubs
      ];
      return searchSection(all, queryTokens, message).slice(0, limit);
    }
    return searchSection(section, queryTokens, message).slice(0, limit);
  }
}

module.exports = new Retrieval();
module.exports.tokenize = tokenize;
module.exports.scoreMatch = scoreMatch;