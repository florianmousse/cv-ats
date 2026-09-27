'use client';
import { useState, type FormEvent } from 'react';
export default function PasswordForm() {
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    const form = new FormData(event.currentTarget);
    if (form.get('password') !== form.get('confirmation')) { setError('Les deux nouveaux mots de passe ne correspondent pas.'); return; }
    setBusy(true);
    try {
      const response = await fetch('/api/auth/password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword: form.get('currentPassword'), password: form.get('password') }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Modification impossible.');
      window.location.replace('/connexion?changed=1');
    } catch (error) { setError(error instanceof Error ? error.message : 'Modification impossible.'); setBusy(false); }
  }
  return <form onSubmit={submit} className="account-form">
    <label htmlFor="currentPassword">Mot de passe actuel ou temporaire</label><input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" maxLength={128} required disabled={busy}/>
    <label htmlFor="password">Nouveau mot de passe</label><input id="password" name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required disabled={busy}/><small>Au moins 12 caractères. Utilise un mot de passe unique.</small>
    <label htmlFor="confirmation">Confirmer le nouveau mot de passe</label><input id="confirmation" name="confirmation" type="password" autoComplete="new-password" minLength={12} maxLength={128} required disabled={busy}/>
    {error && <div className="message error" role="alert">{error}</div>}
    <button type="submit" className="primary-button" disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer et me reconnecter'}</button>
  </form>;
}
