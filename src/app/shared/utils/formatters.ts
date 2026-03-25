// =============================================
// Formatters — utility functions
// =============================================

export function formatEpochToTime(epochSecond: number): string {
  const date = new Date(epochSecond * 1000);
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function formatEpochMillisToDateTime(epochMillis: number): string {
  if (!epochMillis) return '—';
  const date = new Date(epochMillis);
  return date.toLocaleString('pt-BR');
}

export function formatEpochMillisToTime(epochMillis: number): string {
  if (!epochMillis) return '—';
  const date = new Date(epochMillis);
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function calcErrorRate(totalErrors: number, totalRequests: number): number {
  if (!totalRequests || totalRequests === 0) return 0;
  return (totalErrors / totalRequests) * 100;
}

export function formatLatency(ms: number): string {
  if (ms === null || ms === undefined) return '—';
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
  return `${ms.toFixed(1)}ms`;
}

export function formatNumber(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) {
    return '—';
  }
  if (seconds === 0) {
    return '0s';
  }
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) {
    return `${s}s`;
  }
  if (s === 0) {
    return `${m}m`;
  }
  return `${m}m ${s}s`;
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    CREATED: 'Criado',
    RUNNING: 'Executando',
    STOPPED: 'Interrompido',
    FINISHED: 'Finalizado',
    ERROR: 'Erro'
  };
  return map[status] ?? status;
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    CREATED: '#6366f1',
    RUNNING: '#22c55e',
    STOPPED: '#f59e0b',
    FINISHED: '#3d8bff',
    ERROR: '#ef4444'
  };
  return map[status] ?? '#7a8899';
}
