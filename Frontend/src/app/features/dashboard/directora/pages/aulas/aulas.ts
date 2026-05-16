import { Component } from '@angular/core';
import { AulasManager } from '../estructura/components/aulas-manager/aulas-manager';

@Component({
  selector: 'app-aulas-page',
  standalone: true,
  imports: [AulasManager],
  template: `<app-aulas-manager></app-aulas-manager>`,
})
export class AulasPage {}
