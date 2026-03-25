import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StressApiService } from '../../../../core/api/stress-api.service';
import { TestListItem } from '../../../../core/api/models';
import { StatusBadgeComponent } from '../../components/status-badge/status-badge.component';
import { LoadingComponent } from '../../../../shared/components/loading/loading.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { formatEpochMillisToDateTime } from '../../../../shared/utils/formatters';

@Component({
  selector: 'app-tests-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    StatusBadgeComponent,
    LoadingComponent,
    EmptyStateComponent
  ],
  templateUrl: './tests-list.component.html',
  styleUrls: ['./tests-list.component.css']
})
export class TestsListComponent implements OnInit {
  private readonly api = inject(StressApiService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  tests: TestListItem[] = [];
  loading = true;
  displayedColumns = ['name', 'status', 'createdAt', 'startedAt', 'endedAt', 'actions'];

  formatDateTime = formatEpochMillisToDateTime;

  ngOnInit(): void {
    this.loadTests();
  }

  loadTests(): void {
    this.loading = true;
    this.api.listTests().subscribe({
      next: (tests) => {
        this.tests = tests;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  openTest(testId: string): void {
    this.router.navigate(['/tests', testId]);
  }

  newTest(): void {
    this.router.navigate(['/test-wizard']);
  }

  startTest(event: Event, testId: string): void {
    event.stopPropagation();
    this.api.startTest(testId).subscribe({
      next: () => {
        this.snackBar.open('Teste iniciado com sucesso!', 'Fechar', { duration: 3000 });
        this.loadTests();
      }
    });
  }

  stopTest(event: Event, testId: string): void {
    event.stopPropagation();
    this.api.stopTest(testId).subscribe({
      next: () => {
        this.snackBar.open('Teste interrompido.', 'Fechar', { duration: 3000 });
        this.loadTests();
      }
    });
  }
}
