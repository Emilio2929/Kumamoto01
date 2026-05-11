import { Component, EventEmitter, Input, Output, inject, ChangeDetectorRef, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalificacionService, Competencia } from '../../../../../../../core/services/calificacion.service';

@Component({
  selector: 'app-gestion-competencias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-competencias.component.html',
  styleUrls: ['./gestion-competencias.component.scss']
})
export class GestionCompetenciasComponent implements OnChanges {
  @Input() cargaId!: number;
  @Input() competencias: Competencia[] = [];
  @Output() competenciaCambiada = new EventEmitter<void>();

  private calificacionService = inject(CalificacionService);
  private cdr = inject(ChangeDetectorRef);

  nuevaCompetenciaCodigo = 'C1';
  nuevaCompetenciaNombre = '';
  isSaving = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['competencias']) {
      this.nuevaCompetenciaCodigo = `C${this.competencias.length + 1}`;
    }
  }

  agregarCompetencia(): void {
    if (!this.nuevaCompetenciaCodigo.trim() || !this.nuevaCompetenciaNombre.trim()) return;

    this.isSaving = true;
    this.calificacionService.createCompetencia(
      this.cargaId,
      this.nuevaCompetenciaCodigo.trim(),
      this.nuevaCompetenciaNombre.trim()
    ).subscribe({
      next: () => {
        this.isSaving = false;
        this.nuevaCompetenciaNombre = '';
        this.competenciaCambiada.emit();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error al guardar', err);
        this.isSaving = false;
        this.cdr.detectChanges();
      }
    });
  }

  eliminarCompetencia(id: number): void {
    if (!confirm('¿Seguro que deseas eliminar esta competencia? Se perderán las notas asociadas si existen.')) return;

    this.calificacionService.deleteCompetencia(id).subscribe({
      next: () => {
        this.competenciaCambiada.emit();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error al eliminar', err);
        this.cdr.detectChanges();
      }
    });
  }
}
