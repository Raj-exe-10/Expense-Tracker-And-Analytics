import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Alert,
} from '@mui/material';
import { Delete } from '@mui/icons-material';
import { authAPI, budgetAPI } from '../../services/api';
import { useAppSelector } from '../../hooks/redux';

export const FinancialSettingsCard: React.FC = () => {
  const { user } = useAppSelector((s) => s.auth);
  const [income, setIncome] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');

  const currencyCode =
    user?.preferred_currency || goals[0]?.currency_detail?.code || 'USD';

  useEffect(() => {
    if (user?.monthly_income != null) {
      setIncome(String(user.monthly_income));
    }
    budgetAPI.getSavingsGoals().catch(() => []).then((goalsData) => {
      const list = goalsData?.results || goalsData || [];
      setGoals(list);
    });
  }, [user]);

  const saveIncome = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await authAPI.updateProfile({ monthly_income: income ? parseFloat(income) : null });
      setMessage('Monthly income saved. Refresh analytics to see updated cash-flow.');
    } catch {
      setMessage('Failed to save income.');
    } finally {
      setSaving(false);
    }
  };

  const addGoal = async () => {
    if (!goalName || !goalTarget) return;
    setMessage(null);
    try {
      await budgetAPI.createSavingsGoal({
        name: goalName,
        target_amount: parseFloat(goalTarget),
      });
      setGoalName('');
      setGoalTarget('');
      const d = await budgetAPI.getSavingsGoals();
      setGoals(d.results || d || []);
    } catch {
      setMessage('Failed to create savings goal.');
    }
  };

  const removeGoal = async (id: string) => {
    await budgetAPI.deleteSavingsGoal(id);
    setGoals((g) => g.filter((x) => x.id !== id));
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Financial profile
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Used for post-game analytics cash-flow (income + wallet rollover).
        </Typography>
        {message && (
          <Alert severity="info" sx={{ mb: 2 }} onClose={() => setMessage(null)}>
            {message}
          </Alert>
        )}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end', mb: 3 }}>
          <TextField
            label="Monthly income"
            type="number"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            size="small"
            fullWidth
            inputProps={{ min: 0, step: 0.01 }}
          />
          <Button variant="contained" onClick={saveIncome} disabled={saving}>
            Save
          </Button>
        </Box>

        <Typography variant="subtitle2" gutterBottom>
          Savings goals
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
          Goals use your preferred currency ({currencyCode}).
        </Typography>
        <List dense>
          {goals.map((g) => (
            <ListItem
              key={g.id}
              secondaryAction={
                <IconButton edge="end" onClick={() => removeGoal(g.id)}>
                  <Delete />
                </IconButton>
              }
            >
              <ListItemText
                primary={g.name}
                secondary={`${g.progress_percent?.toFixed(0) ?? 0}% of ${g.currency_detail?.symbol || currencyCode} ${g.target_amount}`}
              />
            </ListItem>
          ))}
        </List>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
          <TextField label="Goal name" size="small" value={goalName} onChange={(e) => setGoalName(e.target.value)} />
          <TextField
            label={`Target amount (${currencyCode})`}
            size="small"
            type="number"
            value={goalTarget}
            onChange={(e) => setGoalTarget(e.target.value)}
          />
          <Button variant="outlined" onClick={addGoal}>
            Add goal
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};
