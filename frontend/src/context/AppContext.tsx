import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Member {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface Group {
  id: string;
  name: string;
  description: string;
  members: Member[];
  balance: number;
  totalExpenses: number;
  created_at: string;
  currency_id?: string;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  category_id?: string;
  group_id?: string;
  group?: string;
  notes?: string;
  tags?: string[];
  paidBy?: string;
  shares?: any[];
}

interface Notification {
  id: string;
  type: 'expense' | 'settlement' | 'group';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

interface AppContextType {
  groups: Group[];
  expenses: Expense[];
  notifications: Notification[];
  allMembers: Member[];
  currentFilter: { type: string; value: string };
  addGroup: (group: Omit<Group, 'id' | 'created_at' | 'totalExpenses' | 'balance'>) => void;
  updateGroup: (id: string, group: Partial<Group>) => void;
  deleteGroup: (id: string) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (id: string, expense: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  addMemberToGroup: (groupId: string, member: Member) => void;
  removeMemberFromGroup: (groupId: string, memberId: string) => void;
  setCurrentFilter: (filter: { type: string; value: string }) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Mock all available members
const mockMembers: Member[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
  { id: '3', name: 'Bob Johnson', email: 'bob@example.com' },
  { id: '4', name: 'Alice Brown', email: 'alice@example.com' },
  { id: '5', name: 'Charlie Wilson', email: 'charlie@example.com' },
  { id: '6', name: 'Diana Prince', email: 'diana@example.com' },
  { id: '7', name: 'Eve Adams', email: 'eve@example.com' },
  { id: '8', name: 'Frank Miller', email: 'frank@example.com' },
  { id: '9', name: 'Grace Lee', email: 'grace@example.com' },
  { id: '10', name: 'Henry Ford', email: 'henry@example.com' },
];

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize from localStorage if available
  const [groups, setGroups] = useState<Group[]>(() => {
    const saved = localStorage.getItem('expense_groups');
    if (saved) {
      return JSON.parse(saved);
    }
    // Default mock groups
    return [
      {
        id: '1',
        name: 'Roommates',
        description: 'Monthly shared expenses',
        members: [
          { id: '1', name: 'John Doe', email: 'john@example.com' },
          { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
          { id: '3', name: 'Bob Johnson', email: 'bob@example.com' },
        ],
        balance: 245.50,
        totalExpenses: 1250.00,
        created_at: '2024-01-01',
      },
      {
        id: '2',
        name: 'Weekend Trip',
        description: 'Beach vacation expenses',
        members: [
          { id: '1', name: 'John Doe', email: 'john@example.com' },
          { id: '4', name: 'Alice Brown', email: 'alice@example.com' },
          { id: '5', name: 'Charlie Wilson', email: 'charlie@example.com' },
        ],
        balance: -125.00,
        totalExpenses: 890.75,
        created_at: '2024-01-10',
      },
    ];
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('expense_items');
    if (saved) {
      return JSON.parse(saved);
    }
    // Default mock expenses
    return [
      {
        id: '1',
        description: 'Dinner at Italian Restaurant',
        amount: 85.50,
        date: '2024-01-15',
        category: 'Food & Dining',
        category_id: '1',
        group_id: '1',
        group: 'Roommates',
        paidBy: 'You',
      },
      {
        id: '2',
        description: 'Uber ride to airport',
        amount: 32.00,
        date: '2024-01-14',
        category: 'Transportation',
        category_id: '2',
        paidBy: 'John',
      },
      {
        id: '3',
        description: 'Grocery shopping',
        amount: 125.75,
        date: '2024-01-13',
        category: 'Groceries',
        category_id: '5',
        group_id: '1',
        group: 'Roommates',
        paidBy: 'You',
      },
    ];
  });

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'expense',
      title: 'New expense added',
      message: 'John added "Dinner at Restaurant" for $85.50',
      time: '2 hours ago',
      read: false,
    },
    {
      id: '2',
      type: 'settlement',
      title: 'Payment received',
      message: 'Jane settled up $45.00 with you',
      time: '1 day ago',
      read: false,
    },
    {
      id: '3',
      type: 'group',
      title: 'Group invitation',
      message: 'You\'ve been invited to join "Weekend Trip"',
      time: '2 days ago',
      read: true,
    },
  ]);

  const [currentFilter, setCurrentFilter] = useState({ type: '', value: '' });

  // Save to localStorage whenever groups or expenses change
  useEffect(() => {
    localStorage.setItem('expense_groups', JSON.stringify(groups));
  }, [groups]);

  useEffect(() => {
    localStorage.setItem('expense_items', JSON.stringify(expenses));
  }, [expenses]);

  const addGroup = (groupData: Omit<Group, 'id' | 'created_at' | 'totalExpenses' | 'balance'>) => {
    const newGroup: Group = {
      ...groupData,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      totalExpenses: 0,
      balance: 0,
    };
    setGroups([...groups, newGroup]);
    
    // Add notification
    addNotification({
      type: 'group',
      title: 'New group created',
      message: `You created the group "${groupData.name}"`,
      time: 'Just now',
      read: false,
    });
  };

  const updateGroup = (id: string, groupData: Partial<Group>) => {
    setGroups(groups.map(g => g.id === id ? { ...g, ...groupData } : g));
  };

  const deleteGroup = (id: string) => {
    const group = groups.find(g => g.id === id);
    setGroups(groups.filter(g => g.id !== id));
    
    if (group) {
      addNotification({
        type: 'group',
        title: 'Group deleted',
        message: `Group "${group.name}" has been deleted`,
        time: 'Just now',
        read: false,
      });
    }
  };

  const addExpense = (expenseData: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...expenseData,
      id: Date.now().toString(),
    };
    setExpenses([newExpense, ...expenses]);
    
    // Update group total if it's a group expense
    if (expenseData.group_id) {
      const group = groups.find(g => g.id === expenseData.group_id);
      if (group) {
        updateGroup(expenseData.group_id, {
          totalExpenses: group.totalExpenses + expenseData.amount,
        });
      }
    }
    
    // Add notification
    addNotification({
      type: 'expense',
      title: 'New expense added',
      message: `You added "${expenseData.description}" for $${expenseData.amount.toFixed(2)}`,
      time: 'Just now',
      read: false,
    });
  };

  const updateExpense = (id: string, expenseData: Partial<Expense>) => {
    setExpenses(expenses.map(e => e.id === id ? { ...e, ...expenseData } : e));
  };

  const deleteExpense = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  const addMemberToGroup = (groupId: string, member: Member) => {
    setGroups(groups.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          members: [...g.members, member],
        };
      }
      return g;
    }));
  };

  const removeMemberFromGroup = (groupId: string, memberId: string) => {
    setGroups(groups.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          members: g.members.filter(m => m.id !== memberId),
        };
      }
      return g;
    }));
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
    };
    setNotifications([newNotification, ...notifications]);
  };

  const value: AppContextType = {
    groups,
    expenses,
    notifications,
    allMembers: mockMembers,
    currentFilter,
    addGroup,
    updateGroup,
    deleteGroup,
    addExpense,
    updateExpense,
    deleteExpense,
    addMemberToGroup,
    removeMemberFromGroup,
    setCurrentFilter,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    addNotification,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
