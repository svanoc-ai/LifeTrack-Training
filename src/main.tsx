
import React from 'react';
import ReactDOM from 'react-dom/client';
import './style.css';

function App() {
  return (
    <main className="app">
      <div className="logo">LT</div>
      <p className="eyebrow">LIFETRACK TRAINING</p>
      <h1>TRAIN SMART.<br />PROGRESS STRONG.</h1>
      <p className="description">
        Musculation, cardio et progression.
        Votre nouvel espace d'entraînement.
      </p>

      <div className="status">
        <span className="dot" />
        Prototype V0.1 — Lot 1-A
      </div>

      <p className="footer">
        Initialisation technique réussie
      </p>
    </main>
  );
}

ReactDOM.createRoot(
  document.getElementById('root')!
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

