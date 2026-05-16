import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CargaAcademicaManager } from './components/carga-academica-manager/carga-academica-manager';

@Component({
  selector: 'app-estructura',
  standalone: true,
  imports: [CommonModule, CargaAcademicaManager],
  templateUrl: './estructura.html',
  styleUrl: './estructura.scss',
})
export class Estructura {}
