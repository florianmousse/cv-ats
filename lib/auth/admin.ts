import type { User } from '@supabase/supabase-js';
export function publicAccount(user: User) {
  return { id: user.id, email: user.email ?? '', role: user.app_metadata.cvats_role as 'admin' | 'member', enabled: user.app_metadata.enabled === true, mustChangePassword: user.app_metadata.must_change_password === true, createdAt: user.created_at };
}
export type Account = ReturnType<typeof publicAccount>;
