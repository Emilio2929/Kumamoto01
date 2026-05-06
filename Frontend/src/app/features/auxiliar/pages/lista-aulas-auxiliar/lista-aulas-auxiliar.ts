import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AulaAsignadaAuxiliarDto, AuxiliarService } from '../../../../core/services/auxiliar';

@Component({
  selector: 'app-lista-aulas-auxiliar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './lista-aulas-auxiliar.html',
  styleUrl: './lista-aulas-auxiliar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListaAulasAuxiliarComponent implements OnInit {
  private readonly svc = inject(AuxiliarService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);

  loading = true;
  errorMsg: string | null = null;
  aulas: AulaAsignadaAuxiliarDto[] = [];

  ngOnInit(): void {
    this.svc.getMisAulas().subscribe({
      next: (data) => {
        this.aulas = data;
        this.loading = false;
        this.errorMsg = null;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error cargando aulas auxiliar', err);
        this.loading = false;
        this.errorMsg = 'No se pudieron cargar tus aulas asignadas.';
        this.cdr.markForCheck();
      },
    });
  }

  estadoLabel(estado: AulaAsignadaAuxiliarDto['estadoAsistenciaHoy']): string {
    if (estado === 'RegistradaDocente') return 'Registrada por Docente';
    if (estado === 'RegistradaAuxiliar') return 'Registrada (Auxiliar)';
    return 'Pendiente';
  }

  estadoClass(estado: AulaAsignadaAuxiliarDto['estadoAsistenciaHoy']): string {
    if (estado === 'RegistradaDocente') return 'ok';
    if (estado === 'RegistradaAuxiliar') return 'mid';
    return 'bad';
  }

  irAsistencia(aulaId: number) {
    this.router.navigate(['/dashboard/auxiliar/asistencia', aulaId]);
  }

  trackByAulaId = (_: number, item: AulaAsignadaAuxiliarDto) => item.aulaId;
}

