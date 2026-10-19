import React, { useState } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/authApi';
import FormField from '../components/FormField';
import Alert from '../components/Alert';

export const LoginPage = () => {
  const { login, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // If already logged in, redirect to appropriate dashboard
  if (isAuthenticated) {
    return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    // Client-side quick check
    const errors = {};
    if (!email) errors.email = 'Email is required';
    if (!password) errors.password = 'Password is required';
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const response = await authApi.login({ email, password });
      // response format: { success: true, data: { token, role, name, expiresIn } }
      const data = response?.data || response;
      login(data);

      const from = location.state?.from?.pathname || (data.role === 'admin' ? '/admin' : '/dashboard');
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
      if (err.details && Array.isArray(err.details)) {
        const detailsMap = {};
        err.details.forEach((d) => {
          if (d.field) detailsMap[d.field] = d.message;
        });
        setFieldErrors(detailsMap);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '440px', margin: 'var(--space-8) auto' }}>
      <h1>Sign In</h1>
      <p style={{ color: 'var(--color-muted)' }}>
        Access your OIPP student or administrator account.
      </p>

      {error && <Alert type="danger" message={error} />}

      <form onSubmit={handleSubmit} noValidate>
        <FormField
          id="login-email"
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
          required
          placeholder="e.g. student@example.com"
          autoComplete="email"
        />

        <FormField
          id="login-password"
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          required
          placeholder="••••••••"
          autoComplete="current-password"
        />

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', marginTop: 'var(--space-3)' }}
          disabled={submitting}
        >
          {submitting ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div style={{ marginTop: 'var(--space-5)', textAlign: 'center', fontSize: 'var(--font-size-sm)' }}>
        Don't have an account?{' '}
        <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 500 }}>
          Create student account
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;
