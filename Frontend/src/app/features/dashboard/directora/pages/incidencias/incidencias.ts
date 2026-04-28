import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-incidencias',
  imports: [CommonModule, FormsModule],
  templateUrl: './incidencias.html',
  styleUrl: './incidencias.scss',
})
export class Incidencias {
  showModal = false;
  
  nuevoRegistro = {
    alumno: '',
    tipo: 'Disciplina',
    gravedad: 'Leve',
    notificar: false,
    descripcion: ''
  };

  tipos = ['Disciplina', 'Académico', 'Asistencia'];
  gravedades = ['Leve', 'Moderada', 'Grave'];

  openModal() {
    this.showModal = true;
    this.nuevoRegistro = { alumno: '', tipo: 'Disciplina', gravedad: 'Leve', notificar: false, descripcion: '' };
  }

  closeModal() {
    this.showModal = false;
  }

  onGravedadChange() {
    if (this.nuevoRegistro.gravedad === 'Grave') {
      this.nuevoRegistro.notificar = true;
    }
  }

  saveIncidencia() {
    if (!this.nuevoRegistro.alumno || !this.nuevoRegistro.descripcion) {
      alert("Por favor complete el alumno y la descripción.");
      return;
    }
    
    let msg = "Incidencia registrada correctamente.";
    if (this.nuevoRegistro.notificar) {
      msg += "\nSe ha enviado una notificación automática al apoderado vía WhatsApp/Correo.";
    }
    
    alert(msg);
    this.closeModal();
  }
}
