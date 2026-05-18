import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DocenteService } from '../../../../../core/services/docente';

@Component({
  selector: 'app-tutoria-docente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tutoria-docente.html',
  styleUrls: ['./tutoria-docente.scss']
})
export class TutoriaDocenteComponent implements OnInit {
  private docenteService = inject(DocenteService);
  private cdr = inject(ChangeDetectorRef);

  loading = true;
  tutorias: any[] = [];
  aulaSeleccionada: any | null = null;
  detallesAula: any | null = null;
  errorMsg: string | null = null;

  // Filtros y pestañas activas en la vista
  activeTab: 'general' | 'incidencias' | 'rendimiento' | 'notas' = 'general';
  cursoFiltroNotas: string = 'TODOS';
  cursosDisponibles: string[] = [];

  // Modo de vista en la pestaña de notas
  modoVistaNotas: 'bimestral' | 'semanal' = 'bimestral';
  bimestreFiltroSemanal: string = 'Bimestre I';
  semanasDisponibles: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  ngOnInit() {
    this.cargarTutorias();
  }

  cargarTutorias() {
    this.loading = true;
    this.docenteService.getMisTutorias().subscribe({
      next: (res) => {
        this.tutorias = res || [];
        if (this.tutorias.length > 0) {
          this.seleccionarAula(this.tutorias[0]);
        } else {
          this.loading = false;
          this.errorMsg = 'No tienes aulas asignadas como tutoría en este ciclo académico.';
          this.cdr.markForCheck();
        }
      },
      error: () => {
        this.loading = false;
        this.errorMsg = 'Ocurrió un error al cargar tus tutorías asignadas.';
        this.cdr.markForCheck();
      }
    });
  }

  seleccionarAula(aula: any) {
    this.aulaSeleccionada = aula;
    this.loading = true;
    this.errorMsg = null;
    this.detallesAula = null;
    this.cdr.markForCheck();

    this.docenteService.getTutoriaDetalles(aula.id).subscribe({
      next: (res) => {
        this.detallesAula = res;
        this.extraerCursosDisponibles();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.errorMsg = 'No se pudieron cargar los detalles y métricas de esta aula.';
        this.cdr.markForCheck();
      }
    });
  }

  extraerCursosDisponibles() {
    if (this.detallesAula?.cursos && this.detallesAula.cursos.length > 0) {
      this.cursosDisponibles = this.detallesAula.cursos;
      this.cursoFiltroNotas = this.cursosDisponibles[0] || 'TODOS';
    } else if (this.detallesAula?.notasBimestrales) {
      const setCursos = new Set<string>();
      this.detallesAula.notasBimestrales.forEach((n: any) => setCursos.add(n.curso));
      this.cursosDisponibles = Array.from(setCursos);
      this.cursoFiltroNotas = this.cursosDisponibles[0] || 'TODOS';
    }
  }

  onFiltroChange() {
    this.cdr.markForCheck();
  }

  onModoVistaChange(modo: 'bimestral' | 'semanal') {
    this.modoVistaNotas = modo;
    this.cdr.markForCheck();
  }

  get competenciasCurso() {
    if (!this.detallesAula?.competencias) return [];
    if (this.cursoFiltroNotas === 'TODOS') return this.detallesAula.competencias;
    return this.detallesAula.competencias.filter((c: any) => c.curso === this.cursoFiltroNotas);
  }

  get notasFiltradas() {
    if (!this.detallesAula?.notasBimestrales) return [];
    if (this.cursoFiltroNotas === 'TODOS') return this.detallesAula.notasBimestrales;
    return this.detallesAula.notasBimestrales.filter((n: any) => n.curso === this.cursoFiltroNotas);
  }

  getNotasEstudiante(estudianteId: number, curso: string) {
    if (!this.detallesAula?.notasBimestrales) return [];
    return this.detallesAula.notasBimestrales.filter((n: any) => n.estudianteId === estudianteId && n.curso === curso);
  }

  coincideBimestre(nombreDb: string, filtro: string): boolean {
    if (!nombreDb || !filtro) return false;
    const dbStr = nombreDb.toLowerCase();
    const fStr = filtro.toLowerCase();

    if (fStr === 'i' || (fStr.includes('i') && !fStr.includes('ii') && !fStr.includes('iv') && !fStr.includes('iii')) || fStr.includes('1')) {
      return (dbStr.includes('1') || dbStr.includes('primer') || (dbStr.includes('i') && !dbStr.includes('ii') && !dbStr.includes('iv') && !dbStr.includes('iii')));
    }
    if (fStr === 'ii' || (fStr.includes('ii') && !fStr.includes('iii')) || fStr.includes('2')) {
      return (dbStr.includes('2') || dbStr.includes('segund') || (dbStr.includes('ii') && !dbStr.includes('iii')));
    }
    if (fStr === 'iii' || fStr.includes('iii') || fStr.includes('3')) {
      return (dbStr.includes('3') || dbStr.includes('tercer') || dbStr.includes('iii'));
    }
    if (fStr === 'iv' || fStr.includes('iv') || fStr.includes('4')) {
      return (dbStr.includes('4') || dbStr.includes('cuart') || dbStr.includes('iv'));
    }
    return dbStr.includes(fStr);
  }

  getNotaBimestre(estudianteId: number, curso: string, competencia: string, bimestre: string) {
    if (!this.detallesAula?.notasBimestrales) return '-';
    const nota = this.detallesAula.notasBimestrales.find((n: any) => 
      n.estudianteId === estudianteId && 
      n.curso === curso && 
      n.competencia === competencia &&
      this.coincideBimestre(n.bimestre, bimestre)
    );
    return nota ? nota.letra : '-';
  }

  getNotaSemanal(estudianteId: number, curso: string, competencia: string, bimestre: string, semana: number) {
    if (!this.detallesAula?.notasSemanales) return '-';
    const nota = this.detallesAula.notasSemanales.find((n: any) => 
      n.estudianteId === estudianteId && 
      n.curso === curso && 
      n.competencia === competencia &&
      this.coincideBimestre(n.bimestre, bimestre) && 
      n.semana === semana
    );
    return nota ? nota.letra : '-';
  }
}
