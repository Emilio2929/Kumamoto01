import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ComunicadosService, Comunicado, CreateComunicadoDto } from '../../../../../core/services/comunicados';

@Component({
  selector: 'app-comunicados',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './comunicados.html',
  styleUrl: './comunicados.scss'
})
export class Comunicados implements OnInit {
  private svc = inject(ComunicadosService);
  private cdr = inject(ChangeDetectorRef);
  private fb = inject(FormBuilder);

  comunicados: Comunicado[] = [];
  loading = true;
  error: string | null = null;

  modalCrear = false;
  modoEdicion = false;
  comunicadoSeleccionadoId: number | null = null;
  comunicadoForm: FormGroup;
  guardando = false;

  constructor() {
    this.comunicadoForm = this.fb.group({
      titulo: ['', [Validators.required, Validators.minLength(5)]],
      contenido: ['', [Validators.required, Validators.minLength(10)]],
      urlImagen: [''],
      urlArchivo: [''],
      esImportante: [false]
    });
  }

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading = true;
    this.svc.getAll().subscribe({
      next: (data) => {
        this.comunicados = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.error = 'Error al cargar comunicados.';
        this.cdr.markForCheck();
      }
    });
  }

  abrirModal(): void {
    this.modoEdicion = false;
    this.comunicadoSeleccionadoId = null;
    this.comunicadoForm.reset({
      titulo: '',
      contenido: '',
      urlImagen: '',
      urlArchivo: '',
      esImportante: false
    });
    this.modalCrear = true;
  }

  editar(c: Comunicado): void {
    this.modoEdicion = true;
    this.comunicadoSeleccionadoId = c.id;
    this.comunicadoForm.patchValue({
      titulo: c.titulo,
      contenido: c.contenido,
      urlImagen: c.urlImagen,
      urlArchivo: c.urlArchivo,
      esImportante: c.esImportante
    });
    this.modalCrear = true;
    this.cdr.markForCheck();
  }

  cerrarModal(): void {
    this.modalCrear = false;
  }

  guardar(): void {
    if (this.comunicadoForm.invalid) {
      this.comunicadoForm.markAllAsTouched();
      return;
    }
    
    this.guardando = true;
    const dto: CreateComunicadoDto = this.comunicadoForm.value;

    const request = this.modoEdicion && this.comunicadoSeleccionadoId
      ? this.svc.update(this.comunicadoSeleccionadoId, dto)
      : this.svc.create(dto);

    request.subscribe({
      next: () => {
        this.guardando = false;
        this.modalCrear = false;
        this.cargar();
      },
      error: () => {
        this.guardando = false;
        alert('Error al procesar el comunicado');
      }
    });
  }

  eliminar(id: number): void {
    if (!confirm('¿Deseas eliminar este comunicado?')) return;
    this.svc.delete(id).subscribe(() => this.cargar());
  }
}
