import {CopilotError} from "@/errors/CopilotError";

export class CodeEvaluationError extends CopilotError {
    constructor(message: string, public originalError?: Error) {
        super(message, originalError);
        this.name = 'CodeEvaluationError';
    }
}
