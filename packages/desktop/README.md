# PDV - Sistema de Vendas

Sistema de PDV (Ponto de Venda) desktop desenvolvido com Tauri (Rust + React).

## Estrutura do Projeto

- **Frontend**: React + TypeScript + Vite
- **Backend**: Rust + Tauri
- **Banco de Dados**: SQLite (local)

## Funcionalidades

- ✅ Gestão de Produtos
- ✅ Gestão de Clientes
- ✅ Sistema de Vendas
- ✅ Vendas Fiado (anotações sem nota fiscal)
- ✅ Gestão de Pagamentos
- ✅ Notas Fiscais
- ✅ Sincronização (preparação para API cloud)
- ✅ Impressora Térmica (formatação de cupons)

## Instalação

### Pré-requisitos

**Para Desenvolvimento:**
- Rust (última versão estável)
- Node.js 18+
- npm ou yarn

**Para Execução (Windows):**
- **Windows 10** (versão 1709 ou superior) - **MÍNIMO OFICIAL**
- Windows 11 (ideal)
- Microsoft Edge WebView2 Runtime (geralmente já vem instalado no Windows 10+)

> ⚠️ **Importante**: Windows XP e Windows 7 não são compatíveis. Veja [COMPATIBILIDADE_WINDOWS.md](./COMPATIBILIDADE_WINDOWS.md) para mais detalhes.

### Setup

1. Instalar dependências do frontend:
```bash
npm install
```

2. O Rust e suas dependências serão compiladas automaticamente ao executar o projeto.

## Executar em Desenvolvimento

```bash
npm run tauri dev
```

## Build para Produção

### Build padrão (64-bit)
```bash
npm run tauri build
```

### Build para Windows 32-bit (hardware antigo)
```bash
# Adicionar target 32-bit
rustup target add i686-pc-windows-msvc

# Compilar para 32-bit
npm run tauri build -- --target i686-pc-windows-msvc
```

> **Nota**: A versão 32-bit é recomendada para hardware antigo, mas ainda requer Windows 10 32-bit.

## Estrutura de Diretórios

```
pdv_teste/
├── src/                    # Frontend React
│   ├── components/         # Componentes React
│   ├── pages/              # Páginas da aplicação
│   ├── services/           # Serviços de API
│   └── main.tsx            # Entry point
├── src-tauri/              # Backend Rust/Tauri
│   ├── src/
│   │   ├── commands/       # Tauri commands
│   │   ├── models/         # Modelos de dados
│   │   ├── repositories/   # Acesso a dados
│   │   ├── services/       # Lógica de negócio
│   │   ├── database/       # SQLite e migrations
│   │   ├── printer/        # Impressora térmica
│   │   └── sync/           # Sincronização
│   └── Cargo.toml
└── package.json
```

## Banco de Dados

O banco de dados SQLite é criado automaticamente na primeira execução em `data/pdv.db`.

### Schema Principal

- `customers` - Clientes
- `products` - Produtos
- `sales` - Vendas
- `sale_items` - Itens de venda
- `payments` - Pagamentos (vendas fiado)
- `invoices` - Notas fiscais
- `invoice_items` - Itens de nota fiscal
- `sync_logs` - Logs de sincronização

## Regras de Negócio

- Vendas fiado não geram nota fiscal
- Vendas fiado não são sincronizadas para o serviço de NF
- Pagamentos parciais são permitidos para vendas fiado
- Estoque simplificado (apenas verificação de existência do produto)

## Próximos Passos

- Integração com API cloud (Node.js/NestJS)
- Autenticação e segurança
- Sincronização bidirecional
- Integração real com impressora térmica

