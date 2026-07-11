export const DRAWER_WIDTH = 240;

/** Horizontal padding for main content (shell applies this). */
export const PAGE_PADDING_X = { xs: 2, sm: 2.5, md: 3, lg: 4, xl: 5 } as const;

export const PAGE_PADDING_Y = { xs: 2, md: 3 } as const;

/** Optional cap for very wide monitors — content stays centered when used with mx: 'auto'. */
export const CONTENT_MAX_WIDTH = {
  full: '100%',
  wide: 1600,
  prose: 960,
} as const;
