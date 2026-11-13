# LifeTrack Training V0.1 — Lot 1-A

Projet **indépendant** de LifeTrack V1.0.2. Cette livraison ne contient qu'un écran de démarrage : aucun module métier, IndexedDB ou PWA n'est encore opérationnel.

## Démarrage local

Prérequis : Node.js 22 et npm.

```bash
npm install --no-audit --no-fund
npm run dev
```

## Publication GitHub Pages

1. Créer un **nouveau dépôt** GitHub, par exemple `LifeTrack-Training`, sans modifier le dépôt de LifeTrack.
2. Importer le contenu de ce ZIP dans le nouveau dépôt sur la branche `main`.
3. Dans **Settings > Pages > Build and deployment**, sélectionner **GitHub Actions**.
4. Le workflow `.github/workflows/deploy.yml` construit et publie automatiquement après un push sur `main`.
5. L'adresse finale dépendra du nom du compte et du dépôt : `https://<compte>.github.io/<depot>/`.

La configuration Vite prend automatiquement le nom du dépôt comme chemin de base lors du déploiement. Le premier déploiement peut nécessiter l'activation de GitHub Pages dans les paramètres.

## Portée / limites

- Inclus : squelette React, TypeScript strict, Vite, identité visuelle initiale, pipeline GitHub Pages.
- Non inclus : navigation complète (L1-B), profil/IndexedDB (L1-C), PWA/hors ligne (L1-D), recette multi-appareils (L1-E).
- Aucun dépôt distant n'a été créé et aucune URL de déploiement n'a été vérifiée.
