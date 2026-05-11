import { Component, Input, OnInit, OnChanges, SimpleChanges, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalificacionService, Competencia, AlumnoPlanilla, PeriodoAcademico, SemanaAcademica, NotaItem } from '../../../../../../../core/services/calificacion.service';

@Component({
  selector: 'app-planilla-notas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './planilla-notas.component.html',
  styleUrls: ['./planilla-notas.component.scss']
})
export class PlanillaNotasComponent implements OnInit, OnChanges {
  @Input() cargaId!: number;
  @Input() competencias: Competencia[] = [];

  private calificacionService = inject(CalificacionService);
  private cdr = inject(ChangeDetectorRef);

  periodos: PeriodoAcademico[] = [];
  periodoSeleccionadoId: number = 0;
  
  semanasDelPeriodo: SemanaAcademica[] = [];
  semanaSeleccionadaId: number = 0;

  // Estado de selección de competencias
  competenciasSeleccionadasIds: Set<number> = new Set<number>();
  competenciasAGradear: Competencia[] = []; // Las que se van a mostrar en la tabla

  alumnos: AlumnoPlanilla[] = [];
  isLoading = false;
  isSaving = false;
  planillaGenerada = false;

  // Track dirty state: key is `estudianteId_competenciaId`, value is boolean
  dirtyCells: Set<string> = new Set<string>();

  // Modal system
  modal = {
    show: false,
    message: '',
    type: 'success' as 'success' | 'error' | 'confirm',
    onConfirm: null as (() => void) | null
  };

  private hoy = new Date();

  ngOnInit(): void {
    this.cargarPeriodos();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['competencias'] && !changes['competencias'].firstChange) {
      // Si cambian las competencias generales, reseteamos la planilla
      this.planillaGenerada = false;
      this.alumnos = [];
    }
  }

  cargarPeriodos(): void {
    this.isLoading = true;
    this.calificacionService.getConfig().subscribe({
      next: (config) => {
        this.periodos = config.periodos;
        if (this.periodos.length > 0) {
          this.periodoSeleccionadoId = this.periodos[0].id;
          this.onPeriodoChange();
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando configuración', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onPeriodoChange(): void {
    const periodo = this.periodos.find(p => p.id == this.periodoSeleccionadoId);
    if (periodo && periodo.semanas) {
      this.semanasDelPeriodo = periodo.semanas;
      // Seleccionar la primera semana habilitada o la primera si ninguna está habilitada aún
      const habilitadas = this.semanasDelPeriodo.filter(s => !this.isWeekDisabled(periodo, s.numeroSemana));
      if (habilitadas.length > 0) {
        this.semanaSeleccionadaId = habilitadas[0].id;
      } else if (this.semanasDelPeriodo.length > 0) {
        this.semanaSeleccionadaId = this.semanasDelPeriodo[0].id;
      }
    } else {
      this.semanasDelPeriodo = [];
      this.semanaSeleccionadaId = 0;
    }
  }

  isPeriodDisabled(periodo: PeriodoAcademico): boolean {
    const inicio = new Date(periodo.fechaInicio);
    return this.hoy < inicio;
  }

  isWeekDisabled(periodo: PeriodoAcademico, numeroSemana: number): boolean {
    const inicioBimestre = new Date(periodo.fechaInicio);
    // Cada semana académica empieza el lunes
    const inicioSemana = new Date(inicioBimestre);
    inicioSemana.setDate(inicioBimestre.getDate() + (numeroSemana - 1) * 7);
    
    return this.hoy < inicioSemana;
  }

  isWeekIdDisabled(numeroSemana: number): boolean {
    const periodo = this.periodos.find(p => p.id == this.periodoSeleccionadoId);
    if (!periodo) return true;
    return this.isWeekDisabled(periodo, numeroSemana);
  }

  toggleCompetencia(id: number): void {
    if (this.competenciasSeleccionadasIds.has(id)) {
      this.competenciasSeleccionadasIds.delete(id);
    } else {
      this.competenciasSeleccionadasIds.add(id);
    }
  }

  generarPlanilla(): void {
    if (!this.cargaId || !this.periodoSeleccionadoId || !this.semanaSeleccionadaId || this.competenciasSeleccionadasIds.size === 0) return;

    this.isLoading = true;
    this.dirtyCells.clear();
    
    // Filtrar las competencias que se van a evaluar para las columnas
    this.competenciasAGradear = this.competencias.filter(c => this.competenciasSeleccionadasIds.has(c.id));
    const ids = Array.from(this.competenciasSeleccionadasIds).join(',');

    this.calificacionService.getPlanilla(this.cargaId, this.semanaSeleccionadaId, ids).subscribe({
      next: (res: any) => {
        this.alumnos = res.alumnos;
        this.isLoading = false;
        this.planillaGenerada = true;
        
        // --- RECUPERAR BORRADOR DE LOCALSTORAGE ---
        this.recuperarBorrador();
        
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error cargando planilla', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  cambiarConfiguracion(): void {
    this.planillaGenerada = false;
  }

  onNotaChange(estudianteId: number, competenciaId: number, event: any): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.toUpperCase().trim();
    
    // Lista de valores permitidos
    const allowed = ['AD', 'A', 'B', 'C'];
    
    // Si el valor no es vacío y no está en la lista de permitidos (o no es prefijo de AD)
    if (value !== '' && !allowed.includes(value)) {
      // Si escribieron algo que no empieza por A, o si es algo como "AX"
      value = ''; 
    }

    input.value = value;
    
    // Actualizar el modelo manualmente para asegurar sincronía
    const alumno = this.alumnos.find(a => a.estudianteId === estudianteId);
    if (alumno && alumno.notas[competenciaId.toString()]) {
      alumno.notas[competenciaId.toString()].valor = value;
    }

    const key = `${estudianteId}_${competenciaId}`;
    if (value === '') {
      this.dirtyCells.delete(key);
    } else {
      this.dirtyCells.add(key);
    }
    
    // --- GUARDAR EN LOCALSTORAGE ---
    this.guardarBorrador();
  }

  private getDraftKey(): string {
    return `kumamoto_draft_${this.cargaId}_${this.semanaSeleccionadaId}`;
  }

  private guardarBorrador(): void {
    const draft: any = {};
    this.alumnos.forEach(a => {
      this.competenciasAGradear.forEach(c => {
        const key = `${a.estudianteId}_${c.id}`;
        if (this.dirtyCells.has(key)) {
          draft[key] = a.notas[c.id.toString()].valor;
        }
      });
    });
    localStorage.setItem(this.getDraftKey(), JSON.stringify(draft));
  }

  private recuperarBorrador(): void {
    const raw = localStorage.getItem(this.getDraftKey());
    if (!raw) return;

    try {
      const draft = JSON.parse(raw);
      let recoveredCount = 0;

      this.alumnos.forEach(a => {
        this.competenciasAGradear.forEach(c => {
          const key = `${a.estudianteId}_${c.id}`;
          if (draft[key] !== undefined) {
            const celda = a.notas[c.id.toString()];
            if (celda && !celda.bloqueado) {
              celda.valor = draft[key];
              this.dirtyCells.add(key);
              recoveredCount++;
            }
          }
        });
      });

      if (recoveredCount > 0) {
        console.log(`[LocalStorage] Recuperadas ${recoveredCount} notas sin guardar.`);
      }
    } catch (e) {
      console.error('Error al recuperar borrador', e);
    }
  }

  private eliminarBorrador(): void {
    localStorage.removeItem(this.getDraftKey());
  }

  isRiesgo(notaValor: string | null | undefined): boolean {
    if (!notaValor) return false;
    if (notaValor.toUpperCase() === 'C') return true;
    
    const num = Number(notaValor);
    if (!isNaN(num) && num < 11) return true;

    return false;
  }

  isDirty(estudianteId: number, competenciaId: number): boolean {
    return this.dirtyCells.has(`${estudianteId}_${competenciaId}`);
  }

  handleKeydown(event: KeyboardEvent, currentEstudianteId: number, currentCompetenciaIdx: number, rowIdx: number): void {
    const inputs = document.querySelectorAll('.nota-input:not(:disabled)');
    const cols = this.competenciasAGradear.length;
    let targetIdx = -1;

    // Aprox index logic, but we must find it in the array of non-disabled inputs
    const currentInput = event.target as HTMLElement;
    const inputsArr = Array.from(inputs);
    const currentFlatIdx = inputsArr.indexOf(currentInput);

    if (currentFlatIdx === -1) return;

    switch (event.key) {
      case 'ArrowUp':
        targetIdx = currentFlatIdx - cols;
        break;
      case 'ArrowDown':
        targetIdx = currentFlatIdx + cols;
        break;
      case 'ArrowLeft':
        targetIdx = currentFlatIdx - 1;
        break;
      case 'ArrowRight':
        targetIdx = currentFlatIdx + 1;
        break;
      default:
        return; // No interceptar otras teclas
    }

    if (targetIdx >= 0 && targetIdx < inputsArr.length) {
      event.preventDefault();
      (inputsArr[targetIdx] as HTMLElement).focus();
    }
  }

  guardarCambios(): void {
    if (this.dirtyCells.size === 0) return;
    
    this.showModal(
      '¿Está seguro que desea guardar las calificaciones registradas? Una vez guardadas, tendrá un tiempo limitado para modificarlas.',
      'confirm',
      () => this.ejecutarGuardado()
    );
  }

  private ejecutarGuardado(): void {
    this.isSaving = true;
    const notasToSave: NotaItem[] = [];

    this.alumnos.forEach(alumno => {
      this.competenciasAGradear.forEach(comp => {
        const key = `${alumno.estudianteId}_${comp.id}`;
        if (this.dirtyCells.has(key)) {
          const celda = alumno.notas[comp.id.toString()];
          if (celda && !celda.bloqueado && celda.valor !== null && celda.valor !== undefined && celda.valor !== '') {
            notasToSave.push({
              estudianteId: alumno.estudianteId,
              competenciaId: comp.id,
              nota: celda.valor.toString().toUpperCase().trim()
            });
          }
        }
      });
    });

    if (notasToSave.length === 0) {
      this.isSaving = false;
      this.dirtyCells.clear();
      return;
    }

    this.calificacionService.bulkSave({
      cargaId: this.cargaId,
      semanaId: this.semanaSeleccionadaId,
      notas: notasToSave
    }).subscribe({
      next: () => {
        this.isSaving = false;
        this.dirtyCells.clear();
        this.eliminarBorrador(); // --- LIMPIAR LOCALSTORAGE ---
        this.showModal('Calificaciones guardadas exitosamente.', 'success');
        this.generarPlanilla();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error al guardar calificaciones', err);
        this.isSaving = false;
        const msg = err.error?.mensaje || 'Hubo un error interno en el servidor.';
        this.showModal(msg, 'error');
        this.cdr.detectChanges();
      }
    });
  }

  showModal(message: string, type: 'success' | 'error' | 'confirm', onConfirm?: () => void): void {
    this.modal = {
      show: true,
      message,
      type,
      onConfirm: onConfirm || null
    };
    this.cdr.detectChanges();
  }

  closeModal(): void {
    this.modal.show = false;
    this.cdr.detectChanges();
  }

  confirmAction(): void {
    if (this.modal.onConfirm) {
      this.modal.onConfirm();
    }
    this.closeModal();
  }
}
