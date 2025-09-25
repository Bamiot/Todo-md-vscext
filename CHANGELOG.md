# Journal des modifications

## [0.0.1] - 2025-09-24

### Ajouté

- Vue arborescente pour afficher les todos organisés par sections
- Support complet du format Markdown pour les todos
- Commandes pour ajouter, basculer et supprimer des todos
- Sélection de fichier todo personnalisé
- Surveillance du fichier en temps réel pour les mises à jour automatiques
- Configuration pour le fichier todo par défaut
- Gestion automatique des sections dans les fichiers Markdown
- Interface utilisateur intuitive avec icônes appropriées

### Fonctionnalités

- **Parseur Markdown** : Analyse automatique des tâches au format `- [ ]` et `- [x]`
- **Tree View** : Affichage organisé des todos dans la sidebar Explorer
- **Gestion de fichier** : Création, sélection et ouverture de fichiers todo
- **Édition en temps réel** : Synchronisation automatique entre le fichier et la vue
- **Organisation par sections** : Support des en-têtes Markdown pour organiser les todos

### Commandes disponibles

- `todo-md.openTodoFile` : Ouvre le fichier todo
- `todo-md.addTodo` : Ajoute une nouvelle tâche
- `todo-md.toggleTodo` : Bascule l'état d'une tâche
- `todo-md.deleteTodo` : Supprime une tâche
- `todo-md.refresh` : Actualise la vue
- `todo-md.selectTodoFile` : Sélectionne un fichier todo
