import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { motion, useReducedMotion } from 'framer-motion';
import { CashFlowCategory } from '../../../utils/localeCurrency';
import { landing, landingFonts } from '../landingTokens';

interface CashFlowSankeyProps {
  totalIncome: number;
  categories: CashFlowCategory[];
  formatMoney: (n: number) => string;
  compact?: boolean;
}

function buildLinkPath(
  sourceTop: number,
  sourceHeight: number,
  targetTop: number,
  targetHeight: number,
  chartWidth: number,
  chartHeight: number,
): string {
  const pad = 8;
  const x0 = pad + 2;
  const x1 = chartWidth - pad - 2;
  const mid = (x0 + x1) / 2;
  const y0a = sourceTop;
  const y0b = sourceTop + sourceHeight;
  const y1a = targetTop;
  const y1b = targetTop + targetHeight;
  return [
    `M ${x0} ${y0a}`,
    `C ${mid} ${y0a}, ${mid} ${y1a}, ${x1} ${y1a}`,
    `L ${x1} ${y1b}`,
    `C ${mid} ${y1b}, ${mid} ${y0b}, ${x0} ${y0b}`,
    'Z',
  ].join(' ');
}

export const CashFlowSankey: React.FC<CashFlowSankeyProps> = ({
  totalIncome,
  categories,
  formatMoney,
  compact = false,
}) => {
  const chartHeight = compact ? 200 : 240;
  const chartWidth = 100;
  const prefersReducedMotion = useReducedMotion();

  const layout = useMemo(() => {
    const gap = 6;
    const totalGap = gap * (categories.length - 1);
    const usable = chartHeight - totalGap;
    let targetOffset = 0;
    let sourceOffset = 0;
    const nodes = categories.map((cat) => {
      const h = (cat.amount / totalIncome) * usable;
      const node = {
        ...cat,
        top: targetOffset,
        height: h,
        sourceTop: sourceOffset,
        sourceHeight: h,
      };
      targetOffset += h + gap;
      sourceOffset += h;
      return node;
    });
    return { nodes, sourceHeight: usable, sourceTop: 0 };
  }, [categories, totalIncome, chartHeight]);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'stretch',
        gap: { xs: 1, sm: 1.5 },
        minHeight: chartHeight,
        width: '100%',
      }}
    >
      <motion.div
        style={{ flexShrink: 0, display: 'flex' }}
        initial={prefersReducedMotion ? undefined : { opacity: 0, x: -8 }}
        animate={prefersReducedMotion ? undefined : { opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <Box
          sx={{
            width: { xs: 76, sm: 108 },
            border: `1px solid ${landing.border}`,
            borderRadius: 1,
            bgcolor: landing.gray900,
            p: 1.25,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <Typography
            sx={{
              fontFamily: landingFonts.sans,
              fontSize: compact ? '0.65rem' : '0.72rem',
              color: landing.gray400,
              mb: 0.5,
            }}
          >
            Total Income
          </Typography>
          <Typography
            sx={{
              fontFamily: landingFonts.sans,
              fontWeight: 700,
              fontSize: compact ? '0.85rem' : '1rem',
              lineHeight: 1.2,
            }}
          >
            {formatMoney(totalIncome)}
          </Typography>
        </Box>
      </motion.div>

      <Box sx={{ flex: 1, position: 'relative', minWidth: 48 }}>
        <Box
          component="svg"
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          preserveAspectRatio="none"
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            overflow: 'visible',
          }}
        >
          {layout.nodes.map((node, i) => (
            <motion.path
              key={node.id}
              d={buildLinkPath(
                node.sourceTop + 1,
                Math.max(node.sourceHeight - 2, 3),
                node.top + 1,
                Math.max(node.height - 2, 3),
                chartWidth,
                chartHeight,
              )}
              fill="rgba(255,255,255,0.16)"
              initial={prefersReducedMotion ? undefined : { opacity: 0 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.15 + i * 0.08, ease: 'easeOut' }}
            />
          ))}
        </Box>
      </Box>

      <Box
        sx={{
          width: { xs: 104, sm: 148 },
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.75,
          justifyContent: 'space-between',
        }}
      >
        {layout.nodes.map((node, i) => (
          <motion.div
            key={node.id}
            style={{ flex: 1 }}
            initial={prefersReducedMotion ? undefined : { opacity: 0, x: 8 }}
            animate={prefersReducedMotion ? undefined : { opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.2 + i * 0.08, ease: 'easeOut' }}
          >
            <Box
              sx={{
                height: '100%',
                border: `1px solid ${landing.border}`,
                borderRadius: 1,
                bgcolor: landing.gray900,
                px: 1,
                py: 0.75,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                minHeight: compact ? 36 : 44,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 0.5 }}>
                <Typography
                  sx={{
                    fontFamily: landingFonts.sans,
                    fontSize: compact ? '0.62rem' : '0.7rem',
                    color: landing.gray400,
                    lineHeight: 1.2,
                  }}
                >
                  {node.label}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: landingFonts.mono,
                    fontSize: compact ? '0.6rem' : '0.68rem',
                    color: landing.gray600,
                  }}
                >
                  {node.percent}%
                </Typography>
              </Box>
              <Typography
                sx={{
                  fontFamily: landingFonts.sans,
                  fontWeight: 600,
                  fontSize: compact ? '0.72rem' : '0.82rem',
                  mt: 0.25,
                }}
              >
                {formatMoney(node.amount)}
              </Typography>
            </Box>
          </motion.div>
        ))}
      </Box>
    </Box>
  );
};
