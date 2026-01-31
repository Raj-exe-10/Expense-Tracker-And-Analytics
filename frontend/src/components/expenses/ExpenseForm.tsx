import React, { useState, useEffect, useCallback } from 'react';
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
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
  Paper,
  CircularProgress,
  Checkbox,
  Radio,
  RadioGroup,
  FormLabel,
  Slider,
  Tooltip,
  Collapse,
} from '@mui/material';
import {
  AttachMoney,
  CalendarToday,
  Description,
  PhotoCamera,
  Person,
  People,
  Receipt,
  ExpandMore,
  ExpandLess,
  CheckCircle,
  Info,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { createExpense, updateExpense } from '../../store/slices/expenseSlice';
import { fetchCurrencies, fetchCategories } from '../../store/slices/coreSlice';
import { fetchGroups, fetchGroupMembers } from '../../store/slices/groupSlice';
import { groupsAPI } from '../../services/api';
import { formatAmount } from '../../utils/formatting';
import { sanitizeInput } from '../../utils/sanitize';

interface ExpenseFormProps {
  editMode?: boolean;
  expenseId?: string;
  duplicateData?: any;
  onClose?: () => void;
  onSuccess?: (expense: any) => void;
  groups?: any[];
}

interface ExpenseShare {
  user_id: string;
  user_name: string;
  user_email: string;
  amount: number;
  percentage: number;
  included: boolean;
}

interface GroupMember {
  id: string;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  role: string;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ 
  editMode = false,
  expenseId,
  duplicateData,
  onClose,
  onSuccess,
  groups: propsGroups 
}) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { id: routeId } = useParams();
  
  const { groups: storeGroups } = useAppSelector((state) => state.groups);
  const { categories, currencies, loading: coreLoading } = useAppSelector((state) => state.core);
  const { currentExpense, loading } = useAppSelector((state) => state.expenses);
  const { user: currentUser } = useAppSelector((state) => state.auth);
  
  const id = expenseId || routeId || (editMode && currentExpense?.id ? currentExpense.id : undefined);
  
  const groups = Array.isArray(propsGroups) 
    ? propsGroups 
    : (Array.isArray(storeGroups) ? storeGroups : []);
  
  const currenciesArray = Array.isArray(currencies) ? currencies : [];
  const categoriesArray = Array.isArray(categories) ? categories : [];
  
  const defaultCurrency = currenciesArray.find(c => c.code === 'USD') || currenciesArray[0];
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    date: new Date(),
    currency_id: defaultCurrency?.id ? String(defaultCurrency.id) : '',
    category_id: '',
    group_id: '',
    notes: '',
    tags: [] as string[],
    receipt_image: null as File | null,
    is_recurring: false,
    split_type: 'equal' as 'equal' | 'amount' | 'percentage' | 'shares',
  });
  
  const [shares, setShares] = useState<ExpenseShare[]>([]);
  const [paidBy, setPaidBy] = useState<string>('');
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [showSplitOptions, setShowSplitOptions] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Fetch currencies, categories, and groups on mount
  useEffect(() => {
    dispatch(fetchCurrencies());
    dispatch(fetchCategories());
    dispatch(fetchGroups());
  }, [dispatch]);

  // Set current user as default payer
  useEffect(() => {
    if (currentUser?.id && !paidBy) {
      setPaidBy(String(currentUser.id));
    }
  }, [currentUser, paidBy]);

  useEffect(() => {
    if (editMode && currentExpense) {
      const expenseDate = currentExpense.date || currentExpense.expense_date;
      const groupId = currentExpense.group?.id ? String(currentExpense.group.id) : '';
      const categoryId = currentExpense.category?.id ? String(currentExpense.category.id) : '';
      
      console.log('Edit mode - Loading expense:', {
        group_id: groupId,
        category_id: categoryId,
        group: currentExpense.group,
        category: currentExpense.category,
        availableGroups: groups.length,
      });
      
      setFormData({
        title: currentExpense.title || currentExpense.description || '',
        description: currentExpense.description || '',
        amount: currentExpense.amount.toString(),
        date: expenseDate ? new Date(expenseDate) : new Date(),
        currency_id: currentExpense.currency?.id ? String(currentExpense.currency.id) : (defaultCurrency?.id ? String(defaultCurrency.id) : ''),
        category_id: categoryId,
        group_id: groupId,
        notes: currentExpense.description || '',
        tags: currentExpense.tags || [],
        receipt_image: null,
        is_recurring: false,
        split_type: 'equal',
      });
      
      if (currentExpense.paid_by) {
        setPaidBy(String(currentExpense.paid_by.id || currentExpense.paid_by));
      }
    } else if (duplicateData) {
      setFormData({
        ...duplicateData,
        date: new Date(),
        receipt_image: null,
      });
    }
  }, [editMode, currentExpense, duplicateData]);

  // Re-set group_id if groups loaded after currentExpense was set
  useEffect(() => {
    if (editMode && currentExpense?.group?.id && groups.length > 0 && !formData.group_id) {
      const groupId = String(currentExpense.group.id);
      console.log('Re-setting group_id after groups loaded:', groupId);
      setFormData(prev => ({ ...prev, group_id: groupId }));
    }
  }, [editMode, currentExpense, groups, formData.group_id]);
  
  // Set default currency when currencies are loaded
  useEffect(() => {
    if (currenciesArray.length > 0 && !formData.currency_id && !editMode) {
      const defaultCurrency = currenciesArray.find(c => c.code === 'USD') || currenciesArray[0];
      if (defaultCurrency) {
        setFormData(prev => ({ ...prev, currency_id: String(defaultCurrency.id) }));
      }
    }
  }, [currenciesArray, editMode, formData.currency_id]);

  // Load group members when group is selected
  const loadGroupMembers = useCallback(async (groupId: string, preservePaidBy: boolean = false) => {
    if (!groupId) {
      setGroupMembers([]);
      setShares([]);
      setShowSplitOptions(false);
      return;
    }
    
    setLoadingMembers(true);
    try {
      const members = await groupsAPI.getGroupMembers(groupId);
      setGroupMembers(members || []);
      
      // Initialize shares with all members included
      if (members && members.length > 0) {
        const amount = parseFloat(formData.amount) || 0;
        const shareAmount = amount / members.length;
        const sharePercentage = 100 / members.length;
        
        const newShares = members.map((member: GroupMember) => ({
          user_id: member.user.id,
          user_name: `${member.user.first_name} ${member.user.last_name}`.trim() || member.user.email,
          user_email: member.user.email,
          amount: shareAmount,
          percentage: sharePercentage,
          included: true,
        }));
        
        setShares(newShares);
        setShowSplitOptions(true);
        
        // Only set paidBy to current user if NOT preserving existing paidBy
        // (i.e., only on new expense creation or group change, not on edit mode initial load)
        if (!preservePaidBy) {
          const currentUserMember = members.find((m: GroupMember) => 
            String(m.user.id) === String(currentUser?.id)
          );
          if (currentUserMember) {
            setPaidBy(String(currentUserMember.user.id));
          }
        }
      }
    } catch (error) {
      console.error('Error loading group members:', error);
      setGroupMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  }, [formData.amount, currentUser?.id]);

  // Track if we've done the initial load in edit mode
  const [initialEditLoadDone, setInitialEditLoadDone] = useState(false);

  // Load group members when group_id changes or in edit mode
  useEffect(() => {
    if (formData.group_id && !showSplitOptions && groupMembers.length === 0 && !loadingMembers) {
      // In edit mode, preserve the existing paidBy for initial load
      const shouldPreservePaidBy = editMode && !initialEditLoadDone && !!paidBy;
      loadGroupMembers(formData.group_id, shouldPreservePaidBy);
      if (editMode && !initialEditLoadDone) {
        setInitialEditLoadDone(true);
      }
    }
  }, [formData.group_id, showSplitOptions, groupMembers.length, loadingMembers, loadGroupMembers, editMode, initialEditLoadDone, paidBy]);

  // Recalculate shares when amount changes
  useEffect(() => {
    if (shares.length > 0 && formData.amount) {
      recalculateShares(formData.split_type);
    }
  }, [formData.amount]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
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
    
    if (name === 'group_id') {
      if (value) {
        loadGroupMembers(value);
      } else {
        setGroupMembers([]);
        setShares([]);
        setShowSplitOptions(false);
      }
    }
  };

  const recalculateShares = (splitType: string) => {
    const amount = parseFloat(formData.amount) || 0;
    const includedMembers = shares.filter(s => s.included);
    
    if (includedMembers.length === 0) return;
    
    if (splitType === 'equal') {
      const shareAmount = amount / includedMembers.length;
      const sharePercentage = 100 / includedMembers.length;
      
      setShares(prev => prev.map(share => ({
        ...share,
        amount: share.included ? shareAmount : 0,
        percentage: share.included ? sharePercentage : 0,
      })));
    }
  };

  const handleSplitTypeChange = (splitType: string) => {
    setFormData(prev => ({ ...prev, split_type: splitType as any }));
    recalculateShares(splitType);
  };

  const handleMemberToggle = (userId: string) => {
    setShares(prev => {
      const newShares = prev.map(share => 
        share.user_id === userId 
          ? { ...share, included: !share.included }
          : share
      );
      
      // Recalculate after toggle
      const amount = parseFloat(formData.amount) || 0;
      const includedCount = newShares.filter(s => s.included).length;
      
      if (includedCount > 0 && formData.split_type === 'equal') {
        const shareAmount = amount / includedCount;
        const sharePercentage = 100 / includedCount;
        
        return newShares.map(share => ({
          ...share,
          amount: share.included ? shareAmount : 0,
          percentage: share.included ? sharePercentage : 0,
        }));
      }
      
      return newShares;
    });
  };

  const handleShareChange = (userId: string, field: 'amount' | 'percentage', value: number) => {
    const totalAmount = parseFloat(formData.amount) || 0;
    
    setShares(prev => prev.map(share => {
      if (share.user_id === userId) {
        if (field === 'amount') {
          return {
            ...share,
            amount: value,
            percentage: totalAmount > 0 ? (value / totalAmount) * 100 : 0,
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
    
    if (!formData.title?.trim() && !formData.description.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Valid amount is required';
    }
    
    if (!formData.currency_id) {
      newErrors.currency_id = 'Currency is required';
    }
    
    // Validate date - must not be in the future
    if (!formData.date) {
      newErrors.date = 'Date is required';
    } else {
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      if (formData.date > today) {
        newErrors.date = 'Date cannot be in the future';
      }
    }
    
    // Group is mandatory
    if (!formData.group_id) {
      newErrors.group_id = 'Please select a group for this expense';
    }
    
    // Validate shares if group expense
    if (showSplitOptions && shares.length > 0) {
      const includedShares = shares.filter(s => s.included);
      if (includedShares.length === 0) {
        newErrors.shares = 'At least one member must be included in the split';
      } else {
        const totalShared = includedShares.reduce((sum, share) => sum + share.amount, 0);
        const totalAmount = parseFloat(formData.amount);
        
        if (Math.abs(totalShared - totalAmount) > 0.01) {
          newErrors.shares = `Split amounts must equal total ($${totalAmount.toFixed(2)})`;
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setSuccessMessage(null);
    setErrorMessage(null);
    
    if (!validateForm()) return;
    
    const includedShares = shares.filter(s => s.included);
    const shares_data = showSplitOptions && includedShares.length > 0
      ? includedShares.map(share => ({
          user_id: share.user_id,
          amount: share.amount,
        }))
      : [];
    
    const title = sanitizeInput((formData.title?.trim() || formData.description?.trim() || 'Untitled Expense').trim());
    
    // Extract IDs - handle both string IDs and object formats
    const getCurrencyId = () => {
      const val = formData.currency_id;
      if (!val) return null;
      if (typeof val === 'object' && val !== null) {
        return (val as any).id || null;
      }
      return val;
    };
    
    const getGroupId = () => {
      const val = formData.group_id;
      if (!val) return null;
      if (typeof val === 'object' && val !== null) {
        return (val as any).id || null;
      }
      return val;
    };
    
    const getCategoryId = () => {
      const val = formData.category_id;
      if (!val) return null;
      if (typeof val === 'object' && val !== null) {
        return (val as any).id || null;
      }
      return val;
    };
    
    const expenseData: any = {
      title: title,
      description: sanitizeInput(formData.description?.trim() || formData.notes?.trim() || ''),
      amount: parseFloat(formData.amount),
      date: formData.date.toISOString().split('T')[0],
      currency: getCurrencyId(),
    };
    
    const categoryId = getCategoryId();
    if (categoryId) {
      expenseData.category_id = categoryId;
    }
    
    const groupId = getGroupId();
    if (groupId) {
      expenseData.group = groupId;
    }
    
    if (paidBy) {
      expenseData.paid_by_id = paidBy;
    }
    
    if (shares_data.length > 0) {
      expenseData.shares_data = shares_data;
    }
    
    let requestData: any;
    if (formData.receipt_image) {
      const formDataObj = new FormData();
      Object.keys(expenseData).forEach(key => {
        if (key === 'shares_data') {
          formDataObj.append(key, JSON.stringify(expenseData[key]));
        } else if (expenseData[key] !== undefined && expenseData[key] !== null) {
          formDataObj.append(key, expenseData[key]);
        }
      });
      formDataObj.append('receipt', formData.receipt_image);
      requestData = formDataObj;
    } else {
      requestData = expenseData;
    }
    
    try {
      if (editMode && id) {
        const result = await dispatch(updateExpense({ id, data: requestData }));
        if (updateExpense.fulfilled.match(result)) {
          setSuccessMessage('Expense updated successfully!');
          setTimeout(() => {
            if (onSuccess) {
              onSuccess(result.payload);
            } else {
              navigate('/expenses');
            }
          }, 1500);
        } else {
          const errorMsg = result.payload as any;
          setErrorMessage(
            typeof errorMsg === 'string' 
              ? errorMsg 
              : errorMsg?.detail || errorMsg?.message || 'Failed to update expense.'
          );
        }
      } else {
        const result = await dispatch(createExpense(requestData));
        if (createExpense.fulfilled.match(result)) {
          setSuccessMessage('Expense added successfully!');
          setTimeout(() => {
            if (onSuccess) {
              onSuccess(result.payload);
            } else {
              navigate('/expenses');
            }
          }, 1500);
        } else {
          const errorMsg = result.payload as any;
          setErrorMessage(
            typeof errorMsg === 'string' 
              ? errorMsg 
              : errorMsg?.detail || errorMsg?.message || 'Failed to add expense.'
          );
        }
      }
    } catch (error: any) {
      console.error('Error saving expense:', error);
      setErrorMessage(error?.message || 'An error occurred while saving the expense.');
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

  const getInitials = (firstName?: string, lastName?: string, email?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return '?';
  };

  const totalShared = shares.filter(s => s.included).reduce((sum, share) => sum + share.amount, 0);
  const totalAmount = parseFloat(formData.amount) || 0;
  const remainingAmount = totalAmount - totalShared;
  const includedCount = shares.filter(s => s.included).length;

  const getCurrencySymbol = () => {
    const currency = currenciesArray.find(c => String(c.id) === formData.currency_id);
    return currency?.symbol || '$';
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 1, md: 3 } }}>
        <form onSubmit={handleSubmit}>
          {/* Success/Error Messages */}
          {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
              {successMessage}
            </Alert>
          )}
          {errorMessage && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMessage(null)}>
              {errorMessage}
            </Alert>
          )}
          
          <Grid container spacing={3}>
            {/* Main Form */}
            <Grid item xs={12} md={showSplitOptions ? 7 : 12}>
              <Card elevation={2}>
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                  <Typography variant="h5" fontWeight="600" gutterBottom>
                    {editMode ? 'Edit Expense' : 'Add New Expense'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={3}>
                    Fill in the details below to {editMode ? 'update your' : 'record a new'} expense
                  </Typography>
                  
                  <Grid container spacing={2.5}>
                    {/* Title */}
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="e.g., Dinner at Restaurant"
                        error={!!errors.title}
                        helperText={errors.title}
                        required
                        variant="outlined"
                      />
                    </Grid>
                    
                    {/* Amount & Currency */}
                    <Grid item xs={12} sm={7}>
                      <TextField
                        fullWidth
                        label="Amount"
                        name="amount"
                        type="number"
                        value={formData.amount}
                        onChange={handleInputChange}
                        error={!!errors.amount}
                        helperText={errors.amount}
                        required
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              {getCurrencySymbol()}
                            </InputAdornment>
                          ),
                        }}
                        inputProps={{ step: '0.01', min: '0' }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={5}>
                      <FormControl fullWidth required error={!!errors.currency_id}>
                        <InputLabel>Currency</InputLabel>
                        <Select
                          value={formData.currency_id}
                          onChange={(e) => setFormData(prev => ({ ...prev, currency_id: e.target.value }))}
                          label="Currency"
                        >
                          {currenciesArray.map((currency) => (
                            <MenuItem key={currency.id} value={String(currency.id)}>
                              {currency.symbol} {currency.code}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    {/* Date & Category */}
                    <Grid item xs={12} sm={6}>
                      <DatePicker
                        label="Date *"
                        value={formData.date}
                        onChange={(newValue) => {
                          if (newValue) {
                            setFormData(prev => ({ ...prev, date: newValue }));
                            // Clear date error when valid date is selected
                            if (errors.date) {
                              setErrors((prev: any) => ({ ...prev, date: undefined }));
                            }
                          }
                        }}
                        maxDate={new Date()}
                        disableFuture
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: !!errors.date,
                            helperText: errors.date || 'Expense date (past dates only)',
                            InputProps: {
                              startAdornment: (
                                <InputAdornment position="start">
                                  <CalendarToday color={errors.date ? 'error' : 'action'} />
                                </InputAdornment>
                              ),
                            },
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel id="category-select-label" shrink>Category</InputLabel>
                        <Select
                          native
                          labelId="category-select-label"
                          id="category-select"
                          value={formData.category_id}
                          label="Category"
                          onChange={(e) => {
                            const selectedValue = e.target.value as string;
                            console.log('Category selected:', selectedValue);
                            setFormData(prev => ({
                              ...prev,
                              category_id: selectedValue,
                            }));
                          }}
                          inputProps={{
                            id: 'category-native-select',
                          }}
                        >
                          <option value="">No Category</option>
                          {categoriesArray.map((category: any) => (
                            <option 
                              key={`category-option-${category.id}`} 
                              value={String(category.id)}
                            >
                              {category.name}
                            </option>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    {/* Group Selection - Required */}
                    <Grid item xs={12}>
                      <FormControl fullWidth required error={!!errors.group_id}>
                        <InputLabel id="group-select-label" shrink>Group *</InputLabel>
                        <Select
                          native
                          labelId="group-select-label"
                          id="group-select"
                          value={formData.group_id}
                          label="Group *"
                          onChange={(e) => {
                            const value = e.target.value as string;
                            console.log('Group selected:', value);
                            handleSelectChange('group_id', value);
                          }}
                          inputProps={{
                            id: 'group-native-select',
                          }}
                        >
                          <option value="">-- Select a Group --</option>
                          {groups.map((group: any) => (
                            <option key={`group-option-${group.id}`} value={String(group.id)}>
                              {group.name}
                              {group.member_count ? ` (${group.member_count} members)` : ''}
                            </option>
                          ))}
                        </Select>
                        {errors.group_id && (
                          <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                            {errors.group_id}
                          </Typography>
                        )}
                        {!errors.group_id && (
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                            Select a group to split this expense with others
                          </Typography>
                        )}
                      </FormControl>
                    </Grid>
                    
                    {/* Description */}
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Description / Notes"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        multiline
                        rows={2}
                        placeholder="Add any additional details..."
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                              <Description />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    
                    {/* Advanced Options Toggle */}
                    <Grid item xs={12}>
                      <Button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        endIcon={showAdvanced ? <ExpandLess /> : <ExpandMore />}
                        sx={{ textTransform: 'none' }}
                      >
                        {showAdvanced ? 'Hide' : 'Show'} Advanced Options
                      </Button>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Collapse in={showAdvanced}>
                        <Grid container spacing={2}>
                          {/* Tags */}
                          <Grid item xs={12}>
                            <Autocomplete
                              multiple
                              freeSolo
                              options={['Food', 'Travel', 'Shared', 'Personal', 'Work', 'Entertainment', 'Shopping']}
                              value={formData.tags}
                              onChange={(_, newValue) => setFormData(prev => ({ ...prev, tags: newValue }))}
                              renderTags={(value, getTagProps) =>
                                value.map((option, index) => (
                                  <Chip variant="outlined" label={option} size="small" {...getTagProps({ index })} />
                                ))
                              }
                              renderInput={(params) => (
                                <TextField {...params} label="Tags" placeholder="Add tags..." />
                              )}
                            />
                          </Grid>
                          
                          {/* Receipt Upload */}
                          <Grid item xs={12}>
                            <Box display="flex" alignItems="center" gap={2}>
                              <Button
                                variant="outlined"
                                component="label"
                                startIcon={<PhotoCamera />}
                              >
                                Upload Receipt
                                <input type="file" hidden accept="image/*" onChange={handleFileUpload} />
                              </Button>
                              {formData.receipt_image && (
                                <Chip
                                  icon={<Receipt />}
                                  label={formData.receipt_image.name}
                                  onDelete={() => setFormData(prev => ({ ...prev, receipt_image: null }))}
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          </Grid>
                          
                          {/* Recurring */}
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
                      </Collapse>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
              
              {/* Action Buttons */}
              <Paper 
                elevation={3}
                sx={{ 
                  mt: 3,
                  p: 2,
                  position: 'sticky',
                  bottom: 16,
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 2,
                  borderRadius: 2,
                }}
              >
                <Button
                  variant="outlined"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onClose) onClose();
                    else navigate('/expenses');
                  }}
                  size="large"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading || coreLoading}
                  size="large"
                  startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
                >
                  {loading ? 'Saving...' : editMode ? 'Update Expense' : 'Add Expense'}
                </Button>
              </Paper>
            </Grid>
            
            {/* Split Options Panel */}
            {showSplitOptions && (
              <Grid item xs={12} md={5}>
                <Card 
                  elevation={2} 
                  sx={{ 
                    position: 'sticky', 
                    top: 20,
                    maxHeight: 'calc(100vh - 100px)',
                    overflow: 'auto',
                  }}
                >
                  <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                    <Typography variant="h6" fontWeight="600" gutterBottom>
                      Split Details
                    </Typography>
                    
                    {loadingMembers ? (
                      <Box display="flex" justifyContent="center" py={4}>
                        <CircularProgress />
                      </Box>
                    ) : groupMembers.length > 0 ? (
                      <>
                        {/* Paid By Selection */}
                        <Box mb={3}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Paid By
                          </Typography>
                          <FormControl fullWidth size="small">
                            <Select
                              value={paidBy}
                              onChange={(e) => setPaidBy(e.target.value)}
                              displayEmpty
                            >
                              {groupMembers.map((member) => (
                                <MenuItem key={member.user.id} value={member.user.id}>
                                  <Box display="flex" alignItems="center" gap={1}>
                                    <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem' }}>
                                      {getInitials(member.user.first_name, member.user.last_name, member.user.email)}
                                    </Avatar>
                                    <Box>
                                      <Typography variant="body2">
                                        {`${member.user.first_name} ${member.user.last_name}`.trim() || member.user.email}
                                      </Typography>
                                      {String(member.user.id) === String(currentUser?.id) && (
                                        <Chip label="You" size="small" sx={{ ml: 1, height: 18, fontSize: '0.65rem' }} />
                                      )}
                                    </Box>
                                  </Box>
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Box>
                        
                        <Divider sx={{ my: 2 }} />
                        
                        {/* Split Type Selection */}
                        <Box mb={2}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Split Type
                          </Typography>
                          <FormControl component="fieldset">
                            <RadioGroup
                              row
                              value={formData.split_type}
                              onChange={(e) => handleSplitTypeChange(e.target.value)}
                            >
                              <FormControlLabel value="equal" control={<Radio size="small" />} label="Equal" />
                              <FormControlLabel value="amount" control={<Radio size="small" />} label="By Amount" />
                              <FormControlLabel value="percentage" control={<Radio size="small" />} label="By %" />
                            </RadioGroup>
                          </FormControl>
                        </Box>
                        
                        {/* Members List */}
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Split Among ({includedCount} of {groupMembers.length} members)
                        </Typography>
                        
                        {errors.shares && (
                          <Alert severity="error" sx={{ mb: 2 }} icon={<Info />}>
                            {errors.shares}
                          </Alert>
                        )}
                        
                        <List disablePadding>
                          {shares.map((share, index) => {
                            const member = groupMembers.find(m => m.user.id === share.user_id);
                            if (!member) return null;
                            
                            const isCurrentUser = String(member.user.id) === String(currentUser?.id);
                            
                            return (
                              <React.Fragment key={share.user_id}>
                                <ListItem 
                                  sx={{ 
                                    px: 0,
                                    py: 1.5,
                                    opacity: share.included ? 1 : 0.5,
                                    bgcolor: isCurrentUser ? 'action.selected' : 'transparent',
                                    borderRadius: 1,
                                  }}
                                >
                                  <Checkbox
                                    checked={share.included}
                                    onChange={() => handleMemberToggle(share.user_id)}
                                    size="small"
                                  />
                                  <ListItemAvatar>
                                    <Avatar sx={{ width: 36, height: 36, fontSize: '0.875rem' }}>
                                      {getInitials(member.user.first_name, member.user.last_name, member.user.email)}
                                    </Avatar>
                                  </ListItemAvatar>
                                  <ListItemText
                                    primary={
                                      <Box display="flex" alignItems="center" gap={0.5}>
                                        <Typography variant="body2" fontWeight={500}>
                                          {share.user_name}
                                        </Typography>
                                        {isCurrentUser && (
                                          <Chip label="You" size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
                                        )}
                                      </Box>
                                    }
                                    secondary={
                                      share.included && formData.split_type === 'equal' ? (
                                        <Typography variant="body2" color="primary" fontWeight={500}>
                                          {getCurrencySymbol()}{share.amount.toFixed(2)}
                                        </Typography>
                                      ) : null
                                    }
                                  />
                                  {share.included && formData.split_type !== 'equal' && (
                                    <ListItemSecondaryAction>
                                      <TextField
                                        size="small"
                                        type="number"
                                        value={formData.split_type === 'percentage' ? share.percentage.toFixed(1) : share.amount.toFixed(2)}
                                        onChange={(e) => handleShareChange(
                                          share.user_id,
                                          formData.split_type === 'percentage' ? 'percentage' : 'amount',
                                          parseFloat(e.target.value) || 0
                                        )}
                                        InputProps={{
                                          startAdornment: formData.split_type === 'amount' ? (
                                            <InputAdornment position="start">{getCurrencySymbol()}</InputAdornment>
                                          ) : null,
                                          endAdornment: formData.split_type === 'percentage' ? (
                                            <InputAdornment position="end">%</InputAdornment>
                                          ) : null,
                                        }}
                                        sx={{ width: 100 }}
                                        inputProps={{ step: '0.01', min: '0' }}
                                      />
                                    </ListItemSecondaryAction>
                                  )}
                                </ListItem>
                                {index < shares.length - 1 && <Divider />}
                              </React.Fragment>
                            );
                          })}
                        </List>
                        
                        {/* Summary */}
                        {formData.amount && (
                          <Paper variant="outlined" sx={{ mt: 2, p: 2, bgcolor: 'grey.50' }}>
                            <Box display="flex" justifyContent="space-between" mb={1}>
                              <Typography variant="body2" color="text.secondary">Total Amount</Typography>
                              <Typography variant="body2" fontWeight={600}>
                                {getCurrencySymbol()}{totalAmount.toFixed(2)}
                              </Typography>
                            </Box>
                            <Box display="flex" justifyContent="space-between" mb={1}>
                              <Typography variant="body2" color="text.secondary">Split Total</Typography>
                              <Typography variant="body2" fontWeight={600}>
                                {getCurrencySymbol()}{totalShared.toFixed(2)}
                              </Typography>
                            </Box>
                            {Math.abs(remainingAmount) > 0.01 && (
                              <Box display="flex" justifyContent="space-between">
                                <Typography variant="body2" color="error">Remaining</Typography>
                                <Typography variant="body2" color="error" fontWeight={600}>
                                  {getCurrencySymbol()}{remainingAmount.toFixed(2)}
                                </Typography>
                              </Box>
                            )}
                            {Math.abs(remainingAmount) <= 0.01 && (
                              <Alert severity="success" sx={{ mt: 1 }} icon={<CheckCircle />}>
                                Split amounts match total
                              </Alert>
                            )}
                          </Paper>
                        )}
                      </>
                    ) : (
                      <Alert severity="info">
                        No members found in this group. Add members to the group first.
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </form>
      </Box>
    </LocalizationProvider>
  );
};

export default ExpenseForm;
