import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import StudentDashboard from '../pages/StudentDashboard';
import Navbar from '../components/Navbar';
import progressApi from '../api/progressApi';

// Mock the api module — never mock the network
vi.mock('../api/progressApi', () => ({
  default: { getProgress: vi.fn() },
}));

const mockStudentAuth = {
  user: { name: 'Namitha Student', role: 'student' },
  token: 'valid-student-token',
  isAuthenticated: true,
  isAdmin: false,
  isStudent: true,
  login: () => {},
  logout: () => {},
};

const FIXTURE_PROGRESS = {
  testsAvailable: 4,
  testsCompleted: 1,
  totalAttempts: 3,
  applicationsSubmitted: 2,
  completionPercentage: 25,
  recentActivities: [],
};

const renderWithAuth = (ui, route = '/dashboard') =>
  render(
    <AuthContext.Provider value={mockStudentAuth}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </AuthContext.Provider>
  );

describe('TC-UX-01 / NFR-05 Dashboard Direct Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    progressApi.getProgress.mockResolvedValue({ success: true, data: FIXTURE_PROGRESS });
  });

  it('renders direct navigation links from student dashboard to all key modules', async () => {
    renderWithAuth(<StudentDashboard />);

    expect(screen.getByText(/Welcome back, Namitha Student!/i)).toBeInTheDocument();

    // Verify NFR-05 requirements: direct links to Internships, Applications, Tests, Progress, Analysis
    expect(screen.getByRole('link', { name: /Browse Internships/i })).toHaveAttribute('href', '/internships');
    expect(screen.getByRole('link', { name: /My Applications/i })).toHaveAttribute('href', '/applications');
    expect(screen.getByRole('link', { name: /Aptitude Tests/i })).toHaveAttribute('href', '/tests');
    expect(screen.getByRole('link', { name: /Preparation Progress/i })).toHaveAttribute('href', '/progress');
    expect(screen.getByRole('link', { name: /Performance Analysis/i })).toHaveAttribute('href', '/analysis');

    await screen.findByText('Total attempts');
  });

  it('shows the summary from /api/progress after a loading state', async () => {
    renderWithAuth(<StudentDashboard />);

    expect(screen.getByRole('status')).toBeInTheDocument();

    expect(await screen.findByText('25%')).toBeInTheDocument();
    expect(screen.getByText('1 / 4')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(progressApi.getProgress).toHaveBeenCalledTimes(1);
  });

  it('shows the empty state when the student has no activity', async () => {
    progressApi.getProgress.mockResolvedValue({
      success: true,
      data: {
        ...FIXTURE_PROGRESS,
        testsCompleted: 0,
        totalAttempts: 0,
        applicationsSubmitted: 0,
        completionPercentage: 0,
      },
    });

    renderWithAuth(<StudentDashboard />);

    expect(await screen.findByText('No preparation activity yet')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Browse Tests/i })).toHaveAttribute('href', '/tests');
  });

  it('shows the API message and keeps every link when the summary fails', async () => {
    progressApi.getProgress.mockRejectedValue({
      code: 'SERVER_ERROR',
      message: 'Failed to load progress.',
    });

    renderWithAuth(<StudentDashboard />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to load progress.');
    expect(screen.getByRole('link', { name: /Browse Internships/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Performance Analysis/i })).toBeInTheDocument();
  });

  it('renders student navigation items on the Navbar per NFR-05', () => {
    renderWithAuth(<Navbar />);

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

  it('highlights only the active Navbar link, including on nested pages', () => {
    renderWithAuth(<Navbar />, '/tests/abc/attempt');

    const nav = screen.getByRole('navigation', { name: /Main navigation/i });
    const active = within(nav).getByRole('link', { name: /^Aptitude Tests$/i });

    expect(active).toHaveClass('active');
    expect(active).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('link', { name: /^Dashboard$/i })).not.toHaveClass('active');
  });

  it('opens the mobile menu and closes it after a link click or Escape', () => {
    renderWithAuth(<Navbar />);

    const toggle = screen.getByRole('button', { name: /Toggle navigation menu/i });
    const nav = screen.getByRole('navigation', { name: /Main navigation/i });

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAttribute('aria-controls', nav.id);

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(nav).toHaveClass('open');

    fireEvent.click(within(nav).getByRole('link', { name: /^Progress$/i }));
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(nav).not.toHaveClass('open');

    fireEvent.click(toggle);
    fireEvent.keyDown(within(nav).getByRole('link', { name: /^Results$/i }), { key: 'Escape' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveFocus();
  });
});
