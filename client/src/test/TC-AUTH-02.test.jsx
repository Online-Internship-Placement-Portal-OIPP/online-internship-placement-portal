import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { authApi } from '../api/authApi';
import { getStoredAuth, clearStoredAuth } from '../api/client';
import LoginPage from '../pages/LoginPage';
import Navbar from '../components/Navbar';

vi.mock('../api/authApi', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
  },
}));

describe('TC-AUTH-02 User Authentication & JWT Session Management', () => {
  beforeEach(() => {
    sessionStorage.clear();
    clearStoredAuth();
    vi.clearAllMocks();
  });

  const renderLoginWithRouter = (initialEntries = ['/login']) => {
    return render(
      <AuthProvider>
        <MemoryRouter initialEntries={initialEntries}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<div>Register Page Screen</div>} />
            <Route path="/dashboard" element={<div>Student Dashboard Screen</div>} />
            <Route path="/admin" element={<div>Admin Dashboard Screen</div>} />
            <Route path="/internships" element={<div>Internships Catalog Screen</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );
  };

  it('renders login form with email, password fields and registration link', () => {
    renderLoginWithRouter();

    expect(screen.getByRole('heading', { name: /Sign In/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Sign In$/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Create student account/i })).toHaveAttribute(
      'href',
      '/register'
    );
  });

  it('displays client-side validation errors when submitting empty form', async () => {
    renderLoginWithRouter();

    const submitBtn = screen.getByRole('button', { name: /^Sign In$/i });
    await userEvent.click(submitBtn);

    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(authApi.login).not.toHaveBeenCalled();
  });

  it('displays success alert when redirected from registration with a message', () => {
    renderLoginWithRouter([
      {
        pathname: '/login',
        state: { message: 'Registration successful! Please sign in with your credentials.' },
      },
    ]);

    expect(
      screen.getByText('Registration successful! Please sign in with your credentials.')
    ).toBeInTheDocument();
  });

  it('successful student login stores session in sessionStorage and redirects to /dashboard', async () => {
    authApi.login.mockResolvedValueOnce({
      token: 'jwt-student-token-xyz',
      role: 'student',
      name: 'Alice Student',
      expiresIn: 3600,
    });

    renderLoginWithRouter();

    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const submitBtn = screen.getByRole('button', { name: /^Sign In$/i });

    await userEvent.type(emailInput, 'alice@example.com');
    await userEvent.type(passwordInput, 'Secret123');
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Student Dashboard Screen')).toBeInTheDocument();
    });

    expect(authApi.login).toHaveBeenCalledWith({
      email: 'alice@example.com',
      password: 'Secret123',
    });

    const storedAuth = getStoredAuth();
    expect(storedAuth).toEqual({
      token: 'jwt-student-token-xyz',
      user: {
        name: 'Alice Student',
        role: 'student',
      },
    });
  });

  it('successful admin login stores session in sessionStorage and redirects to /admin', async () => {
    authApi.login.mockResolvedValueOnce({
      token: 'jwt-admin-token-xyz',
      role: 'admin',
      name: 'Portal Administrator',
      expiresIn: 3600,
    });

    renderLoginWithRouter();

    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const submitBtn = screen.getByRole('button', { name: /^Sign In$/i });

    await userEvent.type(emailInput, 'admin@oipp.test');
    await userEvent.type(passwordInput, 'AdminPass123');
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard Screen')).toBeInTheDocument();
    });

    const storedAuth = getStoredAuth();
    expect(storedAuth).toEqual({
      token: 'jwt-admin-token-xyz',
      user: {
        name: 'Portal Administrator',
        role: 'admin',
      },
    });
  });

  it('preserves intended destination when user was redirected from a protected route', async () => {
    authApi.login.mockResolvedValueOnce({
      token: 'jwt-student-token',
      role: 'student',
      name: 'Student User',
      expiresIn: 3600,
    });

    renderLoginWithRouter([
      {
        pathname: '/login',
        state: { from: { pathname: '/internships' } },
      },
    ]);

    await userEvent.type(screen.getByLabelText(/Email Address/i), 'student@example.com');
    await userEvent.type(screen.getByLabelText(/Password/i), 'Password123');
    await userEvent.click(screen.getByRole('button', { name: /^Sign In$/i }));

    await waitFor(() => {
      expect(screen.getByText('Internships Catalog Screen')).toBeInTheDocument();
    });
  });

  it('displays error alert on 401 INVALID_CREDENTIALS', async () => {
    authApi.login.mockRejectedValueOnce({
      status: 401,
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password.',
    });

    renderLoginWithRouter();

    await userEvent.type(screen.getByLabelText(/Email Address/i), 'wrong@example.com');
    await userEvent.type(screen.getByLabelText(/Password/i), 'wrongpassword');
    await userEvent.click(screen.getByRole('button', { name: /^Sign In$/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid email or password.');
    });

    expect(getStoredAuth()).toBeNull();
    expect(screen.queryByText('Student Dashboard Screen')).not.toBeInTheDocument();
  });

  it('displays field errors on 400 VALIDATION_ERROR with details', async () => {
    authApi.login.mockRejectedValueOnce({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Please correct highlighted fields.',
      details: [{ field: 'email', message: 'A valid email address is required.' }],
    });

    renderLoginWithRouter();

    await userEvent.type(screen.getByLabelText(/Email Address/i), 'invalid-email');
    await userEvent.type(screen.getByLabelText(/Password/i), 'somepass');
    await userEvent.click(screen.getByRole('button', { name: /^Sign In$/i }));

    await waitFor(() => {
      expect(screen.getByText('A valid email address is required.')).toBeInTheDocument();
    });
  });

  it('logout button in Navbar clears sessionStorage and returns to unauthenticated state', async () => {
    // Seed authenticated session
    sessionStorage.setItem(
      'oipp_auth',
      JSON.stringify({
        token: 'active-session-token',
        user: { name: 'Active User', role: 'student' },
      })
    );

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Navbar />
          <Routes>
            <Route path="/dashboard" element={<div>Dashboard Screen</div>} />
            <Route path="/login" element={<div>Login Page Screen</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText('Active User')).toBeInTheDocument();
    const logoutBtn = screen.getByRole('button', { name: /Logout/i });

    await userEvent.click(logoutBtn);

    await waitFor(() => {
      expect(screen.getByText('Login Page Screen')).toBeInTheDocument();
    });

    expect(getStoredAuth()).toBeNull();
  });

  it('redirects already authenticated student visiting /login to /dashboard', () => {
    sessionStorage.setItem(
      'oipp_auth',
      JSON.stringify({
        token: 'existing-token',
        user: { name: 'Existing Student', role: 'student' },
      })
    );

    renderLoginWithRouter(['/login']);

    expect(screen.getByText('Student Dashboard Screen')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Sign In/i })).not.toBeInTheDocument();
  });

  it('redirects already authenticated admin visiting /login to /admin', () => {
    sessionStorage.setItem(
      'oipp_auth',
      JSON.stringify({
        token: 'existing-admin-token',
        user: { name: 'Existing Admin', role: 'admin' },
      })
    );

    renderLoginWithRouter(['/login']);

    expect(screen.getByText('Admin Dashboard Screen')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Sign In/i })).not.toBeInTheDocument();
  });
});
