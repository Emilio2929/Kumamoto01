import { Component } from '@angular/core';
import { GradosSeccionesManager } from '../estructura/components/grados-secciones-manager/grados-secciones-manager';

@Component({
  selector: 'app-grados-secciones-page',
  standalone: true,
  imports: [GradosSeccionesManager],
  template: `<app-grados-secciones-manager></app-grados-secciones-manager>`,
})
export class GradosSeccionesPage {}
