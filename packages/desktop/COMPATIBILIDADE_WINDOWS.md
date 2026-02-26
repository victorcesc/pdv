# Compatibilidade Windows - PDV Tauri

## ⚠️ Limitação Técnica Importante

### Tauri e Windows XP/7 - **NÃO COMPATÍVEIS**

Infelizmente, **Tauri não é compatível com Windows XP ou Windows 7**. Isso ocorre porque:

1. **Tauri usa WebView2 no Windows**: O Tauri 1.5 requer Microsoft Edge WebView2 Runtime
2. **WebView2 requer Windows 10+**: A Microsoft suporta oficialmente apenas Windows 10 (versão 1709+) e Windows 11
3. **Rust moderno não suporta Windows XP**: O compilador Rust não gera binários compatíveis com XP
4. **Dependências modernas**: Bibliotecas como `rusqlite` e `chrono` usam APIs do Windows que não existem no XP/7

### Requisitos Mínimos Oficiais do Tauri no Windows

- **Windows 10** (versão 1709 ou superior) - **MÍNIMO OFICIAL**
- **Windows 11** - Ideal
- **Windows Server 2016+** - Para ambientes servidor

**⚠️ IMPORTANTE**: Windows 7 não tem suporte oficial do WebView2. Embora teoricamente possível instalar WebView2 manualmente, não há garantia de funcionamento e não é recomendado para produção.

## 📊 Situação Real no Brasil

Entendemos que muitas padarias e cafeterias ainda usam computadores antigos. Aqui estão as opções:

### Opção 1: Atualizar para Windows 10 (Recomendado e Obrigatório)

**Windows 10 32-bit** é a melhor opção para hardware antigo porque:
- **Suporte oficial do WebView2** (garantia de funcionamento)
- WebView2 vem pré-instalado (sem necessidade de instalação manual)
- Funciona bem em hardware antigo (2-4GB RAM, processadores dual-core)
- Ainda recebe atualizações de segurança
- Upgrade gratuito de Windows 7/8 ainda é possível em muitos casos
- Melhor custo-benefício que manter Windows 7/XP

**Windows 10 64-bit** para hardware mais moderno:
- Melhor performance
- Suporte a mais de 4GB RAM
- Recomendado para máquinas com 4GB+ RAM

### Opção 2: Compilar para 32-bit (x86)

Para maximizar compatibilidade com hardware antigo, você pode compilar para 32-bit:

```bash
# Adicionar target 32-bit
rustup target add i686-pc-windows-msvc

# Compilar para 32-bit
npm run tauri build -- --target i686-pc-windows-msvc
```

**Nota**: Isso requer Windows 10 32-bit com WebView2 (que já vem pré-instalado).

### Opção 3: Alternativas Tecnológicas (Se Windows XP/7 for obrigatório)

Se você **realmente** precisa suportar Windows XP/7, considere mudar a stack tecnológica:

1. **Electron** (versões antigas suportam Windows 7, mas não recomendado)
2. **Qt + C++** (mais complexo, mas suporta Windows 7)
3. **WinForms/WPF** (nativo Windows, funciona no Windows 7)
4. **Aplicação Web** (funciona em qualquer navegador, mas requer servidor)

**⚠️ AVISO**: Mudar a stack tecnológica significa reescrever todo o projeto. É mais prático atualizar o sistema operacional para Windows 10.

## 🔧 Configuração para Máxima Compatibilidade

### 1. Configurar Build 32-bit

Crie/edite `.cargo/config.toml` na raiz do projeto:

```toml
[build]
target = "i686-pc-windows-msvc"  # Para Windows 32-bit
```

### 2. Ajustar tauri.conf.json

Adicione configurações de compatibilidade:

```json
{
  "tauri": {
    "bundle": {
      "targets": ["msi", "nsis"],  // Instaladores Windows
      "windows": {
        "certificateThumbprint": null,
        "digestAlgorithm": "sha256",
        "timestampUrl": ""
      }
    }
  }
}
```

### 3. Otimizar para Baixo Desempenho

No `tauri.conf.json`, ajuste as janelas:

```json
{
  "windows": [
    {
      "width": 1024,      // Reduzir de 1200
      "height": 768,      // Reduzir de 800
      "minWidth": 640,    // Reduzir de 800
      "minHeight": 480,   // Reduzir de 600
      "resizable": true,
      "fullscreen": false
    }
  ]
}
```

## 📋 Checklist de Teste no Windows

### Pré-requisitos para Teste

1. **Verificar WebView2 Runtime** (geralmente já vem instalado no Windows 10+):
   - No Windows 10, o WebView2 geralmente já está instalado
   - Se necessário, download: https://developer.microsoft.com/microsoft-edge/webview2/
   - Versão estável mais recente

2. **Verificar Sistema**:
   ```powershell
   # Verificar versão do Windows
   systeminfo | findstr /B /C:"OS Name" /C:"OS Version"
   
   # Verificar se WebView2 está instalado
   reg query "HKEY_LOCAL_MACHINE\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A37A06E5}"
   ```

3. **Testar Build**:
   ```bash
   # Build para Windows
   npm run tauri build
   
   # O executável estará em:
   # src-tauri/target/release/pdv-tauri.exe (64-bit)
   # ou
   # src-tauri/target/i686-pc-windows-msvc/release/pdv-tauri.exe (32-bit)
   ```

## 🎯 Recomendações Práticas

### Para Padarias/Cafeterias com Hardware Antigo

1. **Mínimo Oficial**: Windows 10 32-bit (versão 1709 ou superior)
   - Hardware: 2GB RAM mínimo, processador dual-core
   - WebView2 já vem pré-instalado
   - Suporte oficial garantido

2. **Ideal**: Windows 10 64-bit
   - Hardware: 4GB RAM mínimo, processador dual-core ou superior
   - Melhor performance
   - WebView2 pré-instalado

3. **Distribuição**:
   - Criar instalador MSI/NSIS
   - Incluir verificação de versão do Windows (deve ser 10+)
   - Verificar WebView2 (geralmente já está instalado)
   - Instalar WebView2 automaticamente se faltar (raro no Windows 10+)

### Estratégia de Migração

Se você encontrar estabelecimentos com Windows XP/7:

1. **Avaliar hardware**: Verificar se suporta Windows 10
   - Mínimo: 2GB RAM, processador de 1GHz, 20GB espaço em disco
   - Windows 10 roda bem em hardware que rodava Windows 7

2. **Propor atualização para Windows 10**:
   - Upgrade pode ser gratuito em muitos casos
   - Windows 10 32-bit funciona em hardware antigo
   - Melhor segurança e suporte

3. **Custo-benefício**: 
   - Atualizar SO é mais barato que trocar aplicação
   - Windows 10 ainda recebe atualizações de segurança
   - Suporte oficial do WebView2

4. **Alternativa temporária**: Versão web simples enquanto migram (se necessário)

## 📝 Próximos Passos

1. **Testar no Windows 10** primeiro (mais fácil)
2. **Compilar versão 32-bit** para compatibilidade
3. **Criar instalador** com verificação de requisitos
4. **Documentar requisitos mínimos** para clientes
5. **Considerar fallback** para versão web se necessário

## 🔗 Links Úteis

- [Tauri Windows Requirements](https://tauri.app/v1/guides/getting-started/prerequisites#windows)
- [WebView2 Runtime Download](https://developer.microsoft.com/microsoft-edge/webview2/)
- [Rust Windows Targets](https://doc.rust-lang.org/nightly/rustc/platform-support.html)

## ⚡ Resumo Executivo

| Sistema | Compatível? | Observações |
|---------|-------------|-------------|
| Windows XP | ❌ **NÃO** | Limitação técnica do Tauri/WebView2 |
| Windows Vista | ❌ **NÃO** | Mesma limitação |
| Windows 7 | ❌ **NÃO** | Sem suporte oficial do WebView2 |
| Windows 8/8.1 | ⚠️ **Não oficial** | WebView2 pode funcionar, mas sem garantia |
| Windows 10 (1709+) | ✅ **SIM** | **MÍNIMO OFICIAL** - Recomendado |
| Windows 11 | ✅ **SIM** | Ideal |

**Conclusão**: 
- **Windows 10 é o mínimo oficial** para garantir funcionamento do PDV Tauri
- Windows 10 32-bit funciona bem em hardware antigo (2GB RAM)
- Para suportar Windows XP/7, seria necessário mudar completamente a stack tecnológica (Electron antigo, Qt, ou WinForms), o que não é recomendado

