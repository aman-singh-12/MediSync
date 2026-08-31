const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');

describe('Full Rubric Concepts Automated Verification Test Suite', () => {
  afterAll(async () => {
    if (mongoose.connection && mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  // ================= 1. JAVASCRIPT — EVENT LOOP (0.1 PTS) =================
  describe('JavaScript — Event Loop (0.1 pts)', () => {
    it('should correctly demonstrate the Event Loop execution phases', async () => {
      const res = await request(app).get('/api/system/event-loop');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('topic', 'JavaScript — Event loop');
      expect(res.body).toHaveProperty('status', 'SUCCESS');
      expect(res.body.timeline).toBeDefined();

      const stages = res.body.timeline.map(t => t.type);
      // Synchronous code runs first, then microtasks (nextTick / Promise), then macrotasks (Timers / Check)
      expect(stages[0]).toBe('Synchronous');
      expect(stages.includes('Microtask')).toBe(true);
      expect(stages.includes('Macrotask')).toBe(true);
    });
  });

  // ================= 2. JAVASCRIPT — HOISTING (0.1 PTS) =================
  describe('JavaScript — Hoisting (0.1 pts)', () => {
    it('should verify var undefined hoisting, let/const TDZ, and function hoisting', async () => {
      const res = await request(app).get('/api/system/hoisting');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('topic', 'JavaScript — Hoisting');
      expect(res.body).toHaveProperty('status', 'SUCCESS');
      expect(res.body.demonstrations).toBeDefined();

      const demos = res.body.demonstrations;
      const varDemo = demos.find(d => d.concept === 'var Hoisting');
      const tdzDemo = demos.find(d => d.concept.includes('Temporal Dead Zone'));
      const funcDemo = demos.find(d => d.concept === 'Function Declaration Hoisting');

      expect(varDemo.result).toContain('PASS');
      expect(tdzDemo.result).toContain('PASS');
      expect(funcDemo.result).toContain('PASS');
    });
  });

  // ================= 3. JAVASCRIPT — PROMISES VS CALLBACKS (0.1 PTS) =================
  describe('JavaScript — Promises vs Callbacks (0.1 pts)', () => {
    it('should verify callbacks, promise chaining, async/await, and custom promisify', async () => {
      const res = await request(app).get('/api/system/promises-vs-callbacks');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('topic', 'JavaScript — Promises vs callbacks');
      expect(res.body).toHaveProperty('status', 'SUCCESS');
      expect(res.body.comparison).toBeDefined();

      const comparison = res.body.comparison;
      expect(comparison.callbacks.success).toBe(true);
      expect(comparison.promises.success).toBe(true);
      expect(comparison.asyncAwait.success).toBe(true);
      expect(res.body.combinators.promiseAll).toBeDefined();
    });
  });

  // ================= 4. RELATIONAL SCHEMA DESIGN WITH PK/FK (0.2 PTS) =================
  describe('Relational schema design with PK/FK (0.2 pts)', () => {
    it('should provide schema details with PKs, FKs, constraints, and normalization proofs', async () => {
      const res = await request(app).get('/api/sql/schema');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('topic', 'Relational schema design with PK/FK');
      expect(res.body).toHaveProperty('status', 'SUCCESS');
      expect(res.body.primaryKeys.length).toBeGreaterThan(0);
      expect(res.body.foreignKeys.length).toBeGreaterThan(0);
      expect(res.body.normalization.length).toBe(4); // 1NF, 2NF, 3NF, BCNF
    });
  });

  // ================= 5. SQL JOINS (0.2 PTS) =================
  describe('SQL JOINs (0.2 pts)', () => {
    it('should execute and return all 6 SQL JOIN types with correct query results', async () => {
      const res = await request(app).get('/api/sql/joins/all');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('topic', 'SQL JOINs');
      expect(res.body).toHaveProperty('status', 'SUCCESS');
      expect(res.body.joins).toHaveProperty('innerJoin');
      expect(res.body.joins).toHaveProperty('leftJoin');
      expect(res.body.joins).toHaveProperty('rightJoin');
      expect(res.body.joins).toHaveProperty('fullOuterJoin');
      expect(res.body.joins).toHaveProperty('crossJoin');
      expect(res.body.joins).toHaveProperty('selfJoin');

      // Verify JOIN semantics
      expect(res.body.joins.innerJoin.joinType).toBe('INNER JOIN');
      expect(res.body.joins.leftJoin.joinType).toBe('LEFT OUTER JOIN');
      expect(res.body.joins.rightJoin.joinType).toBe('RIGHT OUTER JOIN');
      expect(res.body.joins.fullOuterJoin.joinType).toBe('FULL OUTER JOIN');
      expect(res.body.joins.crossJoin.joinType).toBe('CROSS JOIN');
      expect(res.body.joins.selfJoin.joinType).toBe('SELF JOIN');
    });
  });
});
