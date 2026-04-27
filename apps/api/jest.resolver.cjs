const path = require('path');
const fs = require('fs');

module.exports = (request, options) => {
  // Call the default resolver
  let resolved;
  try {
    resolved = options.defaultResolver(request, options);
    return resolved;
  } catch (e) {
    // If it failed and ends in .js, try .ts
    if (request.endsWith('.js')) {
      const tsRequest = request.replace(/\.js$/, '.ts');
      try {
        return options.defaultResolver(tsRequest, options);
      } catch (tsError) {
        // Fall through to original error
      }
    }
    throw e;
  }
};
