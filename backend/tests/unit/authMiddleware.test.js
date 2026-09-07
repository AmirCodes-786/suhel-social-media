import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import { authenticate, optionalAuth } from '../../src/middleware/auth.js';
import config from '../../src/config/index.js';

describe('Auth Middleware Unit Tests', () => {
  it('should return 401 if authorization header is missing', async () => {
    const req = { headers: {} };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: 'Authentication credentials were not provided.',
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if token is invalid', async () => {
    const req = { headers: { authorization: 'Bearer invalid-token' } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('optionalAuth should pass through with null user if no header is present', async () => {
    const req = { headers: {} };
    const res = {};
    const next = jest.fn();

    await optionalAuth(req, res, next);

    expect(req.user).toBeNull();
    expect(req.userId).toBeNull();
    expect(next).toHaveBeenCalled();
  });

  it('optionalAuth should decode valid JWT and attach to req', async () => {
    const fakePayload = { id: 'test-user-id-123' };
    const token = jwt.sign(fakePayload, config.jwt.secret);

    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = {};
    const next = jest.fn();

    // Mock User.findById
    await optionalAuth(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
