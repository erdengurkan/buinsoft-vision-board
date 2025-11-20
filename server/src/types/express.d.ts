// Type declarations for IDE - actual types come from @types/express in Docker
declare module 'express' {
  import { Request, Response, NextFunction, Router } from 'express-serve-static-core';
  export { Request, Response, NextFunction, Router };
  
  interface Express {
    use: (path: string | any, ...handlers: any[]) => any;
    get: (path: string, ...handlers: any[]) => any;
    post: (path: string, ...handlers: any[]) => any;
    patch: (path: string, ...handlers: any[]) => any;
    delete: (path: string, ...handlers: any[]) => any;
    listen: (port: number, host: string, callback: () => void) => any;
  }
  
  interface ExpressStatic {
    (root: string): any;
  }
  
  interface ExpressJson {
    (): any;
  }
  
  function express(): Express;
  namespace express {
    export function static(root: string): ExpressStatic;
    export function json(): ExpressJson;
    function Router(): {
      use: (path: string | any, ...handlers: any[]) => any;
      get: (path: string, ...handlers: any[]) => any;
      post: (path: string, ...handlers: any[]) => any;
      patch: (path: string, ...handlers: any[]) => any;
      delete: (path: string, ...handlers: any[]) => any;
    };
    export { Router };
  }
  
  export default express;
  export const Router: () => {
    use: (path: string | any, ...handlers: any[]) => any;
    get: (path: string, ...handlers: any[]) => any;
    post: (path: string, ...handlers: any[]) => any;
    patch: (path: string, ...handlers: any[]) => any;
    delete: (path: string, ...handlers: any[]) => any;
  };
}

