const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Internship, Test, Question } = require('../src/models');

let userCounter = 0;

/** Create a student with a unique email address for a test. */
async function createStudent(overrides = {}) {
  userCounter += 1;
  return User.create({
    name: 'Test Student',
    email: `student${userCounter}@oipp.test`,
    passwordHash: await bcrypt.hash('Password123', 10),
    role: 'student',
    ...overrides,
  });
}

/** Create an administrator with a unique email address for a test. */
async function createAdmin(overrides = {}) {
  userCounter += 1;
  return User.create({
    name: 'Test Administrator',
    email: `admin${userCounter}@oipp.test`,
    passwordHash: await bcrypt.hash('Password123', 10),
    role: 'admin',
    ...overrides,
  });
}

/** Return a valid Authorization header for the supplied user. */
function authHeader(user) {
  const token = jwt.sign(
    { sub: String(user._id), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: 3600 }
  );
  return { Authorization: `Bearer ${token}` };
}

/** Create an open internship whose deadline is thirty days in the future. */
async function createInternship(overrides = {}) {
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 30);

  return Internship.create({
    title: 'Software Engineering Intern',
    company: 'OIPP Demo Company',
    location: 'Bengaluru',
    category: 'Software Development',
    description: 'A realistic internship used by automated tests.',
    deadline,
    status: 'open',
    ...overrides,
  });
}

/** Create an aptitude test and its questions for a test fixture. */
async function createTestWithQuestions({
  title = 'Test Aptitude Set',
  category = 'Quantitative',
  description = 'A test fixture for automated API tests.',
  durationMinutes = 20,
  questions = [
    {
      text: 'What is 2 plus 2?',
      options: ['3', '4', '5', '6'],
      correctOption: 1,
      category: 'Quantitative',
      marks: 1,
    },
  ],
} = {}) {
  const test = await Test.create({ title, category, description, durationMinutes });
  const createdQuestions = await Question.insertMany(
    questions.map((question) => ({ ...question, testId: test._id }))
  );
  return { test, questions: createdQuestions };
}

module.exports = {
  createStudent,
  createAdmin,
  authHeader,
  createInternship,
  createTestWithQuestions,
};
