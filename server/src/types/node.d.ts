// Node.js global types for IDE - actual types come from @types/node in Docker
declare namespace NodeJS {
  interface ProcessEnv {
    [key: string]: string | undefined;
  }
}

declare var process: {
  env: NodeJS.ProcessEnv;
};

declare var console: {
  log(...data: any[]): void;
  warn(...data: any[]): void;
  error(...data: any[]): void;
  info(...data: any[]): void;
  debug(...data: any[]): void;
};

declare var __dirname: string;
declare var __filename: string;

declare module 'fs' {
  export function readFileSync(path: string, encoding?: string): string;
  export function writeFileSync(path: string, data: string): void;
}

declare module 'path' {
  export function join(...paths: string[]): string;
  export function resolve(...paths: string[]): string;
  export function dirname(path: string): string;
  export function basename(path: string): string;
}

