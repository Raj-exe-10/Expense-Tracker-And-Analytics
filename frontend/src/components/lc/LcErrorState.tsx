import React from 'react';
import { Alert, AlertTitle, Button, Box } from '@mui/material';

export interface LcErrorStateProps {
  message: string;
  onRetry?: () => void;
}

/** Shared error placeholder — keeps navigation usable and offers a retry action instead of a dead end. */
export const LcErrorState: React.FC<LcErrorStateProps> = ({ message, onRetry }) => (
  <Box sx={{ width: '100%', py: 2 }}>
    <Alert severity="error" role="alert" action={onRetry && (
      <Button color="inherit" size="small" onClick={onRetry}>
        Retry
      </Button>
    )}>
      <AlertTitle>Something went wrong</AlertTitle>
      {message}
    </Alert>
  </Box>
);
