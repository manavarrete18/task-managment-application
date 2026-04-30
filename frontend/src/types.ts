export type UserRole = 'admin' | 'user'
export type TaskStatus = 'pending' | 'completed'

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export type AuthResponse = {
  user: User;
  token: string;
}

export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export type TaskListResponse = {
  items: Task[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

