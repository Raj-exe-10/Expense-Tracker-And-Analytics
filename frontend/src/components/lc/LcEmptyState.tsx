import React from 'react';
import { Box, Typography } from '@mui/material';

export interface LcEmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

/** Shared empty-state placeholder — explains why a list/page has nothing to show, with an optional next step. */
export const LcEmptyState: React.FC<LcEmptyStateProps> = ({ title, description, action, icon }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      width: '100%',
      px: 3,
      py: 6,
    }}
  >
    {icon && <Box sx={{ mb: 1.5, color: 'text.secondary' }}>{icon}</Box>}
    <Typography variant="h6" color="text.secondary" gutterBottom>
      {title}
    </Typography>
    {description && (
      <Typography variant="body2" color="text.secondary" sx={{ mb: action ? 3 : 0, maxWidth: 420 }}>
        {description}
      </Typography>
    )}
    {action}
  </Box>
);
