import type { DetoxDoctorOptions, UI } from '../types';
import type { RuleRunner } from './rule';

export type DetoxDoctorConfig = {
  ruleRunner: RuleRunner;
  options: DetoxDoctorOptions;
  ui: UI;
};

export class DetoxDoctor {
  constructor(protected readonly config: DetoxDoctorConfig) {}

  async listRules() {
    await this.config.ui.listRules();
  }

  async run() {
    const { ruleRunner, options, ui } = this.config;
    await ui.printHeader();

    const userSelectedRuleIds = options.selectedRuleIds;
    // previously, we had a prompt here to ask the user which rules they want to run
    const selectedRuleIds = userSelectedRuleIds;

    return await ruleRunner.run(selectedRuleIds);
  }
}
