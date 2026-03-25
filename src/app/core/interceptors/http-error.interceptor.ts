import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let message = 'Erro desconhecido';

      if (error.status === 0) {
        message = 'Sem conexão com o servidor. Verifique se a API está rodando em localhost:8080.';
      } else if (error.status === 404) {
        message = `Recurso não encontrado (404): ${req.url}`;
      } else if (error.status === 400) {
        const detail = error.error?.message || error.error?.error || 'Requisição inválida';
        message = `Dados inválidos: ${detail}`;
      } else if (error.status === 409) {
        message = 'Conflito: o teste já está neste estado.';
      } else if (error.status >= 500) {
        message = `Erro no servidor (${error.status}). Tente novamente.`;
      } else {
        message = `Erro ${error.status}: ${error.message}`;
      }

      snackBar.open(message, 'Fechar', {
        duration: 5000,
        panelClass: ['error-snack'],
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });

      return throwError(() => error);
    })
  );
};