import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, interval, switchMap, takeUntil, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { StressApiService } from '../../../../core/api/stress-api.service';
import { APP_CONFIG } from '../../../../core/config/app-config';
import { TestDetail, TestSummary, TimeseriesPoint } from '../../../../core/api/models';
import { TestHeaderComponent } from '../../components/test-header/test-header.component';
import { KpiCardsComponent } from '../../components/kpi-cards/kpi-cards.component';
import { TimeseriesChartsComponent } from '../../components/timeseries-charts/timeseries-charts.component';
import { LoadingComponent } from '../../../../shared/components/loading/loading.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../components/status-badge/status-badge.component';

@Component({
  selector: 'app-tests-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    TestHeaderComponent,
    KpiCardsComponent,
    TimeseriesChartsComponent,
    LoadingComponent,
    EmptyStateComponent
  ],
  templateUrl: './tests-detail.component.html',
  styleUrls: ['./tests-detail.component.css']
})
export class TestsDetailComponent implements OnInit, OnDestroy {
  private readonly api = inject(StressApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly config = inject(APP_CONFIG);

  private readonly destroy$ = new Subject<void>();
  private readonly stopPoll$ = new Subject<void>();

  testId = '';
  detail: TestDetail | null = null;
  summary: TestSummary | null = null;
  points: TimeseriesPoint[] = [];

  loading = true;
  error = false;
  actionLoading = false;

  get isRunning(): boolean { return this.detail?.status === 'RUNNING'; }
  get canStart(): boolean {
    return false;//this.detail?.status === 'CREATED' || this.detail?.status === 'STOPPED';
  }

  ngOnInit(): void {
    this.testId = this.route.snapshot.paramMap.get('testId') ?? '';
    if (!this.testId) {
      this.router.navigate(['/tests']);
      return;
    }
    this.initialLoad();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopPoll$.next();
    this.stopPoll$.complete();
  }

  private initialLoad(): void {
    this.loading = true;
    forkJoin({
      detail: this.api.getTest(this.testId).pipe(catchError(() => of(null))),
      summary: this.api.getSummary(this.testId).pipe(catchError(() => of(null))),
      timeseries: this.api.getTimeseries(this.testId).pipe(catchError(() => of(null)))
    }).subscribe(({ detail, summary, timeseries }) => {
      this.loading = false;
      if (!detail) { this.error = true; return; }
      this.detail = detail;
      this.summary = summary;
      this.points = timeseries?.points ?? [];
      if (this.isRunning) this.startPolling();
    });
  }

  private startPolling(): void {
    this.stopPoll$.next();

    interval(this.config.pollIntervalMs).pipe(
      takeUntil(this.stopPoll$),
      takeUntil(this.destroy$),
      switchMap(() => forkJoin({
        detail: this.api.getTest(this.testId).pipe(catchError(() => of(null))),
        summary: this.api.getSummary(this.testId).pipe(catchError(() => of(null))),
        timeseries: this.api.getTimeseries(this.testId).pipe(catchError(() => of(null)))
      }))
    ).subscribe(({ detail, summary, timeseries }) => {
      if (detail) {
        this.detail = detail;
        this.summary = summary;
        this.points = timeseries?.points ?? [];
        if (!this.isRunning) {
          this.stopPoll$.next();
        }
      }
    });
  }

  manualRefresh(): void {
    forkJoin({
      detail: this.api.getTest(this.testId).pipe(catchError(() => of(null))),
      summary: this.api.getSummary(this.testId).pipe(catchError(() => of(null))),
      timeseries: this.api.getTimeseries(this.testId).pipe(catchError(() => of(null)))
    }).subscribe(({ detail, summary, timeseries }) => {
      if (detail) {
        this.detail = detail;
        this.summary = summary;
        this.points = timeseries?.points ?? [];
      }
    });
  }

  startTest(): void {
    this.actionLoading = true;
    this.api.startTest(this.testId).subscribe({
      next: () => {
        this.actionLoading = false;
        this.snackBar.open('Teste iniciado!', 'Fechar', { duration: 3000 });
        this.manualRefresh();
        setTimeout(() => this.startPolling(), 500);
      },
      error: () => { this.actionLoading = false; }
    });
  }

  stopTest(): void {
    this.actionLoading = true;
    this.api.stopTest(this.testId).subscribe({
      next: () => {
        this.actionLoading = false;
        this.snackBar.open('Teste interrompido.', 'Fechar', { duration: 3000 });
        this.stopPoll$.next();
        this.manualRefresh();
      },
      error: () => { this.actionLoading = false; }
    });
  }

  goBack(): void {
    this.router.navigate(['/tests']);
  }
}
