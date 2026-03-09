# 🔧 Fluwa Tool

Ferramenta poderosa para interceptação de requisições, mock de respostas e monitoramento em tempo real. Perfeita para testes, debugging e desenvolvimento em aplicações web e mobile.

## Recursos

- 🔍 **Interceptação de Requisições**: Monitore todas as requisições HTTP/Fetch em tempo real
- 🎭 **Mock de Respostas**: Crie e gerencie respostas mockadas para endpoints
- 📊 **Dashboard em Tempo Real**: Interface para visualizar requisições e gerenciar cenários
- 🔗 **Suporte WebSocket**: Atualizações em tempo real e comunicação bidirecional
- 📱 **Multi-plataforma**: Funciona em Web (React, Vue, Angular) e React Native (iOS, Android)
- 🚀 **Zero Configuração**: Setup mínimo necessário

## Instalação

### Pacotes

```bash
npm install @fluwa-tool/sdk
npm install -g @fluwa-tool/server
```

## Guia para Desenvolvedores

### 1. Integrar o SDK na aplicação

**Web (React/Vue/Angular):**
```javascript
import { initFluwaTool } from '@fluwa-tool/sdk';

await initFluwaTool({
  serverUrl: 'http://localhost:5555',
  appName: 'Minha Aplicação',
  debug: false
});
```

**React Native (iOS/Android):**
```javascript
import { initFluwaTool } from '@fluwa-tool/sdk';

const SERVER_IP = '192.168.1.100'; // IP da máquina do dev

await initFluwaTool({
  serverUrl: `http://${SERVER_IP}:5555`,
  appName: 'Minha App',
  debug: false
});
```

### 2. Configuração

```typescript
interface FluwaConfig {
  serverUrl: string;      // URL do servidor
  appName?: string;       // Nome da app (exibido no dashboard)
  debug?: boolean;        // Ativar debug logging
  enabled?: boolean;      // Ativar/desativar Fluwa
  requestTimeout?: number; // Timeout de requisição (ms)
}
```

---

## Guia para QA (Testes em Dispositivos Móveis)

### Como funciona

O QA pode instalar o app no celular (iOS ou Android) e monitorar **todas as requisições de API** através de um dashboard compartilhado. Não precisa de emulador, computador ou conhecimento técnico.

### Pré-requisitos

1. **Servidor Fluwa rodando** em uma máquina acessível (Mac, Windows ou Linux)
2. **Conexão de rede**: Celular e servidor na mesma rede WiFi OU acessíveis via IP

### Passo a Passo para Testar

#### 1️⃣ Desenvolvedora inicia o servidor

```bash
fluwa-server
```

Obtém o IP da máquina:
```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig
```

Exemplo de saída: `192.168.1.100`

#### 2️⃣ Desenvolvedor configura o IP no app

Antes de disponibilizar o app para QA, o desenvolvedor coloca o IP no código:

```javascript
const SERVER_IP = '192.168.1.100'; // IP obtido acima

await initFluwaTool({
  serverUrl: `http://${SERVER_IP}:5555`,
  appName: 'Minha App - QA Testing',
  debug: false
});
```

#### 3️⃣ QA instala o app no celular

O QA recebe o app (via TestFlight, Google Play, APK, etc) e instala no celular.

#### 4️⃣ QA abre o dashboard e começa a testar

1. QA abre o navegador: `http://192.168.1.100:5555`
2. Vê a app conectada no dashboard
3. **Executa as ações de teste no celular**
4. **Monitora as requisições em tempo real**

### O que o QA pode fazer no Dashboard

#### 📊 **Visualizar Requisições**
- Todas as requisições de API aparecem em tempo real
- Vê: método (GET, POST, etc), URL, status, headers, body
- Verifica tempos de resposta

#### 🎭 **Criar Cenários de Teste**
Clica em "Novo Cenário" e pode:

**Testar erros:**
- Simula erro 500 (Internal Server Error)
- Simula erro 404 (Not Found)
- Simula erro 401 (Unauthorized)
- Qualquer status HTTP

**Testar situações especiais:**
- Respostas vazias
- Respostas muito lentas
- Respostas com dados anormais
- Timeout de conexão

#### 🔀 **Alternar Cenários**
- Cria múltiplos cenários para diferentes casos
- Muda cenário durante o teste
- App responde imediatamente ao novo cenário

### Exemplos de Testes

**Exemplo 1: Teste de Erro 500**
1. Abre o app no celular
2. Clica em "Login"
3. No dashboard, cria cenário: `/api/login` retorna erro 500
4. Ativa o cenário
5. Celular mostra mensagem de erro
6. Valida que o app tratou o erro corretamente

**Exemplo 2: Teste de Timeout**
1. Cria cenário: `/api/dados` demora 10 segundos
2. Ativa o cenário
3. Clica em "Carregar Dados" no app
4. Monitora se a requisição fica pendente
5. Verifica se o app mostra timeout ou loading

**Exemplo 3: Teste de Dados Específicos**
1. Cria cenário: `/api/profile` retorna dados específicos de teste
2. Ativa o cenário
3. Abre perfil no app
4. Valida que os dados corretos foram exibidos

### Arquitetura de Rede

```
┌────────────────────────────────────┐
│  WiFi da Empresa (192.168.1.0/24)  │
│                                    │
│  Computador Dev          Celulares │
│  192.168.1.100     iPhone, Android │
│  :5555 ←────────────→ App Fluwa    │
│  Dashboard                         │
└────────────────────────────────────┘
```

**Como acessar o Dashboard:**
- QA abre navegador
- Digita: `http://192.168.1.100:5555`
- Vê todas as apps conectadas e suas requisições

### Dicas para QA

✅ **Boas Práticas**
- Anote os IPs que você costuma usar
- Teste com conexão WiFi estável
- Crie cenários reutilizáveis
- Documenta cenários especiais para reuso

❌ **Problemas Comuns**
- App não conecta: Verifica se IP está correto
- Dashboard vazio: Abre DevTools e monitora requisições
- Cenário não aplica: Ativa o cenário no dashboard

### Suporte

- GitHub: [LeandroS4nt0s/fluwa-tool](https://github.com/LeandroS4nt0s/fluwa-tool)
- Issues: [GitHub Issues](https://github.com/LeandroS4nt0s/fluwa-tool/issues)

---

Feito com ❤️ por Jose Leandro Santos Martins
