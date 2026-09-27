import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cookieName, userFromToken } from './session';
import { PublicError } from '@/lib/http';
export async function pageUser(adminOnly = false, allowPasswordChange = false) {
  const cookieStore = await cookies();
  let user;
  try { user = await userFromToken(cookieStore.get(cookieName())?.value ?? '', true); }
  catch (error) {
    if (error instanceof PublicError) redirect(error.status === 503 ? '/connexion?configuration=1' : '/connexion');
    throw error;
  }
  if (!allowPasswordChange && user.mustChangePassword) redirect('/compte');
  if (adminOnly && user.role !== 'admin') redirect('/');
  return user;
}
