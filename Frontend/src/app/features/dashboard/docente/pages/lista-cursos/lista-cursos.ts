import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { AuthService } from '../../../../../core/services/auth';
import { CargaAcademicaDetalleDto, CargaAcademicaService } from '../../../../../core/services/carga-academica';

interface HorarioItem {
  carga: CargaAcademicaDetalleDto;
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
}

interface TramoHorario {
  horaInicio: string;
  horaFin: string;
  etiqueta: string;
}

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

  docenteNombre = '';
  diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  tramos: TramoHorario[] = [];
  matrizHorario: Record<string, Record<string, CargaAcademicaDetalleDto[]>> = {};

  ngOnInit(): void {
    const docenteId = this.auth.obtenerUsuarioIdDesdeToken();
    if (!docenteId) {
      this.loading = false;
      this.errorMsg = 'No se pudo identificar al docente (sesión inválida).';
      this.cdr.markForCheck();
      return;
    }

    this.docenteNombre = this.auth.obtenerUsuario()?.nombre || 'Docente Kumamoto';

    this.cargasSvc.getAll().subscribe({
      next: (all) => {
        this.cargas = all.filter((c) => c.docenteId === docenteId);

        const mapDias: Record<string, string> = {
          'lunes': 'Lunes', 'mon': 'Lunes', 'monday': 'Lunes',
          'martes': 'Martes', 'tue': 'Martes', 'tuesday': 'Martes',
          'miercoles': 'Miércoles', 'miércoles': 'Miércoles', 'wed': 'Miércoles', 'wednesday': 'Miércoles',
          'jueves': 'Jueves', 'thu': 'Jueves', 'thursday': 'Jueves',
          'viernes': 'Viernes', 'fri': 'Viernes', 'friday': 'Viernes'
        };

        const tramosMap = new Map<string, TramoHorario>();

        this.cargas.forEach(c => {
          if (c.horarios && c.horarios.length > 0) {
            c.horarios.forEach(h => {
              const ini = h.horaInicio ?? '08:00';
              const fin = h.horaFin ?? '10:00';
              const key = `${ini} - ${fin}`;
              if (!tramosMap.has(key)) {
                tramosMap.set(key, { horaInicio: ini, horaFin: fin, etiqueta: key });
              }
            });
          }
        });

        if (tramosMap.size === 0) {
          const tramosDefault = [
            { horaInicio: '08:00', horaFin: '09:30', etiqueta: '08:00 - 09:30' },
            { horaInicio: '09:45', horaFin: '11:15', etiqueta: '09:45 - 11:15' },
            { horaInicio: '11:30', horaFin: '13:00', etiqueta: '11:30 - 13:00' },
            { horaInicio: '13:30', horaFin: '15:00', etiqueta: '13:30 - 15:00' }
          ];
          tramosDefault.forEach(t => tramosMap.set(t.etiqueta, t));
        }

        // Función auxiliar para convertir "HH:mm" o "H:mm" a minutos totales desde la medianoche
        const parseMinutos = (horaStr: string): number => {
          if (!horaStr) return 0;
          const parts = horaStr.split(':');
          const h = parseInt(parts[0], 10) || 0;
          const m = parseInt(parts[1], 10) || 0;
          return h * 60 + m;
        };

        // Ordenar tramos cronológicamente por hora de inicio y, si coinciden, por hora de fin
        this.tramos = Array.from(tramosMap.values()).sort((a, b) => {
          const minAIni = parseMinutos(a.horaInicio);
          const minBIni = parseMinutos(b.horaInicio);
          if (minAIni !== minBIni) {
            return minAIni - minBIni;
          }
          const minAFin = parseMinutos(a.horaFin);
          const minBFin = parseMinutos(b.horaFin);
          return minAFin - minBFin;
        });

        this.matrizHorario = {};
        this.tramos.forEach(t => {
          this.matrizHorario[t.etiqueta] = {
            'Lunes': [],
            'Martes': [],
            'Miércoles': [],
            'Jueves': [],
            'Viernes': []
          };
        });

        this.cargas.forEach(c => {
          if (c.horarios && c.horarios.length > 0) {
            c.horarios.forEach(h => {
              const ini = h.horaInicio ?? '08:00';
              const fin = h.horaFin ?? '10:00';
              const tramoKey = `${ini} - ${fin}`;
              
              const diaRaw = (h.diaSemana ?? '').trim().toLowerCase();
              let diaKey = 'Lunes';
              for (const key in mapDias) {
                if (diaRaw.includes(key)) {
                  diaKey = mapDias[key];
                  break;
                }
              }

              if (this.matrizHorario[tramoKey] && this.matrizHorario[tramoKey][diaKey]) {
                this.matrizHorario[tramoKey][diaKey].push(c);
              }
            });
          } else {
            if (this.tramos.length > 0) {
              const primerTramo = this.tramos[0].etiqueta;
              this.matrizHorario[primerTramo]['Lunes'].push(c);
            }
          }
        });

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

