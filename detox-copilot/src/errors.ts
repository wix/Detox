export class CopilotError extends Error {
    constructor(message: string, public originalError?: Error) {
        super(message);
        this.name = 'CopilotError';
    }
}
