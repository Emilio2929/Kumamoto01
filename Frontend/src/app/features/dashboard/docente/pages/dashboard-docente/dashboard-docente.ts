import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { AuthService } from '../../../../../core/services/auth';
import { CargaAcademicaDetalleDto, CargaAcademicaService } from '../../../../../core/services/carga-academica';

@Component({
  selector: 'app-dashboard-docente',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-docente.html',
  styleUrl: './dashboard-docente.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardDocenteComponent implements OnInit {
  private readonly cargasSvc = inject(CargaAcademicaService);
  private readonly auth = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  errorMsg: string | null = null;

  cursosHoy: number | null = null;
  alumnosRiesgo: number | null = null;
  promedioGeneral: string | null = null;

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
        const misCargas = all.filter((c) => c.docenteId === docenteId);
        this.cursosHoy = this.countCursosHoy(misCargas);
        this.alumnosRiesgo = null; // Se conectará al motor de riesgo más adelante
        this.promedioGeneral = null; // Se conectará al módulo de notas más adelante
        this.loading = false;
        this.errorMsg = null;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error cargando carga académica', err);
        this.loading = false;
        this.errorMsg = 'Error al cargar datos. Verifica la conexión con el servidor.';
        this.cdr.markForCheck();
      },
    });
  }

  private countCursosHoy(cargas: CargaAcademicaDetalleDto[]): number {
    const weekdayMap: Record<number, string[]> = {
      0: ['domingo', 'sun', 'sunday'],
      1: ['lunes', 'mon', 'monday'],
      2: ['martes', 'tue', 'tuesday'],
      3: ['miercoles', 'miércoles', 'wed', 'wednesday'],
      4: ['jueves', 'thu', 'thursday'],
      5: ['viernes', 'fri', 'friday'],
      6: ['sabado', 'sábado', 'sat', 'saturday'],
    };
    const today = new Date().getDay();
    const aliases = weekdayMap[today] ?? [];

    return cargas.filter((c) =>
      (c.horarios ?? []).some((h) => {
        const dia = (h.diaSemana ?? '').trim().toLowerCase();
        return aliases.some((a) => dia.includes(a));
      })
    ).length;
  }
}

