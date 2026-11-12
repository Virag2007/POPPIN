type LogLevel = "debug" | "info" | "warn" | "error";

export class Logger {
  private static sanitize(message: unknown): unknown {
    if (typeof message === "string") {
      // Redact potential JWTs, tokens or secrets from logs
      return message
        .replace(/Bearer\s+[A-Za-z0-9-_.]+/gi, "Bearer [REDACTED]")
        .replace(/token=([A-Za-z0-9-_.]+)/gi, "token=[REDACTED]")
        .replace(/secret=([^\s&]+)/gi, "secret=[REDACTED]");
    }
    return message;
  }

  private static format(level: LogLevel, message: string, meta?: unknown) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [Realtime]`;
    if (meta !== undefined) {
      console[level === "debug" ? "log" : level](`${prefix} ${this.sanitize(message)}`, meta);
    } else {
      console[level === "debug" ? "log" : level](`${prefix} ${this.sanitize(message)}`);
    }
  }

  static debug(message: string, meta?: unknown) {
    if (process.env.DEBUG || process.env.NODE_ENV === "development") {
      this.format("debug", message, meta);
    }
  }

  static info(message: string, meta?: unknown) {
    this.format("info", message, meta);
  }

  static warn(message: string, meta?: unknown) {
    this.format("warn", message, meta);
  }

  static error(message: string, meta?: unknown) {
    this.format("error", message, meta);
  }
}

