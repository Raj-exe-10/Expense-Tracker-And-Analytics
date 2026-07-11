import React from 'react';
import { Box, Alert, Button, useMediaQuery, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { DesktopLanding } from './sections/DesktopLanding';
import { MobileLanding } from './sections/MobileLanding';
import { landingFonts } from './landingTokens';

const LandingPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  return (
    <Box sx={{ minHeight: '100vh', width: '100%' }}>
      {isAuthenticated && (
        <Alert
          severity="info"
          sx={{
            borderRadius: 0,
            justifyContent: 'center',
            fontFamily: landingFonts.sans,
            '& .MuiAlert-message': { flex: 1, textAlign: 'center' },
          }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => navigate('/app/home')}
              sx={{ fontFamily: landingFonts.sans, textTransform: 'none', fontWeight: 600 }}
            >
              Open dashboard
            </Button>
          }
        >
          You are signed in.
        </Alert>
      )}
      {isDesktop ? <DesktopLanding /> : <MobileLanding />}
    </Box>
  );
};

export default LandingPage;
