import { Component } from '@angular/core';
import { CursosManager } from '../estructura/components/cursos-manager/cursos-manager';

@Component({
  selector: 'app-cursos-page',
  standalone: true,
  imports: [CursosManager],
  template: `<app-cursos-manager></app-cursos-manager>`,
})
export class CursosPage {}
