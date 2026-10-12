/**
 * Error catalogue — every application error code with its HTTP status and
 * user-facing message.  (CLAUDE.md §7)
 */
const ERRORS = {
  VALIDATION_ERROR:      { status: 400, message: 'Please correct the highlighted fields.' },
  INVALID_REQUEST:       { status: 400, message: 'The request could not be understood.' },
  INVALID_APPLICATION:   { status: 400, message: 'This application cannot be submitted.' },
  INVALID_SUBMISSION:    { status: 400, message: 'Your answers could not be submitted. Please try again.' },
  INVALID_CREDENTIALS:   { status: 401, message: 'Invalid email or password.' },
  UNAUTHORIZED:          { status: 401, message: 'Please log in to continue.' },
  FORBIDDEN:             { status: 403, message: 'You do not have permission to perform this action.' },
  FORBIDDEN_ADMIN_ONLY:  { status: 403, message: 'You do not have permission to perform this action.' },
  INTERNSHIP_NOT_FOUND:  { status: 404, message: 'This internship is not available.' },
  TEST_NOT_FOUND:        { status: 404, message: 'This test is not available.' },
  QUESTION_NOT_FOUND:    { status: 404, message: 'This question does not exist.' },
  RESULT_NOT_FOUND:      { status: 404, message: 'Result not found.' },
  NOT_FOUND:             { status: 404, message: 'Resource not found.' },
  EMAIL_EXISTS:          { status: 409, message: 'An account with this email already exists.' },
  DUPLICATE_APPLICATION: { status: 409, message: 'You have already applied for this internship.' },
  TOO_MANY_REQUESTS:     { status: 429, message: 'Too many attempts. Please wait and try again.' },
  SERVER_ERROR:          { status: 500, message: 'Something went wrong. Please try again later.' },
};

module.exports = ERRORS;
