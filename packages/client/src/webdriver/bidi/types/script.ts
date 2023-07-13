import { BrowsingContext } from './browsing-context';

export type Realm = string;

export type Source = {
  realm: Realm;
  context?: BrowsingContext;
};

export type StackTrace = {
  callFrames: StackFrame[];
}

export type StackFrame = {
  columnNumber: number;
  functionName: string;
  lineNumber: number;
  url: string;
};
