import { useEffect, useState } from "react";
import { authHeaders } from "./api";

interface Todo {
  id: number;
  title: string;
  done: number;
  created_at: string;
}

export function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadTodos();
  }, []);

  async function loadTodos() {
    setLoading(true);
    const res = await fetch("/api/todos", { headers: authHeaders() });
    const data = (await res.json()) as Todo[];
    setTodos(data);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ title: trimmed }),
    });
    setTitle("");
    await loadTodos();
  }

  async function handleToggle(id: number) {
    await fetch(`/api/todos/${id}`, {
      method: "PATCH",
      headers: authHeaders(),
    });
    await loadTodos();
  }

  async function handleDelete(id: number) {
    await fetch(`/api/todos/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    await loadTodos();
  }

  return (
    <>
      <h1 className="mb-4 fw-bold">TODO App</h1>

      <form onSubmit={handleSubmit} className="mb-4">
        <div className="input-group flex-nowrap">
          <input
            type="text"
            className="form-control"
            placeholder="やることを入力..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <button type="submit" className="btn btn-primary flex-shrink-0">
            追加
          </button>
        </div>
      </form>

      {loading ? (
        <p className="text-muted d-flex align-items-center gap-2">
          <span
            className="spinner-border spinner-border-sm"
            aria-hidden="true"
          />
          読み込み中...
        </p>
      ) : (
        <ul className="list-group">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className="list-group-item d-flex align-items-center justify-content-between flex-nowrap gap-2"
            >
              <div className="form-check d-flex align-items-center gap-2 flex-grow-1 text-truncate mb-0">
                <input
                  className="form-check-input mt-0 flex-shrink-0"
                  type="checkbox"
                  id={`todo-${todo.id}`}
                  checked={todo.done === 1}
                  onChange={() => handleToggle(todo.id)}
                />
                <label
                  className={`form-check-label text-truncate${
                    todo.done ? " text-decoration-line-through text-muted" : ""
                  }`}
                  htmlFor={`todo-${todo.id}`}
                >
                  {todo.title}
                </label>
              </div>
              <button
                type="button"
                className="btn btn-outline-danger btn-sm flex-shrink-0"
                onClick={() => handleDelete(todo.id)}
              >
                削除
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
