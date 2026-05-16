import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../../core/services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-perfil',
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.scss',
})
export class Perfil implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  userData = {
    username: '', // Institutional email (read-only)
    email: '',    // Personal email
    phone: ''     // WhatsApp
  };

  passwords = {
    current: '',
    newPass: '',
    confirmPass: ''
  };

  modal = {
    show: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'info' | 'confirm',
    onConfirm: () => {},
    onCancel: () => {}
  };

  showModal(title: string, message: string, type: 'success' | 'error' | 'info' | 'confirm' = 'info', onConfirm: () => void = () => {}, onCancel: () => void = () => {}) {
    this.modal = { show: true, title, message, type, onConfirm, onCancel };
    this.cdr.detectChanges();
  }

  confirmModal() {
    const action = this.modal.onConfirm;
    this.modal.show = false;
    this.cdr.detectChanges();
    if (action) action();
  }

  closeModal() {
    const action = this.modal.type === 'confirm' ? this.modal.onCancel : this.modal.onConfirm;
    this.modal.show = false;
    this.cdr.detectChanges();
    if (action) action();
  }

  ngOnInit() {
    this.authService.getProfile().subscribe({
      next: (res: any) => {
        this.userData.username = res.correo || '';
        this.userData.email = res.correoPersonal || '';
        this.userData.phone = res.telefono || '';
      },
      error: () => this.showModal('Error', 'Error al cargar el perfil.', 'error')
    });
  }

  saveProfile() {
    this.showModal('Confirmar Actualización', '¿Está seguro que desea actualizar sus datos de contacto?', 'confirm', () => {
      this.authService.updateProfile({
        correoPersonal: this.userData.email,
        telefono: this.userData.phone
      }).subscribe({
        next: (res: any) => {
          this.showModal('Perfil Actualizado', res.mensaje || "¡Datos de contacto actualizados correctamente!", 'success');
        },
        error: (err: any) => {
          this.showModal('Error', err.error?.mensaje || "Error al actualizar los datos.", 'error');
        }
      });
    });
  }

  updatePassword() {
    if (!this.passwords.current || !this.passwords.newPass || !this.passwords.confirmPass) {
      this.showModal('Atención', "Por favor, complete todos los campos de contraseña.", 'error');
      return;
    }
    if (this.passwords.newPass !== this.passwords.confirmPass) {
      this.showModal('Atención', "La nueva contraseña y la confirmación no coinciden.", 'error');
      return;
    }
    
    this.showModal('Cambiar Contraseña', '¿Está seguro que desea cambiar su contraseña? Su sesión actual se cerrará.', 'confirm', () => {
      this.authService.changePassword({
        contrasenaActual: this.passwords.current,
        nuevaContrasena: this.passwords.newPass
      }).subscribe({
        next: (res: any) => {
          this.showModal('Seguridad', "¡Contraseña actualizada con éxito! Por favor inicie sesión nuevamente.", 'success', () => {
            this.passwords = { current: '', newPass: '', confirmPass: '' };
            this.authService.cerrarSesion();
            this.router.navigate(['/']);
          });
        },
        error: (err: any) => {
          this.showModal('Error', err.error?.mensaje || "Error al actualizar la contraseña.", 'error');
        }
      });
    });
  }
}
