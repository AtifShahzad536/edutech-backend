const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const crypto = require('crypto');

// Ensure crypto is available globally for packages that expect it (especially in older Node)
global.crypto = crypto;

let mongo;

// Connect to the in-memory database before all tests
beforeAll(async () => {
  // Set random JWT_SECRET for tests
  process.env.JWT_SECRET = 'test_secret_123';
  process.env.NODE_ENV = 'test';

  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  
  // Override MONGODB_URI in process.env so our app config picks it up
  process.env.MONGODB_URI = uri;

  await mongoose.connect(uri);
});

// Clean up database between tests
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany();
  }
});

// Stop the in-memory database and close connection
afterAll(async () => {
  if (mongo) {
    await mongo.stop();
  }
  await mongoose.connection.close();
});

// Mock external services to avoid real network calls
jest.mock('cloudinary');
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: jest.fn().mockResolvedValue({ id: 'test_session_id', url: 'http://test.com/session' }),
        retrieve: jest.fn().mockResolvedValue({ 
          payment_status: 'paid', 
          metadata: { courseIds: '[]', userId: '64b0f1a2c3d4e5f6a7b8c9d0' } 
        })
      }
    },
    webhooks: {
      constructEvent: jest.fn().mockImplementation((body) => {
        if (Buffer.isBuffer(body)) return JSON.parse(body.toString());
        if (typeof body === 'string') return JSON.parse(body);
        return body;
      })
    },
    customers: {
      list: jest.fn().mockResolvedValue({ data: [] })
    },
    charges: {
      list: jest.fn().mockResolvedValue({ data: [] })
    }
  }));
});
jest.mock('pusher');
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test_id' })
  })
}));
