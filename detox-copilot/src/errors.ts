export class CopilotError extends Error {
    constructor(message: string, public originalError?: Error) {
        super(message);
        this.name = 'CopilotError';
    }
}

export class ActionError extends CopilotError {
    constructor(message: string, originalError?: Error) {
        super(message, originalError);
        this.name = 'ActionError';
    }
}

export class AssertionError extends CopilotError {
    constructor(message: string, originalError?: Error) {
        super(message, originalError);
        this.name = 'AssertionError';
    }
}
