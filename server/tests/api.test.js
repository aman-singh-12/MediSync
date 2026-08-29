const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');

describe('API Integration Tests', () => {
  beforeAll(async () => {
    // We don't connect to the real DB in these basic integration tests 
    // unless we need to. This is a basic health check and route validation.
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('should return 200 for the root API health check', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toBe('API is running...');
  });

  it('should apply validation middleware and return 400 on empty login', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.statusCode).toEqual(400);
    // Since we added express-validator, it should return an array of errors
    expect(res.body).toHaveProperty('errors');
    expect(res.body.errors[0].msg).toContain('Valid email is required');
  });

  it('should return 404 for unknown endpoints', async () => {
    const res = await request(app).get('/api/does-not-exist-12345');
    expect(res.statusCode).toEqual(404);
  });
});
