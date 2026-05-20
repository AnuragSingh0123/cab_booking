// import { HttpInterceptorFn } from '@angular/common/http';

// export const authInterceptor: HttpInterceptorFn = (req, next) => {
//    if (!req.url.includes('localhost:7000')) {
//     return next(req);
//   }

//   const token = localStorage.getItem('token');

//   if (!token) {

//     return next(req);
//   }

//   const clonedReq = req.clone({
//     setHeaders: {
//       Authorization: `Bearer ${token}`
//     }
//   });

//   return next(clonedReq);
// };


import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // 1. Keep your existing external domain guard exactly as it is
  if (!req.url.includes('localhost:7000')) {
    return next(req);
  }

  // 2. Set withCredentials once right here. 
  // This ensures BOTH token and tokenless requests (like login) carry cookies.
  const baseReq = req.clone({ withCredentials: true });

  // 3. Your existing localStorage check remains untouched
  const token = localStorage.getItem('token');

  if (!token) {
    return next(baseReq); // Pass the credential-enabled request forward
  }

  // 4. If a token exists, add the header on top of the credential-enabled request
  const clonedReq = baseReq.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(clonedReq);
};