import { Component } from '@angular/core';
import { AuxiliaresManager } from '../estructura/components/auxiliares-manager/auxiliares-manager';

@Component({
  selector: 'app-auxiliares-page',
  standalone: true,
  imports: [AuxiliaresManager],
  template: `<app-auxiliares-manager></app-auxiliares-manager>`,
})
export class AuxiliaresPage {}
