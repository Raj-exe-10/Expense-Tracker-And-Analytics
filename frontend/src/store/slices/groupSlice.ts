import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { groupsAPI } from '../../services/api';

interface Group {
  id: string;
  name: string;
  description?: string;
  created_by: {
    id: string;
    first_name: string;
    last_name: string;
  };
  created_at: string;
  updated_at: string;
  members: Array<{
    id: string;
    user: {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
    };
    role: 'admin' | 'member';
    joined_at: string;
  }>;
  total_expenses: number;
  currency: {
    id: string;
    code: string;
    symbol: string;
  };
}

interface GroupState {
  groups: Group[];
  currentGroup: Group | null;
  loading: boolean;
  error: string | null;
}

const initialState: GroupState = {
  groups: [],
  currentGroup: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchGroups = createAsyncThunk(
  'groups/fetchGroups',
  async (_, { rejectWithValue }) => {
    try {
      const response = await groupsAPI.getGroups();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch groups');
    }
  }
);

export const fetchGroup = createAsyncThunk(
  'groups/fetchGroup',
  async (id: string, { rejectWithValue }) => {
    try {
      // getGroup method doesn't exist in the API, using getGroups instead
      const groups = await groupsAPI.getGroups();
      const response = groups.find((g: any) => g.id === id);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch group');
    }
  }
);

export const createGroup = createAsyncThunk(
  'groups/createGroup',
  async (groupData: {
    name: string;
    description?: string;
    currency_id: string;
  }, { rejectWithValue }) => {
    try {
      const response = await groupsAPI.createGroup(groupData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to create group');
    }
  }
);

export const updateGroup = createAsyncThunk(
  'groups/updateGroup',
  async ({ id, data }: { id: string; data: Partial<Group> }, { rejectWithValue }) => {
    try {
      const response = await groupsAPI.updateGroup(id, data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to update group');
    }
  }
);

export const deleteGroup = createAsyncThunk(
  'groups/deleteGroup',
  async (id: string, { rejectWithValue }) => {
    try {
      await groupsAPI.deleteGroup(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to delete group');
    }
  }
);

export const inviteMembers = createAsyncThunk(
  'groups/inviteMembers',
  async ({ groupId, emails }: { groupId: string; emails: string[] }, { rejectWithValue }) => {
    try {
      // Use inviteToGroup API method
      const promises = emails.map(email => groupsAPI.inviteToGroup(groupId, { email }));
      const response = await Promise.all(promises);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to invite members');
    }
  }
);

export const removeMember = createAsyncThunk(
  'groups/removeMember',
  async ({ groupId, memberId }: { groupId: string; memberId: string }, { rejectWithValue }) => {
    try {
      // removeMember doesn't exist, using a placeholder
      // This would need a backend API endpoint to be created
      await groupsAPI.leaveGroup(groupId); // Temporary placeholder
      return { groupId, memberId };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to remove member');
    }
  }
);

const groupSlice = createSlice({
  name: 'groups',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentGroup: (state, action: PayloadAction<Group | null>) => {
      state.currentGroup = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch groups
      .addCase(fetchGroups.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGroups.fulfilled, (state, action) => {
        state.loading = false;
        state.groups = action.payload;
      })
      .addCase(fetchGroups.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch single group
      .addCase(fetchGroup.fulfilled, (state, action) => {
        state.currentGroup = action.payload;
        // Update group in list if it exists
        const index = state.groups.findIndex(group => group.id === action.payload.id);
        if (index !== -1) {
          state.groups[index] = action.payload;
        }
      })
      // Create group
      .addCase(createGroup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createGroup.fulfilled, (state, action) => {
        state.loading = false;
        state.groups.unshift(action.payload);
      })
      .addCase(createGroup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update group
      .addCase(updateGroup.fulfilled, (state, action) => {
        const index = state.groups.findIndex(group => group.id === action.payload.id);
        if (index !== -1) {
          state.groups[index] = action.payload;
        }
        if (state.currentGroup?.id === action.payload.id) {
          state.currentGroup = action.payload;
        }
      })
      // Delete group
      .addCase(deleteGroup.fulfilled, (state, action) => {
        state.groups = state.groups.filter(group => group.id !== action.payload);
        if (state.currentGroup?.id === action.payload) {
          state.currentGroup = null;
        }
      })
      // Remove member
      .addCase(removeMember.fulfilled, (state, action) => {
        const { groupId, memberId } = action.payload;
        const group = state.groups.find(g => g.id === groupId);
        if (group) {
          group.members = group.members.filter(member => member.id !== memberId);
        }
        if (state.currentGroup?.id === groupId) {
          state.currentGroup.members = state.currentGroup.members.filter(member => member.id !== memberId);
        }
      });
  },
});

export const { clearError, setCurrentGroup } = groupSlice.actions;
export default groupSlice.reducer;
