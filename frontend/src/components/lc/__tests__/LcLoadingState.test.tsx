import React from 'react';
import { render, screen } from '@testing-library/react';
import { LcLoadingState } from '../LcLoadingState';

describe('LcLoadingState', () => {
  it('renders a status indicator', () => {
    render(<LcLoadingState />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders an optional label', () => {
    render(<LcLoadingState label="Loading expenses..." />);
    expect(screen.getByText('Loading expenses...')).toBeInTheDocument();
  });
});
