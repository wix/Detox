export interface Command {
  id: number;
  method: string;
  params?: unknown;
}

export type Message = CommandResponse | ErrorResponse | Event;

export interface CommandResponse {
  id: number;
  response: unknown;

  [key: string]: any;
}

export type ErrorResponse = {
  id: number | null;
  error: ErrorCode;
  message: string;
  stacktrace?: string;
};

export type ErrorCode =
  | 'invalid argument'
  | 'invalid session id'
  | 'move target out of bounds'
  | 'no such alert'
  | 'no such element'
  | 'no such frame'
  | 'no such handle'
  | 'no such node'
  | 'no such script'
  | 'session not created'
  | 'unable to capture screen'
  | 'unable to close browser'
  | 'unknown command'
  | 'unknown error'
  | 'unsupported operation';


export interface Event {
  method: string;
  params?: unknown;
}

