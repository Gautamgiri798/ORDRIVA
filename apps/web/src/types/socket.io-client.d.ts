declare module 'socket.io-client' {
  export interface Socket {
    id?: string;
    connected: boolean;
    on(event: string, callback: (...args: any[]) => void): this;
    off(event: string, callback?: (...args: any[]) => void): this;
    emit(event: string, ...args: any[]): this;
    close(): this;
    disconnect(): this;
  }

  export function io(uri?: string, opts?: any): Socket;
  export default io;
}

