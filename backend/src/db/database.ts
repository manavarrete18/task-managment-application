import type { ColumnType, Generated } from 'kysely'

type Timestamp = ColumnType<Date, Date | string | undefined, Date | string>

export type TaskStatus = 'pending' | 'completed'
export type UserRole = 'admin' | 'user'

export interface UserTable {
  id: Generated<string>;
  name: string;
  email: string;
  password_hash: string;
  role: Generated<UserRole>;
  created_at: Generated<Timestamp>;
  updated_at: Generated<Timestamp>;
}

export interface TaskTable {
  id: Generated<string>;
  user_id: string;
  title: string;
  description: string | null;
  status: Generated<TaskStatus>;
  due_date: ColumnType<Date | null, Date | string | null | undefined, Date | string | null>;
  created_at: Generated<Timestamp>;
  updated_at: Generated<Timestamp>;
}

export interface Database {
  users: UserTable;
  tasks: TaskTable;
}
