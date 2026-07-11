import React from 'react';
import { Box, Typography, BoxProps, TypographyProps } from '@mui/material';
import { CONTENT_MAX_WIDTH } from './constants';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  titleVariant?: TypographyProps['variant'];
}

/** Consistent page title row: stacks on narrow screens, actions align on the right. */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  actions,
  titleVariant = 'h4',
}) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: { xs: 'column', sm: 'row' },
      justifyContent: 'space-between',
      alignItems: { xs: 'flex-start', sm: 'flex-start' },
      gap: { xs: 1.5, sm: 2 },
      mb: { xs: 2, md: 3 },
      width: '100%',
    }}
  >
    <Box sx={{ minWidth: 0, flex: 1 }}>
      <Typography
        variant={titleVariant}
        fontWeight={700}
        sx={{ fontSize: { xs: '1.35rem', sm: '1.75rem', md: '2.125rem' } }}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
    {actions && (
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
          alignItems: 'center',
          flexShrink: 0,
          width: { xs: '100%', sm: 'auto' },
          justifyContent: { xs: 'flex-start', sm: 'flex-end' },
        }}
      >
        {actions}
      </Box>
    )}
  </Box>
);

export interface PageContainerProps extends BoxProps {
  /** When true, caps width on ultra-wide displays and centers content. */
  centered?: boolean;
}

/** Full-width page wrapper; use inside shell outlet. */
export const PageContainer: React.FC<PageContainerProps> = ({
  centered = false,
  sx,
  children,
  ...props
}) => (
  <Box
    sx={{
      width: '100%',
      maxWidth: centered ? CONTENT_MAX_WIDTH.wide : '100%',
      mx: centered ? 'auto' : 0,
      minWidth: 0,
      boxSizing: 'border-box',
      ...sx,
    }}
    {...props}
  >
    {children}
  </Box>
);
