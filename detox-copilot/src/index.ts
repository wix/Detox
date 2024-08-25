import {DetoxCopilot} from "./DetoxCopilot";

module.exports = {
    init: DetoxCopilot.init,
    act: DetoxCopilot.getInstance().act,
    expect: DetoxCopilot.getInstance().expect
}
