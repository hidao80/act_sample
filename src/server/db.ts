import { Database } from "bun:sqlite";

export interface Todo {
  id: number;
  title: string;
  done: number;
  created_at: string;
}

export interface TodoRepository {
  listTodos(): Todo[];
  createTodo(title: string): Todo;
  toggleTodo(id: number): Todo | null;
  deleteTodo(id: number): boolean;
  close(): void;
}

export function createTodoRepository(path: string): TodoRepository {
  const db = new Database(path, { create: true });
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec(`
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      done INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  return {
    listTodos(): Todo[] {
      return db.query("SELECT * FROM todos ORDER BY id DESC").all() as Todo[];
    },

    createTodo(title: string): Todo {
      return db
        .query("INSERT INTO todos (title) VALUES (?) RETURNING *")
        .get(title) as Todo;
    },

    toggleTodo(id: number): Todo | null {
      return db
        .query("UPDATE todos SET done = NOT done WHERE id = ? RETURNING *")
        .get(id) as Todo | null;
    },

    deleteTodo(id: number): boolean {
      const result = db.query("DELETE FROM todos WHERE id = ?").run(id);
      return result.changes > 0;
    },

    close(): void {
      db.close();
    },
  };
}
