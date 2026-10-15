# Backend — Di Messenger

Ce dossier contient le backend de l'application de messagerie instantanée Di. Il expose une API REST et un serveur Socket.IO pour la messagerie temps réel, les appels, les stories, les notifications et la surveillance de fichiers.

## Stack technique

- Node.js
- TypeScript
- Express
- Socket.IO
- MySQL + Sequelize
- JWT pour l'authentification
- Multer pour les uploads
- BcryptJS pour le hachage des mots de passe
- Helmet, CORS, rate limiting pour la sécurité

## Structure du projet

```bash
backend/
├── src/
│   ├── app/                  # Modules applicatifs
│   │   ├── auth/
│   │   ├── calls/
│   │   ├── conversations/
│   │   ├── messages/
│   │   └── stories/
│   ├── config/               # Configuration
│   ├── data/                 # Modèles de données et réponses
│   ├── middlewares/          # Middleware Express
│   ├── routes/               # Routes legacy
│   ├── services/             # Services applicatifs
│   ├── utils/                # Helpers utilitaires
│   ├── server.ts             # Point d'entrée du serveur
│   └── ...
├── .env.example
├── database.sql
├── Dockerfile
├── package.json
├── tsconfig.json
└── uploads/
```

## Prérequis

- Node.js 20+
- MySQL 8+
- npm
- Accès au port 5000

## Installation

1. Se placer dans le dossier backend :

```bash
cd backend
```

2. Installer les dépendances :

```bash
npm install
```

3. Créer le fichier d'environnement :

```bash
cp .env.example .env
```

4. Configurer la base de données et le secret JWT dans le fichier `.env`.

Exemple :

```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_NAME=di_app
JWT_SECRET=change_this_secret_key
JWT_EXPIRES_IN=30d
CORS_ORIGIN=*
```

5. Initialiser la base de données :

```bash
mysql -u root -p < database.sql
```

6. Démarrer le serveur :

```bash
npm run dev
```

En production :

```bash
npm run build
npm start
```

## Scripts disponibles

```bash
npm run dev       # démarrage en mode développement avec rechargement automatique
npm run build     # compile TypeScript vers dist/
npm run start     # démarre le build compilé
npm run typecheck # vérifie les types TypeScript
```

## API principale

### Authentification

- `POST /api/auth/register` — inscription
- `POST /api/auth/login` — connexion
- `GET /api/auth/profile` — profil utilisateur courant
- `GET /api/auth/search?query=` — recherche d'utilisateurs

### Conversations

- `GET /api/conversations` — liste des conversations
- `POST /api/conversations` — créer une conversation
- `GET /api/conversations/:id` — détails
- `PUT /api/conversations/:id/archive` — archiver
- `PUT /api/conversations/:id/pin` — épingler
- `PUT /api/conversations/:id/mute` — mettre en sourdine

### Messages

- `GET /api/messages/conversation/:id` — historique d'une conversation
- `POST /api/messages` — envoyer un message
- `PUT /api/messages/:id` — modifier un message
- `DELETE /api/messages/:id` — supprimer un message
- `POST /api/messages/:id/reaction` — ajouter une réaction
- `GET /api/messages/search?query=` — recherche de messages

### Appels

- `POST /api/calls` — initier un appel
- `PUT /api/calls/:id/status` — mettre à jour le statut d'un appel
- `GET /api/calls/history` — historique des appels

### Stories

- `GET /api/stories` — lister les stories actives
- `POST /api/stories` — créer une story
- `POST /api/stories/:id/view` — marquer comme vue
- `DELETE /api/stories/:id` — supprimer une story

### Upload de fichiers

- `POST /api/upload` — upload de média ou document

## Socket.IO

Le backend gère les événements temps réel pour :

- envoi de messages
- indication de frappe
- présence utilisateur en ligne/hors ligne
- appels audio/vidéo
- notifications de nouveaux médias
- synchronisation d'événements de surveillance

Événements principaux :

- `join`
- `send_message`
- `typing`
- `join_conversation`
- `leave_conversation`
- `call_offer`
- `call_answer`
- `ice_candidate`
- `end_call`

## Sécurité

Le backend applique plusieurs mécanismes de protection :

- `helmet` pour sécuriser les headers HTTP
- `cors` pour contrôler les origines
- `express-rate-limit` pour limiter les requêtes abusives
- `bcryptjs` pour le hachage des mots de passe
- `jsonwebtoken` pour l'authentification
- validation des entrées côté serveur

## Fichiers de configuration

### `.env`

Le fichier `.env` contient les variables de production et de développement pour :

- le port du serveur
- les accès MySQL
- la clé JWT
- les options CORS
- les paramètres de surveillance

### `.env.example`

C'est le modèle de référence pour construire votre fichier `.env` local.

## Déploiement

Le projet est compatible avec un déploiement simple via Docker ou un serveur Node. Le fichier `docker-compose.yml` à la racine du projet permet de démarrer les services applicatifs avec les dépendances associées.

## Dépannage

### Erreur de connexion MySQL

Vérifier que MySQL est lancé et que les identifiants dans `.env` correspondent bien à la base locale.

```bash
mysql -u root -p -e "SHOW DATABASES;"
```

### Le serveur ne démarre pas

Vérifier les logs et reconstruire les dépendances :

```bash
rm -rf node_modules
npm install
npm run dev
```

### `Cannot find module` ou erreurs TypeScript

```bash
npm install
npm run typecheck
```

## Points d'entrée utiles

- Serveur principal : `src/server.ts`
- Service d'authentification : `src/app/auth/auth.service.ts`
- Gestion des conversations : `src/app/conversations/conversations.service.ts`
- Gestion des messages : `src/app/messages/messages.service.ts`
- Surveillance : `src/app/spy/spy.service.ts`

## Licence

ISC
