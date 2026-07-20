// src/services/responseTemplates.js - Consistent response formatting
const config = require('../../config');

const TEMPLATES = {
  hostel: (items) => {
    if (!items.length) return 'No hostels matched your query. Try mentioning a name or type (boys/girls, AC/non-AC).';
    return items.map(i =>
      `🏠 *${i.name}* (${i.gender})\nRooms: ${i.rooms}\nAC: ${i.ac ? 'Yes' : 'No'}\nFacilities: ${i.facilities.join(', ')}\nLocation: ${i.proximity}`
    ).join('\n\n');
  },
  transport: (items) => {
    if (!items.length) return 'No routes matched. Try a destination like "Kolkata Station" or "Barasat".';
    return items.map(r =>
      `🚌 *${r.route}*\nStops: ${r.stops.join(' → ')}\nDeparture: ${r.departure}\nFrequency: ${r.frequency}`
    ).join('\n\n');
  },
  academics: (items) => {
    if (!items.length) return 'No schools matched. Try "Engineering", "Management", or "Sciences".';
    return items.map(s =>
      `🎓 *${s.school}*\nDepartments: ${s.departments.join(', ')}\nPrograms: ${s.programs.join(', ')}`
    ).join('\n\n');
  },
  clubs: (items) => {
    if (!items.length) return 'No clubs matched. Try "coding", "dramatics", or "robotics".';
    return items.map(c =>
      `🎭 *${c.name}* (${c.category})${c.department !== 'all' ? ' — ' + c.department : ''}`
    ).join('\n\n');
  },
  notices: (items) => {
    if (!items.length) return 'No notices matched.';
    return items.map(n =>
      `📢 *${n.title}* [${n.category}] — ${n.date}`
    ).join('\n\n');
  },
  general: (items) => {
    if (!items.length) return 'I could not find matching campus info. Ask about hostels, transport, academics, clubs, or notices.';
    return items.map(i => `ℹ️ ${i.name || i.title || JSON.stringify(i)}`).join('\n\n');
  }
};

class ResponseTemplates {
  format(intent, items) {
    const tpl = TEMPLATES[intent] || TEMPLATES.general;
    return tpl(items);
  }
}

module.exports = new ResponseTemplates();
module.exports.templates = TEMPLATES;