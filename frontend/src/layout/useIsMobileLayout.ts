import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

/** True below MUI `md` (~900px): bottom nav + stacked layouts */
export function useIsMobileLayout(): boolean {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.down('md'));
}
