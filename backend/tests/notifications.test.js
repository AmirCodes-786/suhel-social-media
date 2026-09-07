import request from 'supertest';
import app from '../src/app.js';
import { setupTestDB } from './setup.js';

setupTestDB();

describe('Notifications Endpoints', () => {
  let tokenAlice, tokenBob, userAlice, userBob;

  beforeEach(async () => {
    const resA = await request(app).post('/api/auth/register').send({
      email: 'alice@vibehub.com',
      username: 'alice',
      password: 'Password123!',
    });
    tokenAlice = resA.body.token;
    userAlice = resA.body.user;

    const resB = await request(app).post('/api/auth/register').send({
      email: 'bob@vibehub.com',
      username: 'bob',
      password: 'Password123!',
    });
    tokenBob = resB.body.token;
    userBob = resB.body.user;
  });

  it('should create notifications on follow and like, and allow marking read', async () => {
    // 1. Bob follows Alice -> triggers follow notification for Alice
    await request(app)
      .post('/api/users/alice/follow/')
      .set('Authorization', `Bearer ${tokenBob}`);

    // 2. Alice creates a post
    const postRes = await request(app)
      .post('/api/posts/')
      .set('Authorization', `Bearer ${tokenAlice}`)
      .send({ content: 'Post for like test' });
    const postId = postRes.body.id;

    // 3. Bob likes Alice's post -> triggers like notification for Alice
    await request(app)
      .post(`/api/posts/${postId}/like/`)
      .set('Authorization', `Bearer ${tokenBob}`);

    // 4. Alice checks unread notification count: should be 2
    const countRes = await request(app)
      .get('/api/notifications/unread-count/')
      .set('Authorization', `Bearer ${tokenAlice}`);

    expect(countRes.status).toBe(200);
    expect(countRes.body.unread_count).toBe(2);

    // 5. Alice retrieves notifications list
    const listRes = await request(app)
      .get('/api/notifications/')
      .set('Authorization', `Bearer ${tokenAlice}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.length).toBe(2);
    expect(listRes.body[0].sender_detail.username).toBe('bob');

    // 6. Alice marks all notifications as read
    const markRes = await request(app)
      .post('/api/notifications/')
      .set('Authorization', `Bearer ${tokenAlice}`);

    expect(markRes.status).toBe(200);
    expect(markRes.body.marked_read_count).toBe(2);

    // 7. Verify unread count is now 0
    const countAfter = await request(app)
      .get('/api/notifications/unread-count/')
      .set('Authorization', `Bearer ${tokenAlice}`);
    expect(countAfter.body.unread_count).toBe(0);
  });
});
