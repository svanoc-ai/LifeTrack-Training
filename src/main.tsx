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

function App() {
  const [tab, setTab] = useState<Tab>('Accueil');
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');
  const [showProfile, setShowProfile] = useState(false);
  const [week, setWeek] = useState(0);
  const effectiveTheme = theme === 'system' ? 'system' : theme;

  const navigate = (next: Tab) => { setTab(next); setShowProfile(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  return (
    <div className={`shell theme-${effectiveTheme}`}>
      <aside className="sidebar" aria-label="Navigation principale">
        <div className="brand"><span className="brand-icon">LT</span><span><strong>LifeTrack</strong><small>TRAINING</small></span></div>
        <nav>{tabs.map(item => <button key={item.label} type="button" className={`side-link ${tab === item.label && !showProfile ? 'active' : ''}`} onClick={() => navigate(item.label)}><span aria-hidden="true">{item.icon}</span>{item.label}</button>)}</nav>
        <div className="sidebar-foot">V0.1 · Lot 1-B<br/>Prototype d'interface</div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <div className="mobile-brand"><span className="brand-icon">LT</span><span>TRAINING</span></div>
          <div className="desktop-heading">TRAIN SMART. <span>PROGRESS STRONG.</span></div>
          <button type="button" className="avatar" aria-label="Afficher le profil" onClick={() => setShowProfile(!showProfile)}>S</button>
        </header>
        <main id="main" className="content">
          <div className="demo-note"><span className="demo-dot"/> Mode démonstration · Aucune donnée enregistrée</div>
          {showProfile ? <section><div className="section-head"><div><p className="kicker">COMPTE LOCAL</p><h1>Profil</h1></div></div><div className="panel"><h2>Profil personnel</h2><p className="muted">Un seul profil actif en V0.1. Architecture multiprofil prévue pour une évolution ultérieure.</p><p className="muted">La gestion des données sera disponible dans le lot dédié au stockage local.</p><button className="secondary-button" onClick={() => setShowProfile(false)}>Retour</button></div></section> : null}
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
          {!showProfile && tab === 'Plus' && <section><div className="section-head"><div><p className="kicker">PERSONNALISATION</p><h1>Plus</h1><p className="muted">Bibliothèques, matériel et réglages.</p></div></div><div className="panel menu-panel">{[['Bibliothèque d’exercices','Exercices et variantes'],['Matériel','Inventaire et configurations'],['Séances types','Modèles réutilisables']].map(([name, description]) => <div className="menu-item" key={name}><div><strong>{name}</strong><p className="muted">{description}</p></div><span>À venir</span></div>)}<button className="menu-item menu-button" onClick={() => setShowProfile(true)}><div><strong>Profil</strong><p className="muted">Profil local actif</p></div><span>→</span></button></div><div className="panel"><h2>Apparence</h2><div className="theme-choices" role="group" aria-label="Thème de l'application">{(['dark','light','system'] as const).map(value => <button key={value} className={theme === value ? 'selected' : ''} onClick={() => setTheme(value)}>{value === 'dark' ? 'Sombre' : value === 'light' ? 'Clair' : 'Système'}</button>)}</div><p className="muted small">Réglage temporaire : la mémorisation sera ajoutée avec IndexedDB.</p></div></section>}
        </main>
        <nav className="bottom-nav" aria-label="Navigation mobile">{tabs.map(item => <button type="button" key={item.label} className={tab === item.label && !showProfile ? 'active' : ''} onClick={() => navigate(item.label)}><span aria-hidden="true">{item.icon}</span><small>{item.label}</small></button>)}</nav>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
