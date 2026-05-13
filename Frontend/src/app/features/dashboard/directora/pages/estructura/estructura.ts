import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AulasManager } from './components/aulas-manager/aulas-manager';
import { CursosManager } from './components/cursos-manager/cursos-manager';
import { GradosSeccionesManager } from './components/grados-secciones-manager/grados-secciones-manager';
import { CargaAcademicaManager } from './components/carga-academica-manager/carga-academica-manager';
import { AuxiliaresManager } from './components/auxiliares-manager/auxiliares-manager';
import { TutoriaManagerComponent } from './components/tutoria-manager/tutoria-manager';

@Component({
  selector: 'app-estructura',
  standalone: true,
  imports: [CommonModule, AulasManager, CursosManager, GradosSeccionesManager, CargaAcademicaManager, AuxiliaresManager, TutoriaManagerComponent],
  templateUrl: './estructura.html',
  styleUrl: './estructura.scss',
})
export class Estructura {
  activeTab: 'aulas' | 'cursos' | 'grados' | 'carga' | 'auxiliares' | 'tutoria' = 'aulas';

  setTab(tab: 'aulas' | 'cursos' | 'grados' | 'carga' | 'auxiliares' | 'tutoria') {
    this.activeTab = tab;
  }
}
