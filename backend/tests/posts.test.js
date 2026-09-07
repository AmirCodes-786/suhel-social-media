import request from 'supertest';
import app from '../src/app.js';
import { setupTestDB } from './setup.js';

setupTestDB();

describe('Posts Endpoints', () => {
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

  it('should create and retrieve a post', async () => {
    const createRes = await request(app)
      .post('/api/posts/')
      .set('Authorization', `Bearer ${tokenAlice}`)
      .send({
        content: 'Hello VibeHub from Alice!',
        media_type: 'text',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.content).toBe('Hello VibeHub from Alice!');
    expect(createRes.body.author_detail.username).toBe('alice');

    const postId = createRes.body.id;

    // Retrieve single post
    const getRes = await request(app)
      .get(`/api/posts/${postId}/`)
      .set('Authorization', `Bearer ${tokenBob}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.content).toBe('Hello VibeHub from Alice!');
    expect(getRes.body.is_liked).toBe(false);
  });

  it('should toggle like on a post', async () => {
    const postRes = await request(app)
      .post('/api/posts/')
      .set('Authorization', `Bearer ${tokenAlice}`)
      .send({ content: 'Like me!' });
    const postId = postRes.body.id;

    // Bob likes Alice's post
    const likeRes = await request(app)
      .post(`/api/posts/${postId}/like/`)
      .set('Authorization', `Bearer ${tokenBob}`);

    expect(likeRes.status).toBe(200);
    expect(likeRes.body.is_liked).toBe(true);
    expect(likeRes.body.likes_count).toBe(1);

    // Bob unlikes Alice's post
    const unlikeRes = await request(app)
      .post(`/api/posts/${postId}/like/`)
      .set('Authorization', `Bearer ${tokenBob}`);

    expect(unlikeRes.status).toBe(200);
    expect(unlikeRes.body.is_liked).toBe(false);
    expect(unlikeRes.body.likes_count).toBe(0);
  });

  it('should toggle save on a post and retrieve from /saved/', async () => {
    const postRes = await request(app)
      .post('/api/posts/')
      .set('Authorization', `Bearer ${tokenAlice}`)
      .send({ content: 'Save me!' });
    const postId = postRes.body.id;

    // Bob saves Alice's post
    const saveRes = await request(app)
      .post(`/api/posts/${postId}/save/`)
      .set('Authorization', `Bearer ${tokenBob}`);

    expect(saveRes.status).toBe(200);
    expect(saveRes.body.is_saved).toBe(true);

    // Bob checks saved posts
    const savedListRes = await request(app)
      .get('/api/posts/saved/')
      .set('Authorization', `Bearer ${tokenBob}`);

    expect(savedListRes.status).toBe(200);
    expect(savedListRes.body.length).toBe(1);
    expect(savedListRes.body[0].id).toBe(postId);
  });

  it('should create root comments and nested replies', async () => {
    const postRes = await request(app)
      .post('/api/posts/')
      .set('Authorization', `Bearer ${tokenAlice}`)
      .send({ content: 'Comment on this!' });
    const postId = postRes.body.id;

    // Bob creates root comment
    const commentRes = await request(app)
      .post(`/api/posts/${postId}/comments/`)
      .set('Authorization', `Bearer ${tokenBob}`)
      .send({ content: 'Great post!' });

    expect(commentRes.status).toBe(201);
    expect(commentRes.body.content).toBe('Great post!');
    const rootCommentId = commentRes.body.id;

    // Alice replies to Bob's comment
    const replyRes = await request(app)
      .post(`/api/posts/${postId}/comments/`)
      .set('Authorization', `Bearer ${tokenAlice}`)
      .send({ content: 'Thanks Bob!', parent: rootCommentId });

    expect(replyRes.status).toBe(201);
    expect(replyRes.body.parent).toBe(rootCommentId);

    // Get comments list for post
    const listRes = await request(app)
      .get(`/api/posts/${postId}/comments/`)
      .set('Authorization', `Bearer ${tokenAlice}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.length).toBe(1); // 1 root comment
    expect(listRes.body[0].replies.length).toBe(1); // 1 nested reply
    expect(listRes.body[0].replies[0].content).toBe('Thanks Bob!');
  });
});
