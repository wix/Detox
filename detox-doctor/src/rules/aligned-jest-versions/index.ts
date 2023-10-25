import { FAILURE, SKIPPED, SUCCESS } from '../../constants';
import type { ActionResult, Project, Rule, RuleContext, RuleDependencies } from '../../types';
import { aggregateRuleResultsAsync, flattenResult } from '../../utils';

export class AlignedJestVersionsRule implements Rule {
  readonly id = 'DETOX-009';
  readonly alias = 'aligned-jest-versions';
  readonly description = `Checks whether jest's own dependencies are aligned with the version of the main package.`;
  private readonly context: RuleContext;
  private readonly project: Project;

  constructor({ context, project }: RuleDependencies) {
    this.context = context;
    this.project = project;
  }

  async check(): Promise<ActionResult> {
    const jest = await this.project.getManifest('jest');
    if (!jest) {
      return {
        status: this.context.bare ? SKIPPED : FAILURE,
        message: `jest is not installed.`,
      };
    }

    return aggregateRuleResultsAsync(
      ['jest-circus', 'jest-runner', '@jest/core', '@jest/transform'].map((moduleName) =>
        this._doCheck(moduleName, jest.version),
      ),
    );
  }

  private async _doCheck(packageName: string, expectedVersion: string): Promise<ActionResult> {
    const manifest = await this.project.getManifest(packageName);

    return flattenResult({
      status: manifest?.version === expectedVersion ? SUCCESS : FAILURE,
      failureMessage: manifest
        ? `${packageName} has a different version (${manifest.version}) than jest: ${expectedVersion}`
        : `${packageName} is not installed.`,
    });
  }
}
