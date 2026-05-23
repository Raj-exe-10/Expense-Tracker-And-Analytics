import React from 'react';
import {
  Box,
  Typography,
  Button,
  AppBar,
  Toolbar,
  Container,
  Grid,
  Paper,
  TextField,
  Link as MuiLink,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { AccountBalance, Smartphone } from '@mui/icons-material';
import { ledgerCoreColors } from '../../theme/ledgerCoreTheme';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: ledgerCoreColors.authBg, color: ledgerCoreColors.authText }}>
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: ledgerCoreColors.authPaper, color: 'inherit' }}>
        <Toolbar sx={{ maxWidth: 1200, mx: 'auto', width: '100%' }}>
          <AccountBalance sx={{ mr: 1 }} />
          <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
            LedgerCore
          </Typography>
          {isDesktop && (
            <Box sx={{ display: 'flex', gap: 3, mr: 3 }}>
              <MuiLink href="#personal" underline="none" color="inherit">
                Personal
              </MuiLink>
              <MuiLink href="#enterprise" underline="none" color="inherit">
                Enterprise
              </MuiLink>
              <MuiLink href="#pricing" underline="none" color="inherit">
                Pricing
              </MuiLink>
            </Box>
          )}
          <Button variant="contained" color="primary" onClick={() => navigate('/login')}>
            Sign In
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                display: 'inline-block',
                px: 1.5,
                py: 0.5,
                mb: 2,
                borderRadius: 4,
                border: 1,
                borderColor: 'divider',
                fontSize: 12,
              }}
            >
              ● SYSTEM OPERATIONAL
            </Box>
            <Typography variant="h3" fontWeight={800} gutterBottom>
              Absolute Mathematical Certainty.
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 480 }}>
              LedgerCore delivers high-density financial management with surgical accuracy for personal
              wealth and enterprise governance.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button variant="contained" size="large" onClick={() => navigate('/register')}>
                Deploy Infrastructure
              </Button>
              <Button variant="outlined" size="large" onClick={() => navigate('/login')}>
                View Documentation
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, bgcolor: '#E8E8E8' }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 120, mb: 2 }}>
                {[40, 65, 50, 80, 55, 90, 70].map((h, i) => (
                  <Box
                    key={i}
                    sx={{
                      flex: 1,
                      height: h,
                      bgcolor: i === 5 ? '#333' : '#BBB',
                      borderRadius: 1,
                    }}
                  />
                ))}
              </Box>
              <Typography variant="h4" fontWeight={700}>
                $12,450.00
              </Typography>
              <Typography variant="body2" sx={{ color: ledgerCoreColors.positive }}>
                ● Positive Variance
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Grid container spacing={6} sx={{ mt: 8 }} id="personal">
          <Grid item xs={12} md={5}>
            <Paper
              sx={{
                p: 2,
                maxWidth: 280,
                mx: { xs: 'auto', md: 0 },
                borderRadius: 4,
                bgcolor: '#111',
                color: '#fff',
              }}
            >
              <Typography variant="caption" color="grey.500">
                TOTAL LIQUIDITY
              </Typography>
              <Typography variant="h5" fontWeight={700}>
                $8,042.15
              </Typography>
              <Typography variant="caption" sx={{ mt: 2, display: 'block' }}>
                RECENT ENTRIES
              </Typography>
              <Typography variant="body2">Merchant Alpha · -142.50</Typography>
              <Typography variant="body2">Utility Provider · -85.00</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={7}>
            <Typography variant="overline" color="text.secondary">
              |
            </Typography>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Personal Wealth Control
            </Typography>
            <Typography color="text.secondary" paragraph>
              Tactical mobile interface with envelope architecture for isolating funds and transaction
              scrubbing for raw data processing.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Paper variant="outlined" sx={{ p: 2, flex: 1, minWidth: 200 }}>
                <Smartphone color="action" />
                <Typography fontWeight={600} sx={{ mt: 1 }}>
                  Envelope Architecture
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Isolate funds by purpose
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2, flex: 1, minWidth: 200 }}>
                <AccountBalance color="action" />
                <Typography fontWeight={600} sx={{ mt: 1 }}>
                  Transaction Scrubbing
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Clean and categorize raw imports
                </Typography>
              </Paper>
            </Box>
          </Grid>
        </Grid>

        <Grid container spacing={6} sx={{ mt: 8 }} id="enterprise">
          <Grid item xs={12} md={6}>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Corporate Governance
            </Typography>
            <Typography color="text.secondary" paragraph>
              Auditable dashboards, supervised entities, and export controls for enterprise teams.
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography fontWeight={600}>Squad Allocation</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Team budgets
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography fontWeight={600}>Audit Trail</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Full compliance log
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, bgcolor: '#FAFAFA' }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ width: 80, bgcolor: '#EEE', borderRadius: 1, p: 1 }}>
                  <Typography variant="caption">Dashboard</Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" fontWeight={700}>
                    Q3 Operations
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <ChipMock label="INFLOW $1.2M" positive />
                    <ChipMock label="OUTFLOW $450K" />
                  </Box>
                  <Typography variant="caption" sx={{ mt: 2, display: 'block' }}>
                    ALLOCATION MATRIX
                  </Typography>
                  <Box sx={{ display: 'flex', height: 12, borderRadius: 1, overflow: 'hidden', mt: 0.5 }}>
                    <Box sx={{ flex: 3, bgcolor: '#333' }} />
                    <Box sx={{ flex: 2, bgcolor: '#888' }} />
                    <Box sx={{ flex: 2, bgcolor: '#CCC' }} />
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        <Paper
          id="pricing"
          sx={{
            mt: 10,
            p: { xs: 4, md: 6 },
            textAlign: 'center',
            bgcolor: '#EBEBEB',
            borderRadius: 2,
          }}
        >
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Initialize Your Ledger Today.
          </Typography>
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              maxWidth: 480,
              mx: 'auto',
              mt: 3,
              flexDirection: { xs: 'column', sm: 'row' },
            }}
          >
            <TextField fullWidth placeholder="System Admin Email" size="small" sx={{ bgcolor: '#fff' }} />
            <Button variant="contained" onClick={() => navigate('/register')}>
              Request Access
            </Button>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            Enterprise SSO available for verified domains.
          </Typography>
        </Paper>
      </Container>

      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          borderTop: 1,
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          maxWidth: 1200,
          mx: 'auto',
        }}
      >
        <Typography variant="caption">© 2026 LedgerCore Systems. All rights reserved.</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <MuiLink component={Link} to="/terms" variant="caption" color="inherit">
            Terms
          </MuiLink>
          <MuiLink component={Link} to="/privacy" variant="caption" color="inherit">
            Privacy
          </MuiLink>
          <MuiLink component={Link} to="/login" variant="caption" color="inherit">
            Sign In
          </MuiLink>
        </Box>
      </Box>
    </Box>
  );
};

const ChipMock: React.FC<{ label: string; positive?: boolean }> = ({ label, positive }) => (
  <Typography
    variant="caption"
    sx={{
      px: 1,
      py: 0.25,
      borderRadius: 1,
      bgcolor: '#fff',
      border: 1,
      borderColor: 'divider',
      color: positive ? ledgerCoreColors.positive : 'inherit',
    }}
  >
    {label}
  </Typography>
);

export default LandingPage;
