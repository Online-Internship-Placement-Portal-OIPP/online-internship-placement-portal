import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import { setStoredAuth, clearStoredAuth } from '../../api/client';
import AdminDashboard from './AdminDashboard';

describe('TC-UX-01 AdminDashboard', () => {
  beforeEach(() => {
    sessionStorage.clear();
    clearStoredAuth();
  });

  it('greets the admin and links directly to both management pages', () => {
    setStoredAuth({ token: 'test-token', user: { name: 'Portal Admin', role: 'admin' } });
    render(
      <AuthProvider>
        <MemoryRouter>
          <AdminDashboard />
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText(/Logged in as Portal Admin/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Manage Internships' })).toHaveAttribute('href', '/admin/internships');
    expect(screen.getByRole('link', { name: 'Manage Aptitude Tests' })).toHaveAttribute('href', '/admin/tests');
  });
});
