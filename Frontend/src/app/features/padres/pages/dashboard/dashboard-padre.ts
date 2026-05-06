import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { PadresService } from '../../../../core/services/padres';

@Component({
  selector: 'app-dashboard-padre',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-padre.html',
  styleUrls: ['./dashboard-padre.scss']
})
export class DashboardPadresComponent implements OnInit {
  private padresService = inject(PadresService);
  private cdr = inject(ChangeDetectorRef);
  
  loading = true;
  resumen: any = null;

  ngOnInit() {
    this.padresService.getResumenHijo().subscribe({
      next: (data) => {
        this.resumen = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar datos del estudiante:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getSemaforoClass(porcentaje: number): string {
    if (porcentaje >= 95) return 'ok';
    if (porcentaje >= 85) return 'mid';
    return 'bad';
  }
}
