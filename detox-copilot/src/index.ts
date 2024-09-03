import { Copilot } from "@/Copilot";
import {CopilotFacade, Config} from "@/types";

const copilot: CopilotFacade = {
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

export default copilot;

export {
    CopilotFacade,
    Config,
    PromptHandler,
    TestingFrameworkDriver,
    TestingFrameworkAPI,
    TestingFrameworkAPIMethod
} from './types';
