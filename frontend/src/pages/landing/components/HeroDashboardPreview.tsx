import React, { useEffect, useState } from 'react';
import { Box, Button, Grid, Typography } from '@mui/material';
import { motion, useReducedMotion } from 'framer-motion';
import { CashFlowSankey } from './CashFlowSankey';
import { landing, landingFonts } from '../landingTokens';
import { useLandingLocale } from '../../../hooks/useLandingLocale';

interface HeroDashboardPreviewProps {
  compact?: boolean;
}

/** Pulsing placeholder bar used while the widget "loads" — matches the terminal/analyst atmosphere. */
const SkeletonBar: React.FC<{ width: string | number; height?: number; delay?: number }> = ({
  width,
  height = 10,
  delay = 0,
}) => (
  <motion.div
    style={{ width, height, borderRadius: 4, background: landing.gray800 }}
    animate={{ opacity: [0.4, 0.85, 0.4] }}
    transition={{ duration: 1.2, repeat: Infinity, delay, ease: 'easeInOut' }}
  />
);

const DashboardSkeleton: React.FC<{ compact: boolean }> = ({ compact }) => (
  <Grid container spacing={2}>
    <Grid item xs={12} lg={compact ? 12 : 8}>
      <Box
        sx={{
          border: `1px solid ${landing.border}`,
          borderRadius: 1.5,
          bgcolor: landing.surfaceElevated,
          p: compact ? 1.5 : 2,
          height: '100%',
          minHeight: compact ? 200 : 240,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          justifyContent: 'center',
        }}
      >
        <SkeletonBar width="45%" />
        {[0, 1, 2].map((i) => (
          <Box key={i} sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <SkeletonBar width={80} height={32} delay={i * 0.15} />
            <SkeletonBar width="100%" height={32} delay={i * 0.15} />
          </Box>
        ))}
      </Box>
    </Grid>
    <Grid item xs={12} lg={compact ? 12 : 4}>
      <Box
        sx={{
          border: `1px solid ${landing.border}`,
          borderRadius: 1.5,
          bgcolor: landing.surfaceElevated,
          p: compact ? 1.5 : 2,
          height: '100%',
          minHeight: compact ? 140 : 240,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.25,
          justifyContent: 'center',
        }}
      >
        {[0, 1].map((i) => (
          <SkeletonBar key={i} width="100%" height={44} delay={i * 0.15} />
        ))}
      </Box>
    </Grid>
  </Grid>
);

export const HeroDashboardPreview: React.FC<HeroDashboardPreviewProps> = ({ compact = false }) => {
  const { formatMoney, cashFlow, insights } = useLandingLocale();
  const { totalIncome, categories, savingsMomPercent } = cashFlow;
  const prefersReducedMotion = useReducedMotion();
  const [ready, setReady] = useState(!!prefersReducedMotion);

  useEffect(() => {
    if (prefersReducedMotion) {
      setReady(true);
      return;
    }
    const id = setTimeout(() => setReady(true), 650);
    return () => clearTimeout(id);
  }, [prefersReducedMotion]);

  return (
    <Box
      sx={{
        border: `1px solid ${landing.border}`,
        borderRadius: 2,
        bgcolor: landing.surface,
        p: compact ? 2 : 3,
        width: '100%',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 1.5,
          mb: 2.5,
        }}
      >
        <Typography
          sx={{
            fontFamily: landingFonts.sans,
            fontWeight: 600,
            fontSize: compact ? '0.8rem' : '0.95rem',
            lineHeight: 1.3,
          }}
        >
          Q3 Personal Financial Performance &amp; Analysis
        </Typography>
        {!compact && (
          <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
            <Button
              size="small"
              variant="outlined"
              sx={{
                borderColor: landing.border,
                color: landing.white,
                fontFamily: landingFonts.sans,
                textTransform: 'none',
                fontSize: '0.75rem',
                py: 0.5,
              }}
            >
              Export CSV
            </Button>
            <Button
              size="small"
              variant="contained"
              disabled
              sx={{
                bgcolor: landing.gray800,
                color: landing.gray600,
                fontFamily: landingFonts.sans,
                textTransform: 'none',
                fontSize: '0.75rem',
                boxShadow: 'none',
              }}
            >
              Generate Report
            </Button>
          </Box>
        )}
      </Box>

      {!ready ? (
        <DashboardSkeleton compact={compact} />
      ) : (
        <motion.div
          initial={prefersReducedMotion ? undefined : { opacity: 0, y: 8 }}
          animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <Grid container spacing={2}>
            <Grid item xs={12} lg={compact ? 12 : 8}>
              <Box
                sx={{
                  border: `1px solid ${landing.border}`,
                  borderRadius: 1.5,
                  bgcolor: landing.surfaceElevated,
                  p: compact ? 1.5 : 2,
                  height: '100%',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 1.5,
                    flexWrap: 'wrap',
                    gap: 1,
                  }}
                >
                  <Typography
                    sx={{ fontFamily: landingFonts.sans, fontWeight: 600, fontSize: compact ? '0.8rem' : '0.9rem' }}
                  >
                    Cash Flow Allocation
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <motion.div
                      style={{ width: 6, height: 6, borderRadius: '50%', background: landing.terminalGreen }}
                      animate={prefersReducedMotion ? undefined : { opacity: [1, 0.4, 1] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <Typography
                      sx={{
                        fontFamily: landingFonts.sans,
                        fontSize: '0.75rem',
                        color: landing.terminalGreen,
                        fontWeight: 500,
                      }}
                    >
                      + {savingsMomPercent}% MoM Savings
                    </Typography>
                  </Box>
                </Box>
                <CashFlowSankey
                  totalIncome={totalIncome}
                  categories={categories}
                  formatMoney={formatMoney}
                  compact={compact}
                />
              </Box>
            </Grid>

            <Grid item xs={12} lg={compact ? 12 : 4}>
              <Box
                sx={{
                  border: `1px solid ${landing.border}`,
                  borderRadius: 1.5,
                  bgcolor: landing.surfaceElevated,
                  p: compact ? 1.5 : 2,
                  height: '100%',
                }}
              >
                <Typography
                  sx={{
                    fontFamily: landingFonts.sans,
                    fontWeight: 600,
                    fontSize: compact ? '0.8rem' : '0.9rem',
                    mb: 1.5,
                  }}
                >
                  Personal Spending Insights
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                  {insights.map((insight, i) => (
                    <motion.div
                      key={insight.title}
                      initial={prefersReducedMotion ? undefined : { opacity: 0, x: 10 }}
                      animate={prefersReducedMotion ? undefined : { opacity: 1, x: 0 }}
                      transition={{ duration: 0.35, delay: i * 0.1, ease: 'easeOut' }}
                    >
                      <Box
                        sx={{
                          border: `1px solid ${landing.border}`,
                          borderRadius: 1,
                          bgcolor: landing.gray900,
                          p: 1.25,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Box
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              bgcolor: landing.terminalGreen,
                              flexShrink: 0,
                            }}
                          />
                          <Typography
                            sx={{
                              fontFamily: landingFonts.sans,
                              fontWeight: 600,
                              fontSize: '0.78rem',
                            }}
                          >
                            {insight.title}
                          </Typography>
                        </Box>
                        <Typography
                          sx={{
                            fontFamily: landingFonts.sans,
                            fontSize: '0.72rem',
                            color: landing.gray400,
                            lineHeight: 1.45,
                            pl: 2,
                          }}
                        >
                          {insight.body}
                        </Typography>
                      </Box>
                    </motion.div>
                  ))}
                </Box>
              </Box>
            </Grid>
          </Grid>
        </motion.div>
      )}
    </Box>
  );
};
