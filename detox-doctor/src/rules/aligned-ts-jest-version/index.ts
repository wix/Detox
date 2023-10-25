import semver from 'semver';
import { FAILURE, SKIPPED, SUCCESS } from '../../constants';
import type {
  ActionResult,
  PackageManifest,
  Project,
  Rule,
  RuleContext,
  RuleDependencies,
} from '../../types';
import { aggregateRuleResults, flattenResult } from '../../utils';

export class AlignedTsJestVersion implements Rule {
  readonly id = 'DETOX-012';
  readonly alias = 'aligned-ts-jest-version';
  readonly description = `Checks whether jest and ts-jest major versions match.`;
  private readonly context: RuleContext;
  private readonly project: Project;
  private readonly manifest: PackageManifest | null;

  constructor({ context, manifest, project }: RuleDependencies) {
    this.context = context;
    this.manifest = manifest;
    this.project = project;
  }

  async check(): Promise<ActionResult> {
    const results: ActionResult[] = [this._checkDeclared()];
    if (results[0].status === FAILURE) {
      return aggregateRuleResults(results);
    }

    if (await this.project.hasDirectory('node_modules')) {
      results.push(await this._checkActual());
    }

    return aggregateRuleResults(results);
  }

  private async _checkActual(): Promise<ActionResult> {
    const jest = await this.project.getManifest('jest');
    const tsJest = await this.project.getManifest('ts-jest');

    if (!jest) {
      return {
        status: this.context.bare ? SKIPPED : FAILURE,
        message: `jest is not installed in node_modules.`,
      };
    }

    if (!tsJest) {
      return {
        status: this.context.bare ? SKIPPED : FAILURE,
        message: `ts-jest is not installed in node_modules.`,
      };
    }

    const jestMajor = semver.major(jest.version);
    const tsJestMajor = semver.major(tsJest.version);

    return flattenResult({
      status: jestMajor === tsJestMajor ? SUCCESS : FAILURE,
      failureMessage: `Actually installed jest@${jest.version} and ts-jest@${tsJest.version} major versions don't match`,
    });
  }

  private _checkDeclared(): ActionResult {
    if (!this.manifest) {
      return {
        status: SKIPPED,
        message: `Couldn't find package.json in your project.`,
      };
    }

    const jestVersion = this.manifest.getDependencyVersion('jest');
    const tsJestVersion = this.manifest.getDependencyVersion('ts-jest');

    if (!jestVersion) {
      return {
        status: SKIPPED,
        message: `jest is not declared in package.json.`,
      };
    }

    if (!tsJestVersion) {
      return {
        status: SKIPPED,
        message: `ts-jest is not declared in package.json.`,
      };
    }

    const { major: jestMajor } = semver.coerce(jestVersion) || {};
    const { major: tsJestMajor } = semver.coerce(tsJestVersion) || {};

    return flattenResult({
      status: jestMajor === tsJestMajor ? SUCCESS : FAILURE,
      failureMessage: `jest@${jestVersion} and ts-jest@${tsJestVersion} major versions don't match: ${jestMajor} vs ${tsJestMajor}`,
    });
  }
}
