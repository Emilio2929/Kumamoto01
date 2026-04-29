import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AulasManager } from './components/aulas-manager/aulas-manager';
import { CursosManager } from './components/cursos-manager/cursos-manager';
import { GradosSeccionesManager } from './components/grados-secciones-manager/grados-secciones-manager';
import { CargaAcademicaManager } from './components/carga-academica-manager/carga-academica-manager';
import { AuxiliaresManager } from './components/auxiliares-manager/auxiliares-manager';

@Component({
  selector: 'app-estructura',
  standalone: true,
  imports: [CommonModule, AulasManager, CursosManager, GradosSeccionesManager, CargaAcademicaManager, AuxiliaresManager],
  templateUrl: './estructura.html',
  styleUrl: './estructura.scss',
})
export class Estructura {
  activeTab: 'aulas' | 'cursos' | 'grados' | 'carga' | 'auxiliares' = 'aulas';

  setTab(tab: 'aulas' | 'cursos' | 'grados' | 'carga' | 'auxiliares') {
    this.activeTab = tab;
  }
}
