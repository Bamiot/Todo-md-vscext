import * as vscode from "vscode";
import { TodoConfiguration } from "./types";

export class ConfigurationService {
  static getConfiguration(): TodoConfiguration {
    const config = vscode.workspace.getConfiguration("todoMd");

    return {
      defaultFile: config.get<string>("defaultFile", "todo.md"),
      filePatterns: config.get<string[]>("filePatterns", [
        "**/todo.md",
        "**/TODO.md",
        "**/*.todo.md",
      ]),
      strikeCompletedTasks: config.get<boolean>("strikeCompletedTasks", true),
      confirmDeletion: config.get<boolean>("confirmDeletion", true),
    };
  }

  static onConfigurationChanged(callback: () => void): vscode.Disposable {
    return vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("todoMd")) {
        callback();
      }
    });
  }
}
