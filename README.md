# 🚀 Load Test Platform — Dashboard Angular v19

Dashboard para criação, execução e monitoramento de testes de carga/stress.

---

## Requisitos

- Node.js >= 18
- npm >= 9
- API REST rodando em `http://localhost:8080` (configurável)

---

## Como rodar

```bash
cd stress-dashboard
npm install
npm start
```

Acesse: http://localhost:4200

---

## Como configurar a base URL da API

Edite o arquivo `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8080',   // altere aqui
  pollIntervalMs: 2000                    // intervalo de polling (ms)
};
```

---

## Rotas

| Rota              | Descrição                          |
|-------------------|------------------------------------|
| `/`               | Redireciona para `/tests`          |
| `/tests`          | Lista de todas as execuções        |
| `/test-wizard`    | Wizard de criação de novo teste    |
| `/tests/:testId`  | Dashboard de detalhes da execução  |

---

## Telas

### 1. Lista de Execuções (`/tests`)
Tabela com todas as execuções registradas no backend. Colunas: Nome, Status (badge colorido), Criado em, Iniciado em, Encerrado em, Ações (abrir, iniciar/parar contextual).

### 2. Wizard de Criação (`/test-wizard`)
Formulário de 4 etapas:
- **Step 1**: Nome, descrição, seleção visual do tipo (HTTP ativo; Kafka e MQ disponíveis apenas na UI)
- **Step 2**: Configuração específica por tipo — HTTP: URL + método + headers dinâmicos + body; Kafka: tópico + bootstrap + template; MQ: fila + exchange + routing key + template
- **Step 3**: VUs, duração, ramp-up, ramp-down, think time, thresholds/SLAs dinâmicos
- **Step 4**: Revisão completa com badges coloridos → "Criar Teste" → POST + redirect

### 3. Detalhes da Execução (`/tests/:testId`)
- Header contextual: nome, status badge, endpoint, VUs, duração, ramp-up
- 8 KPI cards: Total Requests, Taxa de Erros (%), RPS Atual, Workers Ativos, Latência Média, p95, Backlog, Status
- 3 gráficos de série temporal (Chart.js): Throughput (req/s), Erros/s, Latência Média (ms)
- Controles: Start / Stop / Refresh manual
- Indicador visual de polling automático (atualiza a cada 2s enquanto RUNNING)

---

## Exemplos de chamadas da API

### Criar teste
```bash
curl -X POST http://localhost:8080/stress/tests \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste API Health",
    "target": { "url": "https://example.com/health", "method": "GET", "headers": {}, "body": "" },
    "load": { "virtualUsers": 10, "durationSeconds": 60, "rampUpSeconds": 10, "thinkTimeMillis": 0 }
  }'
```

### Iniciar
```bash
curl -X POST http://localhost:8080/stress/tests/{testId}/start
```

### Parar
```bash
curl -X POST http://localhost:8080/stress/tests/{testId}/stop
```

### KPIs
```bash
curl http://localhost:8080/stress/tests/{testId}/summary
```

---

## Stack

- **Angular v19** — 100% Standalone Components
- **Angular Material** — UI components (toolbar, table, stepper, cards, snackbar)
- **ng2-charts + Chart.js** — gráficos de série temporal
- **RxJS** — polling reativo com `interval` + `switchMap` + `takeUntil`
- **JetBrains Mono + DM Sans** — tipografia
