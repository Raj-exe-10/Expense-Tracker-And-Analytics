import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

interface IntensityHeatmapProps {
  intensity: {
    days: number[];
    rows: { category: string; cells: { day: number; amount: number; intensity: number }[] }[];
  };
}

const intensityColor = (level: number) => {
  const shades = ['#2A2A2A', '#444', '#666', '#999', '#E0E0E0'];
  return shades[Math.min(4, Math.max(0, level))];
};

export const IntensityHeatmap: React.FC<IntensityHeatmapProps> = ({ intensity }) => (
  <Paper sx={{ p: 2, mb: 2 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
      <Typography variant="subtitle1" fontWeight={600}>
        Spending Intensity
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Typography variant="caption">Low</Typography>
        {[0, 1, 2, 3, 4].map((i) => (
          <Box key={i} sx={{ width: 12, height: 12, bgcolor: intensityColor(i), borderRadius: 0.5 }} />
        ))}
        <Typography variant="caption">High</Typography>
      </Box>
    </Box>
    {intensity.rows.length === 0 ? (
      <Typography variant="body2" color="text.secondary">
        No spending data for this period
      </Typography>
    ) : (
      intensity.rows.map((row) => (
        <Box key={row.category} sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
          <Typography variant="caption" sx={{ width: 72, flexShrink: 0 }}>
            {row.category}
          </Typography>
          {row.cells.map((cell) => (
            <Box
              key={cell.day}
              title={`Day ${cell.day}: $${cell.amount}`}
              sx={{
                width: 20,
                height: 20,
                borderRadius: 0.5,
                bgcolor: intensityColor(cell.intensity),
              }}
            />
          ))}
        </Box>
      ))
    )}
  </Paper>
);
