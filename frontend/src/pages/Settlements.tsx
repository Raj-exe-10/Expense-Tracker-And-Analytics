import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tab,
  Tabs,
  Paper,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Payment,
  Check,
  TrendingUp,
  TrendingDown,
  History,
  SwapHoriz,
} from '@mui/icons-material';
import { useAppSelector } from '../hooks/redux';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settlements-tabpanel-${index}`}
      aria-labelledby={`settlements-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

interface Settlement {
  id: string;
  from: string;
  to: string;
  amount: number;
  group: string;
  status: 'pending' | 'completed' | 'rejected';
  date: string;
  method?: string;
}

const Settlements: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [settleDialog, setSettleDialog] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);
  const [filter, setFilter] = useState('all');
  // const { user } = useAppSelector((state) => state.auth); // Reserved for future use

  // Mock data for settlements
  const settlements: Settlement[] = [
    {
      id: '1',
      from: 'You',
      to: 'John Doe',
      amount: 125.50,
      group: 'Trip to Vegas',
      status: 'pending',
      date: '2024-01-10',
    },
    {
      id: '2',
      from: 'Jane Smith',
      to: 'You',
      amount: 75.00,
      group: 'Office Lunch',
      status: 'completed',
      date: '2024-01-08',
      method: 'Venmo',
    },
    {
      id: '3',
      from: 'You',
      to: 'Mike Johnson',
      amount: 200.00,
      group: 'Monthly Rent',
      status: 'pending',
      date: '2024-01-05',
    },
  ];

  const balances = [
    { name: 'John Doe', amount: -125.50, avatar: 'JD' },
    { name: 'Jane Smith', amount: 75.00, avatar: 'JS' },
    { name: 'Mike Johnson', amount: -200.00, avatar: 'MJ' },
    { name: 'Sarah Wilson', amount: 45.00, avatar: 'SW' },
  ];

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSettle = (settlement: Settlement) => {
    setSelectedSettlement(settlement);
    setSettleDialog(true);
  };

  const handleCloseDialog = () => {
    setSettleDialog(false);
    setSelectedSettlement(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const totalOwed = balances.filter(b => b.amount < 0).reduce((sum, b) => sum + Math.abs(b.amount), 0);
  const totalOwedToYou = balances.filter(b => b.amount > 0).reduce((sum, b) => sum + b.amount, 0);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settlements
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    You Owe
                  </Typography>
                  <Typography variant="h5" color="error">
                    ${totalOwed.toFixed(2)}
                  </Typography>
                </Box>
                <TrendingDown color="error" fontSize="large" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Owed to You
                  </Typography>
                  <Typography variant="h5" color="success.main">
                    ${totalOwedToYou.toFixed(2)}
                  </Typography>
                </Box>
                <TrendingUp color="success" fontSize="large" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Total Settled
                  </Typography>
                  <Typography variant="h5">
                    $450.00
                  </Typography>
                </Box>
                <Check color="primary" fontSize="large" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Pending
                  </Typography>
                  <Typography variant="h5">
                    3
                  </Typography>
                </Box>
                <History color="warning" fontSize="large" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="settlements tabs">
          <Tab label="Balances" />
          <Tab label="Settlements" />
          <Tab label="History" />
        </Tabs>
      </Paper>

      {/* Balances Tab */}
      <TabPanel value={tabValue} index={0}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Your Balances
            </Typography>
            <List>
              {balances.map((balance, index) => (
                <React.Fragment key={balance.name}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar>{balance.avatar}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={balance.name}
                      secondary={
                        balance.amount < 0
                          ? `You owe $${Math.abs(balance.amount).toFixed(2)}`
                          : `Owes you $${balance.amount.toFixed(2)}`
                      }
                    />
                    <ListItemSecondaryAction>
                      <Button
                        variant="contained"
                        size="small"
                        color={balance.amount < 0 ? 'primary' : 'success'}
                        startIcon={<Payment />}
                        onClick={() => handleSettle({
                          id: `temp-${index}`,
                          from: balance.amount < 0 ? 'You' : balance.name,
                          to: balance.amount < 0 ? balance.name : 'You',
                          amount: Math.abs(balance.amount),
                          group: 'Various',
                          status: 'pending',
                          date: new Date().toISOString().split('T')[0],
                        })}
                      >
                        Settle Up
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < balances.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Settlements Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Recent Settlements</Typography>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Filter</InputLabel>
            <Select
              value={filter}
              label="Filter"
              onChange={(e) => setFilter(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Grid container spacing={2}>
          {settlements
            .filter(s => filter === 'all' || s.status === filter)
            .map((settlement) => (
            <Grid item xs={12} key={settlement.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center" gap={2}>
                      <SwapHoriz color="primary" />
                      <Box>
                        <Typography variant="subtitle1">
                          {settlement.from} → {settlement.to}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {settlement.group} • {settlement.date}
                        </Typography>
                      </Box>
                    </Box>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Typography variant="h6">
                        ${settlement.amount.toFixed(2)}
                      </Typography>
                      <Chip
                        label={settlement.status}
                        color={getStatusColor(settlement.status) as any}
                        size="small"
                      />
                      {settlement.status === 'pending' && settlement.from === 'You' && (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleSettle(settlement)}
                        >
                          Pay Now
                        </Button>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* History Tab */}
      <TabPanel value={tabValue} index={2}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Settlement History
            </Typography>
            <List>
              {settlements
                .filter(s => s.status === 'completed')
                .map((settlement, index) => (
                <React.Fragment key={settlement.id}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'success.main' }}>
                        <Check />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={`${settlement.from} paid ${settlement.to}`}
                      secondary={
                        <>
                          ${settlement.amount.toFixed(2)} • {settlement.group} • {settlement.date}
                          {settlement.method && ` • via ${settlement.method}`}
                        </>
                      }
                    />
                  </ListItem>
                  {index < settlements.filter(s => s.status === 'completed').length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Settlement Dialog */}
      <Dialog open={settleDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Settle Payment</DialogTitle>
        <DialogContent>
          {selectedSettlement && (
            <Box>
              <Typography variant="body1" gutterBottom>
                Payment Details:
              </Typography>
              <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1, mb: 2 }}>
                <Typography variant="h6">
                  ${selectedSettlement.amount.toFixed(2)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedSettlement.from} → {selectedSettlement.to}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedSettlement.group}
                </Typography>
              </Box>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Payment Method</InputLabel>
                <Select defaultValue="venmo" label="Payment Method">
                  <MenuItem value="venmo">Venmo</MenuItem>
                  <MenuItem value="paypal">PayPal</MenuItem>
                  <MenuItem value="cash">Cash</MenuItem>
                  <MenuItem value="bank">Bank Transfer</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Add Note (Optional)"
                multiline
                rows={2}
                placeholder="Add a note about this payment..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCloseDialog}
            startIcon={<Payment />}
          >
            Confirm Payment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settlements;
