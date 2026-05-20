import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EstructuraService, GradoDetalleDto, CursoComboDto } from '../../../../../core/services/estructura';
import { CalificacionService, Competencia } from '../../../../../core/services/calificacion.service';

@Component({
  selector: 'app-competencias-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './competencias.html',
  styleUrl: './competencias.scss'
})
export class CompetenciasPage implements OnInit {
  private estSvc = inject(EstructuraService);
  private calSvc = inject(CalificacionService);
  private cdr = inject(ChangeDetectorRef);

  // Combos
  grados: GradoDetalleDto[] = [];
  cursos: CursoComboDto[] = [];

  // Selected values
  selectedGradoId: number | null = null;
  selectedCursoId: number | null = null;

  // State
  competencias: Competencia[] = [];
  loading = false;
  saving = false;
  errorMsg: string | null = null;

  // Competency form / modal state
  showModal = false;
  isEditing = false;
  editingCompId: number | null = null;
  compCodigo = '';
  compNombre = '';

  // Delete modal confirmation
  compToDelete: Competencia | null = null;
  deleteError: string | null = null;

  ngOnInit(): void {
    this.loadGrados();
    this.loadCursos();
  }

  loadGrados(): void {
    this.estSvc.getGrados().subscribe({
      next: (data) => {
        this.grados = data.filter(g => g.estado === 1);
        this.cdr.markForCheck();
      }
    });
  }

  loadCursos(): void {
    this.estSvc.getCursosCombo().subscribe({
      next: (data) => {
        this.cursos = data;
        this.cdr.markForCheck();
      }
    });
  }

  onFilterChange(): void {
    if (this.selectedGradoId && this.selectedCursoId) {
      this.loadCompetencias();
    } else {
      this.competencias = [];
      this.showModal = false;
    }
  }

  loadCompetencias(): void {
    if (!this.selectedGradoId || !this.selectedCursoId) return;
    this.loading = true;
    this.errorMsg = null;
    this.calSvc.getCompetenciasAdmin(this.selectedCursoId, this.selectedGradoId).subscribe({
      next: (data) => {
        this.competencias = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = 'Error al cargar las competencias del curso y grado.';
        this.cdr.markForCheck();
      }
    });
  }

  openAddForm(): void {
    this.isEditing = false;
    this.editingCompId = null;
    this.compCodigo = `C${this.competencias.length + 1}`;
    this.compNombre = '';
    this.showModal = true;
    this.cdr.markForCheck();
  }

  openEditForm(comp: Competencia): void {
    this.isEditing = true;
    this.editingCompId = comp.id;
    this.compCodigo = comp.codigo;
    this.compNombre = comp.nombre;
    this.showModal = true;
    this.cdr.markForCheck();
  }

  closeModal(): void {
    this.showModal = false;
    this.editingCompId = null;
    this.cdr.markForCheck();
  }

  saveCompetencia(): void {
    if (!this.selectedCursoId || !this.selectedGradoId) return;
    if (!this.compCodigo.trim() || !this.compNombre.trim()) {
      this.errorMsg = 'El código y nombre son obligatorios.';
      return;
    }

    this.saving = true;
    this.errorMsg = null;

    const obs = this.isEditing && this.editingCompId
      ? this.calSvc.updateCompetenciaAdmin(this.editingCompId, this.compCodigo.trim(), this.compNombre.trim())
      : this.calSvc.createCompetenciaAdmin(this.selectedCursoId, this.selectedGradoId, this.compCodigo.trim(), this.compNombre.trim());

    obs.subscribe({
      next: () => {
        this.saving = false;
        this.showModal = false;
        this.loadCompetencias();
      },
      error: (err) => {
        this.saving = false;
        this.errorMsg = err?.error?.mensaje ?? 'Error al guardar la competencia.';
        this.cdr.markForCheck();
      }
    });
  }

  confirmDelete(comp: Competencia): void {
    this.compToDelete = comp;
    this.deleteError = null;
    this.cdr.markForCheck();
  }

  cancelDelete(): void {
    this.compToDelete = null;
    this.deleteError = null;
    this.cdr.markForCheck();
  }

  deleteCompetencia(): void {
    if (!this.compToDelete) return;
    this.calSvc.deleteCompetenciaAdmin(this.compToDelete.id).subscribe({
      next: () => {
        this.compToDelete = null;
        this.loadCompetencias();
      },
      error: (err) => {
        this.deleteError = err?.error?.mensaje ?? 'No se pudo eliminar la competencia. Es posible que ya tenga calificaciones vinculadas.';
        this.cdr.markForCheck();
      }
    });
  }
}
