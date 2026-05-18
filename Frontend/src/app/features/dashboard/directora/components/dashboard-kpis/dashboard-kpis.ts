import { Component, OnInit, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService, DashboardKpisDto } from '../../../../../core/services/dashboard';

@Component({
  selector: 'app-dashboard-kpis',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './dashboard-kpis.html',
  styleUrl: './dashboard-kpis.scss',
})
export class DashboardKpis implements OnInit {
  private dashboardService = inject(DashboardService);
  private cdr = inject(ChangeDetectorRef);

  kpis: DashboardKpisDto | null = null;
  loading = true;
  errorMsg: string | null = null;

  ngOnInit(): void {
    this.cargarKpis();
  }

  cargarKpis(): void {
    this.loading = true;
    this.errorMsg = null;
    this.cdr.markForCheck();

    this.dashboardService.getKpis().subscribe({
      next: (data) => {
        this.kpis = data;
        this.loading = false;
        this.errorMsg = null;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error fetching KPIs', err);
        this.errorMsg = 'Error al cargar los datos. Verifica la conexión con el servidor.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }
}
