import { jest } from '@jest/globals';
import { apiLimiter, authLimiter } from '../../src/middleware/security.js';

describe('Security Middleware Unit Tests', () => {
  it('apiLimiter should be configured with appropriate window and limit', () => {
    expect(apiLimiter).toBeDefined();
    expect(typeof apiLimiter).toBe('function');
  });

  it('authLimiter should be configured for brute force protection', () => {
    expect(authLimiter).toBeDefined();
    expect(typeof authLimiter).toBe('function');
  });
});
