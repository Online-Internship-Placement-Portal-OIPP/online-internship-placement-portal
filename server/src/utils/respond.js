/**
 * Standard success response helper.
 * @param {import('express').Response} res
 * @param {*} data - Payload for the response.
 * @param {number} [status=200] - HTTP status code.
 */
function ok(res, data, status = 200) {
  return res.status(status).json({ success: true, data });
}

module.exports = { ok };

