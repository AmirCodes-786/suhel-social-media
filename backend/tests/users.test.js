import request from 'supertest';
import app from '../src/app.js';
import { setupTestDB } from './setup.js';

setupTestDB();

describe('Users Endpoints', () => {
  let tokenAlice, tokenBob, alice, bob;

  beforeEach(async () => {
    const resA = await request(app).post('/api/auth/register').send({
      email: 'alice@vibehub.com',
      username: 'alice',
      password: 'Password123!',
      first_name: 'Alice',
      last_name: 'Wonder',
    });
    tokenAlice = resA.body.token;
    alice = resA.body.user;

    const resB = await request(app).post('/api/auth/register').send({
      email: 'bob@vibehub.com',
      username: 'bob',
      password: 'Password123!',
      first_name: 'Bob',
      last_name: 'Builder',
    });
    tokenBob = resB.body.token;
    bob = resB.body.user;
  });

  it('should retrieve current user via /api/users/me/', async () => {
    const res = await request(app)
      .get('/api/users/me/')
      .set('Authorization', `Bearer ${tokenAlice}`);

    expect(res.status).toBe(200);
    expect(res.body.username).toBe('alice');
    expect(res.body.followers_count).toBe(0);
    expect(res.body.following_count).toBe(0);
  });

  it('should update user bio and location via /api/users/me/', async () => {
    const res = await request(app)
      .patch('/api/users/me/')
      .set('Authorization', `Bearer ${tokenAlice}`)
      .send({
        bio: 'Updated bio here!',
        location: 'California',
      });

    expect(res.status).toBe(200);
    expect(res.body.profile.bio).toBe('Updated bio here!');
    expect(res.body.profile.location).toBe('California');
  });

  it('should retrieve user profile by username', async () => {
    const res = await request(app)
      .get('/api/users/bob/')
      .set('Authorization', `Bearer ${tokenAlice}`);

    expect(res.status).toBe(200);
    expect(res.body.username).toBe('bob');
    expect(res.body.is_following).toBe(false);
  });

  it('should toggle follow and unfollow', async () => {
    // Follow bob
    const followRes = await request(app)
      .post('/api/users/bob/follow/')
      .set('Authorization', `Bearer ${tokenAlice}`);

    expect(followRes.status).toBe(200);
    expect(followRes.body.is_following).toBe(true);

    // Verify followers list of bob
    const followersRes = await request(app)
      .get('/api/users/bob/followers/')
      .set('Authorization', `Bearer ${tokenAlice}`);
    expect(followersRes.status).toBe(200);
    expect(followersRes.body.length).toBe(1);
    expect(followersRes.body[0].username).toBe('alice');

    // Unfollow bob
    const unfollowRes = await request(app)
      .post('/api/users/bob/follow/')
      .set('Authorization', `Bearer ${tokenAlice}`);
    expect(unfollowRes.status).toBe(200);
    expect(unfollowRes.body.is_following).toBe(false);
  });

  it('should search users by query', async () => {
    const res = await request(app)
      .get('/api/users/search/?q=bob')
      .set('Authorization', `Bearer ${tokenAlice}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].username).toBe('bob');
  });

  it('should return creator suggestions excluding self and followed', async () => {
    const res = await request(app)
      .get('/api/users/suggestions/')
      .set('Authorization', `Bearer ${tokenAlice}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].username).toBe('bob');
  });
});
