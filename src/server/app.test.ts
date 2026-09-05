import { beforeEach, describe, expect, test } from "bun:test";
import type { Hono } from "hono";
import { createApp } from "./app";
import { type TodoRepository, createTodoRepository } from "./db";

const ACCESS_TOKEN = "c2FtcGxlOnNhbXBsZQ==";
const AUTH_HEADER = { Authorization: `Basic ${ACCESS_TOKEN}` };

function jsonRequest(app: Hono, path: string, init: RequestInit = {}) {
  return app.request(path, {
    ...init,
    headers: { ...AUTH_HEADER, ...init.headers },
  });
}

describe("createApp", () => {
  let repo: TodoRepository;
  let app: Hono;

  beforeEach(() => {
    repo = createTodoRepository(":memory:");
    app = createApp(repo, ACCESS_TOKEN);
  });

  describe("GET /", () => {
    test("認証ヘッダーが無くても200を返し、フロントエンド用にACCESS_TOKENを埋め込む", async () => {
      const res = await app.request("/");
      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).toContain(`window.__ACCESS_TOKEN__ = "${ACCESS_TOKEN}";`);
    });
  });

  describe("認証", () => {
    test("Authorizationヘッダーが無いと401を返す", async () => {
      const res = await app.request("/api/todos");
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: "Unauthorized" });
    });

    test("トークンが誤っていると401を返す", async () => {
      const res = await app.request("/api/todos", {
        headers: { Authorization: "Basic wrong" },
      });
      expect(res.status).toBe(401);
    });

    test("正しいトークンなら401にならない", async () => {
      const res = await jsonRequest(app, "/api/todos");
      expect(res.status).toBe(200);
    });
  });

  describe("GET /api/todos", () => {
    test("初期状態は空配列", async () => {
      const res = await jsonRequest(app, "/api/todos");
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual([]);
    });

    test("作成済みTODOを一覧で返す", async () => {
      repo.createTodo("洗濯");
      const res = await jsonRequest(app, "/api/todos");
      const body = (await res.json()) as { title: string }[];
      expect(body).toHaveLength(1);
      expect(body[0]?.title).toBe("洗濯");
    });
  });

  describe("POST /api/todos", () => {
    test("titleを指定すると201でTODOを作成する", async () => {
      const res = await jsonRequest(app, "/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "買い物" }),
      });
      expect(res.status).toBe(201);
      const body = (await res.json()) as { title: string; done: number };
      expect(body.title).toBe("買い物");
      expect(body.done).toBe(0);
    });

    test("titleが空文字だと400を返す", async () => {
      const res = await jsonRequest(app, "/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "   " }),
      });
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: "title is required" });
    });

    test("titleが未指定だと400を返す", async () => {
      const res = await jsonRequest(app, "/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(400);
    });
  });

  describe("PATCH /api/todos/:id", () => {
    test("存在するIDのdoneを反転して200を返す", async () => {
      const created = repo.createTodo("宿題");
      const res = await jsonRequest(app, `/api/todos/${created.id}`, {
        method: "PATCH",
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { done: number };
      expect(body.done).toBe(1);
    });

    test("存在しないIDだと404を返す", async () => {
      const res = await jsonRequest(app, "/api/todos/9999", {
        method: "PATCH",
      });
      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: "not found" });
    });
  });

  describe("DELETE /api/todos/:id", () => {
    test("存在するIDを削除して204を返す", async () => {
      const created = repo.createTodo("朝活");
      const res = await jsonRequest(app, `/api/todos/${created.id}`, {
        method: "DELETE",
      });
      expect(res.status).toBe(204);
      expect(repo.listTodos()).toEqual([]);
    });

    test("存在しないIDだと404を返す", async () => {
      const res = await jsonRequest(app, "/api/todos/9999", {
        method: "DELETE",
      });
      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: "not found" });
    });
  });

  describe("結合テスト: 一連の操作フロー", () => {
    test("作成→一覧確認→完了切替→削除→一覧から消える", async () => {
      const createRes = await jsonRequest(app, "/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "フロー確認" }),
      });
      const created = (await createRes.json()) as { id: number };

      const listRes = await jsonRequest(app, "/api/todos");
      const list = (await listRes.json()) as { id: number }[];
      expect(list.some((t) => t.id === created.id)).toBe(true);

      const toggleRes = await jsonRequest(app, `/api/todos/${created.id}`, {
        method: "PATCH",
      });
      expect(await toggleRes.json()).toMatchObject({ done: 1 });

      const deleteRes = await jsonRequest(app, `/api/todos/${created.id}`, {
        method: "DELETE",
      });
      expect(deleteRes.status).toBe(204);

      const finalListRes = await jsonRequest(app, "/api/todos");
      const finalList = (await finalListRes.json()) as { id: number }[];
      expect(finalList.some((t) => t.id === created.id)).toBe(false);
    });
  });
});
