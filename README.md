# PDV Monorepo

Sistema PDV completo com aplicativo desktop (Tauri) e API cloud.

## Estrutura

```
pdv-monorepo/
├── packages/
│   ├── desktop/     # App Tauri (React + Rust)
│   ├── api/         # API Cloud (Node.js + Express + Prisma)
│   └── shared/      # Código compartilhado (tipos, utilitários)
├── package.json     # Root workspace
└── README.md
```

## Pré-requisitos

- Node.js >= 20
- npm >= 9
- Rust (para build do Tauri)
- PostgreSQL (para a API)

## Instalação

```bash
# Instalar dependências de todos os pacotes
npm install
```

## Desenvolvimento

### Rodar tudo junto
```bash
npm run dev
```

### Rodar separadamente

**API:**
```bash
npm run dev:api
# ou
cd packages/api && npm run dev
```

**Desktop:**
```bash
npm run dev:desktop
# ou
cd packages/desktop && npm run dev
```

**Desktop com Tauri:**
```bash
npm run dev:desktop:tauri
# ou
cd packages/desktop && npm run tauri:dev
```

## Build

### Build de produção
```bash
npm run build
```

### Build individual
```bash
npm run build:api
npm run build:desktop
npm run build:desktop:tauri
```

## Workspaces

Este monorepo usa npm workspaces. Os pacotes são:

- `@pdv/desktop` - Aplicativo desktop Tauri
- `@pdv/api` - API cloud
- `@pdv/shared` - Código compartilhado (futuro)

## Scripts úteis

```bash
# Limpar tudo
npm run clean

# Typecheck em todos os pacotes
npm run typecheck

# Instalar dependências em um workspace específico
npm install --workspace=@pdv/api
```

## Variáveis de Ambiente

### API (`packages/api/.env`)
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/pdv"
PORT=3000
JWT_SECRET="your-secret-key"
```

### Desktop (`packages/desktop/.env`)
```env
VITE_API_URL=http://localhost:3000
```

## Estrutura dos Pacotes

### Desktop
- React + TypeScript
- Tauri (Rust backend)
- SQLite local
- Sincronização com API cloud

### API
- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL
- Autenticação JWT
- Sincronização de dados

## Contribuindo

1. Faça suas alterações no workspace apropriado
2. Teste localmente com `npm run dev`
3. Build antes de commitar: `npm run build`

