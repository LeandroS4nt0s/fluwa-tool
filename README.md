# 🔧 Fluwa Tool

A powerful developer tool for network request interception, mocking, and real-time monitoring. Perfect for testing, debugging, and development across web and mobile applications.

## Features

- 🔍 **Network Interception**: Intercept and monitor all fetch/HTTP requests in real-time
- 🎭 **Request Mocking**: Create and manage mock responses for API endpoints
- 📊 **Real-time Dashboard**: Beautiful UI to visualize requests and manage scenarios
- 🔗 **WebSocket Support**: Live updates and bi-directional communication
- 📱 **Cross-Platform**: Works with Web (React, Vue, Angular) and React Native
- 🚀 **Zero Configuration**: Minimal setup required

## Installation

### Install Packages

```bash
npm install @fluwa-tool/sdk
npm install -g @fluwa-tool/server
```

## Quick Start

### 1. Start the Server

```bash
fluwa-server
```

Dashboard: `http://localhost:5555`

### 2. Initialize in Your App

#### Web (React/Vue/Angular)

```javascript
import { initFluwaTool } from '@fluwa-tool/sdk';

await initFluwaTool({
  serverUrl: 'http://localhost:5555',
  appName: 'My App',
  debug: true
});
```

#### React Native

```javascript
await initFluwaTool({
  serverUrl: 'http://your-ip:5555', // Use your machine's IP
  appName: 'My React Native App',
  debug: true
});
```

## Configuration

```typescript
interface FluwaConfig {
  serverUrl: string;      // Server URL
  appName?: string;       // App name (displayed in dashboard)
  debug?: boolean;        // Enable debug logging
  enabled?: boolean;      // Enable/disable Fluwa
  requestTimeout?: number; // Request timeout (ms)
}
```

## Features

- **Request Monitoring**: View all HTTP requests in real-time
- **Scenario Management**: Create and switch mock responses
- **Error Testing**: Simulate error responses
- **Real-time Dashboard**: Live updates via WebSocket

## Usage

1. Start server: `fluwa-server`
2. Initialize SDK in your app
3. Open dashboard at `http://localhost:5555`
4. Make API calls - they'll appear in the dashboard
5. Create scenarios to mock responses

## Packages

- **@fluwa-tool/sdk**: Client library for your app
- **@fluwa-tool/server**: Global server and dashboard

## Troubleshooting

**Server won't start**: Check if port 5555 is in use
```bash
lsof -i :5555
```

**Can't connect**: Verify `serverUrl` and ensure server is running

**Requests not intercepted**: Make sure `initFluwaTool()` is called before API requests

## Support

- GitHub: [LeandroS4nt0s/fluwa-tool](https://github.com/LeandroS4nt0s/fluwa-tool)
- Issues: [GitHub Issues](https://github.com/LeandroS4nt0s/fluwa-tool/issues)

---

Made with ❤️ by Jose Leandro Santos Martins
