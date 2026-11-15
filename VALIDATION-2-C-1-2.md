# LifeTrack Training — Livraison candidate 2-C.1.2

## Statut
Archive source candidate. Compilation TypeScript/Vite et tests iPhone **non réalisés** dans cet environnement faute de dépendances npm disponibles. Ne pas confondre intégrité du ZIP et validation fonctionnelle.

## Périmètre
- Affichage de la version 2-C.1.2 dans l'application.
- Durées affichées en hh:mm:ss, sans arrondi au dixième de minute dans le récapitulatif.
- Modification manuelle des durées distinguée de l'affichage automatique.
- Historique simple des exécutions clôturées, en lecture seule.
- Retour depuis le récapitulatif avec restauration de l'état actif si nécessaire.
- Vérification du succès d'écriture IndexedDB avant de clôturer une séance.
- Erreur de sauvegarde en arrière-plan signalée au retour, et protection contre l'écriture concurrente dans ce cas.

## Compatibilité
Schéma logique JSON V4 et structures IndexedDB conservés. Aucune synchronisation Safari/PWA ajoutée. Les données stockées sur l'iPhone ne sont pas incluses dans cette archive.

## Validation de build
Dans GitHub Actions, le workflow `.github/workflows/deploy.yml` exécute `npm install` puis `npm run build`. Une publication sur la branche `main` déclenche également un déploiement Pages : **le build n'est pas isolé du déploiement**. Pour un build sans déploiement, utiliser une branche temporaire et un workflow de vérification dédié ou un environnement local avec npm disponible.

## Recette iPhone après compilation réussie
1. Exporter et conserver le JSON actuel depuis la PWA avant mise à jour.
2. Vérifier que les deux séances types et le programme Full Body existent toujours.
3. Vérifier la version visible et le format hh:mm:ss.
4. Reprendre une séance après fermeture forcée, puis vérifier les temps actif/pause.
5. Ouvrir « Terminer », choisir « Retour » et vérifier que le statut reprend correctement.
6. Terminer une séance partielle et retrouver son statut, son nom et ses durées dans l'historique.
7. Exporter le JSON après test et comparer les exécutions; ne pas restaurer dans Safari.
8. Vérifier la mise à jour PWA après déploiement (rechargement/actualisation éventuels).

## Limites
- Aucun test d'échec d'écriture IndexedDB n'a été exécuté en navigateur.
- Le mécanisme d'arrière-plan d'iOS ne garantit pas l'achèvement d'une écriture asynchrone avant suspension; le test de reprise reste obligatoire.
- Le récapitulatif enrichi, le RIR par série, le mode immersif et le HIIT sont hors périmètre.
