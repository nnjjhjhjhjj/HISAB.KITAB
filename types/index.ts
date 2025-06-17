export interface Group {
  id: string;
  name: string;
  description: string;
  members: string[];
  totalExpenses: number;
  balances: { [userId: string]: number };
  inviteCode?: string;
  inviteLink?: string;
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
  payers?: { name: string; amountPaid: number }[];
  splitType?: 'equal' | 'unequal' | 'percentage' | 'shares';
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

export interface Payer {
  name: string;
  amountPaid: number;
}