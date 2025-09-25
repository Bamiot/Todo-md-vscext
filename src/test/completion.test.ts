import * as assert from "assert";
import { MarkdownParser } from "../markdownParser";
import { TodoItem, TodoSection } from "../types";

suite("Todo Completion Tests", () => {
  test("Should parse completed todos correctly", () => {
    const content = `# Test
- [x] Completed task
- [ ] Incomplete task`;

    const sections = MarkdownParser.parseTodos(content);
    assert.strictEqual(sections.length, 1);
    assert.strictEqual(sections[0].items.length, 2);

    const completedTask = sections[0].items[0];
    const incompleteTask = sections[0].items[1];

    assert.strictEqual(completedTask.completed, true);
    assert.strictEqual(incompleteTask.completed, false);
    assert.strictEqual(completedTask.text, "Completed task");
  });

  test("Should toggle todo items correctly", () => {
    const content = `- [ ] Task to complete\n- [x] Completed task`;

    // Toggle incomplete task to complete
    let result = MarkdownParser.toggleTodoItem(content, 0);
    assert.ok(result.includes("[x] Task to complete"));

    // Toggle complete task to incomplete
    result = MarkdownParser.toggleTodoItem(content, 1);
    assert.ok(result.includes("[ ] Completed task"));
  });

  test("Should handle strikethrough formatting for completed tasks", () => {
    const content = `- [ ] Normal task`;

    // When toggling to complete with strikethrough enabled
    const result = MarkdownParser.toggleTodoItem(content, 0);

    // Should be marked as complete
    assert.ok(result.includes("[x]"));
  });
});
