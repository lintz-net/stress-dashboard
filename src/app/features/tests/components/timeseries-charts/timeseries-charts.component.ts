import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { TimeseriesPoint, TestType } from '../../../../core/api/models';
import { formatEpochToTime } from '../../../../shared/utils/formatters';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';

Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler
);

@Component({
  selector: 'app-timeseries-charts',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, EmptyStateComponent],
  templateUrl: './timeseries-charts.component.html',
  styleUrls: ['./timeseries-charts.component.css']
})
export class TimeseriesChartsComponent implements OnChanges {
  @Input() points: TimeseriesPoint[] = [];
  @Input() testType: TestType = 'HTTP';

  labels: string[] = [];
  hasData = false;
  throughputUnit = 'req/s';

  throughputData: ChartData<'line'> = { labels: [], datasets: [] };
  errorsData: ChartData<'line'> = { labels: [], datasets: [] };
  latencyData: ChartData<'line'> = { labels: [], datasets: [] };

  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 200 },
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#161a21',
        borderColor: '#2a3340',
        borderWidth: 1,
        titleColor: '#7a8899',
        bodyColor: '#e8edf5',
        titleFont: { family: 'JetBrains Mono', size: 10 },
        bodyFont: { family: 'JetBrains Mono', size: 12 },
        padding: 10
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#4a5568',
          font: { family: 'JetBrains Mono', size: 10 },
          maxTicksLimit: 10,
          maxRotation: 0
        },
        grid: { color: '#1e2530' }
      },
      y: {
        ticks: {
          color: '#4a5568',
          font: { family: 'JetBrains Mono', size: 10 }
        },
        grid: { color: '#1e2530' },
        beginAtZero: true
      }
    }
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['points'] || changes['testType']) {
      this.buildCharts();
    }
  }

  private buildCharts(): void {
    if (!this.points || this.points.length === 0) {
      this.hasData = false;
      return;
    }
    this.hasData = true;

    this.throughputUnit = this.testType === 'HTTP' ? 'req/s' : 'msg/s';
    this.labels = this.points.map(p => formatEpochToTime(p.epochSecond));

    this.throughputData = {
      labels: this.labels,
      datasets: [{
        data: this.points.map(p => p.requests),
        borderColor: '#3d8bff',
        backgroundColor: 'rgba(61,139,255,0.08)',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.3,
        fill: true,
        label: this.throughputUnit
      }]
    };

    this.errorsData = {
      labels: this.labels,
      datasets: [{
        data: this.points.map(p => p.errors),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239,68,68,0.08)',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.3,
        fill: true,
        label: 'erros/s'
      }]
    };

    this.latencyData = {
      labels: this.labels,
      datasets: [{
        data: this.points.map(p => p.avgLatencyMs),
        borderColor: '#00d4aa',
        backgroundColor: 'rgba(0,212,170,0.08)',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.3,
        fill: true,
        label: 'ms'
      }]
    };
  }
}
