import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import StudentDashboard from '../pages/StudentDashboard';
import Navbar from '../components/Navbar';

describe('TC-UX-01 / NFR-05 Dashboard Direct Navigation', () => {
  const mockStudentAuth = {
    user: { name: 'Namitha Student', role: 'student' },
    token: 'valid-student-token',
    isAuthenticated: true,
    isAdmin: false,
    isStudent: true,
    login: () => {},
    logout: () => {},
  };

  it('renders direct navigation links from student dashboard to all key modules', () => {
    render(
      <AuthContext.Provider value={mockStudentAuth}>
        <MemoryRouter>
          <StudentDashboard />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    // Verify Welcome message
    expect(screen.getByText(/Welcome back, Namitha Student!/i)).toBeInTheDocument();

    // Verify NFR-05 requirements: direct links to Internships, Applications, Tests, Progress, Analysis
    const internshipsLink = screen.getByRole('link', { name: /Browse Internships/i });
    expect(internshipsLink).toBeInTheDocument();
    expect(internshipsLink).toHaveAttribute('href', '/internships');

    const applicationsLink = screen.getByRole('link', { name: /My Applications/i });
    expect(applicationsLink).toBeInTheDocument();
    expect(applicationsLink).toHaveAttribute('href', '/applications');

    const testsLink = screen.getByRole('link', { name: /Aptitude Tests/i });
    expect(testsLink).toBeInTheDocument();
    expect(testsLink).toHaveAttribute('href', '/tests');

    const progressLink = screen.getByRole('link', { name: /Preparation Progress/i });
    expect(progressLink).toBeInTheDocument();
    expect(progressLink).toHaveAttribute('href', '/progress');

    const analysisLink = screen.getByRole('link', { name: /Performance Analysis/i });
    expect(analysisLink).toBeInTheDocument();
    expect(analysisLink).toHaveAttribute('href', '/analysis');
  });

  it('renders student navigation items on the Navbar per NFR-05', () => {
    render(
      <AuthContext.Provider value={mockStudentAuth}>
        <MemoryRouter>
          <Navbar />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    // Navbar should have links to all required student sections
    expect(screen.getByRole('link', { name: /^Dashboard$/i })).toHaveAttribute('href', '/dashboard');
    expect(screen.getByRole('link', { name: /^Internships$/i })).toHaveAttribute('href', '/internships');
    expect(screen.getByRole('link', { name: /^My Applications$/i })).toHaveAttribute('href', '/applications');
    expect(screen.getByRole('link', { name: /^Aptitude Tests$/i })).toHaveAttribute('href', '/tests');
    expect(screen.getByRole('link', { name: /^Results$/i })).toHaveAttribute('href', '/results');
    expect(screen.getByRole('link', { name: /^Progress$/i })).toHaveAttribute('href', '/progress');
    expect(screen.getByRole('link', { name: /^Analysis$/i })).toHaveAttribute('href', '/analysis');
    expect(screen.getByRole('button', { name: /^Logout$/i })).toBeInTheDocument();
  });
});
