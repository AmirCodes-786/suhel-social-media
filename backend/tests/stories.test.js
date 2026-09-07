import request from 'supertest';
import app from '../src/app.js';
import { setupTestDB } from './setup.js';

setupTestDB();

describe('Stories Endpoints', () => {
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

    // Bob follows Alice
    await request(app)
      .post('/api/users/alice/follow/')
      .set('Authorization', `Bearer ${tokenBob}`);
  });

  it('should create a story, retrieve it in feed, and mark it viewed', async () => {
    // 1. Alice creates a story
    const createRes = await request(app)
      .post('/api/stories/')
      .set('Authorization', `Bearer ${tokenAlice}`)
      .send({
        media: 'https://example.com/story.jpg',
        media_type: 'image',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.media).toBe('https://example.com/story.jpg');
    const storyId = createRes.body.id;

    // 2. Bob fetches stories feed (should include Alice's story)
    const feedRes = await request(app)
      .get('/api/stories/')
      .set('Authorization', `Bearer ${tokenBob}`);

    expect(feedRes.status).toBe(200);
    expect(feedRes.body.length).toBe(1);
    expect(feedRes.body[0].user.username).toBe('alice');
    expect(feedRes.body[0].stories.length).toBe(1);
    expect(feedRes.body[0].stories[0].is_viewed).toBe(false);

    // 3. Bob marks the story as viewed
    const viewRes = await request(app)
      .post(`/api/stories/${storyId}/view/`)
      .set('Authorization', `Bearer ${tokenBob}`);

    expect(viewRes.status).toBe(200);
    expect(viewRes.body.success).toBe(true);

    // 4. Alice checks story viewers (Alice is author, so allowed)
    const viewersRes = await request(app)
      .get(`/api/stories/${storyId}/viewers/`)
      .set('Authorization', `Bearer ${tokenAlice}`);

    expect(viewersRes.status).toBe(200);
    expect(viewersRes.body.length).toBe(1);
    expect(viewersRes.body[0].username).toBe('bob');

    // 5. Bob tries to view viewers list (should be 403 Forbidden)
    const unauthorizedRes = await request(app)
      .get(`/api/stories/${storyId}/viewers/`)
      .set('Authorization', `Bearer ${tokenBob}`);

    expect(unauthorizedRes.status).toBe(403);
  });
});
