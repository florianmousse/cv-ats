'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import {UsageDashboard,QuotaEditor} from './usage-dashboard';
import type {UserUsage} from '@/lib/data/usage';
import type { Account } from '@/lib/auth/admin';
export default function AdminPanel() {
  const [usages,setUsages]=useState<UserUsage[]>([]);
  const [users, setUsers] = useState<Account[]>([]), [page, setPage] = useState(1), [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [revision, setRevision] = useState(0), [secret, setSecret] = useState<{ email: string; password: string } | null>(null), [copied, setCopied] = useState(false);
  const [deletion, setDeletion] = useState<Account | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/users?page=${page}`, { cache: 'no-store', signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Chargement impossible.');
        setUsers(data.users); setUsages(data.usage); setHasMore(data.hasMore);
      } catch (error) { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Chargement impossible.'); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load(); return () => controller.abort();
  }, [page, revision]);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget;
    const email = String(new FormData(form).get('email') ?? '');
    setBusy(true); setError(''); setNotice(''); setSecret(null); setCopied(false);
    try {
      const response = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Création impossible.');
      setSecret({ email: data.user.email, password: data.temporaryPassword }); form.reset(); setPage(1); setRevision(r => r + 1);
      setNotice('Compte créé. Transmets les identifiants à la personne par un canal privé.');
    } catch (error) { setError(error instanceof Error ? error.message : 'Création impossible.'); }
    finally { setBusy(false); }
  }
  async function update(user: Account, action: 'enable' | 'disable' | 'reset' | 'delete') {
    setBusy(true); setError(''); setNotice(''); setSecret(null); setCopied(false);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, { method: action === 'delete' ? 'DELETE' : 'PATCH', headers: { 'Content-Type': 'application/json' }, ...(action === 'delete' ? {} : { body: JSON.stringify({ action }) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Modification impossible.');
      if (data.temporaryPassword) setSecret({ email: user.email, password: data.temporaryPassword });
      setNotice(action === 'delete' ? 'Compte supprimé.' : action === 'disable' ? 'Accès désactivé. Les prochaines requêtes sont bloquées.' : action === 'enable' ? 'Accès réactivé. La personne doit se reconnecter.' : 'Mot de passe réinitialisé. Les anciennes sessions sont révoquées.');
      setRevision(r => r + 1); setDeletion(null);
    } catch (error) { setError(error instanceof Error ? error.message : 'Modification impossible.'); }
    finally { setBusy(false); }
  }
  async function copy() {
    if (!secret) return;
    try { await navigator.clipboard.writeText(`Adresse : ${secret.email}\nMot de passe temporaire : ${secret.password}`); setCopied(true); }
    catch { setError('La copie automatique est indisponible. Sélectionne les identifiants pour les copier.'); }
  }
  return <>
    <UsageDashboard/>
    <section className="admin-create"><h2>Ajouter une personne</h2><p>Un compte utilisateur sera créé avec un mot de passe temporaire à changer lors de la première connexion. Aucun e-mail n’est envoyé automatiquement.</p><form onSubmit={create}><label htmlFor="new-email">Adresse e-mail</label><div><input id="new-email" name="email" type="email" autoComplete="off" maxLength={254} required disabled={busy}/><button className="primary-button" disabled={busy}>{busy ? 'Opération en cours…' : 'Créer l’accès'}</button></div></form></section>
    {error && <div className="message error" role="alert">{error}</div>}{notice && <div className="message success" role="status">{notice}</div>}
    {secret && <section className="temporary-secret" aria-label="Identifiants temporaires"><h2>À transmettre une seule fois</h2><p>{secret.email}</p><code>{secret.password}</code><p>Ce mot de passe n’est plus consultable après fermeture de cet encart. Tu peux en générer un nouveau si nécessaire.</p><div><button className="secondary-button" onClick={copy}>{copied ? 'Copié' : 'Copier les identifiants'}</button><button className="secondary-button" onClick={() => setSecret(null)}>Masquer</button></div></section>}
    <section className="accounts-list" aria-busy={loading}><div className="accounts-title"><h2>Comptes et accès</h2><button className="secondary-button small" disabled={busy || loading} onClick={() => { setError(''); setRevision(r => r + 1); }}>Actualiser</button></div>
      {loading ? <p role="status">Chargement des comptes…</p> : !users.length ? <p>Aucun compte sur cette page.</p> : <div className="account-rows">{users.map(user => <article className="account-row" key={user.id}><div><strong>{user.email}</strong><div className="account-badges"><span>{user.role === 'admin' ? 'Administrateur' : 'Utilisateur'}</span><span className={user.enabled ? 'badge-active' : 'badge-disabled'}>{user.enabled ? 'Actif' : 'Désactivé'}</span>{user.mustChangePassword && <span>Mot de passe à changer</span>}</div></div>{usages.filter(u=>u.userId===user.id).map(usage=><QuotaEditor key={`${user.id}-${usage.limit}`} userId={user.id} usage={usage} onSaved={()=>setRevision(r=>r+1)}/>)}<div className="account-actions">{user.role === 'admin' ? <span>Compte protégé</span> : <><button disabled={busy} onClick={() => update(user, user.enabled ? 'disable' : 'enable')}>{user.enabled ? 'Désactiver' : 'Réactiver'}</button><button disabled={busy} onClick={() => update(user, 'reset')}>Réinitialiser le mot de passe</button><button className="danger-action" disabled={busy} onClick={() => setDeletion(user)}>Supprimer</button></>}</div></article>)}</div>}
      <div className="accounts-pagination"><button className="secondary-button small" disabled={page === 1 || busy || loading} onClick={() => setPage(p => p - 1)}>Précédent</button><span>Page {page}</span><button className="secondary-button small" disabled={!hasMore || busy || loading} onClick={() => setPage(p => p + 1)}>Suivant</button></div>
    </section>
    {deletion && <DeleteDialog user={deletion} busy={busy} cancel={() => setDeletion(null)} confirm={() => update(deletion, 'delete')}/>}

    <p className="auth-footnote">Chaque compte reçoit par défaut 100 appels par mois (UTC), administrateur compris. Le budget quotidien du site est partagé. Un scan compte 1 appel ; une optimisation jusqu’à 2, vérification comprise. Les appels tentés en erreur restent décomptés. Modifier un plafond ne remet pas la consommation à zéro. Une requête déjà en cours peut se terminer après une désactivation.</p>
  </>;
}

function DeleteDialog({user,busy,cancel,confirm}:{user:Account;busy:boolean;cancel:()=>void;confirm:()=>void}) {
  const dialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{dialog.current?.showModal();},[]);
  return <dialog ref={dialog} className="delete-dialog" aria-labelledby="delete-title" onCancel={event=>{event.preventDefault();if(!busy)cancel();}}><h2 id="delete-title">Supprimer cet accès ?</h2><p>Le compte de <strong>{user.email}</strong> et toutes ses sauvegardes de CV seront supprimés. Cette personne devra recevoir un nouveau compte pour revenir.</p><div><button autoFocus className="secondary-button" disabled={busy} onClick={cancel}>Annuler</button><button className="primary-button danger-button" disabled={busy} onClick={confirm}>Supprimer le compte</button></div></dialog>;
}
