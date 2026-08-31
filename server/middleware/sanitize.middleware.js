// Express 5 compatible XSS and NoSQL Injection sanitization middleware

const cleanXSS = (data) => {
  if (typeof data === 'string') {
    return data
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
  if (Array.isArray(data)) {
    return data.map(cleanXSS);
  }
  if (data !== null && typeof data === 'object') {
    const cleaned = {};
    for (const key of Object.keys(data)) {
      cleaned[key] = cleanXSS(data[key]);
    }
    return cleaned;
  }
  return data;
};

// Strips NoSQL injection operators (e.g. keys starting with '$') in-place
const sanitizeMongo = (target) => {
  if (target && typeof target === 'object') {
    for (const key of Object.keys(target)) {
      if (/^\$/.test(key)) {
        delete target[key];
      } else if (target[key] && typeof target[key] === 'object') {
        sanitizeMongo(target[key]);
      }
    }
  }
};

const xssSanitizer = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    for (const key of Object.keys(req.body)) {
      req.body[key] = cleanXSS(req.body[key]);
    }
  }
  if (req.params && typeof req.params === 'object') {
    for (const key of Object.keys(req.params)) {
      req.params[key] = cleanXSS(req.params[key]);
    }
  }
  if (req.query && typeof req.query === 'object') {
    for (const key of Object.keys(req.query)) {
      try {
        req.query[key] = cleanXSS(req.query[key]);
      } catch (e) {
        // read-only property safeguard
      }
    }
  }
  next();
};

const mongoSanitizer = (req, res, next) => {
  if (req.body) sanitizeMongo(req.body);
  if (req.params) sanitizeMongo(req.params);
  if (req.query) sanitizeMongo(req.query);
  next();
};

module.exports = { xssSanitizer, mongoSanitizer, cleanXSS, sanitizeMongo };
