interface Logger {
  log: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
  debug: (message: string, ...args: any[]) => void;
}

class ProductionLogger implements Logger {
  private isDev = __DEV__;

  log(message: string, ...args: any[]): void {
    if (this.isDev) {
      console.log(message, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.isDev) {
      console.warn(message, ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    // Always log errors for crash reporting, but limit in production
    if (this.isDev) {
      console.error(message, ...args);
    } else {
      // In production, only log critical errors
      if (message.includes('Critical') || message.includes('CRITICAL')) {
        console.error(message);
      }
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.isDev) {
      console.debug(message, ...args);
    }
  }
}

export const logger = new ProductionLogger(); 