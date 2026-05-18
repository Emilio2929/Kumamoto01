import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { PadresService } from '../../../../core/services/padres';
import { PadreStateService } from '../../../../core/services/padre-state.service';
import { AuthService } from '../../../../core/services/auth';

@Component({
  selector: 'app-dashboard-padre',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-padre.html',
  styleUrls: ['./dashboard-padre.scss']
})
export class DashboardPadresComponent implements OnInit {
  private padresService = inject(PadresService);
  public stateService = inject(PadreStateService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  
  loading = true;
  hijoSeleccionado: any = null;
  error: string | null = null;

  ngOnInit() {
    this.stateService.hijoSeleccionado$.subscribe({
      next: (hijo: any) => {
        this.hijoSeleccionado = hijo;
        this.loading = !hijo;
        this.cdr.detectChanges();
      }
    });
  }

  getRiesgoClass(nivel: string): string {
    const n = nivel.toLowerCase();
    if (n === 'alto') return 'risk-high';
    if (n === 'medio') return 'risk-medium';
    return 'risk-low';
  }

  getSemaforoColor(nivel: string): string {
    const n = nivel.toLowerCase();
    if (n === 'alto') return '#ef4444'; // Rojo
    if (n === 'medio') return '#f59e0b'; // Naranja/Amarillo
    return '#10b981'; // Verde
  }

  getAttendanceRotation(pct: number): string {
    // Para el gráfico de semi-círculo CSS (0-180 grados)
    const rotation = (pct / 100) * 180;
    return `rotate(${rotation}deg)`;
  }

  getBadgeClass(nota: string): string {
    const n = (nota || '').toUpperCase().trim();
    if (n === 'C') return 'nota-c';
    if (n === 'B') return 'nota-b';
    if (n === 'A' || n === 'AD') return 'nota-a';
    return '';
  }

  getHoyClass(hoy: string): string {
    if (!hoy) return 'hoy-sin';
    const h = hoy.toLowerCase();
    if (h === 'presente') return 'hoy-presente';
    if (h === 'falta') return 'hoy-falta';
    if (h === 'tardanza') return 'hoy-tardanza';
    if (h === 'justificado') return 'hoy-justificado';
    return 'hoy-sin';
  }

  verReporteDetallado() {
    this.router.navigate(['/dashboard/padre/notas']);
  }
}
