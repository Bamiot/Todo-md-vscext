import * as vscode from "vscode";
import { TodoItem, TodoSection } from "./types";
import { ConfigurationService } from "./configurationService";

interface MarkdownStyles {
  text: string;
  isStrikethrough: boolean;
  isBold: boolean;
  isItalic: boolean;
}

function parseMarkdownStyles(text: string): MarkdownStyles {
  let cleanText = text;
  let isStrikethrough = false;
  let isBold = false;
  let isItalic = false;

  // Check for strikethrough ~~text~~
  if (text.match(/^~~.*~~$/)) {
    isStrikethrough = true;
    cleanText = text.replace(/^~~(.*)~~$/, "$1");
  }

  // Check for bold **text** or __text__
  else if (text.match(/^\*\*.*\*\*$/) || text.match(/^__.*__$/)) {
    isBold = true;
    cleanText = text
      .replace(/^\*\*(.*)\*\*$/, "$1")
      .replace(/^__(.*)__$/, "$1");
  }

  // Check for italic *text* or _text_
  else if (text.match(/^\*.*\*$/) || text.match(/^_.*_$/)) {
    isItalic = true;
    cleanText = text.replace(/^\*(.*)\*$/, "$1").replace(/^_(.*)_$/, "$1");
  }

  // Handle combined formatting like ***text*** (bold + italic)
  else if (text.match(/^\*\*\*.*\*\*\*$/)) {
    isBold = true;
    isItalic = true;
    cleanText = text.replace(/^\*\*\*(.*)\*\*\*$/, "$1");
  }

  return {
    text: cleanText,
    isStrikethrough,
    isBold,
    isItalic,
  };
}

export class TodoTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly todoItem?: TodoItem,
    public readonly section?: TodoSection,
    public readonly todoFileUri?: vscode.Uri
  ) {
    super(label, collapsibleState);

    if (todoItem && todoFileUri) {
      this.contextValue = "todoItem";
      const config = ConfigurationService.getConfiguration();

      this.iconPath = new vscode.ThemeIcon(
        todoItem.completed ? "check" : "circle-outline"
      );

      // Parse markdown styles first to clean text
      const styles = parseMarkdownStyles(this.label || todoItem.text);
      this.label = styles.text;

      // Show "complete" description for completed tasks
      if (todoItem.completed) {
        this.description = "complete";
      }

      this.command = {
        command: "vscode.open",
        title: "Open Todo File",
        arguments: [
          todoFileUri,
          {
            selection: new vscode.Range(todoItem.line, 0, todoItem.line, 0),
          },
        ],
      };

      this.tooltip = `Line ${todoItem.line + 1}: ${styles.text}${
        todoItem.depth > 0 ? ` (depth: ${todoItem.depth})` : ""
      }${todoItem.completed ? " - COMPLETE" : ""}`;
    } else if (section) {
      this.contextValue = "todoSection";
      this.iconPath = new vscode.ThemeIcon("folder");
      const totalItems = this.countAllItems(section.items);
      this.description = `${totalItems} items`;
      this.tooltip = `Section: ${section.title}`;
    }
  }

  private countAllItems(items: TodoItem[]): number {
    let count = items.length;
    for (const item of items) {
      count += this.countAllItems(item.children);
    }
    return count;
  }
}

export class TodoTreeDataProvider
  implements vscode.TreeDataProvider<TodoTreeItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    TodoTreeItem | undefined | null | void
  > = new vscode.EventEmitter<TodoTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    TodoTreeItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  private sections: TodoSection[] = [];
  private todoFileUri: vscode.Uri | undefined;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  updateSections(sections: TodoSection[], todoFileUri?: vscode.Uri): void {
    this.sections = sections;
    this.todoFileUri = todoFileUri;
    this.refresh();
  }

  getTreeItem(element: TodoTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: TodoTreeItem): Thenable<TodoTreeItem[]> {
    if (!element) {
      // Root level - return sections
      return Promise.resolve(
        this.sections.map(
          (section) =>
            new TodoTreeItem(
              section.title,
              vscode.TreeItemCollapsibleState.Expanded,
              undefined,
              section,
              this.todoFileUri
            )
        )
      );
    } else if (element.section) {
      // Section level - return root todo items
      return Promise.resolve(
        this.createTreeItemsFromTodos(element.section.items)
      );
    } else if (element.todoItem && element.todoItem.children.length > 0) {
      // Todo item with children - return child items
      return Promise.resolve(
        this.createTreeItemsFromTodos(element.todoItem.children)
      );
    }

    return Promise.resolve([]);
  }

  private createTreeItemsFromTodos(todos: TodoItem[]): TodoTreeItem[] {
    return todos.map((todo) => {
      const collapsibleState =
        todo.children.length > 0
          ? vscode.TreeItemCollapsibleState.Expanded
          : vscode.TreeItemCollapsibleState.None;

      const treeItem = new TodoTreeItem(
        todo.originalText,
        collapsibleState,
        todo,
        undefined,
        this.todoFileUri
      );

      return treeItem;
    });
  }

  getTodoItemByLine(lineNumber: number): TodoItem | undefined {
    const findInItems = (items: TodoItem[]): TodoItem | undefined => {
      for (const item of items) {
        if (item.line === lineNumber) {
          return item;
        }
        const found = findInItems(item.children);
        if (found) {
          return found;
        }
      }
      return undefined;
    };

    for (const section of this.sections) {
      const found = findInItems(section.items);
      if (found) {
        return found;
      }
    }
    return undefined;
  }
}
