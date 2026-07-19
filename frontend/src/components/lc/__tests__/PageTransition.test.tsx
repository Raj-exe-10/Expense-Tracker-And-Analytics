import React from 'react';
import { render, screen } from '@testing-library/react';
import { PageTransition } from '../PageTransition';

jest.mock('framer-motion', () => {
  const actual = jest.requireActual('framer-motion');
  return {
    ...actual,
    useReducedMotion: jest.fn(),
  };
});

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { useReducedMotion } = require('framer-motion');

describe('PageTransition', () => {
  it('renders children when motion is allowed', () => {
    (useReducedMotion as jest.Mock).mockReturnValue(false);
    render(
      <PageTransition>
        <p>Page content</p>
      </PageTransition>,
    );
    expect(screen.getByText('Page content')).toBeInTheDocument();
  });

  it('renders children without the animation wrapper when reduced motion is preferred', () => {
    (useReducedMotion as jest.Mock).mockReturnValue(true);
    render(
      <PageTransition>
        <p>Page content</p>
      </PageTransition>,
    );
    expect(screen.getByText('Page content')).toBeInTheDocument();
  });
});
