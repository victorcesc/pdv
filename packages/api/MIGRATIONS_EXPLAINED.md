# 📚 Entendendo Migrations do Prisma

## O que são Migrations?

Migrations são **arquivos SQL versionados** que documentam cada mudança no banco de dados. É como um "controle de versão" (Git) para o seu banco de dados.

## Estrutura de Pastas

Quando você roda `npm run db:migrate`, o Prisma cria:

```
prisma/
├── schema.prisma          # Seu schema atual (a "fonte da verdade")
└── migrations/            # Histórico de todas as mudanças
    ├── 20240115100000_init/
    │   └── migration.sql   # SQL que cria todas as tabelas iniciais
    ├── 20240115120000_add_user_avatar/
    │   └── migration.sql   # SQL que adiciona coluna avatar
    └── migration_lock.toml # Lock file (garante que só um dev aplica por vez)
```

## Como Funciona o Processo

### 1️⃣ Primeira Migration (Init)

**Quando você roda pela primeira vez:**
```bash
npm run db:migrate
```

**O Prisma:**
1. Lê seu `schema.prisma`
2. Cria uma pasta `migrations/20240115100000_init/`
3. Gera um arquivo `migration.sql` com todo o SQL necessário
4. Aplica o SQL no banco de dados
5. Registra a migration como "aplicada" em uma tabela especial

**Exemplo do `migration.sql` gerado:**
```sql
-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
```

### 2️⃣ Próximas Migrations (Mudanças)

**Cenário:** Você adiciona um campo `avatar` no modelo `User`:

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String
  password  String
  avatar    String?  // ← NOVO CAMPO
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
}
```

**Quando você roda:**
```bash
npm run db:migrate
```

**O Prisma:**
1. Compara o schema atual com o banco
2. Detecta a diferença (nova coluna `avatar`)
3. Cria `migrations/20240115120000_add_user_avatar/migration.sql`
4. Gera SQL para adicionar a coluna:
   ```sql
   -- AlterTable
   ALTER TABLE "users" ADD COLUMN "avatar" TEXT;
   ```
5. Aplica no banco
6. Registra como aplicada

## Sistema de Versionamento

### Tabela `_prisma_migrations`

O Prisma cria uma tabela especial no banco para rastrear migrations:

```sql
SELECT * FROM _prisma_migrations;
```

| migration_name              | applied_steps_count | started_at          | finished_at         |
|----------------------------|---------------------|---------------------|---------------------|
| 20240115100000_init        | 1                   | 2024-01-15 10:00:00 | 2024-01-15 10:00:01 |
| 20240115120000_add_user_avatar | 1              | 2024-01-15 12:00:00 | 2024-01-15 12:00:01 |
```

### Como o Prisma Sabe o que Aplicar?

1. **Lê a tabela `_prisma_migrations`** → vê quais já foram aplicadas
2. **Lê a pasta `migrations/`** → vê todas as migrations disponíveis
3. **Compara** → aplica apenas as que faltam
4. **Atualiza a tabela** → marca como aplicada

## Vantagens do Sistema de Migrations

### ✅ 1. Histórico Completo
Você pode ver **exatamente** o que mudou e quando:

```bash
ls prisma/migrations/
# 20240115100000_init/
# 20240115120000_add_user_avatar/
# 20240115150000_add_user_phone/
```

### ✅ 2. Trabalho em Equipe
Quando um colega faz `git pull`:

```bash
# Ele pega as novas migrations
git pull

# Aplica apenas as que ele não tem
npm run db:migrate
# → Prisma detecta: "Você tem 2 migrations novas, aplicar?"
# → Aplica automaticamente
```

### ✅ 3. Rollback (Reverter)
Você pode reverter uma migration:

```bash
# Ver histórico
npx prisma migrate status

# Reverter última migration
npx prisma migrate resolve --rolled-back 20240115120000_add_user_avatar
```

### ✅ 4. Produção Segura
Em produção, você aplica migrations de forma controlada:

```bash
# Em produção (não cria novas, só aplica existentes)
npx prisma migrate deploy
```

### ✅ 5. Debugging
Se algo der errado, você pode ver exatamente qual SQL foi executado:

```bash
cat prisma/migrations/20240115120000_add_user_avatar/migration.sql
```

## Comparação: `db:push` vs `db:migrate`

### `db:push` (Sem Histórico)

```
Schema → Banco (direto)
❌ Sem arquivos de migration
❌ Sem histórico
❌ Não versionado no Git
✅ Rápido para desenvolvimento
```

### `db:migrate` (Com Histórico)

```
Schema → Migration SQL → Banco
✅ Arquivos versionados
✅ Histórico completo
✅ Versionado no Git
✅ Trabalho em equipe
✅ Rollback possível
```

## Fluxo de Trabalho com Migrations

### Desenvolvimento Local

```bash
# 1. Você muda o schema.prisma
# (adiciona um campo, por exemplo)

# 2. Gera e aplica migration
npm run db:migrate
# → Prisma pergunta: "Nome da migration?"
# → Você digita: "add_user_avatar"
# → Cria: migrations/20240115120000_add_user_avatar/

# 3. Commit no Git
git add prisma/migrations/
git commit -m "feat: add user avatar field"
```

### Em Equipe

```bash
# Colega faz pull
git pull

# Aplica migrations pendentes
npm run db:migrate
# → Prisma detecta: "2 migrations novas"
# → Aplica automaticamente
# → Banco sincronizado!
```

### Em Produção

```bash
# Deploy seguro (não cria novas migrations)
npx prisma migrate deploy
# → Aplica apenas migrations que ainda não foram aplicadas
# → Não cria novas migrations (só aplica existentes)
```

## Exemplo Prático Completo

### Passo 1: Schema Inicial
```prisma
model User {
  id    Int    @id @default(autoincrement())
  email String @unique
  name  String
}
```

### Passo 2: Primeira Migration
```bash
npm run db:migrate --name init
```

**Cria:**
```
prisma/migrations/20240115100000_init/migration.sql
```

**SQL gerado:**
```sql
CREATE TABLE "users" (...);
```

### Passo 3: Adiciona Campo
```prisma
model User {
  id     Int     @id @default(autoincrement())
  email  String  @unique
  name   String
  avatar String?  // ← NOVO
}
```

### Passo 4: Segunda Migration
```bash
npm run db:migrate --name add_user_avatar
```

**Cria:**
```
prisma/migrations/20240115120000_add_user_avatar/migration.sql
```

**SQL gerado:**
```sql
ALTER TABLE "users" ADD COLUMN "avatar" TEXT;
```

### Resultado Final

```
prisma/
├── schema.prisma
└── migrations/
    ├── 20240115100000_init/
    │   └── migration.sql        # Cria tabela users
    └── 20240115120000_add_user_avatar/
        └── migration.sql       # Adiciona coluna avatar
```

**No banco:**
- Tabela `users` com coluna `avatar`
- Tabela `_prisma_migrations` com 2 registros

## Comandos Úteis

```bash
# Ver status das migrations
npx prisma migrate status

# Aplicar migrations pendentes (sem criar novas)
npx prisma migrate deploy

# Resetar banco e aplicar todas as migrations
npx prisma migrate reset

# Ver histórico
ls prisma/migrations/
```

## Resumo

**Migrations = Histórico versionado de mudanças no banco**

- ✅ Cada mudança vira um arquivo SQL
- ✅ Versionado no Git
- ✅ Aplicável em qualquer ambiente
- ✅ Rollback possível
- ✅ Trabalho em equipe facilitado

**Use `db:migrate` quando:**
- Trabalha em equipe
- Precisa de histórico
- Vai para produção
- Quer poder reverter mudanças

