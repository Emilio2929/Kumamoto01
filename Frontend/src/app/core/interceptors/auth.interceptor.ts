import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  
  const cloned = req.clone({
    withCredentials: true // Obligatorio para enviar/recibir cookies HttpOnly en peticiones cruzadas o seguras
  });

  return next(cloned).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        sessionStorage.removeItem('kumamoto_user');
        router.navigate(['/']);
      }
      return throwError(() => error);
    })
  );
};
