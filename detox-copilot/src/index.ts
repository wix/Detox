import { Copilot } from "@/Copilot";

function init(config: CopilotConfig): void {
    Copilot.init(config);
}

function act(action: string): Promise<any> {
    return Copilot.getInstance().act(action);
}

function expect(assertion: string): Promise<boolean> {
    return Copilot.getInstance().expect(assertion);
}

export { init, act, expect };
