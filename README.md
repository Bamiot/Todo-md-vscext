# Todo MD Extension

Une extension VS Code pour gérer vos tâches todo en utilisant des fichiers Markdown.

## Fonctionnalités

- 📝 **Gestion de fichier todo en Markdown** : Utilisez la syntaxe Markdown standard pour vos todos
- 🌳 **Vue arborescente** : Visualisez vos todos organisés par sections dans la sidebar
- ✅ **Basculer l'état des tâches** : Marquez facilement les tâches comme terminées ou non terminées
- ➕ **Ajouter des tâches** : Ajoutez rapidement de nouvelles tâches
- 🗑️ **Supprimer des tâches** : Supprimez les tâches terminées ou non désirées
- 🔄 **Mise à jour en temps réel** : Les modifications du fichier sont automatiquement reflétées dans la vue
- 📁 **Sélection de fichier** : Choisissez votre propre fichier todo ou utilisez le fichier par défaut

## Format des tâches

L'extension reconnaît les tâches au format Markdown standard :

```markdown
# Ma Liste de Tâches

## À Faire

- [ ] Tâche non terminée
- [x] Tâche terminée

## En Cours

- [ ] Une autre tâche

## Terminé

- [x] Tâche finie
```

## Commandes

- **Todo MD: Open Todo File** - Ouvre le fichier todo actuel
- **Todo MD: Add Todo** - Ajoute une nouvelle tâche
- **Todo MD: Select Todo File** - Sélectionne un fichier todo différent
- **Todo MD: Refresh** - Actualise la vue des todos

## Configuration

- `todoMd.defaultFile` : Nom du fichier todo par défaut (défaut: `todo.md`)

## Installation

1. Ouvrez VS Code
2. Allez dans Extensions (Ctrl+Shift+X)
3. Recherchez "Todo MD"
4. Cliquez sur "Install"

## Utilisation

1. Ouvrez votre workspace
2. L'extension cherchera automatiquement un fichier `todo.md` à la racine
3. Si aucun fichier n'est trouvé, vous pouvez en créer un ou en sélectionner un existant
4. Utilisez la vue "Todo List" dans l'Explorer pour gérer vos tâches
5. Les modifications dans le fichier sont automatiquement synchronisées

## Développement

Pour développer cette extension :

```bash
# Cloner le repo
git clone <your-repo>
cd todo-md

# Installer les dépendances
npm install

# Compiler
npm run compile

# Lancer en mode debug
# Appuyez sur F5 dans VS Code
```

## Licence

MIT
