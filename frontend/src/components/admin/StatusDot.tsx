import React from 'react';
import { Box, Typography } from '@mui/material';

const statusColor: Record<string, string> = {
  verified: 'success.main',
  cleared: 'success.main',
  active: 'success.main',
  completed: 'success.main',
  pending: 'text.disabled',
  processing: 'warning.main',
  flagged: 'error.main',
  failed: 'error.main',
  inactive: 'text.disabled',
};

export const StatusDot: React.FC<{ status: string; label?: string }> = ({ status, label }) => (
  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
    <Box
      sx={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        bgcolor: statusColor[status] || 'text.disabled',
      }}
    />
    {label && (
      <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
        {label}
      </Typography>
    )}
  </Box>
);
