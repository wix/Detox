import { Copilot } from "@/Copilot";
import {CopilotFacade} from "@/CopilotFacade";

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
