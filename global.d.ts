declare module 'better-sqlite3' {
  interface Statement {
    run(...params: any[]): any;
    get(...params: any[]): any;
    all(...params: any[]): any[];
  }
  interface Database {
    prepare(sql: string): Statement;
    exec(sql: string): void;
    pragma(text: string): void;
  }
  const DatabaseConstructor: {
    new (filename: string): Database;
  };
  export default DatabaseConstructor;
}

declare module 'chrono-node' {
  export interface ParsedComponent {
    date(): Date;
  }
  export interface ParsedResult {
    text: string;
    start?: ParsedComponent;
    end?: ParsedComponent;
  }
  export function parse(text: string, ref?: Date, options?: Record<string, unknown>): ParsedResult[];
  const chrono: { parse: typeof parse };
  export default chrono;
}

declare module 'node:child_process' {
  export const spawn: any;
  export const spawnSync: any;
}

declare module 'node:http' {
  const http: any;
  export default http;
  export function get(options: any, callback: (response: any) => void): any;
}

declare module 'node:fs' {
  const fs: any;
  export default fs;
}

declare module 'node:path' {
  const path: any;
  export default path;
  export function join(...parts: string[]): string;
  export function dirname(input: string): string;
  export function isAbsolute(p: string): boolean;
}

declare const process: any;
