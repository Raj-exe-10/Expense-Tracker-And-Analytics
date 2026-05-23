import React, { useEffect, useState } from 'react';
import {
  Drawer, Box, Typography, Radio, RadioGroup, FormControlLabel,
  Button, Card, CardContent, Chip,
} from '@mui/material';
import offlineService from '../../services/offlineService';
import { syncAPI } from '../../services/api';

interface ConflictItem {
  id: string;
  local: Record<string, unknown>;
  server: Record<string, unknown>;
}

const SyncConflictHost: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
  const [selected, setSelected] = useState<Record<string, 'local' | 'server'>>({});

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { conflicts: ConflictItem[] };
      if (detail?.conflicts?.length) {
        setConflicts(detail.conflicts);
        const sel: Record<string, 'local' | 'server'> = {};
        detail.conflicts.forEach((c) => { sel[c.id] = 'local'; });
        setSelected(sel);
        setOpen(true);
      }
    };
    window.addEventListener('ledgercore:sync-conflict', handler);
    return () => window.removeEventListener('ledgercore:sync-conflict', handler);
  }, []);

  const resolve = async () => {
    for (const c of conflicts) {
      const choice = selected[c.id] || 'local';
      await syncAPI.resolve({
        id: c.id,
        choice,
        data: choice === 'local' ? c.local : c.server,
      });
    }
    setOpen(false);
    setConflicts([]);
    offlineService.syncOfflineData?.();
  };

  if (!open) return null;

  return (
    <Drawer anchor="bottom" open={open} onClose={() => setOpen(false)} PaperProps={{ sx: { borderTopLeftRadius: 16, borderTopRightRadius: 16, p: 2 } }}>
      <Typography variant="h6" fontWeight={700}>Sync Conflict</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Select the version you want to keep.</Typography>
      {conflicts.map((c) => (
        <Card key={c.id} sx={{ mb: 2 }}>
          <CardContent>
            <RadioGroup value={selected[c.id]} onChange={(e) => setSelected((s) => ({ ...s, [c.id]: e.target.value as 'local' | 'server' }))}>
              <FormControlLabel value="local" control={<Radio />} label={
                <Box>
                  <Typography fontWeight={600}>Your Version</Typography>
                  <Chip size="small" label={String((c.local as any).category || 'Category')} sx={{ mr: 1 }} />
                  <Typography variant="body2">{(c.local as any).title} — {(c.local as any).amount}</Typography>
                </Box>
              } />
              <FormControlLabel value="server" control={<Radio />} label={
                <Box>
                  <Typography fontWeight={600}>Server Version</Typography>
                  <Chip size="small" label={String((c.server as any).category || 'Category')} />
                  <Typography variant="body2">{(c.server as any).title} — {(c.server as any).amount}</Typography>
                </Box>
              } />
            </RadioGroup>
          </CardContent>
        </Card>
      ))}
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button fullWidth variant="outlined" onClick={() => setOpen(false)}>Cancel</Button>
        <Button fullWidth variant="contained" onClick={resolve}>Resolve</Button>
      </Box>
    </Drawer>
  );
};

export default SyncConflictHost;
