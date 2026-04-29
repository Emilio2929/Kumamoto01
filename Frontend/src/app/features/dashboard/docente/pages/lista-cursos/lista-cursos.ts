import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { AuthService } from '../../../../../core/services/auth';
import { CargaAcademicaDetalleDto, CargaAcademicaService } from '../../../../../core/services/carga-academica';

@Component({
  selector: 'app-lista-cursos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lista-cursos.html',
  styleUrl: './lista-cursos.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListaCursosComponent implements OnInit {
  private readonly cargasSvc = inject(CargaAcademicaService);
  private readonly auth = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  errorMsg: string | null = null;
  cargas: CargaAcademicaDetalleDto[] = [];

  ngOnInit(): void {
    const docenteId = this.auth.obtenerUsuarioIdDesdeToken();
    if (!docenteId) {
      this.loading = false;
      this.errorMsg = 'No se pudo identificar al docente (sesión inválida).';
      this.cdr.markForCheck();
      return;
    }

    this.cargasSvc.getAll().subscribe({
      next: (all) => {
        this.cargas = all.filter((c) => c.docenteId === docenteId);
        this.loading = false;
        this.errorMsg = null;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error cargando cursos del docente', err);
        this.loading = false;
        this.errorMsg = 'Error al cargar tus cursos. Verifica la conexión con el servidor.';
        this.cdr.markForCheck();
      },
    });
  }

  trackByCargaId = (_: number, item: CargaAcademicaDetalleDto) => item.id;
}

