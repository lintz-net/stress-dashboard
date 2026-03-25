import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';
import { TestDetail } from '../../../../core/api/models';
import { formatDuration, formatNumber } from '../../../../shared/utils/formatters';

@Component({
  selector: 'app-test-header',
  standalone: true,
  imports: [CommonModule, MatIconModule, StatusBadgeComponent],
  templateUrl: './test-header.component.html',
  styleUrls: ['./test-header.component.css']
})
export class TestHeaderComponent {
  @Input() detail: TestDetail | null = null;

  formatDuration = formatDuration;
  formatNumber = formatNumber;
}
