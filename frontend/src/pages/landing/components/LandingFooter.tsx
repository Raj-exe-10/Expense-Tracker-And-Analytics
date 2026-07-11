import React from 'react';
import { Box, Grid, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import { LandingLogo } from './LandingLogo';
import { landing, landingFonts } from '../landingTokens';

const FOOTER_COLUMNS = [
  {
    title: 'PRODUCT',
    links: [
      { label: 'Features', to: '/register' },
      { label: 'Pricing', to: '/register' },
      { label: 'Changelog', to: '/register' },
    ],
  },
  {
    title: 'SOLUTIONS',
    links: [
      { label: 'Personal', to: '/register' },
      { label: 'Enterprise', to: '/register' },
      { label: 'API', to: '/register' },
    ],
  },
  {
    title: 'NETWORK',
    links: [
      { label: 'Partners', to: '/register' },
      { label: 'Community', to: '/register' },
    ],
  },
  {
    title: 'COMPLIANCE',
    links: [
      { label: 'Security', to: '/privacy' },
      { label: 'Terms', to: '/terms' },
      { label: 'Privacy', to: '/privacy' },
    ],
  },
];

const MOBILE_LINKS = [
  'Product',
  'Features',
  'Pricing',
  'Company',
  'Help Center',
  'Contact',
  'Careers',
  'Blog',
  'API',
  'Privacy Policy',
  'Security',
  'Terms',
];

interface LandingFooterProps {
  variant: 'columns' | 'compact';
}

export const LandingFooter: React.FC<LandingFooterProps> = ({ variant }) => {
  const isCompact = variant === 'compact';

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: landing.black,
        color: landing.white,
        py: { xs: 5, md: 8 },
        px: { xs: 2, md: 3 },
      }}
    >
      <Box sx={{ maxWidth: landing.maxContent, mx: 'auto' }}>
        {isCompact ? (
          <>
            <LandingLogo />
            <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {MOBILE_LINKS.map((label) => (
                <Typography
                  key={label}
                  component={Link}
                  to={label.includes('Privacy') ? '/privacy' : label.includes('Terms') ? '/terms' : '/register'}
                  sx={{
                    fontFamily: landingFonts.sans,
                    fontSize: '0.9rem',
                    color: landing.white,
                    textDecoration: 'none',
                    opacity: 0.8,
                  }}
                >
                  {label}
                </Typography>
              ))}
            </Box>
            <Typography
              variant="caption"
              sx={{ display: 'block', mt: 4, opacity: 0.5, fontFamily: landingFonts.sans }}
            >
              © {new Date().getFullYear()} LedgerCore. All rights reserved.
            </Typography>
          </>
        ) : (
          <>
            <Typography
              sx={{
                fontFamily: landingFonts.serif,
                fontSize: { xs: '2rem', md: '2.75rem' },
                fontWeight: 600,
                mb: { xs: 4, md: 6 },
              }}
            >
              LedgerCore
            </Typography>
            <Grid container spacing={4}>
              {FOOTER_COLUMNS.map((col) => (
                <Grid item xs={6} sm={3} key={col.title}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontFamily: landingFonts.mono,
                      letterSpacing: 1,
                      opacity: 0.5,
                      display: 'block',
                      mb: 2,
                    }}
                  >
                    {col.title}
                  </Typography>
                  {col.links.map((link) => (
                    <Typography
                      key={link.label}
                      component={Link}
                      to={link.to}
                      sx={{
                        display: 'block',
                        fontFamily: landingFonts.sans,
                        fontSize: '0.9rem',
                        color: landing.white,
                        textDecoration: 'none',
                        opacity: 0.75,
                        mb: 1,
                        '&:hover': { opacity: 1 },
                      }}
                    >
                      {link.label}
                    </Typography>
                  ))}
                </Grid>
              ))}
            </Grid>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mt: 6,
                opacity: 0.45,
                fontFamily: landingFonts.mono,
              }}
            >
              © {new Date().getFullYear()} LedgerCore. Precision in every byte.
            </Typography>
          </>
        )}
      </Box>
    </Box>
  );
};
