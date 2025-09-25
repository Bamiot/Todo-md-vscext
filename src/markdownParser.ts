import { TodoItem, TodoSection } from "./types";
import { ConfigurationService } from "./configurationService";

export class MarkdownParser {
  static parseTodos(content: string): TodoSection[] {
    const config = ConfigurationService.getConfiguration();
    const lines = content.split("\n");
    const sections: TodoSection[] = [];
    let currentSection: TodoSection | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith("#")) {
        if (currentSection && this.hasItems(currentSection.items)) {
          sections.push(currentSection);
        }
        currentSection = {
          title: trimmedLine.replace(/^#+\s*/, ""),
          items: [],
          line: i,
        };
      } else if (this.isTodoItem(line)) {
        if (!currentSection) {
          currentSection = {
            title: "General",
            items: [],
            line: 0,
          };
        }

        const depth = this.getIndentationDepth(line);
        const todoItem = this.parseTodoItem(line, i, depth);

        if (todoItem && depth <= 3) {
          // Support nested tasks with max depth of 3
          this.addTodoItemToHierarchy(currentSection.items, todoItem);
        }
      }
    }

    if (currentSection && this.hasItems(currentSection.items)) {
      sections.push(currentSection);
    }

    return sections;
  }

  private static hasItems(items: TodoItem[]): boolean {
    return (
      items.length > 0 || items.some((item) => this.hasItems(item.children))
    );
  }

  private static getIndentationDepth(line: string): number {
    const match = line.match(/^(\s*)/);
    if (!match) {
      return 0;
    }

    const indentation = match[1];
    const spaces = (indentation.match(/ /g) || []).length;
    const tabs = (indentation.match(/\t/g) || []).length;

    return Math.floor(spaces / 2) + tabs;
  }

  private static addTodoItemToHierarchy(
    items: TodoItem[],
    newItem: TodoItem
  ): void {
    if (newItem.depth === 0) {
      items.push(newItem);
      return;
    }

    const targetDepth = newItem.depth - 1;
    const parentItem = this.findLastItemAtDepth(items, targetDepth);

    if (parentItem) {
      newItem.parent = parentItem;
      parentItem.children.push(newItem);
    } else {
      newItem.depth = 0;
      items.push(newItem);
    }
  }

  private static findLastItemAtDepth(
    items: TodoItem[],
    depth: number
  ): TodoItem | null {
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      if (item.depth === depth) {
        return item;
      }
      const found = this.findLastItemAtDepth(item.children, depth);
      if (found) {
        return found;
      }
    }
    return null;
  }

  private static isTodoItem(line: string): boolean {
    return /^\s*[-*+]\s*\[[x\s]\]\s*/.test(line);
  }

  private static parseTodoItem(
    line: string,
    lineNumber: number,
    depth: number
  ): TodoItem | null {
    const match = line.match(/^\s*[-*+]\s*\[([x\s])\]\s*(.+)$/);
    if (!match) {
      return null;
    }

    const completed = match[1].toLowerCase() === "x";
    const originalText = match[2].trim(); // Garde le texte original avec markdown
    let text = originalText;

    // Remove strikethrough markdown if present for display purposes
    if (text.startsWith("~~") && text.endsWith("~~") && text.length > 4) {
      text = text.slice(2, -2);
    }

    return {
      id: `${lineNumber}-${depth}-${text}`,
      text,
      originalText,
      completed,
      line: lineNumber,
      depth,
      children: [],
      parent: undefined,
    };
  }

  static toggleTodoItem(content: string, lineNumber: number): string {
    const lines = content.split("\n");
    if (lineNumber < 0 || lineNumber >= lines.length) {
      return content;
    }

    const line = lines[lineNumber];
    const config = ConfigurationService.getConfiguration();

    if (this.isTodoItem(line)) {
      if (line.includes("[ ]")) {
        // Marking as completed
        let newLine = line.replace("[ ]", "[x]");

        // Add strikethrough if option is enabled
        if (config.strikeCompletedTasks) {
          const match = newLine.match(/^(\s*[-*+]\s*\[x\]\s*)(.+)$/);
          if (match) {
            const prefix = match[1];
            const text = match[2].trim();
            // Only add tildes if not already present
            if (!text.startsWith("~~") || !text.endsWith("~~")) {
              newLine = `${prefix}~~${text}~~`;
            }
          }
        }

        lines[lineNumber] = newLine;
      } else if (line.includes("[x]")) {
        // Marking as incomplete
        let newLine = line.replace("[x]", "[ ]");

        // Remove strikethrough if present
        const match = newLine.match(/^(\s*[-*+]\s*\[\s\]\s*)~~(.+)~~$/);
        if (match) {
          const prefix = match[1];
          const text = match[2];
          newLine = `${prefix}${text}`;
        }

        lines[lineNumber] = newLine;
      }
    }

    return lines.join("\n");
  }

  static deleteTodoItem(content: string, lineNumber: number): string {
    const lines = content.split("\n");
    if (lineNumber < 0 || lineNumber >= lines.length) {
      return content;
    }

    lines.splice(lineNumber, 1);
    return lines.join("\n");
  }

  static addTodoItem(content: string, text: string): string {
    const lines = content.split("\n");
    const newTodoItem = `- [ ] ${text}`;
    lines.push(newTodoItem);
    return lines.join("\n");
  }

  static updateStrikethroughFormatting(content: string): string {
    const lines = content.split("\n");
    const config = ConfigurationService.getConfiguration();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (this.isTodoItem(line)) {
        const match = line.match(/^(\s*[-*+]\s*\[([x\s])\]\s*)(.+)$/);
        if (match) {
          const prefix = match[1];
          const checkState = match[2];
          const text = match[3].trim();
          const isCompleted = checkState.toLowerCase() === "x";

          if (isCompleted && config.strikeCompletedTasks) {
            // Add strikethrough if not present
            if (!text.startsWith("~~") || !text.endsWith("~~")) {
              const cleanText =
                text.startsWith("~~") && text.endsWith("~~")
                  ? text.slice(2, -2)
                  : text;
              lines[i] = `${prefix}~~${cleanText}~~`;
            }
          } else if (!isCompleted || !config.strikeCompletedTasks) {
            // Remove strikethrough if present
            if (text.startsWith("~~") && text.endsWith("~~")) {
              const cleanText = text.slice(2, -2);
              lines[i] = `${prefix}${cleanText}`;
            }
          }
        }
      }
    }

    return lines.join("\n");
  }
}
