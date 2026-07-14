export interface LogContext {
  [key: string]: unknown;
}

export class Logger {
  private static formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : "";
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  public static info(message: string, context?: LogContext): void {
    console.info(this.formatMessage("info", message, context));
  }

  public static warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage("warn", message, context));
  }

  public static error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext = error instanceof Error 
      ? { ...context, errorName: error.name, errorMessage: error.message, errorStack: error.stack } 
      : { ...context, errorRaw: String(error) };
    console.error(this.formatMessage("error", message, errorContext));
  }

  public static debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV !== "production") {
      console.debug(this.formatMessage("debug", message, context));
    }
  }
}
