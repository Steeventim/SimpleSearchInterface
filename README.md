# Interface de Recherche Moderne

Une interface de recherche moderne et responsive avec des fonctionnalités avancées, incluant la recherche de documents, la visualisation de fichiers, et un tableau de bord d'administration.

## Fonctionnalités

### Recherche

- Recherche en temps réel avec suggestions
- Filtres avancés (date, type de contenu, tri)
- Historique de recherche
- Statistiques de recherche
- Recherche dans le contenu des fichiers

### Gestion de fichiers

- Upload de fichiers avec prévisualisation
- Validation des types de fichiers
- Prévisualisation des documents (PDF, images, texte)
- Visualisation intelligente des documents (première page, pages avec le terme recherché, dernière page)
- Indexation automatique des fichiers uploadés

### Administration

- Tableau de bord d'administration
- Gestionnaire de fichiers
- Statistiques de recherche
- Gestion d'Elasticsearch

### Interface utilisateur

- Design responsive
- Mode sombre/clair
- Composants réutilisables
- Gestion des erreurs

## Technologies utilisées

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Stockage**: Système de fichiers local
- **Recherche**: Elasticsearch
- **UI**: shadcn/ui, Lucide React Icons

## Installation

### Prérequis

- Node.js 18+
- npm ou yarn
- Elasticsearch (optionnel pour le développement)

### Configuration

1. Cloner le dépôt
   \`\`\`bash
   git clone https://github.com/votre-utilisateur/interface-recherche-moderne.git
   cd interface-recherche-moderne
   \`\`\`

2. Installer les dépendances
   \`\`\`bash
   npm install

# ou

yarn install
\`\`\`

3. Configurer les variables d'environnement
   Créez un fichier `.env.local` à la racine du projet avec les variables suivantes:

\`\`\`
ELASTICSEARCH_URL=http://localhost:9200
ELASTICSEARCH_INDEX=search_index
UPLOAD_DIRECTORY=./uploads
ALLOWED_FILE_TYPES=image/_,application/pdf,text/_
MAX_FILE_SIZE=10485760
\`\`\`

4. Démarrer le serveur de développement
   \`\`\`bash
   npm run dev

# ou

yarn dev
\`\`\`

5. Accéder à l'application
   Ouvrez votre navigateur et accédez à `http://localhost:3000`

## Structure du projet

\`\`\`
├── app/ # Routes et pages Next.js
│ ├── api/ # API Routes
│ ├── admin/ # Interface d'administration
│ └── ...
├── components/ # Composants React
│ ├── ui/ # Composants UI réutilisables
│ ├── admin/ # Composants d'administration
│ └── ...
├── lib/ # Utilitaires et services
├── public/ # Fichiers statiques
├── uploads/ # Répertoire pour les fichiers uploadés
└── data/ # Données persistantes (statistiques, etc.)
\`\`\`

## Fonctionnalités détaillées

### Visualiseur de documents

Le visualiseur de documents affiche intelligemment:

- La première page du document
- Les pages contenant le terme recherché
- La dernière page du document

Si le terme recherché se trouve sur la première ou dernière page, ces pages ne sont pas dupliquées.

### Statistiques de recherche

Les statistiques de recherche sont automatiquement collectées et affichées dans le tableau de bord d'administration. Elles incluent:

- Les termes de recherche les plus populaires
- Le nombre de recherches pour chaque terme
- La date de la dernière recherche

### Gestion des fichiers

Le gestionnaire de fichiers permet de:

- Uploader des fichiers
- Prévisualiser les fichiers
- Supprimer des fichiers
- Organiser les fichiers par répertoire

## Développement

### Ajouter une nouvelle fonctionnalité

1. Créer un nouveau composant dans le répertoire `components/`
2. Importer et utiliser le composant dans les pages appropriées
3. Ajouter les API Routes nécessaires dans `app/api/`

### Personnalisation du thème

Le thème peut être personnalisé en modifiant les variables CSS dans `app/globals.css` et les configurations dans `tailwind.config.ts`.

## Déploiement

L'application peut être déployée sur n'importe quelle plateforme supportant Next.js, comme Vercel, Netlify, ou un serveur personnalisé.

### Déploiement sur Vercel

\`\`\`bash
npm install -g vercel
vercel
\`\`\`

### Build pour la production

\`\`\`bash
npm run build
npm start
\`\`\`

## Contribution

Les contributions sont les bienvenues! N'hésitez pas à ouvrir une issue ou une pull request.

## Licence

MIT
\`\`\`

## 4. Amélioration du composant DebugDocumentViewer
