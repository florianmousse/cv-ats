'use client';
import { useState, type FormEvent } from 'react';
export default function LoginForm() {
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: form.get('email'), password: form.get('password') }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Connexion impossible.');
      window.location.replace(data.redirect === '/compte' ? '/compte' : '/');
    } catch (error) { setError(error instanceof Error ? error.message : 'Connexion impossible.'); setBusy(false); }
  }
  return <form onSubmit={submit} className="account-form">
    <label htmlFor="email">Adresse e-mail</label><input id="email" name="email" type="email" autoComplete="username" maxLength={254} required disabled={busy}/>
    <label htmlFor="password">Mot de passe</label><input id="password" name="password" type="password" autoComplete="current-password" maxLength={128} required disabled={busy}/>
    {error && <div className="message error" role="alert">{error}</div>}
    <button className="primary-button" type="submit" disabled={busy}>{busy ? 'Connexion…' : 'Se connecter'}</button>
  </form>;
}
