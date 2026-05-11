import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuxiliarService } from '../../../../core/services/auxiliar';

@Component({
  selector: 'app-dashboard-auxiliar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-auxiliar.html',
  styleUrl: './dashboard-auxiliar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardAuxiliarComponent implements OnInit {
  private auxiliarService = inject(AuxiliarService);
  private cdr = inject(ChangeDetectorRef);

  stats: any = null;
  loading = true;
  error = false;

  ngOnInit() {
    this.cargarStats();
  }

  cargarStats() {
    this.loading = true;
    this.auxiliarService.getDashboardStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = true;
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  getRiesgoClass(riesgo: string) {
    if (riesgo === 'Alto') return 'badge-risk-high';
    if (riesgo === 'Medio') return 'badge-risk-medium';
    return 'badge-risk-low';
  }
}
