import { Copilot } from "@/Copilot";
import {CopilotFacade, Config} from "@/types";

const copilot: CopilotFacade = {
    init: (config: Config) => {
        Copilot.init(config);
    },
    reset: () => {
        Copilot.getInstance().reset();
    },
    perform: async (steps: string | string[]) => {
        const intents = Array.isArray(steps) ? steps : [steps];
        const results = new Array<any>();
        for (const intent of intents) {
            results.push(await Copilot.getInstance().performStep(intent));
        }

        return results.length === 1 ? results[0] : results;
    }
};

export default copilot;

export {
    CopilotFacade,
    Config,
    PromptHandler,
    TestingFrameworkDriver,
    TestingFrameworkAPICatalog,
    TestingFrameworkAPICatalogItem
} from './types';
