import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

/** Guard base: solo verifica que exista sesión activa (JWT válido) */
export const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.estaAutenticado()) return true;

  router.navigate(['/login']);
  return false;
};

/** Guard para el módulo Directora — solo rol 'Director' */
export const directoraGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  const user   = auth.obtenerUsuario();

  if (auth.estaAutenticado() && user?.rol?.toLowerCase() === 'director') return true;

  // Si está autenticado pero con otro rol → redirige a su módulo
  if (auth.estaAutenticado() && user) {
    redirectByRole(user.rol, router);
    return false;
  }

  router.navigate(['/login']);
  return false;
};

/** Guard para el módulo Docente — solo rol 'Docente' */
export const docenteGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  const user   = auth.obtenerUsuario();

  if (auth.estaAutenticado() && user?.rol?.toLowerCase() === 'docente') return true;

  if (auth.estaAutenticado() && user) {
    redirectByRole(user.rol, router);
    return false;
  }

  router.navigate(['/login']);
  return false;
};

/** Guard para el módulo Auxiliar — solo rol 'Auxiliar' */
export const auxiliarGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  const user   = auth.obtenerUsuario();

  if (auth.estaAutenticado() && user?.rol?.toLowerCase() === 'auxiliar') return true;

  if (auth.estaAutenticado() && user) {
    redirectByRole(user.rol, router);
    return false;
  }

  router.navigate(['/login']);
  return false;
};

/** Redirige al módulo correcto según el rol del usuario autenticado */
function redirectByRole(rol: string, router: Router): void {
  const r = rol?.toLowerCase();
  if (r === 'director') router.navigate(['/dashboard/directora']);
  else if (r === 'docente')  router.navigate(['/dashboard/docente']);
  else if (r === 'auxiliar') router.navigate(['/dashboard/auxiliar']);
  else if (r === 'padre')    router.navigate(['/dashboard/padre']);
  else router.navigate(['/login']);
}
