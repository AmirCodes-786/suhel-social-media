import request from 'supertest';
import app from '../src/app.js';

describe('App & Middleware Infrastructure', () => {
  it('should reflect database state on GET /health (503 when disconnected)', async () => {
    const res = await request(app).get('/health');

    // In test environment, MongoDB is not connected — expect 503 'degraded'
    expect(res.status).toBe(503);
    expect(res.body).toHaveProperty('status', 'degraded');
    expect(res.body).toHaveProperty('uptime');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('database', 'disconnected');
  });

  it('should return 404 with detail message on non-existent endpoint', async () => {
    const res = await request(app).get('/api/unknown-endpoint');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('detail');
    expect(res.body.detail).toContain('Not found: GET /api/unknown-endpoint');
  });

  it('should set Helmet security headers', async () => {
    const res = await request(app).get('/health');

    expect(res.headers).toHaveProperty('x-dns-prefetch-control');
    expect(res.headers).toHaveProperty('x-content-type-options', 'nosniff');
  });

  it('should reject invalid auth token on protected endpoint', async () => {
    const res = await request(app)
      .get('/api/users/me/')
      .set('Authorization', 'Bearer invalid-token-here');

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('detail');
  });
});
