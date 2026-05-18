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

  // Estado de notificaciones exitosas
  notificados: Record<number, boolean> = {};

  // Modal Confirmación Notificación
  showConfirmModal = false;
  estudianteSeleccionado: RiskMonitorDetailDto | null = null;
  mensajeExito: string | null = null;
  mensajeError: string | null = null;

  confirmarNotificacion(estudiante: RiskMonitorDetailDto): void {
    this.estudianteSeleccionado = estudiante;
    this.showConfirmModal = true;
    this.mensajeExito = null;
    this.mensajeError = null;
    this.cdr.markForCheck();
  }

  cancelarNotificacion(): void {
    this.showConfirmModal = false;
    this.estudianteSeleccionado = null;
    this.cdr.markForCheck();
  }

  enviarNotificacionConfirmada(): void {
    if (!this.estudianteSeleccionado || this.notificando[this.estudianteSeleccionado.id]) return;

    const estId = this.estudianteSeleccionado.id;
    this.notificando[estId] = true;
    this.mensajeError = null;
    this.cdr.markForCheck();

    this.dashboardSvc.notifyRiskParent(estId, this.estudianteSeleccionado.motivo, this.estudianteSeleccionado.nivelRiesgo).subscribe({
      next: () => {
        this.notificando[estId] = false;
        this.notificados[estId] = true;
        this.mensajeExito = `¡Notificación enviada exitosamente al padre de ${this.estudianteSeleccionado?.estudiante}!`;
        this.cdr.markForCheck();
        
        // Cerrar el modal automáticamente después de 2.5 segundos
        setTimeout(() => {
          this.showConfirmModal = false;
          this.estudianteSeleccionado = null;
          this.mensajeExito = null;
          this.cdr.markForCheck();
        }, 2500);
      },
      error: (err) => {
        this.notificando[estId] = false;
        this.mensajeError = err.error?.mensaje || 'Ocurrió un error al intentar notificar al padre.';
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
