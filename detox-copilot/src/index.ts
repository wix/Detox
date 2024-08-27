import { Copilot } from "@/Copilot";

export const copilot = {
    init: (config: Config) => {
        Copilot.init(config);
    },
    reset: () => {
        Copilot.getInstance().reset();
    },
    act: async (action: string) => {
        return await Copilot.getInstance().execute({
            type: 'action',
            value: action
        });
    },
    assert: async (assertion: string) => {
        return await Copilot.getInstance().execute({
            type: 'assertion',
            value: assertion
        });
    }
}
