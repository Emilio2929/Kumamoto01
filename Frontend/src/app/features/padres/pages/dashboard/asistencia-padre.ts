import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { PadresService } from '../../../../core/services/padres';

@Component({
  selector: 'app-asistencia-padre',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './asistencia-padre.html',
  styleUrls: ['./asistencia-padre.scss']
})
export class AsistenciaPadresComponent implements OnInit {
  private padresService = inject(PadresService);
  private cdr = inject(ChangeDetectorRef);
  loading = true;
  asistencias: any[] | null = null;

  ngOnInit() {
    this.padresService.getAsistenciasHijo().subscribe({
      next: (data) => {
        this.asistencias = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.asistencias = [];
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
