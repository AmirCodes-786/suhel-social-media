import { jest } from '@jest/globals';
import { notFound, errorHandler } from '../../src/middleware/errorHandler.js';

describe('Error Handler Middleware Unit Tests', () => {
  it('notFound should return 404 with method and url', () => {
    const req = { method: 'GET', originalUrl: '/api/test' };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    notFound(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: 'Not found: GET /api/test',
      })
    );
  });

  it('errorHandler should format CastError as 404', () => {
    const err = new Error('Cast to ObjectId failed');
    err.name = 'CastError';

    const req = { method: 'GET', url: '/api/posts/123' };
    const res = {
      statusCode: 200,
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: 'Resource not found with specified identifier.',
      })
    );
  });

  it('errorHandler should format duplicate key 11000 as 400', () => {
    const err = new Error('E11000 duplicate key error');
    err.code = 11000;
    err.keyValue = { username: 'testuser' };

    const req = { method: 'POST', url: '/api/auth/register' };
    const res = {
      statusCode: 200,
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.stringContaining('username'),
      })
    );
  });
});
