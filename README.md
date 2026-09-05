# act_sample TODO App

A minimal local TODO app built with bun + Hono + React + bun:sqlite + Bootstrap 5.

## Setup

```bash
bun install
```

`/api/*` is protected by HTTP Basic authentication. Create a `.env` file at the repository root and set `ACCESS_TOKEN` to the Base64-encoded value of `"username:password"`.

```bash
# Example: username=sample, password=sample
echo "ACCESS_TOKEN=$(printf 'sample:sample' | base64)" > .env
```

## Run

```bash
bun run dev
```

Open http://localhost:3000 to see the TODO app.

- `GET /api/todos`: list todos
- `POST /api/todos`: add a todo (`{ "title": "..." }`)
- `PATCH /api/todos/:id`: toggle done/not done
- `DELETE /api/todos/:id`: delete a todo

See [z-ai/openapi.yml](z-ai/openapi.yml) for the full API spec.

Data is stored in `data/todo.sqlite`.

## Testing

```bash
bun test         # unit, functional, and integration tests via bun:test
```

- `src/server/db.test.ts`: unit tests for the repository layer (in-memory DB)
- `src/server/app.test.ts`: functional/integration tests for the API endpoints
- `src/client/App.test.tsx`: unit/functional tests for the React component (happy-dom)

## Lint / Audit

```bash
bun run lint     # biome check
bun audit        # audit dependencies for vulnerabilities
```

## CI / act

`.github/workflows/ci.yml` checks the following:

- Automated tests via `bun test` (including type checking; `ACCESS_TOKEN` uses a dummy value for CI)
- Lint/format checks via Biome
- Cognitive complexity check via Biome's `noExcessiveCognitiveComplexity` rule
- Dependency audit via `bun audit`

`.actrc` maps the runner image used for local CI runs with `act` to `catthehacker/ubuntu:act-latest` / `full-latest` (images closer to a full Ubuntu environment).

```bash
act push
```

## Supply Chain Protection

`.npmrc`'s `minimum-release-age=10080` rejects installing package versions published less than 7 days (10080 minutes) ago.
