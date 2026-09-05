import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { App } from "./App";

interface Todo {
  id: number;
  title: string;
  done: number;
  created_at: string;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function createFetchMock(
  getTodos: () => Todo[],
  setTodos: (t: Todo[]) => void,
) {
  function handleList() {
    return jsonResponse(getTodos());
  }

  function handleCreate(init?: RequestInit) {
    const body = JSON.parse(init?.body as string) as { title: string };
    const todos = getTodos();
    const created: Todo = {
      id: todos.length + 1,
      title: body.title,
      done: 0,
      created_at: "2026-01-01 00:00:00",
    };
    setTodos([created, ...todos]);
    return jsonResponse(created, 201);
  }

  function handleToggle(id: number) {
    const todos = getTodos().map((t) =>
      t.id === id ? { ...t, done: t.done ? 0 : 1 } : t,
    );
    setTodos(todos);
    return jsonResponse(todos.find((t) => t.id === id));
  }

  function handleDelete(id: number) {
    setTodos(getTodos().filter((t) => t.id !== id));
    return new Response(null, { status: 204 });
  }

  return mock(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    const method = init?.method ?? "GET";

    if (url === "/api/todos" && method === "GET") return handleList();
    if (url === "/api/todos" && method === "POST") return handleCreate(init);

    const id = Number(url.match(/^\/api\/todos\/(\d+)$/)?.[1]);
    if (!Number.isNaN(id) && method === "PATCH") return handleToggle(id);
    if (!Number.isNaN(id) && method === "DELETE") return handleDelete(id);

    throw new Error(`unexpected fetch: ${method} ${url}`);
  });
}

const ACCESS_TOKEN = "c2FtcGxlOnNhbXBsZQ==";

describe("App", () => {
  let todos: Todo[];
  let fetchMock: ReturnType<typeof mock>;

  beforeEach(() => {
    todos = [
      { id: 1, title: "洗濯", done: 0, created_at: "2026-01-01 00:00:00" },
    ];

    fetchMock = createFetchMock(
      () => todos,
      (next) => {
        todos = next;
      },
    );

    globalThis.fetch = fetchMock as unknown as typeof fetch;
    window.__ACCESS_TOKEN__ = ACCESS_TOKEN;
  });

  afterEach(() => {
    cleanup();
  });

  test("初期表示でTODO一覧を取得して表示する", async () => {
    render(<App />);

    expect(screen.getByText("読み込み中...")).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByText("洗濯")).toBeTruthy();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/todos",
      expect.objectContaining({
        headers: { Authorization: `Basic ${ACCESS_TOKEN}` },
      }),
    );
  });

  test("入力してフォームを送信するとTODOが追加される", async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByText("洗濯")).toBeTruthy());

    const input = screen.getByPlaceholderText(
      "やることを入力...",
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "買い物" } });
    fireEvent.click(screen.getByText("追加"));

    await waitFor(() => expect(screen.getByText("買い物")).toBeTruthy());

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/todos",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: `Basic ${ACCESS_TOKEN}`,
        }),
      }),
    );
    expect(input.value).toBe("");
  });

  test("空白のみの入力では追加されない", async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByText("洗濯")).toBeTruthy());

    const input = screen.getByPlaceholderText("やることを入力...");
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.click(screen.getByText("追加"));

    const postCalls = fetchMock.mock.calls.filter(
      (call) => (call[1] as RequestInit | undefined)?.method === "POST",
    );
    expect(postCalls).toHaveLength(0);
  });

  test("チェックボックスをクリックするとPATCHが呼ばれ完了状態が反映される", async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByText("洗濯")).toBeTruthy());

    const checkbox = screen.getByRole("checkbox") as HTMLInputElement;
    fireEvent.click(checkbox);

    await waitFor(() => expect(checkbox.checked).toBe(true));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/todos/1",
      expect.objectContaining({
        method: "PATCH",
        headers: { Authorization: `Basic ${ACCESS_TOKEN}` },
      }),
    );
  });

  test("削除ボタンをクリックするとDELETEが呼ばれ一覧から消える", async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByText("洗濯")).toBeTruthy());

    fireEvent.click(screen.getByText("削除"));

    await waitFor(() => expect(screen.queryByText("洗濯")).toBeNull());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/todos/1",
      expect.objectContaining({
        method: "DELETE",
        headers: { Authorization: `Basic ${ACCESS_TOKEN}` },
      }),
    );
  });
});
