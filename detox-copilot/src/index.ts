import { Copilot } from "@/Copilot";

export const copilot = {
    init: (config: CopilotConfig) => {
        Copilot.init(config);
    },
    act: async (action: string) => {
        return await Copilot.getInstance().act(action);
    },
    expect: async (assertion: string) => {
        await Copilot.getInstance().expect(assertion);
    }
}
