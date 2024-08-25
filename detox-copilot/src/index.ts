import {DetoxCopilot} from "./DetoxCopilot";

module.exports = {
    initCopilot: DetoxCopilot.init,
    act: DetoxCopilot.getInstance().act,
    expect: DetoxCopilot.getInstance().expect
}
