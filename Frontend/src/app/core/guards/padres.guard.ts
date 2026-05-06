import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const padresGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.obtenerUsuario();

  if (authService.estaAutenticado() && user?.rol?.toLowerCase() === 'padre') {
    return true;
  }

  router.navigate(['/login']);
  return false;
};
