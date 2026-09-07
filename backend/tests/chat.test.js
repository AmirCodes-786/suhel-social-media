import request from 'supertest';
import app from '../src/app.js';
import { setupTestDB } from './setup.js';

setupTestDB();

describe('Chat Endpoints', () => {
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

  it('should create conversation, send messages, and mark read', async () => {
    // 1. Create conversation between Alice and Bob
    const convRes = await request(app)
      .post('/api/chat/conversations/')
      .set('Authorization', `Bearer ${tokenAlice}`)
      .send({ participants: [userBob.id] });

    expect(convRes.status).toBe(201);
    expect(convRes.body.participants.length).toBe(2);
    const convId = convRes.body.id;

    // 2. Alice sends a message
    const msgRes = await request(app)
      .post(`/api/chat/conversations/${convId}/messages/`)
      .set('Authorization', `Bearer ${tokenAlice}`)
      .send({ content: 'Hey Bob!' });

    expect(msgRes.status).toBe(201);
    expect(msgRes.body.content).toBe('Hey Bob!');
    expect(msgRes.body.is_read).toBe(false);

    // 3. Bob checks his conversations: should have unread_count = 1
    const bobConvsRes = await request(app)
      .get('/api/chat/conversations/')
      .set('Authorization', `Bearer ${tokenBob}`);

    expect(bobConvsRes.status).toBe(200);
    expect(bobConvsRes.body.length).toBe(1);
    expect(bobConvsRes.body[0].unread_count).toBe(1);
    expect(bobConvsRes.body[0].last_message.content).toBe('Hey Bob!');

    // 4. Bob marks conversation as read
    const readRes = await request(app)
      .post(`/api/chat/conversations/${convId}/read/`)
      .set('Authorization', `Bearer ${tokenBob}`);

    expect(readRes.status).toBe(200);
    expect(readRes.body.marked_read_count).toBe(1);

    // 5. Verify unread count is now 0 for Bob
    const bobConvsAfter = await request(app)
      .get('/api/chat/conversations/')
      .set('Authorization', `Bearer ${tokenBob}`);
    expect(bobConvsAfter.body[0].unread_count).toBe(0);
  });
});
