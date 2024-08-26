import { Copilot } from "@/Copilot";

export const init = (config: CopilotConfig) => {
    Copilot.init(config);
}

export const act = async (action: string) => {
    return await Copilot.getInstance().act(action);
}

export const expect = async (assertion: string) => {
    await Copilot.getInstance().expect(assertion);
}
