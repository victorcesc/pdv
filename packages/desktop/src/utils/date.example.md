# Exemplos de Uso - Utilitários de Data

## Importar as funções

```typescript
import { formatDateTimeBR, formatDateOnlyBR, formatRelativeDateBR } from "../utils/date";
```

## Exemplos de Uso

### 1. Formatar data completa (data + hora)
```typescript
// Timestamp do banco (UTC): "2026-02-27T00:14:29.976Z"
const formatted = formatDateTimeBR("2026-02-27T00:14:29.976Z");
// Resultado: "26/02/2026 21:14:29" (convertido para horário de Brasília)
```

### 2. Formatar apenas data (sem hora)
```typescript
const formatted = formatDateOnlyBR("2026-02-27T00:14:29.976Z");
// Resultado: "26/02/2026"
```

### 3. Formatar data relativa
```typescript
const formatted = formatRelativeDateBR("2026-02-27T00:14:29.976Z");
// Resultado: "há 2 horas" ou "ontem" ou "26/02/2026" (dependendo do tempo)
```

### 4. Em componentes React
```tsx
function MyComponent({ createdAt }: { createdAt: string }) {
  return (
    <div>
      <p>Criado em: {formatDateTimeBR(createdAt)}</p>
      <p>Ou: {formatRelativeDateBR(createdAt)}</p>
    </div>
  );
}
```

### 5. Com valores null/undefined
```typescript
const date = null;
formatDateTimeBR(date); // Retorna: ""
formatDateOnlyBR(undefined); // Retorna: ""
```

## Notas Importantes

- As funções automaticamente convertem UTC para o fuso horário do Brasil (America/Sao_Paulo)
- O formato sempre será brasileiro (DD/MM/YYYY)
- Valores null/undefined retornam string vazia
- As funções são seguras e não lançam erros

