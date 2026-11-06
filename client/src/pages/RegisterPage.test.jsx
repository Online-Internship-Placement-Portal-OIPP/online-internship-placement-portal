import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { authApi } from '../api/authApi';
import { clearStoredAuth } from '../api/client';
import RegisterPage from './RegisterPage';

vi.mock('../api/authApi', () => ({
  authApi: { login: vi.fn(), register: vi.fn() },
}));

// Shows the message passed to /login so the redirect can be checked.
function LoginStub() {
  const location = useLocation();
  return <div>Login Screen: {location.state?.message}</div>;
}

function renderRegister() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginStub />} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

async function fillForm(user, { name, email, password }) {
  if (name) await user.type(screen.getByLabelText(/full name/i), name);
  if (email) await user.type(screen.getByLabelText(/email address/i), email);
  if (password) await user.type(screen.getByLabelText(/password/i), password);
  await user.click(screen.getByRole('button', { name: 'Create Account' }));
}

describe('TC-AUTH-01 RegisterPage', () => {
  beforeEach(() => {
    sessionStorage.clear();
    clearStoredAuth();
    vi.clearAllMocks();
  });

  it('registers with trimmed details and redirects to /login with a success message', async () => {
    const user = userEvent.setup();
    authApi.register.mockResolvedValue({ success: true, data: { role: 'student' } });
    renderRegister();

    await fillForm(user, { name: '  Asha K  ', email: ' asha@oipp.test ', password: 'Student@123' });

    expect(authApi.register).toHaveBeenCalledWith({ name: 'Asha K', email: 'asha@oipp.test', password: 'Student@123' });
    expect(await screen.findByText(/Login Screen: Registration successful/)).toBeInTheDocument();
  });

  it('shows a message under each field for an empty form and sends nothing', async () => {
    const user = userEvent.setup();
    renderRegister();

    await user.click(screen.getByRole('button', { name: 'Create Account' }));

    expect(screen.getByText('Full name is required')).toBeInTheDocument();
    expect(screen.getByText('Email address is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required (min 8 characters)')).toBeInTheDocument();
    expect(authApi.register).not.toHaveBeenCalled();
  });

  it('rejects a password shorter than 8 characters before sending', async () => {
    const user = userEvent.setup();
    renderRegister();

    await fillForm(user, { name: 'Asha K', email: 'asha@oipp.test', password: 'short' });

    expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    expect(authApi.register).not.toHaveBeenCalled();
  });

  it('shows server field errors from VALIDATION_ERROR details', async () => {
    const user = userEvent.setup();
    authApi.register.mockRejectedValue({
      code: 'VALIDATION_ERROR',
      message: 'Please correct the highlighted fields.',
      details: [
        { field: 'name', message: 'Name must be at least 2 characters.' },
        { field: 'email', message: 'A valid email address is required.' },
      ],
    });
    renderRegister();

    await fillForm(user, { name: 'A', email: 'abc', password: 'Student@123' });

    expect(await screen.findByText('Name must be at least 2 characters.')).toBeInTheDocument();
    expect(screen.getByText('A valid email address is required.')).toBeInTheDocument();
    expect(screen.getByText('Please correct the highlighted fields.')).toBeInTheDocument();
  });

  it('shows the EMAIL_EXISTS message for a duplicate email', async () => {
    const user = userEvent.setup();
    authApi.register.mockRejectedValue({ code: 'EMAIL_EXISTS', message: 'An account with this email already exists.' });
    renderRegister();

    await fillForm(user, { name: 'Asha K', email: 'asha@oipp.test', password: 'Student@123' });

    expect(await screen.findByText('An account with this email already exists.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeEnabled();
  });
});
