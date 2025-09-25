import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { MarkdownParser } from "./markdownParser";
import { TodoTreeDataProvider } from "./todoTreeDataProvider";
import { TodoSection, TodoItem } from "./types";
import { ConfigurationService } from "./configurationService";

export class TodoManager {
  private currentTodoFile: vscode.Uri | undefined;
  private fileWatcher: vscode.FileSystemWatcher | undefined;
  private configWatcher: vscode.Disposable | undefined;
  private treeDataProvider: TodoTreeDataProvider;

  constructor(private context: vscode.ExtensionContext) {
    this.treeDataProvider = new TodoTreeDataProvider();

    // Watch for configuration changes
    this.configWatcher = ConfigurationService.onConfigurationChanged(() => {
      this.updateFileFormatting(); // Update file formatting when configuration changes
      this.loadTodos(); // Reload todos when configuration changes
    });
  }

  getTreeDataProvider(): TodoTreeDataProvider {
    return this.treeDataProvider;
  }

  async initialize(): Promise<void> {
    // Try to find default todo file
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (workspaceFolder) {
      const config = vscode.workspace.getConfiguration("todoMd");
      const defaultFileName = config.get<string>("defaultFile", "todo.md");
      const defaultTodoPath = path.join(
        workspaceFolder.uri.fsPath,
        defaultFileName
      );
      const defaultTodoUri = vscode.Uri.file(defaultTodoPath);

      try {
        await vscode.workspace.fs.stat(defaultTodoUri);
        await this.setTodoFile(defaultTodoUri);
      } catch (error) {
        // File doesn't exist, that's OK
        console.log(`Default todo file ${defaultFileName} not found`);
      }
    }
  }

  async setTodoFile(uri: vscode.Uri): Promise<void> {
    this.currentTodoFile = uri;

    // Dispose of the previous watcher
    if (this.fileWatcher) {
      this.fileWatcher.dispose();
    }

    // Create a new file watcher
    this.fileWatcher = vscode.workspace.createFileSystemWatcher(uri.fsPath);
    this.fileWatcher.onDidChange(() => this.loadTodos());
    this.fileWatcher.onDidCreate(() => this.loadTodos());

    // Load todos
    await this.loadTodos();

    // Update context
    vscode.commands.executeCommand("setContext", "todomd:hasWorkspace", true);
  }

  async createTodoFile(): Promise<vscode.Uri> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      throw new Error("No workspace folder found");
    }

    const config = vscode.workspace.getConfiguration("todoMd");
    const defaultFileName = config.get<string>("defaultFile", "todo.md");
    const todoPath = path.join(workspaceFolder.uri.fsPath, defaultFileName);
    const todoUri = vscode.Uri.file(todoPath);

    const initialContent = `# Todo List

## To Do
- [ ] Add your first todo item

## In Progress

## Done
- [x] Created todo file
`;

    await vscode.workspace.fs.writeFile(
      todoUri,
      Buffer.from(initialContent, "utf8")
    );
    await this.setTodoFile(todoUri);

    return todoUri;
  }

  async selectTodoFile(): Promise<void> {
    const options: vscode.OpenDialogOptions = {
      canSelectMany: false,
      openLabel: "Select Todo File",
      filters: {
        "Markdown files": ["md"],
        "All files": ["*"],
      },
    };

    const fileUri = await vscode.window.showOpenDialog(options);
    if (fileUri && fileUri[0]) {
      await this.setTodoFile(fileUri[0]);
      vscode.window.showInformationMessage(
        `Todo file set to: ${path.basename(fileUri[0].fsPath)}`
      );
    }
  }

  async loadTodos(): Promise<void> {
    if (!this.currentTodoFile) {
      return;
    }

    try {
      const content = await vscode.workspace.fs.readFile(this.currentTodoFile);
      const textContent = content.toString();
      const sections = MarkdownParser.parseTodos(textContent);
      this.treeDataProvider.updateSections(sections, this.currentTodoFile);
    } catch (error) {
      console.error("Error loading todos:", error);
      vscode.window.showErrorMessage(`Error loading todo file: ${error}`);
    }
  }

  async updateFileFormatting(): Promise<void> {
    if (!this.currentTodoFile) {
      return;
    }

    try {
      const content = await vscode.workspace.fs.readFile(this.currentTodoFile);
      const textContent = content.toString();
      const updatedContent =
        MarkdownParser.updateStrikethroughFormatting(textContent);

      if (updatedContent !== textContent) {
        await vscode.workspace.fs.writeFile(
          this.currentTodoFile,
          Buffer.from(updatedContent, "utf8")
        );
      }
    } catch (error) {
      console.error("Error updating file formatting:", error);
    }
  }

  async addTodo(): Promise<void> {
    if (!this.currentTodoFile) {
      const create = await vscode.window.showInformationMessage(
        "No todo file found. Would you like to create one?",
        "Create File",
        "Select File"
      );

      if (create === "Create File") {
        await this.createTodoFile();
      } else if (create === "Select File") {
        await this.selectTodoFile();
      }

      if (!this.currentTodoFile) {
        return;
      }
    }

    const text = await vscode.window.showInputBox({
      prompt: "Enter todo item",
      placeHolder: "What do you need to do?",
    });

    if (!text) {
      return;
    }

    try {
      const content = await vscode.workspace.fs.readFile(this.currentTodoFile);
      const textContent = content.toString();
      const updatedContent = MarkdownParser.addTodoItem(textContent, text);

      await vscode.workspace.fs.writeFile(
        this.currentTodoFile,
        Buffer.from(updatedContent, "utf8")
      );
      vscode.window.showInformationMessage("Todo item added successfully");
    } catch (error) {
      console.error("Error adding todo:", error);
      vscode.window.showErrorMessage(`Error adding todo: ${error}`);
    }
  }

  async toggleTodo(item?: TodoItem): Promise<void> {
    if (!this.currentTodoFile) {
      return;
    }

    let lineNumber: number;
    if (item) {
      lineNumber = item.line;
    } else {
      // Get active editor and current line
      const editor = vscode.window.activeTextEditor;
      if (
        !editor ||
        editor.document.uri.fsPath !== this.currentTodoFile.fsPath
      ) {
        vscode.window.showErrorMessage("Please select a todo item");
        return;
      }
      lineNumber = editor.selection.active.line;
    }

    try {
      const content = await vscode.workspace.fs.readFile(this.currentTodoFile);
      const textContent = content.toString();
      const updatedContent = MarkdownParser.toggleTodoItem(
        textContent,
        lineNumber
      );

      await vscode.workspace.fs.writeFile(
        this.currentTodoFile,
        Buffer.from(updatedContent, "utf8")
      );
    } catch (error) {
      console.error("Error toggling todo:", error);
      vscode.window.showErrorMessage(`Error toggling todo: ${error}`);
    }
  }

  async deleteTodo(item?: TodoItem): Promise<void> {
    if (!this.currentTodoFile) {
      return;
    }

    let lineNumber: number;
    if (item) {
      lineNumber = item.line;
    } else {
      const editor = vscode.window.activeTextEditor;
      if (
        !editor ||
        editor.document.uri.fsPath !== this.currentTodoFile.fsPath
      ) {
        vscode.window.showErrorMessage("Please select a todo item");
        return;
      }
      lineNumber = editor.selection.active.line;
    }

    const config = ConfigurationService.getConfiguration();
    let confirmDelete = true;

    if (config.confirmDeletion) {
      const confirm = await vscode.window.showWarningMessage(
        "Are you sure you want to delete this todo item?",
        "Delete",
        "Cancel"
      );
      confirmDelete = confirm === "Delete";
    }

    if (!confirmDelete) {
      return;
    }

    try {
      const content = await vscode.workspace.fs.readFile(this.currentTodoFile);
      const textContent = content.toString();
      const updatedContent = MarkdownParser.deleteTodoItem(
        textContent,
        lineNumber
      );

      await vscode.workspace.fs.writeFile(
        this.currentTodoFile,
        Buffer.from(updatedContent, "utf8")
      );
    } catch (error) {
      console.error("Error deleting todo:", error);
      vscode.window.showErrorMessage(`Error deleting todo: ${error}`);
    }
  }

  async openTodoFile(): Promise<void> {
    if (!this.currentTodoFile) {
      const create = await vscode.window.showInformationMessage(
        "No todo file found. Would you like to create one?",
        "Create File",
        "Select File"
      );

      if (create === "Create File") {
        this.currentTodoFile = await this.createTodoFile();
      } else if (create === "Select File") {
        await this.selectTodoFile();
      }

      if (!this.currentTodoFile) {
        return;
      }
    }

    const document = await vscode.workspace.openTextDocument(
      this.currentTodoFile
    );
    await vscode.window.showTextDocument(document);
  }

  dispose(): void {
    if (this.fileWatcher) {
      this.fileWatcher.dispose();
    }
    if (this.configWatcher) {
      this.configWatcher.dispose();
    }
  }
}
