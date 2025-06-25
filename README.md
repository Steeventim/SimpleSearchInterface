# Moteur de Recherche de Documents Intelligent

Une interface de recherche moderne et responsive avec des fonctionnalités avancées d'IA, incluant la recherche de documents PDF, la visualisation intelligente de fichiers, et un système d'administration complet avec suivi des performances.

## Fonctionnalités

### Recherche Intelligente

- **Recherche en temps réel** avec suggestions multi-sources
- **Suggestions intelligentes** basées sur :
  - Elasticsearch (recherche sémantique)
  - Termes populaires (historique des recherches)
  - Suggestions contextuelles
  - Corrections orthographiques automatiques
  - Bibliothèque de recherche dynamique auto-apprenante
- **Filtres avancés** (date, type de contenu, tri par pertinence/date)
- **Historique de recherche** persistant
- **Statistiques de recherche** en temps réel
- **Recherche full-text** dans le contenu des fichiers PDF

### Gestion Avancée de Fichiers

- **Upload intelligent** avec validation des types et taille
- **Prévisualisation multi-format** (PDF, images, texte, documents Office)
- **Visualisation PDF intelligente** avec navigation par pages
- **Indexation automatique** des fichiers uploadés dans Elasticsearch
- **Gestion des métadonnées** (titre, description, tags)
- **Système de fichiers sécurisé** avec contrôle d'accès
- **Support des caractères Unicode** pour les documents internationaux

### Administration Complète

- **Tableau de bord d'administration** avec métriques en temps réel
- **Gestionnaire de fichiers** avec prévisualisation et suppression
- **Statistiques de recherche** détaillées avec graphiques
- **Gestion d'Elasticsearch** (indexation, configuration)
- **Bibliothèque de recherche** pour analyser les comportements utilisateurs
- **Visualiseur de logs** système
- **Contrôle d'accès** basé sur les rôles
- **Tests d'intégrité** des services

### Interface Utilisateur Moderne

- **Design responsive** adaptatif (mobile, tablette, desktop)
- **Mode sombre/clair** avec préférences utilisateur
- **Composants UI réutilisables** (shadcn/ui)
- **Animations fluides** et transitions
- **Gestion d'erreurs** intelligente avec feedback utilisateur
- **Accessibilité** optimisée (ARIA, navigation clavier)
- **Performance optimisée** avec lazy loading et cache

## Technologies Utilisées

### Frontend

- **Next.js 15** avec App Router
- **React 19** avec hooks modernes
- **TypeScript** pour la sécurité des types
- **Tailwind CSS** pour le styling
- **shadcn/ui** pour les composants UI
- **Lucide React** pour les icônes

### Backend & APIs

- **Next.js API Routes** pour les endpoints
- **NextAuth.js** pour l'authentification
- **Elasticsearch** pour la recherche full-text
- **Node.js** pour le traitement serveur

### Outils & Déploiement

- **Docker** pour la containerisation
- **PM2** pour la gestion des processus
- **pnpm** pour la gestion des paquets
- **ESLint & Prettier** pour la qualité du code

## Installation et Configuration

### Prérequis

- **Node.js 18+** (recommandé: 20+)
- **pnpm** (gestionnaire de paquets recommandé)
- **Elasticsearch 8.x** (optionnel pour le développement)
- **Docker** (optionnel pour le déploiement)

### Installation Rapide

1. **Cloner le dépôt**

   ```bash
   git clone <votre-repo>
   cd search-engine
   ```

2. **Installer les dépendances**

   ```bash
   pnpm install
   ```

3. **Configurer l'environnement**
   Créez un fichier `.env` à la racine :

   ```env
   # Authentification NextAuth
   NEXTAUTH_SECRET=your-secret-key-here
   NEXTAUTH_URL=http://localhost:3000

   # Configuration Elasticsearch
   ELASTICSEARCH_URL=http://localhost:9200
   ELASTICSEARCH_INDEX=search_index

   # Configuration des fichiers
   UPLOAD_DIRECTORY=/path/to/your/documents
   ALLOWED_FILE_TYPES=image/*,application/pdf,text/*,application/msword
   MAX_FILE_SIZE=10485760
   ```

4. **Démarrer en développement**

   ```bash
   pnpm dev
   ```

5. **Accéder à l'application**
   - Interface principale: `http://localhost:3000`
   - Administration: `http://localhost:3000/admin`

## Structure du Projet

```
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── analytics/           # Statistiques Elasticsearch
│   │   ├── auth/               # NextAuth endpoints
│   │   ├── search/             # Moteur de recherche
│   │   ├── suggestions/        # Suggestions intelligentes
│   │   ├── search-library/     # Bibliothèque auto-apprenante
│   │   ├── upload/             # Gestion des fichiers
│   │   └── pdf/               # Visualisation PDF
│   ├── admin/                  # Interface d'administration
│   │   ├── logs/              # Visualiseur de logs
│   │   └── search-library/    # Gestion bibliothèque
│   └── auth/                  # Pages d'authentification
├── components/                # Composants React
│   ├── ui/                   # Composants shadcn/ui
│   ├── admin/               # Composants d'administration
│   ├── enhanced-search-suggestions.tsx  # Suggestions avancées
│   ├── search-interface.tsx # Interface de recherche principale
│   └── ...
├── lib/                     # Services et utilitaires
│   ├── elasticsearch.ts    # Client Elasticsearch
│   ├── pdf-utils.ts        # Traitement PDF
│   ├── access-control.ts   # Contrôle d'accès
│   └── ...
├── hooks/                   # Hooks React personnalisés
│   ├── use-suggestions.ts   # Gestion des suggestions
│   ├── use-search-tracking.ts # Suivi des recherches
│   └── ...
├── data/                    # Données persistantes
│   ├── search-stats.json    # Statistiques de recherche
│   └── search-library.json  # Bibliothèque de termes
├── public/                  # Fichiers statiques
├── Dockerfile              # Configuration Docker
├── docker-compose.yml      # Orchestration des services
└── ecosystem.config.js     # Configuration PM2
```

## Fonctionnalités Détaillées

### Système de Suggestions Intelligent

Le système de suggestions utilise plusieurs sources pour fournir des résultats pertinents :

1. **Suggestions Elasticsearch** - Recherche sémantique dans l'index
2. **Termes populaires** - Basés sur l'historique des recherches
3. **Suggestions contextuelles** - Adaptées au contexte utilisateur
4. **Corrections orthographiques** - Détection et correction automatique
5. **Bibliothèque dynamique** - Apprentissage continu des patterns utilisateur

### Visualiseur de Documents PDF

Le visualiseur PDF intelligent affiche stratégiquement :

- **Première page** - Aperçu du document
- **Pages avec termes recherchés** - Contexte des résultats
- **Dernière page** - Vue d'ensemble du contenu
- **Navigation fluide** - Entre les pages pertinentes
- **Mise en surbrillance** - Des termes recherchés

### Bibliothèque de Recherche Auto-Apprenante

Système innovant qui :

- **Collecte automatiquement** les termes de recherche
- **Analyse les patterns** de recherche utilisateur
- **Améliore les suggestions** en temps réel
- **Fournit des insights** via l'interface d'administration
- **S'adapte aux domaines** spécifiques des documents

### Administration Avancée

L'interface d'administration offre :

- **Dashboard temps réel** avec métriques clés
- **Gestion des fichiers** avec aperçu et métadonnées
- **Analyse des recherches** avec graphiques interactifs
- **Bibliothèque de termes** avec filtres et tri
- **Logs système** pour le debugging
- **Tests d'intégrité** des services connectés

## Déploiement

### Option 1: Déploiement Docker (Recommandé)

1. **Build de l'image**

   ```bash
   NODE_ENV=production pnpm build
   docker build -t search-engine .
   ```

2. **Déploiement avec Docker Compose**

   ```bash
   docker-compose up -d
   ```

   Services inclus :

   - Application Next.js (port 3000)
   - Elasticsearch (port 9200)
   - Volumes persistants pour les données

### Option 2: Déploiement PM2

1. **Build de production**

   ```bash
   NODE_ENV=production pnpm build
   ```

2. **Lancement avec PM2**
   ```bash
   pm2 start ecosystem.config.js
   ```

### Option 3: Déploiement Vercel/Netlify

1. **Configuration des variables d'environnement**
2. **Push sur votre repository Git**
3. **Connexion automatique** avec la plateforme

### Variables d'Environnement de Production

```env
NODE_ENV=production
NEXTAUTH_SECRET=<strong-secret-key>
NEXTAUTH_URL=https://votre-domaine.com
ELASTICSEARCH_URL=http://elasticsearch:9200
ELASTICSEARCH_INDEX=production_index
UPLOAD_DIRECTORY=/app/uploads
```

## Développement et Contribution

### Architecture du Code

- **Composants modulaires** avec responsabilités séparées
- **Hooks personnalisés** pour la logique métier
- **Services centralisés** pour les API externes
- **Types TypeScript** stricts pour la sécurité
- **Tests** unitaires et d'intégration

### Ajout de Nouvelles Fonctionnalités

1. **Créer le composant** dans `components/`
2. **Ajouter les API routes** dans `app/api/`
3. **Configurer les types** TypeScript
4. **Tester** en mode développement
5. **Documenter** les changements

### Standards de Code

- **ESLint + Prettier** pour la cohérence
- **Commits conventionnels** pour l'historique
- **Tests** obligatoires pour les nouvelles features
- **Documentation** des API et composants

## Performance et Optimisations

### Optimisations Techniques

- **Lazy loading** des composants lourds
- **Cache intelligent** des résultats de recherche
- **Compression** des réponses API
- **Optimisation des images** automatique
- **Bundle splitting** pour des temps de chargement optimaux

### Métriques de Performance

- **Time to First Byte** < 200ms
- **First Contentful Paint** < 1.5s
- **Largest Contentful Paint** < 2.5s
- **Search Response Time** < 300ms

## Sécurité

### Mesures de Sécurité Implémentées

- **Authentification** NextAuth avec sessions sécurisées
- **Validation** stricte des inputs utilisateur
- **Sanitisation** des données avant indexation
- **Contrôle d'accès** par rôles utilisateur
- **Upload sécurisé** avec validation des types de fichiers
- **Rate limiting** sur les API endpoints

## Monitoring et Logs

### Système de Logs

- **Logs structurés** au format JSON
- **Niveaux de logs** configurables
- **Rotation automatique** des fichiers de logs
- **Monitoring** des erreurs en temps réel

### Métriques Surveillées

- **Utilisation des ressources** (CPU, mémoire)
- **Temps de réponse** des API
- **Taux d'erreur** par endpoint
- **Satisfaction utilisateur** via les statistiques d'usage

## Contribution

Les contributions sont les bienvenues ! Voici comment participer :

1. **Fork** le projet
2. **Créer une branche** pour votre feature (`git checkout -b feature/AmazingFeature`)
3. **Commiter** vos changements (`git commit -m 'Add some AmazingFeature'`)
4. **Pusher** vers la branche (`git push origin feature/AmazingFeature`)
5. **Ouvrir une Pull Request**

### Guidelines de Contribution

- Respecter les standards de code existants
- Ajouter des tests pour les nouvelles fonctionnalités
- Documenter les changements dans le README
- Vérifier que tous les tests passent avant de soumettre

## Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

---

## Support et Contact

Pour toute question ou support :

- **Issues GitHub** : Pour les bugs et demandes de fonctionnalités
- **Discussions** : Pour les questions générales
- **Documentation** : Wiki du projet pour des guides détaillés

**Développé avec ❤️ par l'équipe de développement**
