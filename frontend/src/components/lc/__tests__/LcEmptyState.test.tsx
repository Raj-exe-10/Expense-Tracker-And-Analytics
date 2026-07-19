import React from 'react';
import { render, screen } from '@testing-library/react';
import { LcEmptyState } from '../LcEmptyState';

describe('LcEmptyState', () => {
  it('renders the title', () => {
    render(<LcEmptyState title="No expenses yet" />);
    expect(screen.getByText('No expenses yet')).toBeInTheDocument();
  });

  it('renders optional description and action', () => {
    render(
      <LcEmptyState
        title="No expenses yet"
        description="Start tracking your spending"
        action={<button>Add expense</button>}
      />,
    );
    expect(screen.getByText('Start tracking your spending')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add expense' })).toBeInTheDocument();
  });
});
