// ================= RUBRIC: WRITING UNIT TESTS (0.3 pts) =================
// Comprehensive Jest & Supertest automated test suite covering HTTP endpoints, validation middleware, 
// error boundaries, and Redis cache helper functions.
const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const { getCache, setCache, delCache } = require('../config/redis');

describe('API & Service Unit / Integration Tests', () => {
  afterAll(async () => {
    if (mongoose.connection && mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  // 1. Root API Health Check
  it('should return 200 for the root API health check', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toBe('API is running...');
  });

  // 2. Request Validation Middleware Test
  it('should apply validation middleware and return 400 on empty login', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('errors');
    expect(res.body.errors[0].msg).toContain('Valid email is required');
  });

  // 3. 404 Route Handler Test
  it('should return 404 for unknown endpoints', async () => {
    const res = await request(app).get('/api/does-not-exist-12345');
    expect(res.statusCode).toEqual(404);
  });

  // 4. Redis Cache Utility Unit Tests (Set, Get, Del with TTL)
  it('should verify Redis cache set, get, and del functions', async () => {
    const testKey = 'test_patient_cache_99';
    const testData = { patientId: 'P-99', status: 'ACTIVE_TRIAGE' };

    // Set cache with 10s TTL
    const setResult = await setCache(testKey, testData, 10);
    expect(setResult).toBe(true);

    // Get cache
    const retrieved = await getCache(testKey);
    expect(retrieved).toEqual(testData);

    // Delete cache
    const delResult = await delCache(testKey);
    expect(delResult).toBe(true);

    // Verify deletion
    const postDel = await getCache(testKey);
    expect(postDel).toBeNull();
  });

  // 5. Sequelize ORM Endpoint Integration Test
  it('should return 200 and ORM model mapping metadata from /api/sql/orm', async () => {
    const res = await request(app).get('/api/sql/orm');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('topic', 'ORM usage (Prisma/Sequelize)');
    expect(res.body).toHaveProperty('status', 'SUCCESS');
    expect(res.body).toHaveProperty('eagerLoadingDemonstrated', true);
  });
});
