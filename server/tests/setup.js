const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Ensure all models are registered on mongoose.models
require('../src/models');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

let mongoServer;

beforeAll(async () => {
  let uri;
  if (process.env.MONGODB_URI_TEST) {
    const dbName = `test_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    uri = `${process.env.MONGODB_URI_TEST}/${dbName}`;
  } else {
    mongoServer = await MongoMemoryServer.create();
    uri = mongoServer.getUri();
  }

  process.env.MONGODB_URI = uri;
  await mongoose.connect(uri);

  // Ensure all unique indexes exist
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
});

afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key of Object.keys(collections)) {
      await collections[key].deleteMany({});
    }
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});
