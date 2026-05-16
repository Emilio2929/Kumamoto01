import { Component, OnInit, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardService, AsistenciaGlobalDto } from '../../../../../core/services/dashboard';

@Component({
  selector: 'app-global-attendance',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './global-attendance.html',
  styleUrl: './global-attendance.scss',
})
export class GlobalAttendance implements OnInit {
  private readonly dashboardSvc = inject(DashboardService);
  private readonly cdr = inject(ChangeDetectorRef);

  filtro: string = 'today';
  datos: AsistenciaGlobalDto[] = [];
  loading: boolean = true;
  error: string | null = null;

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    this.dashboardSvc.getAsistenciaGlobal(this.filtro).subscribe({
      next: (data) => {
        this.datos = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = 'Error al cargar los datos de asistencia global.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onFiltroChange(): void {
    this.cargarDatos();
  }
}
