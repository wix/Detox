import { Copilot } from "@/Copilot";
import {CopilotFacade, Config} from "@/types";

const copilot: CopilotFacade = {
    init: (config: Config) => {
        Copilot.init(config);
    },
    reset: () => {
        Copilot.getInstance().reset();
    },
    perform: (intent: string) => {
        return Copilot.getInstance().perform(intent);
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
