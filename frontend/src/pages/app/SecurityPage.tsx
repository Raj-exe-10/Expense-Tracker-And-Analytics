import React, { useEffect, useState } from 'react';
import { Box, Typography, Switch, FormControlLabel, Button, TextField, List, ListItem, ListItemText, Divider } from '@mui/material';
import { securityAPI, analyticsAPI } from '../../services/api';
import { LcCard } from '../../components/lc';

const SecurityPage: React.FC = () => {
  const [settings, setSettings] = useState<any>({});
  const [totpCode, setTotpCode] = useState('');

  useEffect(() => {
    securityAPI.get().then(setSettings);
  }, []);

  const patch = (field: string, value: boolean) => {
    securityAPI.patch({ [field]: value }).then(() => setSettings((s: any) => ({ ...s, [field]: value })));
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>Security & Privacy</Typography>
      <LcCard sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>Account Security</Typography>
        <FormControlLabel
          control={<Switch checked={!!settings.biometric_lock_enabled} onChange={(e) => patch('biometric_lock_enabled', e.target.checked)} />}
          label="Biometric Lock"
        />
        <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 1 }}>Require FaceID / PIN to open</Typography>
        <FormControlLabel
          control={<Switch checked={!!settings.totp_enabled} />}
          label="Two-Factor Authentication"
        />
        <Button size="small" onClick={() => securityAPI.totpSetup()} sx={{ ml: 2 }}>Setup TOTP</Button>
        <TextField size="small" label="Verify code" value={totpCode} onChange={(e) => setTotpCode(e.target.value)} sx={{ ml: 1, width: 120 }} />
        <Button size="small" onClick={() => securityAPI.totpVerify(totpCode)}>Enable</Button>
      </LcCard>
      <LcCard sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>Data Privacy</Typography>
        <FormControlLabel
          control={<Switch checked={!!settings.hide_balances} onChange={(e) => patch('hide_balances', e.target.checked)} />}
          label="Stealth Mode — hide balances on home"
        />
        <Button variant="outlined" fullWidth sx={{ mt: 1 }} onClick={() => analyticsAPI.exportData('csv')}>
          Data Export (CSV)
        </Button>
      </LcCard>
      <LcCard sx={{ p: 2, mb: 2 }}>
        <FormControlLabel
          control={<Switch checked={!!settings.contacts_sync_enabled} onChange={(e) => patch('contacts_sync_enabled', e.target.checked)} />}
          label="Contacts Sync"
        />
      </LcCard>
      <Button color="error" variant="outlined" fullWidth onClick={() => securityAPI.deleteAccount()}>
        Delete Account
      </Button>
    </Box>
  );
};

export default SecurityPage;
