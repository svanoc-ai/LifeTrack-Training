import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import './style.css';

type Tab = 'Accueil' | 'Séance' | 'Programmes' | 'Stats' | 'Plus';
const tabs: { label: Tab; icon: string }[] = [
  { label: 'Accueil', icon: '⌂' },
  { label: 'Séance', icon: '◉' },
  { label: 'Programmes', icon: '▦' },
  { label: 'Stats', icon: '▥' },
  { label: 'Plus', icon: '☰' },
];


// Lot 1-C : profil unique actif, stockage local IndexedDB versionné.
// Le profil est créé uniquement si la base ne contient encore aucun profil.
type Theme = 'dark' | 'light' | 'system';
type LocalProfile = { id: string; name: string; createdAt: string; updatedAt: string };
type LocalSettings = { id: string; profileId: string; theme: Theme; updatedAt: string };
const DB_NAME = 'lifetrack-training';
const DB_VERSION = 1;
const SETTINGS_KEY = 'preferences';
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) { reject(new Error('IndexedDB indisponible sur ce navigateur.')); return; }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('profiles')) db.createObjectStore('profiles', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Ouverture de la base impossible.'));
    request.onblocked = () => reject(new Error('Base bloquée par un autre onglet. Ferme les autres onglets puis réessaie.'));
  });
}
function readRecord<T>(db: IDBDatabase, storeName: string, key: string): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const request = tx.objectStore(storeName).get(key);
    request.onsuccess = () => resolve(request.result as T | undefined);
    request.onerror = () => reject(request.error || new Error('Lecture locale impossible.'));
    tx.onabort = () => reject(tx.error || new Error('Lecture interrompue.'));
  });
}
function readProfiles(db: IDBDatabase): Promise<LocalProfile[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('profiles', 'readonly');
    const request = tx.objectStore('profiles').getAll();
    request.onsuccess = () => resolve(request.result as LocalProfile[]);
    request.onerror = () => reject(request.error || new Error('Lecture du profil impossible.'));
    tx.onabort = () => reject(tx.error || new Error('Lecture interrompue.'));
  });
}
function writeRecord(db: IDBDatabase, storeName: string, record: LocalProfile | LocalSettings): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).put(record);
    tx.oncomplete = () => resolve(); // Seul le commit de transaction confirme la sauvegarde.
    tx.onerror = () => reject(tx.error || new Error('Écriture impossible.'));
    tx.onabort = () => reject(tx.error || new Error('Écriture annulée.'));
  });
}
function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}
async function loadLocalData(): Promise<{ db: IDBDatabase; profile: LocalProfile; settings: LocalSettings }> {
  const db = await openDatabase();
  try {
    const profiles = await readProfiles(db);
    if (profiles.length > 1) throw new Error('Plusieurs profils détectés : sélection multiprofil non disponible en V0.1.');
    let profile = profiles[0];
    if (!profile) {
      const now = new Date().toISOString();
      profile = { id: makeId(), name: 'Sportif', createdAt: now, updatedAt: now };
      await writeRecord(db, 'profiles', profile);
    }
    let settings = await readRecord<LocalSettings>(db, 'settings', SETTINGS_KEY);
    if (!settings) {
      settings = { id: SETTINGS_KEY, profileId: profile.id, theme: 'dark', updatedAt: new Date().toISOString() };
      await writeRecord(db, 'settings', settings);
    }
    if (settings.profileId !== profile.id || !['dark','light','system'].includes(settings.theme)) {
      throw new Error('Préférences locales incohérentes. Aucune donnée n’a été écrasée.');
    }
    return { db, profile, settings };
  } catch (error) { db.close(); throw error; }
}
function describeError(error: unknown): string {
  return error instanceof Error ? error.message : 'Une erreur de stockage est survenue.';
}

function App() {
  const [tab, setTab] = useState<Tab>('Accueil');
  const [theme, setTheme] = useState<Theme>('dark');
  const [profile, setProfile] = useState<LocalProfile | null>(null);
  const [profileName, setProfileName] = useState('');
  const [storageStatus, setStorageStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [storageError, setStorageError] = useState('');
  const [saving, setSaving] = useState(false);
  const dbRef = React.useRef<IDBDatabase | null>(null);
  const [storageDetail, setStorageDetail] = useState('');
  React.useEffect(() => {
    let cancelled = false;
    loadLocalData().then(({ db, profile: storedProfile, settings }) => {
      if (cancelled) { db.close(); return; }
      dbRef.current = db;
      setProfile(storedProfile);
      setProfileName(storedProfile.name);
      setTheme(settings.theme);
      setStorageStatus('ready');
      setStorageDetail('Lecture initiale vérifiée · profil ' + storedProfile.id.slice(0, 8));
    }).catch(error => {
      if (!cancelled) { setStorageError(describeError(error)); setStorageStatus('error'); }
    });
    return () => { cancelled = true; dbRef.current?.close(); dbRef.current = null; };
  }, []);
  const saveProfile = async () => {
    if (!profile || !dbRef.current || saving) return;
    const name = profileName.trim();
    if (!name || name.length > 60) { setStorageError('Le nom doit contenir entre 1 et 60 caractères.'); return; }
    setSaving(true); setStorageError('');
    const updated = { ...profile, name, updatedAt: new Date().toISOString() };
    try {
      await writeRecord(dbRef.current, 'profiles', updated);
      const verified = await readRecord<LocalProfile>(dbRef.current, 'profiles', updated.id);
      if (!verified || verified.name !== updated.name) throw new Error('La relecture du nom ne correspond pas à la valeur enregistrée.');
      setProfile(verified);
      setStorageDetail('Nom enregistré et relu avec succès · ' + new Date().toLocaleTimeString('fr-FR'));
    }
    catch (error) { setStorageError('Profil non enregistré : ' + describeError(error)); }
    finally { setSaving(false); }
  };
  const saveTheme = async (next: Theme) => {
    if (!profile || !dbRef.current || saving) return;
    setSaving(true); setStorageError('');
    try {
      await writeRecord(dbRef.current, 'settings', { id: SETTINGS_KEY, profileId: profile.id, theme: next, updatedAt: new Date().toISOString() });
      const verified = await readRecord<LocalSettings>(dbRef.current, 'settings', SETTINGS_KEY);
      if (!verified || verified.theme !== next || verified.profileId !== profile.id) throw new Error('La relecture du thème ne correspond pas à la valeur enregistrée.');
      setTheme(verified.theme);
      setStorageDetail('Thème enregistré et relu avec succès · ' + new Date().toLocaleTimeString('fr-FR'));
    } catch (error) { setStorageError('Thème non enregistré : ' + describeError(error)); }
    finally { setSaving(false); }
  };
  const [showProfile, setShowProfile] = useState(false);
  const [week, setWeek] = useState(0);
  const effectiveTheme = theme === 'system' ? 'system' : theme;

  const navigate = (next: Tab) => { setTab(next); setShowProfile(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  return (
    <div className={`shell theme-${effectiveTheme}`}>
      <aside className="sidebar" aria-label="Navigation principale">
        <div className="brand"><span className="brand-icon">LT</span><span><strong>LifeTrack</strong><small>TRAINING</small></span></div>
        <nav>{tabs.map(item => <button key={item.label} type="button" className={`side-link ${tab === item.label && !showProfile ? 'active' : ''}`} onClick={() => navigate(item.label)}><span aria-hidden="true">{item.icon}</span>{item.label}</button>)}</nav>
        <div className="sidebar-foot">V0.1 · Lot 1-C<br/>Profil local et préférences</div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <div className="mobile-brand"><span className="brand-icon">LT</span><span>TRAINING</span></div>
          <div className="desktop-heading">TRAIN SMART. <span>PROGRESS STRONG.</span></div>
          <button type="button" className="avatar" aria-label="Afficher le profil" onClick={() => setShowProfile(!showProfile)}>{profile?.name.trim().charAt(0).toUpperCase() || "S"}</button>
        </header>
        <main id="main" className="content">
          <div className="demo-note"><span className="demo-dot"/> Démonstration sportive · {storageStatus === 'ready' ? 'Profil et préférences enregistrés localement' : storageStatus === 'loading' ? 'Initialisation du stockage…' : 'Stockage indisponible'}</div>
          {storageError && <div className="storage-error" role="alert">{storageError}</div>}
          {storageStatus === 'ready' && <p className="muted small" style={{margin:'4px 0 10px'}}>Diagnostic L1-C.1 : {storageDetail}</p>}
          {showProfile ? <section><div className="section-head"><div><p className="kicker">COMPTE LOCAL</p><h1>Profil</h1></div></div><div className="panel"><h2>Profil personnel</h2><p className="muted">Un seul profil local actif en V0.1. Les données sont associées à un identifiant stable, sans compte ni serveur.</p><label className="field-label" htmlFor="profile-name">Nom affiché</label><input className="profile-input" id="profile-name" type="text" maxLength={60} value={profileName} disabled={storageStatus !== 'ready' || saving} onChange={event => setProfileName(event.target.value)} /><div className="profile-actions"><button className="primary-button save-button" disabled={storageStatus !== 'ready' || saving || !profileName.trim() || profileName.trim() === profile?.name} onClick={saveProfile}>{saving ? 'Enregistrement…' : 'Enregistrer le nom'}</button><button className="secondary-button" onClick={() => setShowProfile(false)}>Retour</button></div><p className="muted small">Les informations corporelles et les objectifs sportifs seront ajoutés dans un lot ultérieur.</p></div></section> : null}
          {!showProfile && tab === 'Accueil' && <section>
            <div className="section-head"><div><p className="kicker">TABLEAU DE BORD</p><h1>Bonjour 👋</h1><p className="muted">Ton entraînement, en un coup d'œil.</p></div></div>
            <div className="hero-card"><div className="hero-top"><span className="pill">PROCHAINE SÉANCE · EXEMPLE</span><span className="hero-time">~ 55 min</span></div><p className="hero-label">Aujourd'hui</p><h2>Haut du corps</h2><p>6 exercices · Pectoraux, dos, épaules</p><button className="primary-button" onClick={() => navigate('Séance')}>Voir la séance <span>→</span></button></div>
            <div className="section-title"><h2>Cette semaine</h2><span className="muted">Données fictives</span></div>
            <div className="metrics"><div className="metric"><span>Séances</span><strong>3<span>/4</span></strong><small>prévues</small></div><div className="metric"><span>Durée</span><strong>2h 35</strong><small>entraînement</small></div><div className="metric"><span>Séries</span><strong>42</strong><small>validées</small></div></div>
            <div className="panel"><div className="panel-heading"><h2>Programme</h2><button className="text-button" onClick={() => navigate('Programmes')}>Calendrier →</button></div><div className="timeline"><span className="timeline-dot"/><div><strong>Demain · Cardio</strong><p>Vélo · 40 min · séance planifiée</p></div></div><div className="timeline"><span className="timeline-dot lime"/><div><strong>Samedi · Full body</strong><p>Musculation · 60 min</p></div></div></div>
          </section>}
          {!showProfile && tab === 'Séance' && <section><div className="section-head"><div><p className="kicker">ENTRAÎNEMENT</p><h1>Séance</h1><p className="muted">Prépare et retrouve tes entraînements.</p></div></div><div className="panel highlighted"><span className="pill">SÉANCE DU JOUR · EXEMPLE</span><h2>Haut du corps</h2><p className="muted">6 exercices · 18 séries · repos personnalisés</p><div className="exercise-list"><div><span>01</span> Développé debout <small>3 × 10</small></div><div><span>02</span> Tirage horizontal <small>3 × 10</small></div><div><span>03</span> Curl biceps <small>3 × 12</small></div></div><div className="disabled-action">Démarrage disponible dans un prochain lot</div></div><div className="panel"><h2>Séance libre</h2><p className="muted">Musculation, cardio ou copie d'une séance existante.</p><div className="disabled-action">Création disponible dans un prochain lot</div></div></section>}
          {!showProfile && tab === 'Programmes' && <section><div className="section-head"><div><p className="kicker">PLANIFICATION</p><h1>Programmes</h1><p className="muted">Calendrier global et cycles multisemaines.</p></div></div><div className="panel"><div className="panel-heading"><h2>Semaine {week === 0 ? 'en cours' : week > 0 ? `+${week}` : week}</h2><div className="week-buttons"><button aria-label="Semaine précédente" onClick={() => setWeek(v => v - 1)}>‹</button><button aria-label="Semaine suivante" onClick={() => setWeek(v => v + 1)}>›</button></div></div><div className="calendar">{['L','M','M','J','V','S','D'].map((day, i) => <div className="calendar-day" key={`${day}-${i}`}><span>{day}</span><strong>{i + 9 + week * 7}</strong>{week === 0 && [1,3,5].includes(i) && <i className={i === 3 ? 'blue' : ''}/>}</div>)}</div><p className="muted small">Aperçu fictif du calendrier. Les dates et séances réelles seront calculées ultérieurement.</p></div><div className="panel"><h2>Programmes actifs</h2><div className="program"><div><strong>Cycle force & progression</strong><p className="muted">Exemple · 8 semaines</p></div><span className="pill">Semaine 3/8</span></div><div className="disabled-action">Éditeur disponible dans un prochain lot</div></div></section>}
          {!showProfile && tab === 'Stats' && <section><div className="section-head"><div><p className="kicker">ANALYSES</p><h1>Statistiques</h1><p className="muted">Suivi de la progression et répartition musculaire.</p></div></div><div className="metrics"><div className="metric"><span>Volume</span><strong>42</strong><small>séries · exemple</small></div><div className="metric"><span>Cardio</span><strong>85</strong><small>minutes · exemple</small></div></div><div className="panel"><h2>Progression récente</h2><p className="muted small">Illustration sans données réelles</p><div className="bars" aria-label="Graphique illustratif"><span style={{height:'38%'}}/><span style={{height:'51%'}}/><span style={{height:'47%'}}/><span style={{height:'70%'}}/><span style={{height:'65%'}}/><span style={{height:'83%'}}/><span style={{height:'94%'}}/></div></div><div className="panel"><h2>Analyse musculaire</h2><p className="muted">Carte corporelle interactive, séries directes et secondaires pondérées : intégration prévue dans les lots fonctionnels.</p><div className="disabled-action">Analyse indisponible dans cette démonstration</div></div></section>}
          {!showProfile && tab === 'Plus' && <section><div className="section-head"><div><p className="kicker">PERSONNALISATION</p><h1>Plus</h1><p className="muted">Bibliothèques, matériel et réglages.</p></div></div><div className="panel menu-panel">{[['Bibliothèque d’exercices','Exercices et variantes'],['Matériel','Inventaire et configurations'],['Séances types','Modèles réutilisables']].map(([name, description]) => <div className="menu-item" key={name}><div><strong>{name}</strong><p className="muted">{description}</p></div><span>À venir</span></div>)}<button className="menu-item menu-button" onClick={() => setShowProfile(true)}><div><strong>Profil</strong><p className="muted">Profil local actif</p></div><span>→</span></button></div><div className="panel"><h2>Apparence</h2><div className="theme-choices" role="group" aria-label="Thème de l'application">{(['dark','light','system'] as const).map(value => <button key={value} className={theme === value ? 'selected' : ''} disabled={storageStatus !== 'ready' || saving} onClick={() => saveTheme(value)}>{value === 'dark' ? 'Sombre' : value === 'light' ? 'Clair' : 'Système'}</button>)}</div><p className="muted small">Thème enregistré dans IndexedDB et restauré à la prochaine ouverture.</p></div></section>}
        </main>
        <nav className="bottom-nav" aria-label="Navigation mobile">{tabs.map(item => <button type="button" key={item.label} className={tab === item.label && !showProfile ? 'active' : ''} onClick={() => navigate(item.label)}><span aria-hidden="true">{item.icon}</span><small>{item.label}</small></button>)}</nav>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
