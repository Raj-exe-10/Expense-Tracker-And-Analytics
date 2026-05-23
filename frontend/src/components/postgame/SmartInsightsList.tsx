import React from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import {
  TrendingUp,
  Info,
  CheckCircle,
  Warning,
} from '@mui/icons-material';

interface Insight {
  id: string;
  type: string;
  severity: string;
  title: string;
  detail: string;
  source?: string;
}

const iconFor = (type: string) => {
  if (type === 'warning') return <TrendingUp color="error" />;
  if (type === 'success') return <CheckCircle color="success" />;
  if (type === 'info') return <Info color="action" />;
  return <Warning color="warning" />;
};

export const SmartInsightsList: React.FC<{ insights: Insight[] }> = ({ insights }) => (
  <Paper sx={{ p: 2 }}>
    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
      Smart Insights
    </Typography>
    {insights.length === 0 ? (
      <Typography variant="body2" color="text.secondary">
        No insights yet. Add expenses and set your monthly income in Settings.
      </Typography>
    ) : (
      <List disablePadding>
        {insights.map((ins) => (
          <ListItem key={ins.id} alignItems="flex-start" sx={{ px: 0, py: 1.5 }}>
            <ListItemIcon sx={{ minWidth: 40 }}>{iconFor(ins.type)}</ListItemIcon>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography fontWeight={600}>{ins.title}</Typography>
                  {ins.source === 'ml' && (
                    <Typography variant="caption" color="text.secondary">
                      (ML)
                    </Typography>
                  )}
                </Box>
              }
              secondary={ins.detail}
            />
          </ListItem>
        ))}
      </List>
    )}
  </Paper>
);
