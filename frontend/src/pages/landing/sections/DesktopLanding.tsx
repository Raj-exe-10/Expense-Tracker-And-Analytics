import React from 'react';
import { Box, Button, Grid, Typography } from '@mui/material';
import { motion, useReducedMotion, Variants } from 'framer-motion';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useNavigate } from 'react-router-dom';
import { LandingNav } from '../components/LandingNav';
import { LandingFooter } from '../components/LandingFooter';
import { HeroDashboardPreview } from '../components/HeroDashboardPreview';
import { useLandingLocale } from '../../../hooks/useLandingLocale';
import { landing, landingFonts } from '../landingTokens';

const TERMINAL_LINES = [
  '> ANALYZING TRENDS...',
  '> Anomaly detected in Q2 overheads.',
  '> Recommended action: Reallocate surplus.',
  '_',
];

const SESSIONS = [
  { name: 'Analyst_01', status: 'online' as const },
  { name: 'Controller_Sys', status: 'online' as const },
  { name: 'Guest_Auditor', status: 'idle' as const },
];

const SectionShell: React.FC<{ children: React.ReactNode; id?: string }> = ({ children, id }) => (
  <Box
    id={id}
    sx={{
      width: '100%',
      px: { md: 3, lg: 4, xl: 6 },
      py: { md: 8, lg: 10 },
    }}
  >
    {children}
  </Box>
);

export const DesktopLanding: React.FC = () => {
  const navigate = useNavigate();
  const { headline, expensesTrackedStat, currency } = useLandingLocale();
  const prefersReducedMotion = useReducedMotion();

  const STATS = [
    { value: '500+', label: 'Enterprise Users' },
    { value: expensesTrackedStat, label: 'Expenses Tracked' },
    { value: '98%', label: 'Allocation Accuracy' },
    { value: '4.8', label: 'Average Rating' },
  ];

  const staggerContainer: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: prefersReducedMotion ? 0 : 0.1 } },
  };
  const fadeUpItem: Variants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 14 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  };
  const fadeInItem: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.35, ease: 'easeOut' } },
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: landing.black, color: landing.white }}>
      <LandingNav variant="dark" />

      <SectionShell>
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={6} lg={5}>
            <motion.div
              initial={prefersReducedMotion ? undefined : 'hidden'}
              animate={prefersReducedMotion ? undefined : 'visible'}
              variants={staggerContainer}
            >
              <motion.div variants={fadeUpItem}>
                <Typography
                  component="h1"
                  sx={{
                    fontFamily: landingFonts.serif,
                    fontWeight: 600,
                    fontSize: { md: '2.4rem', lg: '3.25rem' },
                    lineHeight: 1.15,
                    mb: 2,
                  }}
                >
                  {headline}
                </Typography>
              </motion.div>
              <motion.div variants={fadeUpItem}>
                <Typography
                  sx={{
                    fontFamily: landingFonts.sans,
                    color: landing.gray400,
                    fontSize: '1.05rem',
                    lineHeight: 1.6,
                    mb: 4,
                    maxWidth: 520,
                  }}
                >
                  Institutional-grade financial intelligence, simplified for personal clarity and team
                  efficiency. Precision in every byte.
                </Typography>
              </motion.div>
              <motion.div variants={fadeUpItem}>
                <Typography
                  sx={{
                    fontFamily: landingFonts.mono,
                    fontSize: '0.72rem',
                    color: landing.gray600,
                    mb: 3,
                  }}
                >
                  Demo amounts in {currency} · detected from your locale
                </Typography>
              </motion.div>
              <motion.div variants={fadeUpItem}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => navigate('/register')}
                    sx={{
                      bgcolor: landing.white,
                      color: landing.black,
                      fontFamily: landingFonts.sans,
                      textTransform: 'none',
                      fontWeight: 600,
                      px: 3,
                      boxShadow: 'none',
                      '&:hover': { bgcolor: landing.gray200, boxShadow: 'none' },
                    }}
                  >
                    Start for free
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => navigate('/register')}
                    sx={{
                      borderColor: landing.white,
                      color: landing.white,
                      fontFamily: landingFonts.sans,
                      textTransform: 'none',
                      fontWeight: 600,
                      px: 3,
                      '&:hover': { borderColor: landing.gray200, bgcolor: 'rgba(255,255,255,0.06)' },
                    }}
                  >
                    Book enterprise demo
                  </Button>
                </Box>
              </motion.div>
              <motion.div variants={fadeUpItem}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ display: 'flex' }}>
                    {['#888', '#AAA', '#CCC'].map((c, i) => (
                      <Box
                        key={c}
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          bgcolor: c,
                          border: `2px solid ${landing.black}`,
                          ml: i > 0 ? -1.5 : 0,
                        }}
                      />
                    ))}
                  </Box>
                  <Typography sx={{ fontFamily: landingFonts.sans, fontSize: '0.9rem', color: landing.gray400 }}>
                    ★ 4.8 from sophisticated analysts
                  </Typography>
                </Box>
              </motion.div>
            </motion.div>
          </Grid>

          <Grid item xs={12} md={6} lg={7}>
            <motion.div
              initial={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.98 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
            >
              <HeroDashboardPreview />
            </motion.div>
          </Grid>
        </Grid>
      </SectionShell>

      <Box sx={{ borderTop: `1px solid ${landing.border}`, borderBottom: `1px solid ${landing.border}` }}>
        <motion.div
          initial={prefersReducedMotion ? undefined : 'hidden'}
          whileInView={prefersReducedMotion ? undefined : 'visible'}
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerContainer}
        >
          <Grid
            container
            sx={{ width: '100%', px: { md: 3, lg: 4, xl: 6 }, py: 4 }}
          >
            {STATS.map((s) => (
              <Grid item xs={6} md={3} key={s.label}>
                <motion.div variants={fadeUpItem}>
                  <Typography
                    sx={{ fontFamily: landingFonts.serif, fontSize: '1.75rem', fontWeight: 600 }}
                  >
                    {s.value}
                  </Typography>
                  <Typography sx={{ fontFamily: landingFonts.sans, fontSize: '0.85rem', color: landing.gray400 }}>
                    {s.label}
                  </Typography>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </motion.div>
      </Box>

      <SectionShell id="product">
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={6} order={{ xs: 2, md: 1 }}>
            <Box
              sx={{
                bgcolor: landing.surfaceElevated,
                border: `1px solid ${landing.border}`,
                borderRadius: 1,
                p: 2,
                fontFamily: landingFonts.mono,
                fontSize: '0.85rem',
              }}
            >
              <Typography sx={{ color: landing.gray400, mb: 1, fontSize: '0.75rem' }}>
                smart insights.log
              </Typography>
              <motion.div
                initial={prefersReducedMotion ? undefined : 'hidden'}
                whileInView={prefersReducedMotion ? undefined : 'visible'}
                viewport={{ once: true, margin: '-60px' }}
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: prefersReducedMotion ? 0 : 0.35 } },
                }}
              >
                {TERMINAL_LINES.map((line) => (
                  <motion.div key={line} variants={fadeInItem}>
                    <Typography
                      sx={{
                        color: line.startsWith('>') ? landing.terminalGreen : landing.terminalMuted,
                        lineHeight: 1.8,
                      }}
                    >
                      {line}
                    </Typography>
                  </motion.div>
                ))}
              </motion.div>
            </Box>
          </Grid>
          <Grid item xs={12} md={6} order={{ xs: 1, md: 2 }}>
            <motion.div
              initial={prefersReducedMotion ? undefined : { opacity: 0, y: 16 }}
              whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            >
              <Typography
                component="h2"
                sx={{ fontFamily: landingFonts.serif, fontSize: '2rem', fontWeight: 600, mb: 2 }}
              >
                Algorithmic Clarity.
              </Typography>
              <Typography sx={{ fontFamily: landingFonts.sans, color: landing.gray400, lineHeight: 1.7, mb: 3 }}>
                Move beyond static reports. Our system actively scans your ledger for inefficiencies,
                providing actionable intelligence with mathematical precision.
              </Typography>
              {['Auto-categorization', 'Trend anomaly detection'].map((item) => (
                <Box key={item} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <CheckCircleOutlineIcon sx={{ fontSize: 20, color: landing.white }} />
                  <Typography sx={{ fontFamily: landingFonts.sans }}>{item}</Typography>
                </Box>
              ))}
            </motion.div>
          </Grid>
        </Grid>
      </SectionShell>

      <SectionShell id="solutions">
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={6}>
            <motion.div
              initial={prefersReducedMotion ? undefined : { opacity: 0, y: 16 }}
              whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            >
              <Typography
                component="h2"
                sx={{ fontFamily: landingFonts.serif, fontSize: '2rem', fontWeight: 600, mb: 2 }}
              >
                Synchronized Ledgers.
              </Typography>
              <Typography sx={{ fontFamily: landingFonts.sans, color: landing.gray400, lineHeight: 1.7, mb: 3 }}>
                Real-time multi-user concurrency without data collisions. Maintain a single source of
                truth across decentralized analyst teams.
              </Typography>
              {['Granular access controls', 'Immutable audit trails'].map((item) => (
                <Box key={item} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <CheckCircleOutlineIcon sx={{ fontSize: 20, color: landing.white }} />
                  <Typography sx={{ fontFamily: landingFonts.sans }}>{item}</Typography>
                </Box>
              ))}
            </motion.div>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                border: `1px solid ${landing.border}`,
                borderRadius: 2,
                bgcolor: landing.surface,
                p: 3,
              }}
            >
              <Typography sx={{ fontFamily: landingFonts.mono, fontSize: '0.8rem', color: landing.gray400, mb: 2 }}>
                Active Sessions (3)
              </Typography>
              <motion.div
                initial={prefersReducedMotion ? undefined : 'hidden'}
                whileInView={prefersReducedMotion ? undefined : 'visible'}
                viewport={{ once: true, margin: '-60px' }}
                variants={staggerContainer}
              >
                {SESSIONS.map((s) => (
                  <motion.div key={s.name} variants={fadeUpItem}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        py: 1.5,
                        borderBottom: `1px solid ${landing.border}`,
                        '&:last-child': { borderBottom: 0 },
                      }}
                    >
                      <motion.div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: s.status === 'online' ? landing.terminalGreen : landing.gray600,
                        }}
                        animate={
                          prefersReducedMotion || s.status !== 'online' ? undefined : { opacity: [1, 0.4, 1] }
                        }
                        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                      />
                      <Typography sx={{ fontFamily: landingFonts.mono, fontSize: '0.9rem' }}>{s.name}</Typography>
                    </Box>
                  </motion.div>
                ))}
              </motion.div>
            </Box>
          </Grid>
        </Grid>
      </SectionShell>

      <Box id="compliance" sx={{ display: 'none' }} aria-hidden />
      <Box id="network" sx={{ display: 'none' }} aria-hidden />

      <LandingFooter variant="columns" />
    </Box>
  );
};
