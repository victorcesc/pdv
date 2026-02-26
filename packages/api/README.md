# PDV Cloud API

API ponte entre o app PDV (Tauri/React) e o ecossistema de Notas Fiscais Eletrônicas (NF-e/NFC-e), com cálculo de impostos e persistência em PostgreSQL. Inclui sincronização dos dados locais (SQLite do app) para a nuvem.

## Stack

- Node.js 20+
- TypeScript (strict)
- Express
- Zod (validação e env)
- PostgreSQL (via Prisma, em passo posterior)

## Setup

```bash
cp .env.example .env
# Ajuste .env se necessário (PORT, API_KEY, DATABASE_URL)
npm install
npm run dev
```

## Scripts

- `npm run dev` – servidor em modo watch (tsx)
- `npm run build` – compila para `dist/`
- `npm start` – roda `dist/index.js`
- `npm run typecheck` – verifica tipos sem emitir arquivos

## Endpoints (base)

- `GET /health` – health check
- `GET /notas` – (placeholder) listagem de notas
- `POST /sync`, `GET /sync` – (placeholder) sincronização SQLite ↔ Postgres

## Autenticação

Se `API_KEY` estiver definida no `.env`, as requisições devem enviar:

- Header `X-API-Key: <sua-api-key>`, ou
- Header `Authorization: Bearer <sua-api-key>`

Sem `API_KEY`, a API aceita todas as requisições (apenas para desenvolvimento).
