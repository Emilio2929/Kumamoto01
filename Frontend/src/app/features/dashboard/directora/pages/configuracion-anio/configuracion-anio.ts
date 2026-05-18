import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { EstructuraService } from '../../../../../core/services/estructura';

@Component({
  selector: 'app-configuracion-anio',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './configuracion-anio.html',
  styleUrls: ['./configuracion-anio.scss']
})
export class ConfiguracionAnioComponent implements OnInit {
  private estructuraService = inject(EstructuraService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  configForm!: FormGroup;
  loading = true;
  saving = false;
  mensajeExito = '';
  mensajeError = '';
  mostrarModalAuth = false;
  contrasenaAuth = '';

  ngOnInit() {
    this.initForm();
    this.cargarConfiguracion();
  }

  initForm() {
    this.configForm = this.fb.group({
      anioLectivo: ['2026', Validators.required],
      bimestresCount: [4, [Validators.required, Validators.min(1), Validators.max(6)]],
      bimestres: this.fb.array([])
    });
  }

  get bimestresFormArray() {
    return this.configForm.get('bimestres') as FormArray;
  }

  cargarConfiguracion(preserveExito = false) {
    this.loading = true;
    this.mensajeError = '';
    if (!preserveExito) {
      this.mensajeExito = '';
    }

    this.estructuraService.getConfiguracionAnio('2026').subscribe({
      next: (data: any) => {
        if (data && data.bimestres && data.bimestres.length > 0) {
          this.configForm.patchValue({
            anioLectivo: data.anioLectivo || '2026',
            bimestresCount: data.bimestres.length
          });

          this.bimestresFormArray.clear();
          data.bimestres.forEach((b: any) => {
            this.bimestresFormArray.push(this.fb.group({
              numero: [b.numero, Validators.required],
              nombre: [b.nombre || `${b.numero}° Bimestre`, Validators.required],
              fechaInicio: [b.fechaInicio || '', Validators.required],
              fechaFin: [b.fechaFin || '', Validators.required],
              semanasCount: [b.semanasCount || 9, [Validators.required, Validators.min(1), Validators.max(52)]]
            }));
          });
        } else {
          // Generar 4 bimestres por defecto
          this.generarBimestresPorDefecto(4);
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.mensajeError = 'Error al cargar la configuración del año lectivo.';
        this.generarBimestresPorDefecto(4);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  generarBimestresPorDefecto(count: number) {
    this.bimestresFormArray.clear();
    const fechasDefecto = [
      { inicio: '2026-03-16', fin: '2026-05-15' },
      { inicio: '2026-05-18', fin: '2026-07-24' },
      { inicio: '2026-08-10', fin: '2026-10-09' },
      { inicio: '2026-10-12', fin: '2026-12-18' }
    ];

    for (let i = 1; i <= count; i++) {
      const f = fechasDefecto[i - 1] || { inicio: '2026-01-01', fin: '2026-12-31' };
      this.bimestresFormArray.push(this.fb.group({
        numero: [i, Validators.required],
        nombre: [`${i}° Bimestre`, Validators.required],
        fechaInicio: [f.inicio, Validators.required],
        fechaFin: [f.fin, Validators.required],
        semanasCount: [9, [Validators.required, Validators.min(1), Validators.max(52)]]
      }));
    }
  }

  actualizarConteoBimestres() {
    const count = this.configForm.get('bimestresCount')?.value || 4;
    const currentLength = this.bimestresFormArray.length;

    if (count > currentLength) {
      for (let i = currentLength + 1; i <= count; i++) {
        this.bimestresFormArray.push(this.fb.group({
          numero: [i, Validators.required],
          nombre: [`${i}° Bimestre`, Validators.required],
          fechaInicio: ['2026-01-01', Validators.required],
          fechaFin: ['2026-12-31', Validators.required],
          semanasCount: [9, [Validators.required, Validators.min(1), Validators.max(52)]]
        }));
      }
    } else if (count < currentLength) {
      for (let i = currentLength - 1; i >= count; i--) {
        this.bimestresFormArray.removeAt(i);
      }
    }
    this.cdr.detectChanges();
  }

  abrirModalConfirmacion() {
    if (this.configForm.invalid) {
      this.mensajeError = 'Por favor, completa correctamente todos los campos obligatorios del formulario.';
      this.configForm.markAllAsTouched();
      return;
    }

    this.mensajeError = '';
    this.mensajeExito = '';
    this.contrasenaAuth = '';
    this.mostrarModalAuth = true;
    this.cdr.detectChanges();
  }

  cerrarModalAuth() {
    if (this.saving) return;
    this.mostrarModalAuth = false;
    this.contrasenaAuth = '';
    this.cdr.detectChanges();
  }

  guardarConfiguracion() {
    if (!this.contrasenaAuth) {
      this.mensajeError = 'La contraseña de confirmación es requerida.';
      this.cdr.detectChanges();
      return;
    }

    this.saving = true;
    this.mensajeError = '';
    this.mensajeExito = '';

    const formValue = this.configForm.value;
    const payload = {
      anioLectivo: formValue.anioLectivo,
      contrasenaConfirmacion: this.contrasenaAuth,
      bimestres: formValue.bimestres
    };

    this.estructuraService.saveConfiguracionAnio(payload).subscribe({
      next: (res: any) => {
        this.saving = false;
        this.mostrarModalAuth = false;
        this.contrasenaAuth = '';
        this.mensajeExito = res?.mensaje || 'Configuración del año lectivo guardada exitosamente.';
        this.cargarConfiguracion(true);
      },
      error: (err: any) => {
        console.error('Error al guardar configuración:', err);
        this.saving = false;
        this.mostrarModalAuth = false;
        this.contrasenaAuth = '';
        this.mensajeError = err?.error?.mensaje || 'Error al guardar la configuración en la base de datos.';
        this.cdr.detectChanges();
      }
    });
  }
}
