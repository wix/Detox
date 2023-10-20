import chalk from 'chalk';
import inquirer from 'inquirer';
import type { RuleRegistry, Logger, UI, UIDependencies, NormalizedActionResult } from '../types';

const { red: pre, blue: em, bold: b } = chalk;

export class ConsoleUI implements UI {
  private readonly actionRegistry: RuleRegistry;
  private readonly doctorVersion: string;
  private readonly logger: Logger;

  constructor(deps: UIDependencies) {
    this.actionRegistry = deps.actionRegistry;
    this.doctorVersion = deps.doctorVersion;
    this.logger = deps.logger;
  }

  async listRules(): Promise<void> {
    this.logger.log(`Welcome to ${b('detox-doctor')}@${em(this.doctorVersion)} !`);
    this.logger.log('Below you can find the available rules:\n');
    for (const rule of this.actionRegistry.getRules()) {
      this.logger.log(`${em(rule.alias)} (id: ${em(rule.id)})`);
      this.logger.log(`\t${rule.description}\n`);
    }
  }

  async promptFix(ruleId: string, checkResult: NormalizedActionResult): Promise<boolean> {
    const { alias } = this.actionRegistry.getRule(ruleId);

    const result = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'fix',
        message: `Rule ${em(alias)} found an issue:\n${pre(
          checkResult.message.join('\n'),
        )}\n\nWould you like to fix it?`,
        default: true,
      },
    ]);

    return result.fix;
  }

  async promptRules(selectedRuleIds: string[]) {
    const ids = new Set(selectedRuleIds);
    const { choices } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'choices',
        message: 'Select rules to run',
        choices: this.actionRegistry.getRules().map((rule) => ({
          name: rule.alias,
          value: rule.alias,
          default: ids.has(rule.id) || ids.has(rule.alias),
        })),
      },
    ]);

    return choices;
  }

  async printHeader(): Promise<void> {
    this.logger.log(`Detox Doctor (${this.doctorVersion})`);
    this.logger.log('------------');
  }
}
