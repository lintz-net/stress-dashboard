import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { statusLabel, statusColor } from '../../../../shared/utils/formatters';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-badge.component.html',
  styleUrls: ['./status-badge.component.css']
})
export class StatusBadgeComponent {
  @Input() status = '';

  get label(): string { return statusLabel(this.status); }
  get color(): string { return statusColor(this.status); }
}
