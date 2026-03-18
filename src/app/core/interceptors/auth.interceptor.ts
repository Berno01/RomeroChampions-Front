import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SessionService } from '../services/session.service';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const sessionService = inject(SessionService);

  const isBackendApiRequest = req.url.startsWith(environment.apiUrl);

  // Excluir endpoints de autenticación (login)
  // Excluir también servicios externos (Cloudinary, etc.) para evitar CORS/preflight.
  if (!isBackendApiRequest || req.url.includes('/auth/login')) {
    return next(req);
  }

  // Clonar la petición y agregar el header X-Usuario-Id
  const clonedRequest = req.clone({
    setHeaders: {
      'X-Usuario-Id': sessionService.userId().toString(),
    },
  });

  return next(clonedRequest);
};
