import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LcErrorState } from '../LcErrorState';

describe('LcErrorState', () => {
  it('renders the error message as an alert', () => {
    render(<LcErrorState message="Could not load expenses" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load expenses');
  });

  it('calls onRetry when the retry action is clicked', () => {
    const onRetry = jest.fn();
    render(<LcErrorState message="Could not load expenses" onRetry={onRetry} />);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('does not render a retry button when onRetry is omitted', () => {
    render(<LcErrorState message="Could not load expenses" />);
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
  });
});
