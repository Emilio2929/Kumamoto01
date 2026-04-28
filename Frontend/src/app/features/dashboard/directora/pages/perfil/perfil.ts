import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-perfil',
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.scss',
})
export class Perfil {
  // Simulación de datos actuales
  userData = {
    username: 'admin.directora',
    email: 'directora@kumamoto.edu.pe',
    phone: '987654321'
  };

  passwords = {
    current: '',
    newPass: '',
    confirmPass: ''
  };

  saveProfile() {
    alert("¡Datos de contacto actualizados correctamente!");
  }

  updatePassword() {
    if (!this.passwords.current || !this.passwords.newPass || !this.passwords.confirmPass) {
      alert("Por favor, complete todos los campos de contraseña.");
      return;
    }
    if (this.passwords.newPass !== this.passwords.confirmPass) {
      alert("La nueva contraseña y la confirmación no coinciden.");
      return;
    }
    
    // Simular éxito
    alert("¡Contraseña actualizada con éxito! Se cerrará la sesión actual en el próximo ingreso.");
    this.passwords = { current: '', newPass: '', confirmPass: '' };
  }
}
