import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalificacionService, Competencia } from '../../../../../core/services/calificacion.service';
import { ActivatedRoute } from '@angular/router';
import { GestionCompetenciasComponent } from './components/gestion-competencias/gestion-competencias.component';
import { PlanillaNotasComponent } from './components/planilla-notas/planilla-notas.component';
import { ReportesCursoComponent } from './components/reportes-curso/reportes-curso.component';

@Component({
  selector: 'app-calificaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, GestionCompetenciasComponent, PlanillaNotasComponent, ReportesCursoComponent],
  templateUrl: './calificaciones.component.html',
  styleUrls: ['./calificaciones.component.scss']
})
export class CalificacionesComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private calificacionService = inject(CalificacionService);
  private cdr = inject(ChangeDetectorRef);

  cargaId: number = 0;
  cargaSeleccionada: any = {};
  competencias: Competencia[] = [];
  isLoading = true;

  cargas: any[] = [];
  cursoSeleccionadoTexto: string = '';
  currentMode: 'list' | 'competencias' | 'notas' | 'reportes' = 'list';

  ngOnInit(): void {
    this.cargarMisCursos();
  }

  cargarMisCursos(): void {
    this.isLoading = true;
    this.calificacionService.getMisCursos().subscribe({
      next: (cargas) => {
        this.cargas = cargas;
        this.isLoading = false;
        
        // Revisar si venimos de otra pantalla con un ID específico
        const idParam = this.route.snapshot.paramMap.get('cargaId');
        if (idParam) {
          const selectedId = +idParam;
          const carga = this.cargas.find(c => c.cargaId === selectedId);
          if (carga) {
            this.abrirNotas(carga); // Por defecto abrir notas si viene de "Mis Cursos"
          }
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar cursos', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  abrirCompetencias(carga: any): void {
    this.seleccionarCarga(carga, 'competencias');
  }

  abrirNotas(carga: any): void {
    this.seleccionarCarga(carga, 'notas');
  }

  abrirReportes(carga: any): void {
    this.seleccionarCarga(carga, 'reportes');
  }

  private seleccionarCarga(carga: any, mode: 'competencias' | 'notas' | 'reportes'): void {
    this.cargaId = carga.cargaId;
    this.cargaSeleccionada = carga;
    this.cursoSeleccionadoTexto = `${carga.curso} - ${carga.grado} ${carga.seccion}`;
    this.currentMode = mode;
    this.cdr.detectChanges();
    this.cargarCompetencias();
  }

  volver(): void {
    this.currentMode = 'list';
    this.cargaId = 0;
    this.cursoSeleccionadoTexto = '';
    this.competencias = [];
    this.cdr.detectChanges();
  }

  cargarCompetencias(): void {
    this.calificacionService.getCompetencias(this.cargaId).subscribe({
      next: (res: Competencia[]) => {
        this.competencias = res;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error cargando competencias', err);
        this.cdr.detectChanges();
      }
    });
  }

  onCompetenciaCambiada(): void {
    this.cargarCompetencias();
  }
}
