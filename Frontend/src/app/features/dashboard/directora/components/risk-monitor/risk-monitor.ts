import { Component, OnInit, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService, RiskMonitorAIDto, RiskMonitorDetailDto } from '../../../../../core/services/dashboard';

@Component({
  selector: 'app-risk-monitor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './risk-monitor.html',
  styleUrl: './risk-monitor.scss',
})
export class RiskMonitor implements OnInit {
  private readonly dashboardSvc = inject(DashboardService);
  private readonly cdr = inject(ChangeDetectorRef);

  data: RiskMonitorAIDto | null = null;
  loading: boolean = true;
  error: string | null = null;

  // Modal State
  showModal = false;
  loadingDetails = false;
  detalles: RiskMonitorDetailDto[] = [];
  notificando: Record<number, boolean> = {};

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    this.dashboardSvc.getRiskMonitorAI().subscribe({
      next: (res) => {
        this.data = res;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'No se pudo cargar el análisis de IA.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  abrirDetalle(): void {
    this.showModal = true;
    this.loadingDetails = true;
    this.cdr.markForCheck();

    this.dashboardSvc.getRiskMonitorAIDetails().subscribe({
      next: (res) => {
        this.detalles = res;
        this.loadingDetails = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingDetails = false;
        this.cdr.markForCheck();
      }
    });
  }

  cerrarModal(): void {
    this.showModal = false;
    this.cdr.markForCheck();
  }

  notificarPadre(estudiante: RiskMonitorDetailDto): void {
    if (this.notificando[estudiante.id]) return;
    
    this.notificando[estudiante.id] = true;
    this.cdr.markForCheck();

    this.dashboardSvc.notifyRiskParent(estudiante.id, estudiante.motivo, estudiante.nivelRiesgo).subscribe({
      next: () => {
        this.notificando[estudiante.id] = false;
        alert(`Padre de ${estudiante.estudiante} notificado exitosamente.`);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.notificando[estudiante.id] = false;
        alert(err.error?.mensaje || 'Error al notificar al padre.');
        this.cdr.markForCheck();
      }
    });
  }

  // Libreta Modal State
  showLibretaModal = false;
  loadingLibreta = false;
  libretaData: any = null;

  verLibreta(estudianteId: number): void {
    this.showLibretaModal = true;
    this.loadingLibreta = true;
    this.libretaData = null;
    this.cdr.markForCheck();

    this.dashboardSvc.getLibretaDirectora(estudianteId).subscribe({
      next: (res) => {
        this.libretaData = res;
        this.loadingLibreta = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingLibreta = false;
        alert('Error al obtener la libreta.');
        this.showLibretaModal = false;
        this.cdr.markForCheck();
      }
    });
  }

  cerrarLibreta(): void {
    this.showLibretaModal = false;
    this.libretaData = null;
    this.cdr.markForCheck();
  }
}
