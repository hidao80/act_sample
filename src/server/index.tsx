import { createApp } from "./app";
import { createTodoRepository } from "./db";

const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
  throw new Error("ACCESS_TOKEN must be set in .env");
}

const repo = createTodoRepository("data/todo.sqlite");
const app = createApp(repo, ACCESS_TOKEN);

export default {
  port: 3000,
  fetch: app.fetch,
};
