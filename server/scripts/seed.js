/*
 * Demo-data seed script for local development. It is deliberately blocked in
 * production, because it removes existing records before creating fresh data.
 */
const bcrypt = require('bcryptjs');
const { connectDB, disconnectDB } = require('../src/config/db');
const config = require('../src/config/env');
const {
  User,
  Internship,
  Application,
  Test,
  Question,
  Result,
  Activity,
} = require('../src/models');

function futureDate(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function scoreAnswers(questions, selectedOptions) {
  const categoryScores = new Map();
  let score = 0;
  let totalMarks = 0;

  questions.forEach((question, index) => {
    totalMarks += question.marks;
    const current = categoryScores.get(question.category) || { score: 0, total: 0 };
    current.total += question.marks;
    if (selectedOptions[index] === question.correctOption) {
      score += question.marks;
      current.score += question.marks;
    }
    categoryScores.set(question.category, current);
  });

  return {
    score,
    totalMarks,
    percentage: Math.round((score / totalMarks) * 100),
    categoryScores: [...categoryScores.entries()].map(([category, values]) => ({
      category,
      ...values,
    })),
  };
}

const internshipData = [
  ['Backend Developer Intern', 'TechVista Solutions', 'Bengaluru', 'Software Development', 14, 'open'],
  ['Frontend Engineering Intern', 'PixelForge Labs', 'Remote', 'Web Development', 18, 'open'],
  ['Data Science Intern', 'Insight Analytics', 'Hyderabad', 'Data Science', 21, 'open'],
  ['Embedded Systems Intern', 'CircuitWorks India', 'Pune', 'Embedded Systems', 24, 'open'],
  ['UI/UX Design Intern', 'Canvas Collective', 'Mumbai', 'UI/UX Design', 28, 'open'],
  ['Cloud Operations Intern', 'Nimbus Stack', 'Chennai', 'Cloud & DevOps', 31, 'open'],
  ['Full Stack Intern', 'Campus Connect', 'Remote', 'Web Development', 35, 'open'],
  ['Machine Learning Intern', 'DataNest', 'Bengaluru', 'Data Science', 40, 'open'],
  ['QA Automation Intern', 'Quality First', 'Kochi', 'Software Development', 12, 'closed'],
  ['DevOps Intern', 'DeployRight', 'Delhi', 'Cloud & DevOps', 56, 'closed'],
].map(([title, company, location, category, days, status]) => ({
  title,
  company,
  location,
  category,
  description: `Work with the ${company} team on practical ${category} projects and learn from experienced mentors.`,
  deadline: futureDate(days),
  status,
}));

const testData = [
  {
    title: 'Quantitative Aptitude – Set 1', category: 'Quantitative', durationMinutes: 20,
    questions: [
      ['What is 25% of 200?', ['25', '50', '75', '100'], 1, 'Quantitative', 1],
      ['If x + 7 = 15, what is x?', ['6', '7', '8', '9'], 2, 'Quantitative', 1],
      ['What is the average of 4, 8 and 12?', ['6', '8', '10', '12'], 1, 'Quantitative', 1],
      ['A train travels 120 km in 2 hours. Its speed is?', ['40 km/h', '50 km/h', '60 km/h', '70 km/h'], 2, 'Quantitative', 2],
      ['What is 3 squared plus 4 squared?', ['7', '12', '25', '49'], 2, 'Quantitative', 1],
      ['A ₹500 item has a 10% discount. Sale price?', ['₹400', '₹450', '₹475', '₹490'], 1, 'Quantitative', 1],
    ],
  },
  {
    title: 'Logical Reasoning – Set 1', category: 'Logical', durationMinutes: 20,
    questions: [
      ['What comes next: 2, 4, 8, 16, ?', ['20', '24', '30', '32'], 3, 'Logical', 1],
      ['All roses are flowers. Some flowers fade quickly. Which is certain?', ['All roses fade quickly', 'Some roses fade quickly', 'Roses are flowers', 'No roses fade quickly'], 2, 'Logical', 1],
      ['If CAT is coded as DBU, DOG is coded as?', ['EPF', 'EOG', 'CPH', 'FPE'], 0, 'Logical', 2],
      ['A is taller than B and B is taller than C. Who is shortest?', ['A', 'B', 'C', 'Cannot say'], 2, 'Logical', 1],
      ['Which does not belong: Square, Triangle, Circle, Rectangle?', ['Square', 'Triangle', 'Circle', 'Rectangle'], 2, 'Logical', 1],
      ['If today is Monday, what day is it after 10 days?', ['Wednesday', 'Thursday', 'Friday', 'Saturday'], 1, 'Logical', 1],
    ],
  },
  {
    title: 'Mixed Placement Mock Test', category: 'Mixed', durationMinutes: 30,
    questions: [
      ['What is 15% of 300?', ['30', '45', '60', '75'], 1, 'Quantitative', 1],
      ['What comes next: 3, 6, 12, 24, ?', ['36', '42', '48', '54'], 2, 'Logical', 1],
      ['Choose the correctly spelled word.', ['Accomodation', 'Accommodation', 'Acommodation', 'Accommadation'], 1, 'Verbal', 1],
      ['A number doubled and increased by 5 equals 19. The number is?', ['5', '6', '7', '8'], 2, 'Quantitative', 2],
      ['Book is to reading as fork is to?', ['Writing', 'Eating', 'Drawing', 'Driving'], 1, 'Logical', 1],
      ['Which word is closest in meaning to brief?', ['Long', 'Short', 'Noisy', 'Difficult'], 1, 'Verbal', 1],
    ],
  },
];

async function seed() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed a production database.');
  }

  await connectDB(config.MONGODB_URI);
  await Promise.all([Activity, Result, Application, Question, Test, Internship, User].map((model) => model.deleteMany({})));

  const passwordHashes = await Promise.all([
    bcrypt.hash('Admin@12345', 10),
    bcrypt.hash('Student@123', 10),
  ]);
  const [adminHash, studentHash] = passwordHashes;

  const [admin, asha, ravi, meera] = await User.create([
    { name: 'Portal Admin', email: 'admin@oipp.test', passwordHash: adminHash, role: 'admin' },
    { name: 'Asha K', email: 'asha@oipp.test', passwordHash: studentHash, role: 'student' },
    { name: 'Ravi M', email: 'ravi@oipp.test', passwordHash: studentHash, role: 'student' },
    { name: 'Meera S', email: 'meera@oipp.test', passwordHash: studentHash, role: 'student' },
  ]);
  void admin; void asha; void meera;

  const internships = await Internship.insertMany(internshipData);
  const createdTests = [];
  for (const testDefinition of testData) {
    const test = await Test.create({
      title: testDefinition.title,
      category: testDefinition.category,
      description: `Practice questions for ${testDefinition.category.toLowerCase()} placement preparation.`,
      durationMinutes: testDefinition.durationMinutes,
    });
    const questions = await Question.insertMany(testDefinition.questions.map(
      ([text, options, correctOption, category, marks]) => ({ testId: test._id, text, options, correctOption, category, marks })
    ));
    createdTests.push({ test, questions });
  }

  const applications = await Application.create([
    { studentId: ravi._id, internshipId: internships[0]._id },
    { studentId: ravi._id, internshipId: internships[2]._id },
  ]);
  await Activity.create(applications.map((application) => ({
    studentId: ravi._id, type: 'INTERNSHIP_APPLIED', refId: application.internshipId,
  })));

  const firstResult = scoreAnswers(createdTests[0].questions, [1, 2, 1, 2, 0, 1]);
  const secondResult = scoreAnswers(createdTests[2].questions, [1, 2, 1, 0, 1, 1]);
  const results = await Result.create([
    { studentId: ravi._id, testId: createdTests[0].test._id, ...firstResult },
    { studentId: ravi._id, testId: createdTests[2].test._id, ...secondResult },
  ]);
  await Activity.create(results.map((result) => ({
    studentId: ravi._id, type: 'TEST_COMPLETED', refId: result.testId,
  })));

  process.stdout.write('\nSeed complete. Demo accounts:\n');
  process.stdout.write('  Admin:    admin@oipp.test / Admin@12345\n');
  process.stdout.write('  Students: asha@oipp.test, ravi@oipp.test, meera@oipp.test / Student@123\n');
  process.stdout.write(`  Created: ${internships.length} internships, ${createdTests.length} tests, and ${results.length} Ravi results.\n`);
}

seed()
  .catch((error) => {
    process.stderr.write(`Seed failed: ${error.message}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDB();
  });
