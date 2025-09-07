import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  IconButton,
  Chip,
  Grid,
  Typography,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Autocomplete,
  Avatar,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Alert,
} from '@mui/material';
import {
  AttachMoney,
  CalendarToday,
  Category,
  Description,
  Group,
  Person,
  Add,
  Remove,
  Receipt,
  PhotoCamera,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { createExpense, updateExpense } from '../../store/slices/expenseSlice';

interface ExpenseFormProps {
  editMode?: boolean;
  duplicateData?: any;
  onClose?: () => void;
  onSuccess?: (expense: any) => void;
  groups?: any[];
}

interface ExpenseShare {
  user_id: string;
  amount: number;
  percentage: number;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ 
  editMode = false, 
  duplicateData,
  onClose,
  onSuccess,
  groups: propsGroups 
}) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { id } = useParams();
  
  const { groups: storeGroups } = useAppSelector((state) => state.groups);
  const { categories } = useAppSelector((state) => state.core);
  const { currentExpense, loading } = useAppSelector((state) => state.expenses);
  
  // Use groups from props if available, otherwise from store
  const groups = propsGroups || storeGroups || [];
  
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: new Date(),
    category_id: '',
    group_id: '',
    notes: '',
    tags: [] as string[],
    receipt_image: null as File | null,
    is_recurring: false,
    split_type: 'equal' as 'equal' | 'amount' | 'percentage' | 'custom',
  });
  
  const [shares, setShares] = useState<ExpenseShare[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [errors, setErrors] = useState<any>({});
  const [showSplitOptions, setShowSplitOptions] = useState(false);

  useEffect(() => {
    if (editMode && currentExpense) {
      setFormData({
        description: currentExpense.description,
        amount: currentExpense.amount.toString(),
        date: new Date(currentExpense.date),
        category_id: currentExpense.category?.id || '',
        group_id: currentExpense.group?.id || '',
        notes: currentExpense.notes || '',
        tags: currentExpense.tags || [],
        receipt_image: null,
        is_recurring: false,
        split_type: 'equal',
      });
      
      if (currentExpense.shares) {
        // Map shares to the expected format
        const mappedShares = currentExpense.shares.map((share: any) => ({
          user_id: share.user?.id || share.user_id,
          amount: share.amount,
          percentage: share.percentage || 0
        }));
        setShares(mappedShares);
      }
    } else if (duplicateData) {
      setFormData({
        ...duplicateData,
        date: new Date(),
        receipt_image: null,
      });
    }
  }, [editMode, currentExpense, duplicateData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev: any) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSelectChange = (name: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // If group is selected, load group members for splitting
    if (name === 'group_id' && value) {
      loadGroupMembers(value);
      setShowSplitOptions(true);
    }
  };

  const loadGroupMembers = (groupId: string) => {
    // Find the selected group and get its members
    const selectedGroup = groups.find((g: any) => g.id === groupId);
    
    if (selectedGroup && selectedGroup.members) {
      const groupMembers = selectedGroup.members.map((member: any) => ({
        id: member.id || member.user_id,
        first_name: member.first_name || member.name?.split(' ')[0] || '',
        last_name: member.last_name || member.name?.split(' ')[1] || '',
        email: member.email || '',
        name: member.name || `${member.first_name} ${member.last_name}`
      }));
      
      setSelectedUsers(groupMembers);
      
      // Initialize equal shares
      if (formData.amount && groupMembers.length > 0) {
        const shareAmount = parseFloat(formData.amount) / groupMembers.length;
        const newShares = groupMembers.map((member: any) => ({
          user_id: member.id,
          amount: shareAmount,
          percentage: 100 / groupMembers.length,
        }));
        setShares(newShares);
      }
    } else {
      // Fallback if no members found
      setSelectedUsers([]);
      setShares([]);
    }
  };

  const handleSplitTypeChange = (splitType: string) => {
    setFormData(prev => ({ ...prev, split_type: splitType as any }));
    
    if (!formData.amount || selectedUsers.length === 0) return;
    
    const totalAmount = parseFloat(formData.amount);
    
    switch (splitType) {
      case 'equal':
        const equalShare = totalAmount / selectedUsers.length;
        setShares(selectedUsers.map(user => ({
          user_id: user.id,
          amount: equalShare,
          percentage: 100 / selectedUsers.length,
        })));
        break;
      
      case 'percentage':
        setShares(selectedUsers.map(user => ({
          user_id: user.id,
          amount: 0,
          percentage: 0,
        })));
        break;
      
      case 'amount':
        setShares(selectedUsers.map(user => ({
          user_id: user.id,
          amount: 0,
          percentage: 0,
        })));
        break;
      
      default:
        break;
    }
  };

  const handleShareChange = (userId: string, field: 'amount' | 'percentage', value: number) => {
    const totalAmount = parseFloat(formData.amount);
    
    setShares(prev => prev.map(share => {
      if (share.user_id === userId) {
        if (field === 'amount') {
          return {
            ...share,
            amount: value,
            percentage: (value / totalAmount) * 100,
          };
        } else {
          return {
            ...share,
            percentage: value,
            amount: (totalAmount * value) / 100,
          };
        }
      }
      return share;
    }));
  };

  const validateForm = () => {
    const newErrors: any = {};
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Valid amount is required';
    }
    
    if (!formData.category_id) {
      newErrors.category_id = 'Category is required';
    }
    
    // Validate shares if splitting
    if (showSplitOptions && shares.length > 0) {
      const totalShared = shares.reduce((sum, share) => sum + share.amount, 0);
      const totalAmount = parseFloat(formData.amount);
      
      if (Math.abs(totalShared - totalAmount) > 0.01) {
        newErrors.shares = `Shared amounts must equal total (${totalAmount.toFixed(2)})`;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    // Get category name
    const categoryMap: any = {
      '1': 'Food & Dining',
      '2': 'Transportation',
      '3': 'Entertainment',
      '4': 'Shopping',
      '5': 'Bills & Utilities',
      '6': 'Healthcare',
    };
    
    const expenseData: any = {
      description: formData.description,
      amount: parseFloat(formData.amount),
      date: formData.date.toISOString().split('T')[0],
      category: categoryMap[formData.category_id] || 'Other',
      category_id: formData.category_id,
      group_id: formData.group_id || undefined,
      group: formData.group_id ? groups.find(g => g.id === formData.group_id)?.name : undefined,
      notes: formData.notes,
      tags: formData.tags,
      paidBy: 'You',
      shares: showSplitOptions ? shares : undefined,
    };
    
    try {
      if (onSuccess) {
        // Use the callback if provided
        onSuccess(expenseData);
      } else if (editMode && id) {
        await dispatch(updateExpense({ id, data: expenseData }));
        navigate('/expenses');
      } else {
        await dispatch(createExpense(expenseData));
        navigate('/expenses');
      }
    } catch (error) {
      console.error('Error saving expense:', error);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({
        ...prev,
        receipt_image: e.target.files![0],
      }));
    }
  };

  const totalShared = shares.reduce((sum, share) => sum + share.amount, 0);
  const remainingAmount = formData.amount ? parseFloat(formData.amount) - totalShared : 0;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Main Form */}
          <Grid item xs={12} md={showSplitOptions ? 7 : 12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {editMode ? 'Edit Expense' : 'Add New Expense'}
                </Typography>
                
                <Box sx={{ mt: 3 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        error={!!errors.description}
                        helperText={errors.description}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Description />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Amount"
                        name="amount"
                        type="number"
                        value={formData.amount}
                        onChange={handleInputChange}
                        error={!!errors.amount}
                        helperText={errors.amount}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <AttachMoney />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <DatePicker
                        label="Date"
                        value={formData.date}
                        onChange={(newValue) => newValue && setFormData(prev => ({ ...prev, date: newValue }))}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            InputProps: {
                              startAdornment: (
                                <InputAdornment position="start">
                                  <CalendarToday />
                                </InputAdornment>
                              ),
                            },
                          },
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth error={!!errors.category_id}>
                        <InputLabel>Category</InputLabel>
                        <Select
                          value={formData.category_id}
                          label="Category"
                          onChange={(e) => handleSelectChange('category_id', e.target.value)}
                        >
                          <MenuItem value="">Select Category</MenuItem>
                          <MenuItem value="1">Food & Dining</MenuItem>
                          <MenuItem value="2">Transportation</MenuItem>
                          <MenuItem value="3">Entertainment</MenuItem>
                          <MenuItem value="4">Shopping</MenuItem>
                          <MenuItem value="5">Bills & Utilities</MenuItem>
                          <MenuItem value="6">Healthcare</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Group</InputLabel>
                        <Select
                          value={formData.group_id}
                          label="Group"
                          onChange={(e) => handleSelectChange('group_id', e.target.value)}
                        >
                          <MenuItem value="">Personal Expense</MenuItem>
                          {groups.map((group: any) => (
                            <MenuItem key={group.id} value={group.id}>
                              {group.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        multiline
                        rows={2}
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Autocomplete
                        multiple
                        freeSolo
                        options={['Food', 'Travel', 'Shared', 'Personal', 'Work']}
                        value={formData.tags}
                        onChange={(_, newValue) => setFormData(prev => ({ ...prev, tags: newValue }))}
                        renderTags={(value, getTagProps) =>
                          value.map((option, index) => (
                            <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                          ))
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Tags"
                            placeholder="Add tags"
                          />
                        )}
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Box display="flex" gap={2}>
                        <Button
                          variant="outlined"
                          component="label"
                          startIcon={<PhotoCamera />}
                        >
                          Upload Receipt
                          <input
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={handleFileUpload}
                          />
                        </Button>
                        
                        {formData.receipt_image && (
                          <Chip
                            label={formData.receipt_image.name}
                            onDelete={() => setFormData(prev => ({ ...prev, receipt_image: null }))}
                          />
                        )}
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.is_recurring}
                            onChange={(e) => setFormData(prev => ({ ...prev, is_recurring: e.target.checked }))}
                          />
                        }
                        label="Make this a recurring expense"
                      />
                    </Grid>
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Split Options */}
          {showSplitOptions && (
            <Grid item xs={12} md={5}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Split Options
                  </Typography>
                  
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Split Type</InputLabel>
                    <Select
                      value={formData.split_type}
                      label="Split Type"
                      onChange={(e) => handleSplitTypeChange(e.target.value)}
                    >
                      <MenuItem value="equal">Split Equally</MenuItem>
                      <MenuItem value="amount">By Amount</MenuItem>
                      <MenuItem value="percentage">By Percentage</MenuItem>
                      <MenuItem value="custom">Custom Split</MenuItem>
                    </Select>
                  </FormControl>
                  
                  {errors.shares && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {errors.shares}
                    </Alert>
                  )}
                  
                  <Box>
                    {selectedUsers.map((user, index) => (
                      <Box key={user.id}>
                        <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                          <ListItemAvatar>
                            <Avatar>{user.first_name[0]}</Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={`${user.first_name} ${user.last_name}`}
                            secondary={
                              <Box display="flex" gap={1} mt={1}>
                                {formData.split_type === 'amount' && (
                                  <TextField
                                    size="small"
                                    type="number"
                                    label="Amount"
                                    value={shares.find(s => s.user_id === user.id)?.amount || 0}
                                    onChange={(e) => handleShareChange(user.id, 'amount', parseFloat(e.target.value))}
                                    InputProps={{
                                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                    }}
                                  />
                                )}
                                {formData.split_type === 'percentage' && (
                                  <TextField
                                    size="small"
                                    type="number"
                                    label="Percentage"
                                    value={shares.find(s => s.user_id === user.id)?.percentage || 0}
                                    onChange={(e) => handleShareChange(user.id, 'percentage', parseFloat(e.target.value))}
                                    InputProps={{
                                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                    }}
                                  />
                                )}
                                {formData.split_type === 'equal' && (
                                  <Typography variant="body2">
                                    ${shares.find(s => s.user_id === user.id)?.amount.toFixed(2) || '0.00'}
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < selectedUsers.length - 1 && <Divider />}
                      </Box>
                    ))}
                  </Box>
                  
                  {formData.amount && (
                    <Box mt={2} p={2} bgcolor="grey.100" borderRadius={1}>
                      <Typography variant="body2" color="text.secondary">
                        Total: ${formData.amount}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Shared: ${totalShared.toFixed(2)}
                      </Typography>
                      {Math.abs(remainingAmount) > 0.01 && (
                        <Typography variant="body2" color="error">
                          Remaining: ${remainingAmount.toFixed(2)}
                        </Typography>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}
          
          {/* Actions */}
          <Grid item xs={12}>
            <Box display="flex" justifyContent="flex-end" gap={2}>
              <Button
                variant="outlined"
                onClick={(e) => {
                  e.preventDefault();
                  if (onClose) {
                    onClose();
                  } else {
                    navigate('/expenses');
                  }
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
              >
                {loading ? 'Saving...' : editMode ? 'Update Expense' : 'Add Expense'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </LocalizationProvider>
  );
};

export default ExpenseForm;
