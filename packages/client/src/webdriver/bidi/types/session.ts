import { Command } from './core';

export type SessionCommand =
  | SessionStatusCommand
  | SessionNewCommand
  | SessionEndCommand
  | SessionSubscribeCommand
  | SessionUnsubscribeCommand;

export interface SessionStatusCommand extends Command {
  method: 'session.status';
}

export interface SessionNewCommand extends Command {
  method: 'session.new';
  params: SessionNewParameters;
}

type SessionNewParameters = {
  capabilities: any;
};

export interface SessionEndCommand extends Command {
  method: 'session.end';
}

export interface SessionSubscribeCommand extends Command {
  method: 'session.subscribe';
  params: SubscriptionRequest;
}

export type SubscriptionRequest = {
  events: string[];
  contexts?: string[];
};

export interface SessionUnsubscribeCommand extends Command {
  method: 'session.unsubscribe';
  params: SubscriptionRequest;
}

