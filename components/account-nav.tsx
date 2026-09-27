'use client';
import { useState } from 'react';
import type { SiteUser } from '@/lib/auth/session';

export default function AccountNav({ user }: { user: SiteUser }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function logout() {
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) throw new Error('La déconnexion a échoué. Réessaie.');
      window.location.replace('/connexion');
    } catch (error) { setError(error instanceof Error ? error.message : 'Réessaie.'); setBusy(false); }
  }
  return <div className="account-nav">
    {user.role === 'admin' && <a href="/admin">Administration</a>}
    <a href="/compte">Mon compte</a>
    <button disabled={busy} onClick={logout}>{busy ? 'Déconnexion…' : 'Se déconnecter'}</button>
    {error && <span role="alert">{error}</span>}
  </div>;
}
