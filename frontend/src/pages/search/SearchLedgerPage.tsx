import React from 'react';
import { Typography, Box } from '@mui/material';
import Expenses from '../Expenses';

const SearchLedgerPage: React.FC = () => (
  <Box>
    <Typography variant="h4" fontWeight={700} gutterBottom>
      Transaction Ledger
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
      Global search across your ledger entries
    </Typography>
    <Expenses />
  </Box>
);

export default SearchLedgerPage;
