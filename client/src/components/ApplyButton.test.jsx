import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ApplyButton from './ApplyButton';
import applicationsApi from '../api/applicationsApi';

vi.mock('../api/applicationsApi', () => ({
  default: { apply: vi.fn() },
}));

const internship = {
  id: 'internship-1',
  title: 'Software Engineering Intern',
  company: 'OIPP Demo Company',
  status: 'open',
  deadlinePassed: false,
  hasApplied: false,
};

describe('TC-APP-01 ApplyButton', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows Applied when the student already applied', () => {
    render(<ApplyButton internship={{ ...internship, hasApplied: true }} />);
    expect(screen.getByRole('button', { name: '✓ Applied' })).toBeDisabled();
  });

  it('confirms and submits an application', async () => {
    const user = userEvent.setup();
    const onApplied = vi.fn();
    applicationsApi.apply.mockResolvedValue({ success: true });
    render(<ApplyButton internship={internship} onApplied={onApplied} />);

    await user.click(screen.getByRole('button', { name: 'Apply now' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Apply to Software Engineering Intern at OIPP Demo Company?');
    await user.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() => expect(applicationsApi.apply).toHaveBeenCalledWith('internship-1'));
    expect(await screen.findByText('Application submitted.')).toBeInTheDocument();
    expect(onApplied).toHaveBeenCalled();
  });

  it('shows the API duplicate error', async () => {
    const user = userEvent.setup();
    applicationsApi.apply.mockRejectedValue({ message: 'You have already applied for this internship.' });
    render(<ApplyButton internship={internship} />);

    await user.click(screen.getByRole('button', { name: 'Apply now' }));
    await user.click(screen.getByRole('button', { name: 'Apply' }));

    expect(await screen.findByText('You have already applied for this internship.')).toBeInTheDocument();
  });
});
