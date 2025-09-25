// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { TodoManager } from "./todoManager";
import { TodoTreeItem } from "./todoTreeDataProvider";

let todoManager: TodoManager;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "todo-md" is now active!');

  // Initialize the todo manager
  todoManager = new TodoManager(context);

  // Register tree data provider
  const treeDataProvider = todoManager.getTreeDataProvider();
  vscode.window.createTreeView("todoView", {
    treeDataProvider: treeDataProvider,
    showCollapseAll: true,
  });

  // Initialize the todo manager
  await todoManager.initialize();

  // Register commands
  const commands = [
    vscode.commands.registerCommand("todo-md.openTodoFile", () =>
      todoManager.openTodoFile()
    ),
    vscode.commands.registerCommand("todo-md.addTodo", () =>
      todoManager.addTodo()
    ),
    vscode.commands.registerCommand("todo-md.refresh", () =>
      todoManager.loadTodos()
    ),
    vscode.commands.registerCommand("todo-md.selectTodoFile", () =>
      todoManager.selectTodoFile()
    ),
    vscode.commands.registerCommand(
      "todo-md.toggleTodo",
      (item?: TodoTreeItem) => {
        if (item && item.todoItem) {
          todoManager.toggleTodo(item.todoItem);
        } else {
          todoManager.toggleTodo();
        }
      }
    ),
    vscode.commands.registerCommand(
      "todo-md.deleteTodo",
      (item?: TodoTreeItem) => {
        if (item && item.todoItem) {
          todoManager.deleteTodo(item.todoItem);
        } else {
          todoManager.deleteTodo();
        }
      }
    ),
  ];

  // Add all commands to subscriptions
  context.subscriptions.push(...commands);

  // Add todo manager to subscriptions
  context.subscriptions.push(todoManager);
}

// This method is called when your extension is deactivated
export function deactivate() {
  if (todoManager) {
    todoManager.dispose();
  }
}
