import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AulasManager } from './components/aulas-manager/aulas-manager';
import { CursosManager } from './components/cursos-manager/cursos-manager';
import { GradosSeccionesManager } from './components/grados-secciones-manager/grados-secciones-manager';
import { CargaAcademicaManager } from './components/carga-academica-manager/carga-academica-manager';

@Component({
  selector: 'app-estructura',
  imports: [CommonModule, AulasManager, CursosManager, GradosSeccionesManager, CargaAcademicaManager],
  templateUrl: './estructura.html',
  styleUrl: './estructura.scss',
})
export class Estructura {
  activeTab: 'aulas' | 'cursos' | 'grados' | 'carga' = 'aulas';

  setTab(tab: 'aulas' | 'cursos' | 'grados' | 'carga') {
    this.activeTab = tab;
  }
}
