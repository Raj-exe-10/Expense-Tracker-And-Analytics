import React from 'react';
import { Box, Typography, useMediaQuery, useTheme } from '@mui/material';
import { ledgerCoreColors } from '../../theme/ledgerCoreTheme';

export const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  if (!isDesktop) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: ledgerCoreColors.authBg,
          px: 2,
          py: 4,
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 420 }}>{children}</Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex' }}>
      <Box
        sx={{
          flex: 1,
          bgcolor: ledgerCoreColors.authBg,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          px: 6,
        }}
      >
        <Typography variant="h4" fontWeight={700} gutterBottom>
          LedgerCore
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 360, textAlign: 'center', fontStyle: 'italic' }}>
          The level of precision is unparalleled. It strips away the noise and lets you focus on the actual data.
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 3 }}>
          — Alex K., Financial Controller
        </Typography>
      </Box>
      <Box
        sx={{
          flex: 1,
          bgcolor: ledgerCoreColors.authPaper,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 4,
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 400 }}>{children}</Box>
      </Box>
    </Box>
  );
};
