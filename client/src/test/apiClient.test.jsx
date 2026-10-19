import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import apiClient, { getStoredAuth, setStoredAuth, clearStoredAuth } from '../api/client';

describe('Centralized API Client & Storage (S0-05)', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('manages auth data in sessionStorage with key oipp_auth', () => {
    expect(getStoredAuth()).toBeNull();

    const authPayload = {
      token: 'jwt-xyz-123',
      user: { name: 'Alex Student', role: 'student' },
    };

    setStoredAuth(authPayload);
    expect(getStoredAuth()).toEqual(authPayload);

    clearStoredAuth();
    expect(getStoredAuth()).toBeNull();
  });

  it('attaches Bearer token in request interceptor when auth exists', async () => {
    setStoredAuth({
      token: 'bearer-test-token',
      user: { name: 'Student', role: 'student' },
    });

    // Run interceptor directly
    const interceptor = apiClient.interceptors.request.handlers[0];
    const config = await interceptor.fulfilled({ headers: {} });

    expect(config.headers.Authorization).toBe('Bearer bearer-test-token');
  });

  it('does not attach Authorization header if no token is stored', async () => {
    clearStoredAuth();

    const interceptor = apiClient.interceptors.request.handlers[0];
    const config = await interceptor.fulfilled({ headers: {} });

    expect(config.headers.Authorization).toBeUndefined();
  });

  it('normalizes error envelope from backend in response interceptor', async () => {
    const errorInterceptor = apiClient.interceptors.response.handlers[0].rejected;

    const mockAxiosError = {
      response: {
        status: 400,
        data: {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Please correct highlighted fields.',
            details: [{ field: 'email', message: 'Invalid email' }],
          },
        },
      },
    };

    try {
      await errorInterceptor(mockAxiosError);
      expect.fail('Should have thrown an error');
    } catch (err) {
      expect(err).toEqual({
        code: 'VALIDATION_ERROR',
        message: 'Please correct highlighted fields.',
        details: [{ field: 'email', message: 'Invalid email' }],
        status: 400,
      });
    }
  });

  it('clears stored auth on 401 UNAUTHORIZED response', async () => {
    setStoredAuth({
      token: 'expired-token',
      user: { name: 'Student', role: 'student' },
    });

    const errorInterceptor = apiClient.interceptors.response.handlers[0].rejected;

    const mock401Error = {
      response: {
        status: 401,
        data: {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Please log in to continue.',
          },
        },
      },
    };

    try {
      await errorInterceptor(mock401Error);
      expect.fail('Should have thrown an error');
    } catch (err) {
      expect(err.code).toBe('UNAUTHORIZED');
      expect(getStoredAuth()).toBeNull();
    }
  });
});
