# 🔧 Fluwa-Tool - Network Interception & Mocking DevTools

Complete DevTools para interceptar requisições HTTP, criar mocks e testar diferentes cenários em qualquer aplicação (web, mobile, Node.js).

## ✨ Features

- ✅ **Interceptação em tempo real** - Captura todas as requisições fetch/axios
- ✅ **Criar mocks via UI** - Sem código, totalmente visual
- ✅ **Cenários reutilizáveis** - Salve e compartilhe configurações de teste
- ✅ **Network Inspector** - Veja todas as requisições capturadas em tempo real
- ✅ **Dashboard moderno** - Interface web intuitiva (React + TypeScript)
- ✅ **WebSocket em tempo real** - Atualizações instantâneas no dashboard

## 🚀 Quick Start

### 1. Instalar Server (primeira vez)
```bash
npm install -g @fluwa-tool/server
fluwa-tool-server start
# ✅ Server roda em http://localhost:5555
```

### 2. Integrar SDK no seu app
```bash
npm install @fluwa-tool/sdk
```

```javascript
// src/App.js (React) ou main.js (Node.js)
import { initFluwaTool } from '@fluwa-tool/sdk';

// Inicializar uma vez
initFluwaTool({
  serverUrl: 'http://localhost:5555',
  appName: 'MyApp'
});

// Pronto! Todas as requisições são interceptadas automaticamente
```

### 3. Usar o Dashboard
Abra **http://localhost:5555** e comece! 🎉

```
┌─────────────────────────────────────┐
│ 📡 Fluwa Dashboard                  │
│ http://localhost:5555               │
├─────────────────────────────────────┤
│ Network Tab  │ Scenarios Tab         │
│              │                       │
│ GET /api/... │ ✅ Active Scenario   │
│ POST /users  │ - Mock Response       │
│ ...          │ - Edit JSON           │
│              │ - Save & Share        │
└─────────────────────────────────────┘
```

## 📖 Como Usar

### Básico - Mockar uma Requisição

1. **Abrir Dashboard** → http://localhost:5555
2. **Fazer requisição** no seu app
3. **Network Tab** → Ver a requisição capturada
4. **Clique em "Mock This"** → Aparece o JSON
5. **Editar resposta** → Mude os dados
6. **Ativar** → Próximas requisições usam o mock
7. **Testar** → Sua app usa dados mockados!

### Avançado - Compartilhar Cenários

```bash
# Exportar um cenário
curl http://localhost:5555/api/scenarios/123/export > my-scenario.json

# Colocar no git
git add my-scenario.json
git commit -m "Add error scenario for testing"

# Colega importa
curl -X POST http://localhost:5555/api/scenarios/import -d @my-scenario.json
```

## 🏗️ Arquitetura

```
fluwa-tool/
├── sdk/           # TypeScript SDK para integração
│   └── src/
│       ├── features/network/   (Interceptadores)
│       ├── features/communication/  (WebSocket + HTTP)
│       └── core/               (Logger, Config, etc)
│
├── server/        # Node.js + Express backend
│   └── src/
│       ├── features/requests/  (Captura requisições)
│       ├── features/scenarios/  (Gerencia mocks)
│       ├── features/websocket/  (Atualizações em tempo real)
│       └── core/               (DI Container, Logger, etc)
│
└── ui/            # React + Tailwind frontend
    └── src/
        ├── features/network/   (Network Inspector)
        └── features/scenarios/ (Scenarios Manager)
```

## 📦 Stack Tecnológico

| Camada | Tecnologia |
|--------|-----------|
| **SDK** | TypeScript + Vanilla JS |
| **Server** | Node.js 16+ + Express + WebSocket |
| **UI** | React 18 + TypeScript + Tailwind CSS + Vite |
| **Storage** | In-memory (extensível para DB) |

## 🎯 Casos de Uso

- 🧪 **Testes** - Mockar diferentes respostas da API em testes
- 🐛 **Debug** - Inspecionar requisições em tempo real
- 📱 **Mobile** - Testar cenários em apps mobile (iOS, Android, React Native)
- 🌐 **Web** - Interceptar requisições em aplicações web
- 🔄 **CI/CD** - Reutilizar cenários em pipelines de teste

## 📦 Pacotes npm

| Pacote | Descrição | Como Instalar |
|--------|-----------|---|
| `@fluwa-tool/sdk` | SDK para seus apps | `npm install @fluwa-tool/sdk` |
| `@fluwa-tool/server` | Server com UI | `npm install -g @fluwa-tool/server` |

## 🔧 Requisitos

- **Node.js**: 16 ou superior
- **npm** ou **yarn**
- Qualquer navegador moderno (Chrome, Firefox, Safari)

## 🤔 FAQ

**P: O Fluwa funciona em produção?**
- R: Não. Use apenas em desenvolvimento. Disable com `enabled: process.env.NODE_ENV === 'development'`

**P: Qual é a performance impact?**
- R: Mínimo. Interceptadores são eficientes. Em desenvolvimento não importa muito.

**P: Funciona com bibliotecas customizadas de HTTP?**
- R: Só com `fetch` e `axios`. Bibliotecas customizadas precisam usar um desses sob o capô.

**P: Posso usar em produção?**
- R: Não recomendado. Sempre deixe desabilitado em produção.

## 📝 Licença

MIT

## 🤝 Contribuindo

Issues e PRs são bem-vindos!

---

**Pronto para começar?** Siga o [Quick Start](#-quick-start) acima! 🚀
