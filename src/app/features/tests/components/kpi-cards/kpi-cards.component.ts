import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';
import { TestSummary } from '../../../../core/api/models';
import { calcErrorRate, formatLatency, formatNumber } from '../../../../shared/utils/formatters';

interface KpiCard {
  label: string;
  value: string;
  sublabel?: string;
  icon: string;
  accentColor: string;
  isStatus?: boolean;
  status?: string;
}

@Component({
  selector: 'app-kpi-cards',
  standalone: true,
  imports: [CommonModule, MatIconModule, StatusBadgeComponent],
  templateUrl: './kpi-cards.component.html',
  styleUrls: ['./kpi-cards.component.css']
})
export class KpiCardsComponent implements OnChanges {
  @Input() summary: TestSummary | null = null;

  cards: KpiCard[] = [];

  ngOnChanges(): void {
    this.buildCards();
  }

  private buildCards(): void {
    if (!this.summary) {
      this.cards = [];
      return;
    }
    const s = this.summary;
    const errorRate = calcErrorRate(s.totalErrors, s.totalRequests);

    this.cards = [
      {
        label: 'Total de Requests',
        value: formatNumber(s.totalRequests),
        icon: 'send',
        accentColor: 'var(--accent-blue)'
      },
      {
        label: 'Taxa de Erros',
        value: `${errorRate.toFixed(2)}%`,
        sublabel: `${formatNumber(s.totalErrors)} erros`,
        icon: 'error_outline',
        accentColor: errorRate > 5 ? 'var(--accent-red)' : errorRate > 1 ? 'var(--accent-yellow)' : 'var(--accent-green)'
      },
      {
        label: 'RPS Atual',
        value: s.rpsCurrent.toFixed(1),
        sublabel: 'req/s',
        icon: 'speed',
        accentColor: 'var(--accent-cyan)'
      },
      {
        label: 'Workers Ativos',
        value: s.activeWorkers.toString(),
        sublabel: 'VUs',
        icon: 'memory',
        accentColor: 'var(--accent-purple)'
      },
      {
        label: 'Latência Média',
        value: formatLatency(s.avgLatencyMs),
        icon: 'timer',
        accentColor: 'var(--accent-blue)'
      },
      {
        label: 'Latência p95',
        value: formatLatency(s.p95LatencyMs),
        icon: 'bar_chart',
        accentColor: s.p95LatencyMs > 1000 ? 'var(--accent-red)' : s.p95LatencyMs > 500 ? 'var(--accent-yellow)' : 'var(--accent-green)'
      },
      {
        label: 'Backlog',
        value: formatNumber(s.backlogCurrent),
        sublabel: 'requisições',
        icon: 'queue',
        accentColor: s.backlogCurrent > 100 ? 'var(--accent-red)' : 'var(--accent-yellow)'
      },
      {
        label: 'Status',
        value: '',
        icon: 'info',
        accentColor: 'var(--accent-blue)',
        isStatus: true,
        status: s.status
      }
    ];
  }
}
