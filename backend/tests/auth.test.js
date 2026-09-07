import request from 'supertest';
import app from '../src/app.js';
import { setupTestDB } from './setup.js';

setupTestDB();

describe('Auth Endpoints', () => {
  const testUser = {
    email: 'test@vibehub.com',
    username: 'testuser',
    password: 'Password123!',
    first_name: 'Test',
    last_name: 'User',
  };

  it('should register a new user successfully', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.username).toBe(testUser.username);
    expect(res.body.user.email).toBe(testUser.email);
    expect(res.body.user.profile).toBeDefined();
  });

  it('should reject registration with duplicate email or username', async () => {
    await request(app).post('/api/auth/register').send(testUser);

    const duplicateEmailRes = await request(app).post('/api/auth/register').send({
      ...testUser,
      username: 'otheruser',
    });
    expect(duplicateEmailRes.status).toBe(400);

    const duplicateUserRes = await request(app).post('/api/auth/register').send({
      ...testUser,
      email: 'other@vibehub.com',
    });
    expect(duplicateUserRes.status).toBe(400);
  });

  it('should login an existing user with correct password', async () => {
    await request(app).post('/api/auth/register').send(testUser);

    const res = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: testUser.password,
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.username).toBe(testUser.username);
  });

  it('should reject login with wrong password', async () => {
    await request(app).post('/api/auth/register').send(testUser);

    const res = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: 'WrongPassword!',
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return current user at /api/auth/me with valid Bearer token', async () => {
    const regRes = await request(app).post('/api/auth/register').send(testUser);
    const token = regRes.body.token;

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.username).toBe(testUser.username);
    expect(res.body.email).toBe(testUser.email);
  });

  it('should reject unauthenticated request to /api/auth/me', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
