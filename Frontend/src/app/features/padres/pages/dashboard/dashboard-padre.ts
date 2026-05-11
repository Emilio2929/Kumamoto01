import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
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
}
