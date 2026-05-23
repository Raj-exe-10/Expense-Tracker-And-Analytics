import React from 'react';
import { Card, CardProps } from '@mui/material';

export const LcCard: React.FC<CardProps> = ({ sx, children, ...props }) => (
  <Card
    sx={{
      bgcolor: 'background.paper',
      border: '1px solid',
      borderColor: 'divider',
      boxShadow: 'none',
      ...sx,
    }}
    {...props}
  >
    {children}
  </Card>
);
