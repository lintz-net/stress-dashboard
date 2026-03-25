import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { APP_CONFIG } from '../config/app-config';

export const baseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  const config = inject(APP_CONFIG);
  if (req.url.startsWith('http://') || req.url.startsWith('https://')) {
    return next(req);
  }
  const apiReq = req.clone({ url: `${config.apiBaseUrl}${req.url}` });
  return next(apiReq);
};
