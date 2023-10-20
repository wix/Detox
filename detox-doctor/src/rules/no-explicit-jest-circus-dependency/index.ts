import semver from 'semver';
import { FAILURE, SKIPPED, SUCCESS } from '../../constants';
import type { RuleDependencies, PackageManifest, Rule, ActionResult } from '../../types';
import { flattenResult } from '../../utils';

export class NoExplicitJestCircusDependencyRule implements Rule {
  readonly id = 'DETOX-001';
  readonly alias = 'no-explicit-jest-circus-dependency';
  readonly description = `This rule ensures jest-circus is not declared as a dependency, because it is brought by Jest 27.x and later by default.`;

  private readonly manifest: PackageManifest | null;

  constructor({ manifest }: Pick<RuleDependencies, 'manifest'>) {
    this.manifest = manifest;
  }

  async check(): Promise<ActionResult> {
    if (!this.manifest) {
      return {
        status: SKIPPED,
        message: `Couldn't find package.json in your project.`,
      };
    }

    const jest = this.manifest.getDependencyVersion('jest');
    const jestVersion = jest ? semver.coerce(jest) : { major: 29 };
    if (!jestVersion) {
      return {
        status: SKIPPED,
        message: `The project is using non-semver version of jest: ${jest}`,
      };
    }

    if (jestVersion.major < 27) {
      return {
        status: SKIPPED,
        message: `The project is using jest@${jest}, which is not affected by this rule`,
      };
    }

    return flattenResult({
      status: this.manifest.findDependency('jest-circus').length > 0 ? FAILURE : SUCCESS,
      failureMessage: 'Project should not have jest-circus as a dependency',
    });
  }

  async fix(): Promise<ActionResult> {
    const version = this.manifest?.getDependencyVersion('jest-circus');
    return flattenResult({
      status: this.manifest!.deleteDependency('jest-circus') ? SUCCESS : FAILURE,
      successMessage: `Removed jest-circus@${version} from dependencies`,
      failureMessage: `Failed to remove jest-circus@${version} from dependencies`,
    });
  }
}
