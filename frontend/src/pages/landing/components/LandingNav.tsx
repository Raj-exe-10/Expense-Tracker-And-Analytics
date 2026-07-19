import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Box,
  Button,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { Link, useNavigate } from 'react-router-dom';
import { LandingLogo } from './LandingLogo';
import { landing, landingFonts } from '../landingTokens';

const DESKTOP_LINKS = [
  { label: 'Product', href: '#product' },
  { label: 'Solutions', href: '#solutions' },
  { label: 'Network', href: '#network' },
  { label: 'Compliance', href: '#compliance' },
];

const MOBILE_LINKS = [
  { label: 'Personal', href: '#personal' },
  { label: 'Enterprise', href: '#enterprise' },
  { label: 'Features', href: '#features' },
];

interface LandingNavProps {
  variant: 'dark' | 'light';
}

export const LandingNav: React.FC<LandingNavProps> = ({ variant }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [open, setOpen] = useState(false);

  const isDark = variant === 'dark';
  const links = isDesktop ? DESKTOP_LINKS : MOBILE_LINKS;

  const linkSx = {
    fontFamily: landingFonts.sans,
    fontSize: '0.9rem',
    color: isDark ? landing.white : landing.black,
    textDecoration: 'none',
    opacity: 0.85,
    '&:hover': { opacity: 1 },
  };

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: isDark ? landing.black : landing.offWhite,
          color: isDark ? landing.white : landing.black,
          borderBottom: isDark ? `1px solid ${landing.border}` : `1px solid ${landing.gray200}`,
        }}
      >
        <Toolbar
          sx={{
            width: '100%',
            px: { xs: 2, md: 3, lg: 4, xl: 6 },
            minHeight: { xs: 56, md: 64 },
          }}
        >
          <LandingLogo light={isDark} />
          <Box sx={{ flexGrow: 1 }} />

          {isDesktop ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mr: 2 }}>
              {links.map((l) => (
                <Box key={l.label} component="a" href={l.href} sx={linkSx}>
                  {l.label}
                </Box>
              ))}
            </Box>
          ) : (
            <IconButton
              color="inherit"
              aria-label="Open menu"
              onClick={() => setOpen(true)}
              sx={{ ml: 1 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
            <Button
              color="inherit"
              onClick={() => navigate('/login')}
              sx={{
                fontFamily: landingFonts.sans,
                textTransform: 'none',
                fontWeight: 500,
                minWidth: 'auto',
                px: { xs: 1, sm: 2 },
              }}
            >
              Sign in
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate('/register')}
              sx={{
                fontFamily: landingFonts.sans,
                textTransform: 'none',
                fontWeight: 600,
                bgcolor: isDark ? landing.white : landing.black,
                color: isDark ? landing.black : landing.white,
                boxShadow: 'none',
                px: { xs: 2, sm: 2.5 },
                '&:hover': {
                  bgcolor: isDark ? landing.gray200 : landing.gray800,
                  boxShadow: 'none',
                },
              }}
            >
              {isDesktop ? 'Start free' : 'Get Started'}
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{ sx: { width: 280, bgcolor: landing.black, color: landing.white } }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
          <IconButton color="inherit" onClick={() => setOpen(false)} aria-label="Close menu">
            <CloseIcon />
          </IconButton>
        </Box>
        <List>
          {MOBILE_LINKS.map((l) => (
            <ListItemButton
              key={l.label}
              component="a"
              href={l.href}
              onClick={() => setOpen(false)}
            >
              <ListItemText primary={l.label} />
            </ListItemButton>
          ))}
          <ListItemButton component={Link} to="/login" onClick={() => setOpen(false)}>
            <ListItemText primary="Sign in" />
          </ListItemButton>
          <ListItemButton component={Link} to="/register" onClick={() => setOpen(false)}>
            <ListItemText primary="Create account" />
          </ListItemButton>
        </List>
      </Drawer>
    </>
  );
};
