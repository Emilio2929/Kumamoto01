import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../../environments/environment';

@Component({
  selector: 'app-desbloqueo-notas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './desbloqueo-notas.html',
  styleUrl: './desbloqueo-notas.scss'
})
export class DesbloqueoNotas implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private apiUrl = `${environment.apiUrl}/api`;

  form: FormGroup;
  activos: any[] = [];
  cargas: any[] = [];
  periodos: any[] = [];
  semanas: any[] = [];
  estudiantes: any[] = [];

  constructor() {
    this.form = this.fb.group({
      cargaId: ['', Validators.required],
      periodoId: [''],
      semanaId: ['', Validators.required],
      estudianteId: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.cargarActivos();
    this.cargarCargas();
    this.cargarSemanas();
  }

  cargarActivos() {
    this.http.get<any[]>(`${this.apiUrl}/desbloqueo-notas/activos`).subscribe({
      next: (data) => {
        this.activos = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  cargarCargas() {
    this.http.get<any[]>(`${this.apiUrl}/carga-academica`).subscribe({
      next: (data) => {
        this.cargas = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  cargarSemanas() {
    this.http.get<any>(`${this.apiUrl}/calificaciones/config`).subscribe({
      next: (data) => {
        this.periodos = data.periodos;
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  onPeriodoChange() {
    const periodoId = this.form.get('periodoId')?.value;
    if (!periodoId) {
      this.semanas = [];
      this.form.get('semanaId')?.setValue('');
      this.cdr.detectChanges();
      return;
    }
    const periodo = this.periodos.find(p => p.id == periodoId);
    this.semanas = periodo ? periodo.semanas : [];
    this.form.get('semanaId')?.setValue('');
    this.cdr.detectChanges();
  }

  onCargaChange() {
    const cargaId = this.form.get('cargaId')?.value;
    if (!cargaId) {
      this.estudiantes = [];
      this.form.get('estudianteId')?.setValue('');
      this.cdr.detectChanges();
      return;
    }
    // Fetch students of the carga (by getting the carga's aula's students)
    // Here we can call the students endpoint for the specific aula
    const carga = this.cargas.find(c => c.id == cargaId);
    if (carga && carga.aulaId) {
      this.http.get<any[]>(`${this.apiUrl}/matricula`).subscribe({
        next: (data) => {
          this.estudiantes = data.filter(e => e.aulaId === carga.aulaId && e.estado === 1);
          this.cdr.detectChanges();
        },
        error: (err) => console.error(err)
      });
    }
  }

  autorizar() {
    if (this.form.invalid) return;

    this.http.post(`${this.apiUrl}/desbloqueo-notas`, this.form.value).subscribe({
      next: (res: any) => {
        alert(res.mensaje || 'Permiso concedido');
        this.form.reset();
        this.cargarActivos();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        alert('Error al conceder permiso');
      }
    });
  }

  revocar(id: number) {
    if (!confirm('¿Seguro que deseas revocar este permiso?')) return;

    this.http.post(`${this.apiUrl}/desbloqueo-notas/${id}/revocar`, {}).subscribe({
      next: (res: any) => {
        alert(res.mensaje || 'Permiso revocado');
        this.cargarActivos();
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }
}
