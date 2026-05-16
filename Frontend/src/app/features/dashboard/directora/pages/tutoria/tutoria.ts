import { Component } from '@angular/core';
import { TutoriaManagerComponent } from '../estructura/components/tutoria-manager/tutoria-manager';

@Component({
  selector: 'app-tutoria-page',
  standalone: true,
  imports: [TutoriaManagerComponent],
  template: `<app-tutoria-manager></app-tutoria-manager>`,
})
export class TutoriaPage {}
