# ⭕ Morpion multijoueur

Un morpion multijoueur en temps réel : deux joueurs se retrouvent automatiquement via un matchmaking, et chaque coup s'affiche instantanément chez l'adversaire.

## 🎯 Le problème

Le morpion est trivial en local, mais le rendre multijoueur pose les vraies questions du temps réel : comment apparier deux inconnus, synchroniser l'état d'une partie, et empêcher un client malveillant de tricher ?

## ▶️ Lancer le projet

```bash
npm install
npm start
```

Le serveur sert les fichiers statiques et gère les parties via Socket.io.

## 🏗️ Architecture

- **`server.js`** — serveur HTTP Express, sert le front statique
- **`game.js`** — logique de jeu pure
- **`matchmaking.js`** — file d'attente et appariement des joueurs

**Principe directeur : le serveur fait autorité.** Il valide chaque coup ; le client n'est qu'un affichage. L'état des parties vit en mémoire (pas de base de données).

### Événements Socket.io (noms stables, en anglais)

| Événement | Rôle |
|---|---|
| `find-game` | Un joueur rejoint la file d'attente |
| `game-start` | Deux joueurs sont appariés, la partie démarre |
| `make-move` | Un joueur envoie son coup |
| `move-made` | Le coup validé est diffusé aux deux joueurs |
| `game-over` | Fin de partie (victoire / égalité) |
| `opponent-left` | L'adversaire s'est déconnecté en cours de partie |
| `waiting` | En attente d'un second joueur |

## ✨ Fonctionnalités

- **Matchmaking automatique** — file d'attente et appariement des joueurs en temps réel
- **Synchronisation instantanée** — chaque coup propagé via WebSocket
- **Serveur autoritaire** — validation de tous les coups côté serveur, anti-triche par conception
- **Gestion des déconnexions** — détection du départ de l'adversaire en cours de partie

## 🛠️ Stack technique

- **Serveur** : Node.js + Express + Socket.io
- **Client** : HTML / CSS / JavaScript natifs, sans framework
- Pas de base de données : l'état des parties vit en mémoire

## 📝 Conventions du projet

- Commentaires de code en français
- Logique de jeu, serveur et matchmaking séparés dans des fichiers distincts
- Ne jamais faire confiance au client pour valider un coup
- Ne pas ajouter de framework frontend ni de base de données
