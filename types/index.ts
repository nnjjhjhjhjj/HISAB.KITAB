export interface Group {
  id: string;
  name: string;
  description: string;
  members: string[];
  totalExpenses: number;
  balances: { [userId: string]: number };
  createdAt: string;
}

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  paidBy: string;
  participants: string[];
  splits?: { participant: string; amount: number; percentage?: number }[];
  splitType?: 'equal' | 'unequal' | 'percentage';
  date: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  googleId?: string;
  picture?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ExpenseSplit {
  participant: string;
  amount: number;
  percentage?: number;
}