import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token =
    sessionStorage.getItem('access_token') ||
    sessionStorage.getItem('token') ||
    sessionStorage.getItem('accessToken');

  // ---------------------------------------------------------
  // NO TOKEN
  // ---------------------------------------------------------

  if (!token) {
    return next(req);
  }

  // ---------------------------------------------------------
  // ATTACH JWT
  // ---------------------------------------------------------

  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  return next(authReq);
};
