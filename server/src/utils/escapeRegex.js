/**
 * Escape special regex characters in a string so it can be used in
 * new RegExp() safely (prevents ReDoS from user input).
 * @param {string} str
 * @returns {string}
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = escapeRegex;

