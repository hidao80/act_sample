# act_sample TODO App

bun + Hono + React + bun:sqlite + Bootstrap 5 によるローカルPC向けの最小構成TODOアプリです。

## セットアップ

```bash
bun install
```

`/api/*` はHTTP Basic認証で保護されています。リポジトリルートに `.env` を作成し、`"username:password"` をBase64化した値を `ACCESS_TOKEN` として設定してください。

```bash
# 例: username=sample, password=sample の場合
echo "ACCESS_TOKEN=$(printf 'sample:sample' | base64)" > .env
```

## 起動

```bash
bun run dev
```

http://localhost:3000 を開くとTODOアプリが表示されます。

- `GET /api/todos` : 一覧取得
- `POST /api/todos` : 追加 (`{ "title": "..." }`)
- `PATCH /api/todos/:id` : 完了/未完了トグル
- `DELETE /api/todos/:id` : 削除

API仕様の詳細は [z-ai/openapi.yml](z-ai/openapi.yml) を参照してください。

データは `data/todo.sqlite` に保存されます。

## テスト

```bash
bun test         # bun:test によるユニット・機能・結合テスト
```

- `src/server/db.test.ts` : リポジトリ層のユニットテスト(インメモリDB)
- `src/server/app.test.ts` : APIエンドポイントの機能・結合テスト
- `src/client/App.test.tsx` : Reactコンポーネントのユニット・機能テスト(happy-dom)

## Lint / Audit

```bash
bun run lint     # biome check
bun audit        # 依存パッケージの脆弱性監査
```

## CI / act

`.github/workflows/ci.yml` で以下をチェックします。

- `bun test`による自動テスト実行(型チェック含む、`ACCESS_TOKEN`はCI用ダミー値を使用)
- Biomeによるlint/フォーマットチェック
- Biome `noExcessiveCognitiveComplexity`ルールによる認知的複雑度チェック
- `bun audit`による依存パッケージ監査

`.actrc` により、`act` でのローカルCI実行時のrunnerイメージを `catthehacker/ubuntu:full-*` (通常のUbuntuに近いフルイメージ) にマッピングしています。

```bash
act push
```

## サプライチェーン対策

`.npmrc` の `minimum-release-age=10080` により、公開から7日(10080分)未満のパッケージバージョンのインストールを拒否します。
