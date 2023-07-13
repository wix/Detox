import { Event } from './core';
import { Source, StackTrace } from './script';

export interface LogEntryAddedEvent extends Event {
  method: 'log.entryAdded';
  params: LogEntry;
}

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogEntry =
  | GenericLogEntry
  | ConsoleLogEntry
  | JavascriptLogEntry;

export interface BaseLogEntry {
  level: LogLevel;
  source: Source;
  text: string | null;
  timestamp: number;
  stackTrace?: StackTrace;
}

export interface GenericLogEntry extends BaseLogEntry {
  type: 'text';
}

export interface ConsoleLogEntry extends BaseLogEntry {
  type: 'console';
  method: string;
  args: unknown[];
}

export interface JavascriptLogEntry extends BaseLogEntry {
  type: 'javascript';
}
