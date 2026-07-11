import React from 'react';
import { Box, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import { landing, landingFonts } from '../landingTokens';

export const LandingLogo: React.FC<{ light?: boolean; to?: string }> = ({ light = true, to = '/' }) => (
  <Box
    component={Link}
    to={to}
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 1,
      textDecoration: 'none',
      color: light ? landing.white : landing.black,
    }}
  >
    <Box
      sx={{
        width: 28,
        height: 28,
        border: `2px solid ${light ? landing.white : landing.black}`,
        borderRadius: 0.5,
        position: 'relative',
        flexShrink: 0,
        '&::after': {
          content: '""',
          position: 'absolute',
          left: '50%',
          top: 4,
          bottom: 4,
          width: 2,
          bgcolor: light ? landing.white : landing.black,
          transform: 'translateX(-50%)',
        },
      }}
    />
    <Typography
      component="span"
      sx={{ fontFamily: landingFonts.serif, fontWeight: 600, fontSize: { xs: '1.1rem', md: '1.25rem' } }}
    >
      LedgerCore
    </Typography>
  </Box>
);
