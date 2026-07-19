import React, { useState } from 'react';
import { Box, TextField, Typography, Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText } from '@mui/material';
import { expensesAPI } from '../../services/api';
import { LcCard, LcEmptyState, LcErrorState, LcLoadingState, PageTransition } from '../../components/lc';

const SearchHubPage: React.FC = () => {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const search = () => {
    setLoading(true);
    setError(null);
    expensesAPI
      .getExpenses({ search: q })
      .then((d) => {
        setResults(d.results || d || []);
        setHasSearched(true);
      })
      .catch(() => setError("We couldn't run that search."))
      .finally(() => setLoading(false));
  };

  return (
    <PageTransition>
    <Box>
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField fullWidth placeholder="Search transactions, squads" value={q} onChange={(e) => setQ(e.target.value)} size="small" />
        <Button variant="outlined" onClick={() => setFiltersOpen(true)}>Filters {activeFilters.length ? `(${activeFilters.length})` : ''}</Button>
      </Box>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
        {['Dining', 'This Month'].map((f) => (
          <Chip key={f} label={f} onDelete={() => setActiveFilters((a) => a.filter((x) => x !== f))} />
        ))}
      </Box>
      <Button variant="contained" fullWidth onClick={search} disabled={loading} sx={{ mb: 2 }}>Search</Button>
      {loading && <LcLoadingState fullHeight={false} label="Searching..." />}
      {!loading && error && <LcErrorState message={error} onRetry={search} />}
      {!loading && !error && (
        <>
          {hasSearched && (
            <Typography variant="caption" color="text.secondary">{results.length} RESULTS</Typography>
          )}
          {hasSearched && results.length === 0 ? (
            <LcEmptyState title="No results" description="Try a different search term or filter." />
          ) : (
            results.map((e: any) => (
              <LcCard key={e.id} sx={{ p: 2, mt: 1 }}>
                <ListItemText primary={e.title} secondary={e.category_name} />
                <Typography color="error.main">-{e.amount}</Typography>
              </LcCard>
            ))
          )}
        </>
      )}
      <Dialog open={filtersOpen} onClose={() => setFiltersOpen(false)} fullWidth>
        <DialogTitle>Global Filters</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2">Categories</Typography>
          {['Dining', 'Travel', 'Utilities'].map((c) => (
            <Chip key={c} label={c} sx={{ m: 0.5 }} onClick={() => setActiveFilters((a) => [...a, c])} />
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFiltersOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => { setFiltersOpen(false); search(); }}>Apply Filters</Button>
        </DialogActions>
      </Dialog>
    </Box>
    </PageTransition>
  );
};

export default SearchHubPage;
