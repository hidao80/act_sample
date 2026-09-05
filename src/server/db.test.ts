import { beforeEach, describe, expect, test } from "bun:test";
import { type TodoRepository, createTodoRepository } from "./db";

describe("TodoRepository", () => {
  let repo: TodoRepository;

  beforeEach(() => {
    repo = createTodoRepository(":memory:");
  });

  test("listTodos は初期状態で空配列を返す", () => {
    expect(repo.listTodos()).toEqual([]);
  });

  test("createTodo は done=0 の新規TODOを作成する", () => {
    const todo = repo.createTodo("牛乳を買う");

    expect(todo.title).toBe("牛乳を買う");
    expect(todo.done).toBe(0);
    expect(typeof todo.id).toBe("number");
    expect(typeof todo.created_at).toBe("string");
  });

  test("listTodos は作成したTODOをID降順で返す", () => {
    repo.createTodo("1件目");
    repo.createTodo("2件目");
    const [first, second] = repo.listTodos();

    expect(first?.title).toBe("2件目");
    expect(second?.title).toBe("1件目");
    expect(first?.id).toBeGreaterThan(second?.id ?? 0);
  });

  test("toggleTodo は done を反転させる", () => {
    const created = repo.createTodo("掃除");

    const toggledOn = repo.toggleTodo(created.id);
    expect(toggledOn?.done).toBe(1);

    const toggledOff = repo.toggleTodo(created.id);
    expect(toggledOff?.done).toBe(0);
  });

  test("toggleTodo は存在しないIDに対して null を返す", () => {
    expect(repo.toggleTodo(9999)).toBeNull();
  });

  test("deleteTodo は削除に成功すると true を返す", () => {
    const created = repo.createTodo("洗濯");

    expect(repo.deleteTodo(created.id)).toBe(true);
    expect(repo.listTodos()).toEqual([]);
  });

  test("deleteTodo は存在しないIDに対して false を返す", () => {
    expect(repo.deleteTodo(9999)).toBe(false);
  });
});
