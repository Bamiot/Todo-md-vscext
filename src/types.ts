export interface TodoItem {
  id: string;
  text: string;
  originalText: string; // Texte avec markdown original
  completed: boolean;
  line: number;
  depth: number;
  children: TodoItem[];
  parent?: TodoItem;
}

export interface TodoSection {
  title: string;
  items: TodoItem[];
  line: number;
}

export interface TodoConfiguration {
  defaultFile: string;
  filePatterns: string[];
  strikeCompletedTasks: boolean;
  confirmDeletion: boolean;
}
