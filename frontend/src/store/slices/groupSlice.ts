import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { groupsAPI } from '../../services/api';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name?: string;
}

interface GroupMember {
  id: string;
  user: User;
  role: 'admin' | 'member' | 'viewer';
  status: string;
  is_active: boolean;
  joined_at: string;
}

interface GroupActivity {
  id: string;
  activity_type: string;
  description: string;
  user: User;
  created_at: string;
}

interface Group {
  id: string;
  name: string;
  description?: string;
  group_type: string;
  image?: string;
  currency: number;
  currency_details?: {
    id: number;
    code: string;
    symbol: string;
    name: string;
  };
  is_private: boolean;
  invite_code: string;
  member_count: number;
  total_expenses: string;
  settled_amount: string;
  is_active: boolean;
  is_archived: boolean;
  user_role: 'admin' | 'member' | 'viewer' | null;
  user_balance: string;
  recent_activity: GroupActivity[];
  created_at: string;
  updated_at: string;
}

interface GroupState {
  groups: Group[];
  currentGroup: Group | null;
  currentGroupMembers: GroupMember[];
  currentGroupActivities: GroupActivity[];
  searchedUsers: User[];
  inviteLink: string | null;
  loading: boolean;
  membersLoading: boolean;
  error: string | null;
}

const initialState: GroupState = {
  groups: [],
  currentGroup: null,
  currentGroupMembers: [],
  currentGroupActivities: [],
  searchedUsers: [],
  inviteLink: null,
  loading: false,
  membersLoading: false,
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
      return rejectWithValue(error.response?.data?.detail || error.response?.data?.error || 'Failed to fetch groups');
    }
  }
);

export const fetchGroup = createAsyncThunk(
  'groups/fetchGroup',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await groupsAPI.getGroup(id);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || error.response?.data?.error || 'Failed to fetch group');
    }
  }
);

export const createGroup = createAsyncThunk(
  'groups/createGroup',
  async (groupData: {
    name: string;
    description?: string;
    group_type?: string;
    currency: number;
    is_private?: boolean;
    initial_members?: string[];
  }, { rejectWithValue }) => {
    try {
      const response = await groupsAPI.createGroup(groupData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || error.response?.data?.error || 'Failed to create group');
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
      return rejectWithValue(error.response?.data?.detail || error.response?.data?.error || 'Failed to update group');
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
      return rejectWithValue(error.response?.data?.detail || error.response?.data?.error || 'Failed to delete group');
    }
  }
);

export const fetchGroupMembers = createAsyncThunk(
  'groups/fetchGroupMembers',
  async (groupId: string, { rejectWithValue }) => {
    try {
      const response = await groupsAPI.getGroupMembers(groupId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || error.response?.data?.error || 'Failed to fetch members');
    }
  }
);

export const fetchGroupActivities = createAsyncThunk(
  'groups/fetchGroupActivities',
  async (groupId: string, { rejectWithValue }) => {
    try {
      const response = await groupsAPI.getGroupActivities(groupId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || error.response?.data?.error || 'Failed to fetch activities');
    }
  }
);

export const searchUsers = createAsyncThunk(
  'groups/searchUsers',
  async ({ query, groupId }: { query: string; groupId?: string }, { rejectWithValue }) => {
    try {
      const response = await groupsAPI.searchUsers(query, groupId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || error.response?.data?.error || 'Failed to search users');
    }
  }
);

export const addMember = createAsyncThunk(
  'groups/addMember',
  async ({ groupId, userId, role }: { groupId: string; userId: string; role?: string }, { rejectWithValue }) => {
    try {
      const response = await groupsAPI.addMember(groupId, userId, role);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || error.response?.data?.error || 'Failed to add member');
    }
  }
);

export const removeMember = createAsyncThunk(
  'groups/removeMember',
  async ({ groupId, userId }: { groupId: string; userId: string }, { rejectWithValue }) => {
    try {
      await groupsAPI.removeMember(groupId, userId);
      return { groupId, userId };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || error.response?.data?.error || 'Failed to remove member');
    }
  }
);

export const changeMemberRole = createAsyncThunk(
  'groups/changeMemberRole',
  async ({ groupId, userId, role }: { groupId: string; userId: string; role: string }, { rejectWithValue }) => {
    try {
      const response = await groupsAPI.changeMemberRole(groupId, userId, role);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || error.response?.data?.error || 'Failed to change role');
    }
  }
);

export const getInviteLink = createAsyncThunk(
  'groups/getInviteLink',
  async ({ groupId, regenerate }: { groupId: string; regenerate?: boolean }, { rejectWithValue }) => {
    try {
      const response = await groupsAPI.getInviteLink(groupId, regenerate);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || error.response?.data?.error || 'Failed to get invite link');
    }
  }
);

export const joinByCode = createAsyncThunk(
  'groups/joinByCode',
  async (inviteCode: string, { rejectWithValue }) => {
    try {
      const response = await groupsAPI.joinByCode(inviteCode);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || error.response?.data?.error || 'Failed to join group');
    }
  }
);

export const leaveGroup = createAsyncThunk(
  'groups/leaveGroup',
  async (groupId: string, { rejectWithValue }) => {
    try {
      await groupsAPI.leaveGroup(groupId);
      return groupId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || error.response?.data?.error || 'Failed to leave group');
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
    clearSearchedUsers: (state) => {
      state.searchedUsers = [];
    },
    clearInviteLink: (state) => {
      state.inviteLink = null;
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
        const payload = action.payload;
        state.groups = Array.isArray(payload)
          ? payload
          : (Array.isArray(payload?.results) ? payload.results : []);
      })
      .addCase(fetchGroups.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch single group
      .addCase(fetchGroup.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchGroup.fulfilled, (state, action) => {
        state.loading = false;
        state.currentGroup = action.payload;
        // Update in list
        const index = state.groups.findIndex(g => g.id === action.payload.id);
        if (index !== -1) {
          state.groups[index] = action.payload;
        }
      })
      .addCase(fetchGroup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
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
      // Fetch members
      .addCase(fetchGroupMembers.pending, (state) => {
        state.membersLoading = true;
      })
      .addCase(fetchGroupMembers.fulfilled, (state, action) => {
        state.membersLoading = false;
        state.currentGroupMembers = action.payload;
      })
      .addCase(fetchGroupMembers.rejected, (state, action) => {
        state.membersLoading = false;
        state.error = action.payload as string;
      })
      // Fetch activities
      .addCase(fetchGroupActivities.fulfilled, (state, action) => {
        state.currentGroupActivities = action.payload;
      })
      // Search users
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.searchedUsers = action.payload;
      })
      // Add member
      .addCase(addMember.fulfilled, (state, action) => {
        if (action.payload.membership) {
          state.currentGroupMembers.push(action.payload.membership);
        }
      })
      // Remove member
      .addCase(removeMember.fulfilled, (state, action) => {
        const { userId } = action.payload;
        state.currentGroupMembers = state.currentGroupMembers.filter(
          m => m.user.id !== userId
        );
      })
      // Change role
      .addCase(changeMemberRole.fulfilled, (state, action) => {
        if (action.payload.membership) {
          const index = state.currentGroupMembers.findIndex(
            m => m.user.id === action.payload.membership.user.id
          );
          if (index !== -1) {
            state.currentGroupMembers[index] = action.payload.membership;
          }
        }
      })
      // Get invite link
      .addCase(getInviteLink.fulfilled, (state, action) => {
        state.inviteLink = action.payload.invite_url;
      })
      // Join by code
      .addCase(joinByCode.fulfilled, (state, action) => {
        if (action.payload.group) {
          state.groups.unshift(action.payload.group);
        }
      })
      // Leave group
      .addCase(leaveGroup.fulfilled, (state, action) => {
        state.groups = state.groups.filter(g => g.id !== action.payload);
        if (state.currentGroup?.id === action.payload) {
          state.currentGroup = null;
        }
      });
  },
});

export const { clearError, setCurrentGroup, clearSearchedUsers, clearInviteLink } = groupSlice.actions;
export default groupSlice.reducer;
