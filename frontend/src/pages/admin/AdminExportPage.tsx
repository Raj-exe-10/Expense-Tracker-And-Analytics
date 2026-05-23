import React, { useState } from 'react';
import { Typography, Button, TextField, FormGroup, FormControlLabel, Checkbox, Box } from '@mui/material';
import { enterpriseAPI } from '../../services/api';

const AdminExportPage: React.FC = () => {
  const [dateFrom, setDateFrom] = useState('2024-01-01');
  const [dateTo, setDateTo] = useState('2024-12-31');
  const cols = ['id', 'title', 'amount', 'date', 'category'];

  const generate = () => {
    enterpriseAPI.exports.create({
      format: 'csv',
      date_from: dateFrom,
      date_to: dateTo,
      columns: cols,
    }).then((job) => {
      if (job.id) enterpriseAPI.exports.download(job.id);
    });
  };

  return (
    <Box sx={{ maxWidth: 900 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>Export Control</Typography>
      <TextField label="From" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} sx={{ mr: 2 }} InputLabelProps={{ shrink: true }} />
      <TextField label="To" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} InputLabelProps={{ shrink: true }} />
      <FormGroup sx={{ my: 2 }}>
        {cols.map((c) => <FormControlLabel key={c} control={<Checkbox defaultChecked />} label={c} />)}
      </FormGroup>
      <Button variant="contained" size="large" onClick={generate}>Generate Export</Button>
    </Box>
  );
};

export default AdminExportPage;
