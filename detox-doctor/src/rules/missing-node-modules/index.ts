import { FAILURE, SKIPPED, SUCCESS } from '../../constants';
import type { ActionResult, Project, Rule, RuleContext, RuleDependencies } from '../../types';
import { aggregateRuleResultsAsync, flattenResult } from '../../utils';

export class MissingNodeModulesRule implements Rule {
  private static packages = ['jest', 'ts-jest', '@types/jest'];

  readonly id = 'DETOX-006';
  readonly alias = 'missing-node-modules';
  readonly description = `This rule checks for any required packages that are missing from the node_modules/ and suggests investigating why they are not available even after installation.`;
  readonly context: RuleContext;

  private readonly project: Project;

  constructor({ context, project }: RuleDependencies) {
    this.context = context;
    this.project = project;
  }

  async check(): Promise<ActionResult> {
    if (await this.project.hasDirectory('node_modules')) {
      return aggregateRuleResultsAsync(this._doCheck());
    }

    return {
      status: this.context.bare ? SKIPPED : FAILURE,
      message: `node_modules/ is missing. Run \`npm install\` to install dependencies.`,
    };
  }

  private *_doCheck() {
    for (const packageName of MissingNodeModulesRule.packages) {
      yield async () => {
        const isInstalled = await this.project.isModuleInstalled(packageName);

        return flattenResult({
          status: isInstalled ? SUCCESS : FAILURE,
          failureMessage: `${packageName} is missing from node_modules. Run \`npm ls ${packageName}\` to investigate why it is not installed.`,
        });
      };
    }
  }
}
