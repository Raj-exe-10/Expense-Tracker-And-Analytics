import React from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';
import { motion, useReducedMotion, Variants } from 'framer-motion';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useNavigate } from 'react-router-dom';
import { LandingNav } from '../components/LandingNav';
import { LandingFooter } from '../components/LandingFooter';
import { HeroDashboardPreview } from '../components/HeroDashboardPreview';
import { useLandingLocale } from '../../../hooks/useLandingLocale';
import { landing, landingFonts } from '../landingTokens';

const ProductCard: React.FC<{
  title: string;
  description: string;
  exploreLabel: string;
  icon: React.ReactNode;
  accentBg: string;
  onExplore: () => void;
}> = ({ title, description, exploreLabel, icon, accentBg, onExplore }) => (
  <Paper
    elevation={0}
    sx={{
      p: 3,
      borderRadius: 3,
      bgcolor: landing.white,
      border: `1px solid ${landing.gray200}`,
    }}
  >
    <Box
      sx={{
        width: 48,
        height: 48,
        borderRadius: '50%',
        bgcolor: accentBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        mb: 2,
      }}
    >
      {icon}
    </Box>
    <Typography
      sx={{ fontFamily: landingFonts.serif, fontWeight: 600, fontSize: '1.35rem', color: landing.black, mb: 1 }}
    >
      {title}
    </Typography>
    <Typography sx={{ fontFamily: landingFonts.sans, color: landing.gray600, fontSize: '0.95rem', lineHeight: 1.6, mb: 2 }}>
      {description}
    </Typography>
    <Button
      endIcon={<ArrowForwardIcon />}
      onClick={onExplore}
      sx={{
        fontFamily: landingFonts.sans,
        textTransform: 'none',
        color: landing.gray600,
        p: 0,
        minWidth: 0,
        '&:hover': { bgcolor: 'transparent', color: landing.black },
      }}
    >
      {exploreLabel}
    </Button>
  </Paper>
);

/** Small animated bar-trend widget — replaces the empty illustration placeholder with real motion. */
const TrendWidget: React.FC<{ bars: number[]; caption: string }> = ({ bars, caption }) => {
  const prefersReducedMotion = useReducedMotion();
  return (
    <Box
      sx={{
        height: 180,
        border: `1px solid ${landing.gray200}`,
        borderRadius: 2,
        bgcolor: landing.white,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        p: 2,
        gap: 1,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, flex: 1 }}>
        {bars.map((h, i) => (
          <motion.div
            key={i}
            style={{
              flex: 1,
              borderRadius: 4,
              background: i === bars.length - 1 ? landing.terminalGreen : landing.gray200,
            }}
            initial={prefersReducedMotion ? { height: `${h}%` } : { height: 0 }}
            whileInView={{ height: `${h}%` }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.55, delay: i * 0.08, ease: 'easeOut' }}
          />
        ))}
      </Box>
      <Typography sx={{ fontFamily: landingFonts.mono, color: landing.gray400, fontSize: '0.72rem' }}>
        {caption}
      </Typography>
    </Box>
  );
};

const FeatureBlock: React.FC<{ title: string; description: string; bars: number[]; caption: string }> = ({
  title,
  description,
  bars,
  caption,
}) => (
  <Box id="features" sx={{ mb: 6 }}>
    <Typography
      component="h2"
      sx={{ fontFamily: landingFonts.serif, fontWeight: 600, fontSize: '1.5rem', color: landing.black, mb: 1.5 }}
    >
      {title}
    </Typography>
    <Typography sx={{ fontFamily: landingFonts.sans, color: landing.gray600, lineHeight: 1.65, mb: 2.5 }}>
      {description}
    </Typography>
    <TrendWidget bars={bars} caption={caption} />
  </Box>
);

export const MobileLanding: React.FC = () => {
  const navigate = useNavigate();
  const { headline, currency } = useLandingLocale();
  const prefersReducedMotion = useReducedMotion();

  const staggerContainer: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: prefersReducedMotion ? 0 : 0.1 } },
  };
  const fadeUpItem: Variants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 14 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: landing.offWhite }}>
      <Box sx={{ bgcolor: landing.black, color: landing.white }}>
        <LandingNav variant="dark" />
        <motion.div
          initial={prefersReducedMotion ? undefined : 'hidden'}
          animate={prefersReducedMotion ? undefined : 'visible'}
          variants={staggerContainer}
        >
          <Box sx={{ px: 2.5, pt: 2, pb: 5 }}>
            <motion.div variants={fadeUpItem}>
              <Typography
                component="h1"
                sx={{
                  fontFamily: landingFonts.serif,
                  fontWeight: 600,
                  fontSize: '2rem',
                  lineHeight: 1.2,
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
                  fontSize: '0.95rem',
                  lineHeight: 1.6,
                  mb: 3,
                }}
              >
                Personal financial tracking for individuals and small businesses. Track spending, manage
                budgets, and settle with groups.
              </Typography>
            </motion.div>
            <motion.div variants={fadeUpItem}>
              <Typography
                sx={{
                  fontFamily: landingFonts.mono,
                  fontSize: '0.68rem',
                  color: landing.gray600,
                  mb: 2,
                }}
              >
                Demo amounts in {currency}
              </Typography>
            </motion.div>
            <motion.div variants={fadeUpItem}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/register')}
                  sx={{
                    bgcolor: landing.white,
                    color: landing.black,
                    fontFamily: landingFonts.sans,
                    textTransform: 'none',
                    fontWeight: 600,
                    py: 1.5,
                    boxShadow: 'none',
                    '&:hover': { bgcolor: landing.gray200, boxShadow: 'none' },
                  }}
                >
                  Get Started
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/login')}
                  sx={{
                    borderColor: landing.white,
                    color: landing.white,
                    fontFamily: landingFonts.sans,
                    textTransform: 'none',
                    fontWeight: 600,
                    py: 1.5,
                    '&:hover': { borderColor: landing.gray200, bgcolor: 'rgba(255,255,255,0.08)' },
                  }}
                >
                  Learn More
                </Button>
              </Box>
            </motion.div>
            <motion.div variants={fadeUpItem}>
              <HeroDashboardPreview compact />
            </motion.div>
          </Box>
        </motion.div>
      </Box>

      <Box sx={{ px: 2.5, py: 5 }}>
        <motion.div
          initial={prefersReducedMotion ? undefined : { opacity: 0, y: 16 }}
          whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <Box id="personal" sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
            <ProductCard
              title="Personal"
              description="Take control of your personal wealth with tools tailored for individual use. Effortless tracking."
              exploreLabel="Explore Personal"
              icon={<PersonOutlineIcon sx={{ color: '#2E7D32' }} />}
              accentBg={landing.personalAccentBg}
              onExplore={() => navigate('/register')}
            />
          </Box>
        </motion.div>
        <motion.div
          initial={prefersReducedMotion ? undefined : { opacity: 0, y: 16 }}
          whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
        >
          <Box id="enterprise">
            <ProductCard
              title="Enterprise"
              description="Robust budget management, multi-user access, and deep analytics for growing businesses."
              exploreLabel="Explore Enterprise"
              icon={<BusinessOutlinedIcon sx={{ color: '#E65100' }} />}
              accentBg={landing.enterpriseAccentBg}
              onExplore={() => navigate('/register')}
            />
          </Box>
        </motion.div>

        <Box sx={{ mt: 6 }}>
          <FeatureBlock
            title="Smart Insights"
            description="Automated categorization and trend analysis helps you see patterns. Identify issues before they become problems."
            bars={[35, 55, 40, 70, 90]}
            caption="Category anomaly detection — live"
          />
          <FeatureBlock
            title="Threaded Ledger"
            description="Link transactions directly to conversations or projects. Keep your records clear and context-rich. It's not just data, it's a story."
            bars={[50, 45, 65, 60, 80]}
            caption="Linked activity over the last 5 weeks"
          />
        </Box>
      </Box>

      <LandingFooter variant="compact" />
    </Box>
  );
};
