import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/authApi';
import FormField from '../components/FormField';
import Alert from '../components/Alert';

export const RegisterPage = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const errors = {};
    if (!name.trim()) errors.name = 'Full name is required';
    if (!email.trim()) errors.email = 'Email address is required';
    if (!password) errors.password = 'Password is required (min 8 characters)';
    else if (password.length < 8) errors.password = 'Password must be at least 8 characters';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      await authApi.register({ name: name.trim(), email: email.trim(), password });
      navigate('/login', {
        state: { message: 'Registration successful! Please sign in with your credentials.' },
      });
    } catch (err) {
      setError(err.message || 'Registration failed. Please check the form.');
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
      <h1>Create Account</h1>
      <p style={{ color: 'var(--color-muted)' }}>
        Register as a student to prepare for placements and apply for internships.
      </p>

      {error && <Alert type="danger" message={error} />}

      <form onSubmit={handleSubmit} noValidate>
        <FormField
          id="register-name"
          label="Full Name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={fieldErrors.name}
          required
          placeholder="e.g. Alex Johnson"
          autoComplete="name"
        />

        <FormField
          id="register-email"
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
          required
          placeholder="e.g. alex@example.com"
          autoComplete="email"
        />

        <FormField
          id="register-password"
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          required
          placeholder="At least 8 characters"
          autoComplete="new-password"
          hint="Must be between 8 and 72 characters."
        />

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', marginTop: 'var(--space-3)' }}
          disabled={submitting}
        >
          {submitting ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <div style={{ marginTop: 'var(--space-5)', textAlign: 'center', fontSize: 'var(--font-size-sm)' }}>
        Already registered?{' '}
        <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 500 }}>
          Sign in
        </Link>
      </div>
    </div>
  );
};

export default RegisterPage;
