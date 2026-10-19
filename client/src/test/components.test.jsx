import React, { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Alert from '../components/Alert';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import ConfirmDialog from '../components/ConfirmDialog';
import FormField from '../components/FormField';

describe('Reusable UI Components (S0-05)', () => {
  // 1. Alert component
  describe('Alert', () => {
    it('renders with message and proper role="alert"', () => {
      render(<Alert type="danger" message="Invalid email or password" />);
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveClass('alert-danger');
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });

    it('triggers onClose callback when close button is clicked', async () => {
      const handleClose = vi.fn();
      render(<Alert type="success" message="Success!" onClose={handleClose} />);
      const closeBtn = screen.getByRole('button', { name: /Close alert/i });
      await userEvent.click(closeBtn);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  // 2. Loader component
  describe('Loader', () => {
    it('renders loading text and role="status"', () => {
      render(<Loader message="Fetching internships..." />);
      const loader = screen.getByRole('status');
      expect(loader).toBeInTheDocument();
      expect(screen.getByText('Fetching internships...')).toBeInTheDocument();
    });
  });

  // 3. EmptyState component
  describe('EmptyState', () => {
    it('renders title, description, and action button', () => {
      render(
        <EmptyState
          title="No applications yet"
          message="You have not submitted any applications."
          action={<button type="button">Apply Now</button>}
        />
      );
      expect(screen.getByText('No applications yet')).toBeInTheDocument();
      expect(screen.getByText('You have not submitted any applications.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Apply Now' })).toBeInTheDocument();
    });
  });

  // 4. Pagination component
  describe('Pagination', () => {
    it('renders page info and fires onPageChange callbacks', async () => {
      const handlePageChange = vi.fn();
      render(
        <Pagination
          page={2}
          limit={10}
          total={50}
          onPageChange={handlePageChange}
        />
      );

      expect(screen.getByText('Page 2 of 5')).toBeInTheDocument();

      const prevBtn = screen.getByRole('button', { name: /Previous/i });
      const nextBtn = screen.getByRole('button', { name: /Next/i });

      expect(prevBtn).not.toBeDisabled();
      expect(nextBtn).not.toBeDisabled();

      await userEvent.click(prevBtn);
      expect(handlePageChange).toHaveBeenCalledWith(1);

      await userEvent.click(nextBtn);
      expect(handlePageChange).toHaveBeenCalledWith(3);
    });

    it('disables previous button on first page and next button on last page', () => {
      const { rerender } = render(
        <Pagination page={1} limit={10} total={30} onPageChange={() => {}} />
      );
      expect(screen.getByRole('button', { name: /Previous/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /Next/i })).not.toBeDisabled();

      rerender(
        <Pagination page={3} limit={10} total={30} onPageChange={() => {}} />
      );
      expect(screen.getByRole('button', { name: /Next/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /Previous/i })).not.toBeDisabled();
    });
  });

  // 5. ConfirmDialog component
  describe('ConfirmDialog', () => {
    it('renders modal with title and message when isOpen is true', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="Delete Internship?"
          message="This action will permanently delete this opportunity."
          onConfirm={() => {}}
          onCancel={() => {}}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Delete Internship?')).toBeInTheDocument();
      expect(screen.getByText('This action will permanently delete this opportunity.')).toBeInTheDocument();
    });

    it('fires onConfirm and onCancel handlers', async () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      render(
        <ConfirmDialog
          isOpen={true}
          title="Confirm"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(onCancel).toHaveBeenCalledTimes(1);

      await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('does not render when isOpen is false', () => {
      render(
        <ConfirmDialog
          isOpen={false}
          title="Hidden Modal"
          onConfirm={() => {}}
          onCancel={() => {}}
        />
      );
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  // 6. FormField component
  describe('FormField', () => {
    it('renders input with label and associates aria attributes on error', () => {
      render(
        <FormField
          id="email-field"
          label="Email Address"
          value=""
          onChange={() => {}}
          error="Email is required"
          hint="Use your college email address"
          required
        />
      );

      const label = screen.getByText('Email Address');
      expect(label).toBeInTheDocument();
      expect(screen.getByText('*')).toBeInTheDocument();

      const input = screen.getByLabelText(/Email Address/i);
      expect(input).toHaveAttribute('id', 'email-field');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby', 'email-field-error email-field-hint');

      expect(screen.getByRole('alert')).toHaveTextContent('Email is required');
    });
  });
});
