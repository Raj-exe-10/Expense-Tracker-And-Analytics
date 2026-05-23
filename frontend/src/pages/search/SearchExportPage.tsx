import React from 'react';
import { Typography, Button } from '@mui/material';
import { analyticsAPI } from '../../services/api';

const SearchExportPage: React.FC = () => (
  <>
    <Typography variant="h6" fontWeight={700} gutterBottom>Export</Typography>
    <Button variant="contained" onClick={() => analyticsAPI.exportData('csv')}>Download CSV</Button>
    <Button variant="outlined" sx={{ ml: 1 }} onClick={() => analyticsAPI.exportData('pdf')}>Download PDF</Button>
  </>
);

export default SearchExportPage;
