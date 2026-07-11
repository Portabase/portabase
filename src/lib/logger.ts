import pino, { type Logger } from "pino";

// const isProd = process.env.NODE_ENV === "production";
const isProd =true;
const defaultLevel = isProd ? "info" : "debug";
const level = (process.env.LOG_LEVEL ?? defaultLevel) as pino.Level;

function getLocalTimestamp() {
  const date = new Date();

  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone: process.env.TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
    .format(date)
    .replace(" ", "T");

  return `,"time":"${formatted}"`;
}

export const logger: Logger = pino({
  level: level,
  base: null,
  ...(isProd
    ? {
        timestamp: getLocalTimestamp,
        formatters: {
          level(label) {
            return { level: label.toUpperCase() };
          },
        },
      }
    : {
        timestamp: getLocalTimestamp,
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "yyyy-mm-dd HH:MM:ss",
            ignore: "pid,hostname",
            levelFirst: true,
          },
        },
      }),
});
