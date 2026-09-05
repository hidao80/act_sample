import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import type { TodoRepository } from "./db";

export function createApp(repo: TodoRepository, accessToken: string): Hono {
  const app = new Hono();

  app.use(
    "/static/*",
    serveStatic({
      root: "./public",
      rewriteRequestPath: (p) => p.replace(/^\/static/, ""),
    }),
  );

  app.use("/api/*", async (c, next) => {
    const auth = c.req.header("Authorization");
    if (auth !== `Basic ${accessToken}`) {
      c.header("WWW-Authenticate", 'Basic realm="TODO App"');
      return c.json({ error: "Unauthorized" }, 401);
    }
    await next();
  });

  app.get("/", (c) => {
    return c.html(`<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TODO App</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;700&display=swap"
      rel="stylesheet"
    />
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
    />
    <style>
      body {
        font-family: "Noto Sans", sans-serif;
      }
    </style>
  </head>
  <body>
    <main class="container py-4" id="root"></main>
    <script>window.__ACCESS_TOKEN__ = ${JSON.stringify(accessToken)};</script>
    <script type="module" src="/static/main.js"></script>
  </body>
</html>`);
  });

  app.get("/api/todos", (c) => {
    return c.json(repo.listTodos());
  });

  app.post("/api/todos", async (c) => {
    const body = await c.req.json<{ title?: string }>();
    const title = body.title?.trim();
    if (!title) {
      return c.json({ error: "title is required" }, 400);
    }
    return c.json(repo.createTodo(title), 201);
  });

  app.patch("/api/todos/:id", (c) => {
    const id = Number(c.req.param("id"));
    const todo = repo.toggleTodo(id);
    if (!todo) {
      return c.json({ error: "not found" }, 404);
    }
    return c.json(todo);
  });

  app.delete("/api/todos/:id", (c) => {
    const id = Number(c.req.param("id"));
    const ok = repo.deleteTodo(id);
    if (!ok) {
      return c.json({ error: "not found" }, 404);
    }
    return c.body(null, 204);
  });

  return app;
}
