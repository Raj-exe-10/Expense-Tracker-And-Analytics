import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

export interface LcLoadingStateProps {
  label?: string;
  /** Fills the parent's height (e.g. a full page) instead of a compact inline spinner. */
  fullHeight?: boolean;
}

/** Shared loading placeholder — use instead of an ad hoc spinner so every page feels consistent. */
export const LcLoadingState: React.FC<LcLoadingStateProps> = ({ label, fullHeight = true }) => (
  <Box
    role="status"
    aria-live="polite"
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 1.5,
      width: '100%',
      minHeight: fullHeight ? '40vh' : 120,
      py: 4,
    }}
  >
    <CircularProgress />
    {label && (
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    )}
  </Box>
);
