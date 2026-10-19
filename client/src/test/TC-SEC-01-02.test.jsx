import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import Navbar from '../components/Navbar';
import App from '../App';

describe('TC-SEC-01 / TC-SEC-02 Frontend Protected Routes & Role Guards', () => {
  const unauthContext = {
    user: null,
    token: null,
    isAuthenticated: false,
    isAdmin: false,
    isStudent: false,
    login: () => {},
    logout: () => {},
  };

  const studentContext = {
    user: { name: 'Student One', role: 'student' },
    token: 'token-student',
    isAuthenticated: true,
    isAdmin: false,
    isStudent: true,
    login: () => {},
    logout: () => {},
  };

  const adminContext = {
    user: { name: 'Admin One', role: 'admin' },
    token: 'token-admin',
    isAuthenticated: true,
    isAdmin: true,
    isStudent: false,
    login: () => {},
    logout: () => {},
  };

  it('TC-SEC-01 redirects unauthenticated user to /login when accessing protected route', () => {
    render(
      <AuthContext.Provider value={unauthContext}>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route path="/login" element={<div>Login Page Screen</div>} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute role="student">
                  <div>Protected Student Dashboard</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText('Login Page Screen')).toBeInTheDocument();
    expect(screen.queryByText('Protected Student Dashboard')).not.toBeInTheDocument();
  });

  it('TC-SEC-02 redirects student accessing admin route to /dashboard', () => {
    render(
      <AuthContext.Provider value={studentContext}>
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route path="/dashboard" element={<div>Student Home Dashboard</div>} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute role="admin">
                  <div>Admin Secret Console</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText('Student Home Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Admin Secret Console')).not.toBeInTheDocument();
  });

  it('TC-SEC-02 redirects admin accessing student-only route to /admin', () => {
    render(
      <AuthContext.Provider value={adminContext}>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route path="/admin" element={<div>Admin Home Console</div>} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute role="student">
                  <div>Student Space</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText('Admin Home Console')).toBeInTheDocument();
    expect(screen.queryByText('Student Space')).not.toBeInTheDocument();
  });

  it('renders admin navigation items on Navbar for admin user', () => {
    render(
      <AuthContext.Provider value={adminContext}>
        <MemoryRouter>
          <Navbar />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByRole('link', { name: /Admin Dashboard/i })).toHaveAttribute('href', '/admin');
    expect(screen.getByRole('link', { name: /Manage Internships/i })).toHaveAttribute('href', '/admin/internships');
    expect(screen.getByRole('link', { name: /Manage Tests/i })).toHaveAttribute('href', '/admin/tests');
    expect(screen.getByText('Admin One')).toBeInTheDocument();
  });

  it('renders login and register links on Navbar for unauthenticated visitors', () => {
    render(
      <AuthContext.Provider value={unauthContext}>
        <MemoryRouter>
          <Navbar />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByRole('link', { name: /^Login$/i })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: /^Register$/i })).toHaveAttribute('href', '/register');
  });

  it('renders NotFoundPage (404) for unknown URL paths', () => {
    render(
      <AuthContext.Provider value={studentContext}>
        <MemoryRouter initialEntries={['/some-unknown-path-xyz']}>
          <App />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText(/404 — Page Not Found/i)).toBeInTheDocument();
  });
});
