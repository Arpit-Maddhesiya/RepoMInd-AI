import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../app.js';
import { env } from '../config/env.js';

const BASE = '/api/auth';
const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/repomind_test';

describe('Auth API', () => {
  beforeAll(async () => {
    await mongoose.connect(MONGODB_URI);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await mongoose.connection.dropDatabase();
  });

  it('registers a user and returns a token', async () => {
    const res = await request(app).post(`${BASE}/register`).send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'secret123',
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('test@example.com');
  });

  it('rejects duplicate email registration', async () => {
    await request(app).post(`${BASE}/register`).send({
      name: 'One',
      email: 'dup@example.com',
      password: 'secret123',
    });
    const res = await request(app).post(`${BASE}/register`).send({
      name: 'Two',
      email: 'dup@example.com',
      password: 'secret123',
    });
    expect(res.status).toBe(409);
    expect(res.body.errorCode).toBe('CONFLICT');
  });

  it('rejects invalid registration payloads', async () => {
    const res = await request(app).post(`${BASE}/register`).send({
      name: 'X',
      email: 'not-an-email',
      password: '123',
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errorCode).toBe('VALIDATION_ERROR');
  });

  it('logs in with correct credentials', async () => {
    await request(app).post(`${BASE}/register`).send({
      name: 'Login User',
      email: 'login@example.com',
      password: 'secret123',
    });
    const res = await request(app).post(`${BASE}/login`).send({
      email: 'login@example.com',
      password: 'secret123',
    });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
  });

  it('rejects wrong password', async () => {
    await request(app).post(`${BASE}/register`).send({
      name: 'Login User',
      email: 'login2@example.com',
      password: 'secret123',
    });
    const res = await request(app).post(`${BASE}/login`).send({
      email: 'login2@example.com',
      password: 'wrongpass',
    });
    expect(res.status).toBe(401);
    expect(res.body.errorCode).toBe('UNAUTHORIZED');
  });

  it('never stores plaintext passwords', async () => {
    await request(app).post(`${BASE}/register`).send({
      name: 'Hash User',
      email: 'hash@example.com',
      password: 'secret123',
    });
    const users = await mongoose.connection.db!.collection('users').find().toArray();
    const user = users[0] as Record<string, unknown>;
    expect(user.passwordHash).toBeDefined();
    expect(user.passwordHash).not.toBe('secret123');
    expect(String(user.passwordHash)).toMatch(/^\$2[aby]\$/);
  });

  it('returns the current user with a valid token', async () => {
    const reg = await request(app).post(`${BASE}/register`).send({
      name: 'Me User',
      email: 'me@example.com',
      password: 'secret123',
    });
    const token = reg.body.data.token;
    const res = await request(app).get(`${BASE}/me`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('me@example.com');
  });

  it('rejects /me without a token', async () => {
    const res = await request(app).get(`${BASE}/me`);
    expect(res.status).toBe(401);
    expect(res.body.errorCode).toBe('UNAUTHORIZED');
  });

  it('rejects /me with a garbage token', async () => {
    const res = await request(app).get(`${BASE}/me`).set('Authorization', 'Bearer not.a.token');
    expect(res.status).toBe(401);
  });

  it('logs out successfully', async () => {
    const res = await request(app).post(`${BASE}/logout`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
