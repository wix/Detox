import { Copilot } from "@/Copilot";

export type CopilotFacade = {
    init: (config: Config) => void;
    reset: () => void;
    act: (action: string) => Promise<any>;
    assert: (assertion: string) => Promise<any>;
};

export const copilot: CopilotFacade = {
    init: (config: Config) => {
        Copilot.init(config);
    },
    reset: () => {
        Copilot.getInstance().reset();
    },
    act: (action: string) => {
        return Copilot.getInstance().perform({
            type: 'action',
            value: action
        });
    },
    assert: (assertion: string) => {
        return Copilot.getInstance().perform({
            type: 'assertion',
            value: assertion
        });
    }
};
