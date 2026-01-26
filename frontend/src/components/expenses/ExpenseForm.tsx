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
  Paper,
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
import { fetchCurrencies, fetchCategories } from '../../store/slices/coreSlice';
import { formatAmount } from '../../utils/formatting';
import { sanitizeInput } from '../../utils/sanitize';

interface ExpenseFormProps {
  editMode?: boolean;
  expenseId?: string; // Add expenseId prop for edit mode
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
  expenseId, // Get expenseId from props
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
  
  // Use expenseId from props, or routeId from params, or currentExpense.id (after currentExpense is declared)
  const id = expenseId || routeId || (editMode && currentExpense?.id ? currentExpense.id : undefined);
  
  // Use groups from props if available, otherwise from store
  // Ensure groups is always an array
  const groups = Array.isArray(propsGroups) 
    ? propsGroups 
    : (Array.isArray(storeGroups) ? storeGroups : []);
  
  // Ensure currencies and categories are arrays
  const currenciesArray = Array.isArray(currencies) ? currencies : [];
  const categoriesArray = Array.isArray(categories) ? categories : [];
  
  // Get default currency (USD) or first available
  const defaultCurrency = currenciesArray.find(c => c.code === 'USD') || currenciesArray[0];
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    date: new Date(),
    currency_id: defaultCurrency?.id || '',
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Fetch currencies and categories on mount - always fetch to ensure we have data
  useEffect(() => {
    // Always fetch currencies on mount to ensure they're loaded
    dispatch(fetchCurrencies());
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    if (editMode && currentExpense) {
      const expenseDate = currentExpense.date || currentExpense.expense_date;
      setFormData({
        title: currentExpense.title || currentExpense.description || '',
        description: currentExpense.description || '',
        amount: currentExpense.amount.toString(),
        date: expenseDate ? new Date(expenseDate) : new Date(),
        currency_id: currentExpense.currency?.id ? String(currentExpense.currency.id) : (defaultCurrency?.id ? String(defaultCurrency.id) : ''),
        category_id: currentExpense.category?.id ? String(currentExpense.category.id) : '',
        group_id: currentExpense.group?.id ? String(currentExpense.group.id) : '',
        notes: currentExpense.description || '', // Map description to notes field in form
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
  
  // Set default currency when currencies are loaded
  useEffect(() => {
    if (currenciesArray.length > 0 && !formData.currency_id && !editMode) {
      const defaultCurrency = currenciesArray.find(c => c.code === 'USD') || currenciesArray[0];
      if (defaultCurrency) {
        setFormData(prev => ({ ...prev, currency_id: defaultCurrency.id }));
      }
    }
  }, [currenciesArray, editMode, formData.currency_id]);

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
    
    if (!formData.title?.trim() && !formData.description.trim()) {
      newErrors.title = 'Title or description is required';
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Valid amount is required';
    }
    
    if (!formData.currency_id) {
      newErrors.currency_id = 'Currency is required';
    }
    
    // Category validation - only require if categories are available and loaded
    if (categoriesArray.length > 0 && !formData.category_id) {
      newErrors.category_id = 'Category is required';
    }
    // Note: If categories are not loaded, we allow submission without category
    // as the backend allows null categories
    
    // Validate shares if splitting
    if (showSplitOptions && shares.length > 0) {
      const totalShared = shares.reduce((sum, share) => sum + share.amount, 0);
      const totalAmount = parseFloat(formData.amount);
      
      if (Math.abs(totalShared - totalAmount) > 0.01) {
        const totalAmountNum = typeof totalAmount === 'number' ? totalAmount : parseFloat(totalAmount || '0');
        newErrors.shares = `Shared amounts must equal total (${totalAmountNum.toFixed(2)})`;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous messages
    setSuccessMessage(null);
    setErrorMessage(null);
    
    if (!validateForm()) return;
    
    // Prepare shares_data in the format backend expects
    const shares_data = showSplitOptions && shares.length > 0
      ? shares.map(share => ({
          user_id: share.user_id,
          amount: share.amount,
          percentage: share.percentage || 0
        }))
      : [];
    
    // Prepare expense data in the format backend expects
    // Ensure title is never empty (required field) and sanitize input
    const title = sanitizeInput((formData.title?.trim() || formData.description?.trim() || 'Untitled Expense').trim());
    
    const expenseData: any = {
      title: title, // Title is required, ensure it's never empty and sanitized
      description: sanitizeInput(formData.description?.trim() || formData.notes?.trim() || ''), // Sanitize description
      amount: parseFloat(formData.amount),
      date: formData.date.toISOString().split('T')[0], // Backend serializer maps 'date' to 'expense_date'
      currency: formData.currency_id, // Backend expects currency UUID
    };
    
    // Always include category_id (even if empty) to allow clearing the category
    expenseData.category_id = formData.category_id || null;
    
    // Only include group if it's provided and not empty
    if (formData.group_id) {
      expenseData.group = formData.group_id; // Backend expects group UUID
    }
    
    // Only include tag_ids if they are valid UUIDs (not string tags)
    // Note: The tags field in the form is for string tags, not tag UUIDs
    // If you want to use tag_ids, you need to fetch/create tags and use their UUIDs
    // For now, we'll skip tag_ids since the form uses string tags
    // expenseData.tag_ids = []; // Empty array for now
    
    // Only include shares_data if there are actual shares
    if (shares_data && shares_data.length > 0) {
      expenseData.shares_data = shares_data;
    }
    
    // Use FormData if there's a receipt image, otherwise use JSON
    let requestData: any;
    if (formData.receipt_image) {
      const formDataObj = new FormData();
      Object.keys(expenseData).forEach(key => {
        if (key === 'shares_data' || key === 'tag_ids') {
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
      // Check if we're in edit mode and have an ID
      if (editMode && id) {
        // Update existing expense
        const result = await dispatch(updateExpense({ id, data: requestData }));
        if (updateExpense.fulfilled.match(result)) {
          setSuccessMessage('Expense updated successfully!');
          setTimeout(() => {
            if (onSuccess) {
              onSuccess(result.payload);
            } else {
              navigate('/expenses');
            }
            setSuccessMessage(null);
          }, 1500);
        } else {
          const errorMsg = result.payload as any;
          setErrorMessage(
            typeof errorMsg === 'string' 
              ? errorMsg 
              : errorMsg?.detail || errorMsg?.message || 'Failed to update expense. Please check all required fields.'
          );
        }
      } else if (onSuccess) {
        // Use the callback if provided (for Expenses page) - create new expense
        const result = await dispatch(createExpense(requestData));
        if (createExpense.fulfilled.match(result)) {
          setSuccessMessage('Expense added successfully!');
          setTimeout(() => {
            onSuccess(result.payload);
            setSuccessMessage(null);
          }, 1500);
        } else {
          const errorMsg = result.payload as any;
          setErrorMessage(
            typeof errorMsg === 'string' 
              ? errorMsg 
              : errorMsg?.detail || errorMsg?.message || 'Failed to add expense. Please check all required fields.'
          );
        }
      } else {
        // Create new expense (default)
        const result = await dispatch(createExpense(requestData));
        if (createExpense.fulfilled.match(result)) {
          setSuccessMessage('Expense added successfully!');
          setTimeout(() => {
            navigate('/expenses');
          }, 1500);
        } else {
          const errorMsg = result.payload as any;
          setErrorMessage(
            typeof errorMsg === 'string' 
              ? errorMsg 
              : errorMsg?.detail || errorMsg?.message || 'Failed to add expense. Please check all required fields.'
          );
        }
      }
    } catch (error: any) {
      console.error('Error saving expense:', error);
      setErrorMessage(
        error?.response?.data?.detail || 
        error?.response?.data?.message || 
        error?.message || 
        'An error occurred while saving the expense. Please try again.'
      );
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
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2, pb: 12 }}>
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
          
          <Grid container spacing={2}>
            {/* Main Form */}
            <Grid item xs={12} md={showSplitOptions ? 7 : 12}>
              <Card>
                <CardContent sx={{ pb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    {editMode ? 'Edit Expense' : 'Add New Expense'}
                  </Typography>
                  
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="e.g., Restaurant Bill"
                        error={!!errors.title}
                        helperText={errors.title || 'A brief title for this expense'}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        multiline
                        rows={2}
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
                        required
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
                      <FormControl fullWidth required error={!!errors.currency_id}>
                        <InputLabel>Currency</InputLabel>
                        <Select
                          name="currency_id"
                          value={formData.currency_id ? String(formData.currency_id) : ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, currency_id: e.target.value ? String(e.target.value) : '' }))}
                          label="Currency"
                          disabled={currenciesArray.length === 0}
                        >
                          {currenciesArray.length > 0 ? (
                            currenciesArray.map((currency) => (
                              <MenuItem key={currency.id} value={String(currency.id)}>
                                {currency.code} - {currency.name}
                              </MenuItem>
                            ))
                          ) : (
                            <MenuItem value="" disabled>
                              {currenciesArray.length === 0 && currencies.length === 0 
                                ? 'No currencies available. Please contact support.' 
                                : 'Loading currencies...'}
                            </MenuItem>
                          )}
                        </Select>
                        {errors.currency_id && (
                          <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                            {errors.currency_id}
                          </Typography>
                        )}
                        {currenciesArray.length === 0 && (
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1.75 }}>
                            Please wait while currencies are being loaded...
                          </Typography>
                        )}
                      </FormControl>
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
                      <FormControl fullWidth required error={!!errors.category_id}>
                        <InputLabel>Category</InputLabel>
                        <Select
                          value={formData.category_id ? String(formData.category_id) : ''}
                          label="Category"
                          onChange={(e) => {
                            const selectedValue = e.target.value;
                            // Ensure we're setting the actual category ID, not the index
                            handleSelectChange('category_id', selectedValue === '' ? '' : String(selectedValue));
                          }}
                          disabled={coreLoading}
                          error={!!errors.category_id}
                        >
                          <MenuItem value="">Select Category (Optional)</MenuItem>
                          {coreLoading ? (
                            <MenuItem value="" disabled>Loading categories...</MenuItem>
                          ) : categoriesArray.length > 0 ? (
                            categoriesArray.map((category: any) => (
                              <MenuItem key={category.id} value={String(category.id)}>
                                {category.name}
                              </MenuItem>
                            ))
                          ) : (
                            <MenuItem value="" disabled>
                              No categories available. You can still submit without a category.
                            </MenuItem>
                          )}
                        </Select>
                        {errors.category_id && (
                          <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                            {errors.category_id}
                          </Typography>
                        )}
                        {coreLoading && (
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1.75 }}>
                            Loading categories...
                          </Typography>
                        )}
                        {!coreLoading && categoriesArray.length === 0 && (
                          <Typography variant="caption" color="warning.main" sx={{ mt: 0.5, ml: 1.75 }}>
                            Categories not available. You can submit without a category, or run: python manage.py seed_categories
                          </Typography>
                        )}
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Group</InputLabel>
                        <Select
                          value={formData.group_id ? String(formData.group_id) : ''}
                          label="Group"
                          onChange={(e) => handleSelectChange('group_id', e.target.value ? String(e.target.value) : '')}
                        >
                          <MenuItem value="">Personal Expense</MenuItem>
                          {groups.map((group: any) => (
                            <MenuItem key={group.id} value={String(group.id)}>
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
                </CardContent>
              </Card>
              
              {/* Action Buttons - Sticky at bottom for easy access */}
              <Box 
                display="flex" 
                justifyContent="flex-end" 
                gap={2} 
                sx={{ 
                  mt: 3,
                  position: 'sticky',
                  bottom: 20,
                  backgroundColor: 'background.paper',
                  py: 2,
                  px: 3,
                  borderRadius: 2,
                  boxShadow: 4,
                  zIndex: 1000,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
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
                  size="large"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading || coreLoading}
                  size="large"
                >
                  {loading ? 'Saving...' : editMode ? 'Update Expense' : 'Add Expense'}
                </Button>
              </Box>
            </Grid>
            
            {/* Split Options */}
            {showSplitOptions && (
              <Grid item xs={12} md={5}>
                <Card sx={{ position: 'sticky', top: 20, maxHeight: 'calc(100vh - 40px)', overflowY: 'auto' }}>
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
                    
                    <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                      {selectedUsers.map((user, index) => (
                        <Box key={user.id}>
                          <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                            <ListItemAvatar>
                              <Avatar>{user.first_name?.[0] || 'U'}</Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={`${user.first_name || ''} ${user.last_name || ''}`.trim() || user.name || 'Unknown User'}
                              secondary={
                                <Box display="flex" gap={1} mt={1}>
                                  {formData.split_type === 'amount' && (
                                    <TextField
                                      size="small"
                                      type="number"
                                      label="Amount"
                                      value={shares.find(s => s.user_id === user.id)?.amount || 0}
                                      onChange={(e) => handleShareChange(user.id, 'amount', parseFloat(e.target.value) || 0)}
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
                                      onChange={(e) => handleShareChange(user.id, 'percentage', parseFloat(e.target.value) || 0)}
                                      InputProps={{
                                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                      }}
                                    />
                                  )}
                                  {formData.split_type === 'equal' && (
                                    <Typography variant="body2">
                                      ${formatAmount(shares.find(s => s.user_id === user.id)?.amount || 0)}
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
          </Grid>
        </form>
      </Box>
    </LocalizationProvider>
  );
};

export default ExpenseForm;
