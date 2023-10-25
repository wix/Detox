import * as semver from 'semver';
import { FAILURE, SKIPPED, SUCCESS } from '../../constants';
import type {
  ActionResult,
  DependencyCategory,
  PackageManifest,
  Project,
  Rule,
  RuleContext,
  RuleDependencies,
} from '../../types';
import { flattenResult } from '../../utils';

const SCOPES: DependencyCategory[] = ['peerDependencies'];

export class UnsupportedJestVersionRule implements Rule {
  readonly id = 'DETOX-003';
  readonly alias = 'unsupported-jest-version';
  readonly description = `This rule checks if the installed jest version is supported by Detox, and suggests updating or downgrading the version if it is not compatible.`;
  readonly needs = ['DETOX-001'];
  private readonly context: RuleContext;
  private readonly manifest: PackageManifest | null;
  private readonly project: Project;

  constructor({
    context,
    manifest,
    project,
  }: Pick<RuleDependencies, 'context' | 'manifest' | 'project'>) {
    this.context = context;
    this.manifest = manifest;
    this.project = project;
  }

  async check(): Promise<ActionResult> {
    if (!this.manifest) {
      return {
        status: SKIPPED,
        message: `Couldn't find package.json in your project.`,
      };
    }

    if (this.context.bare) {
      return {
        status: SKIPPED,
        message: `Cannot run without node_modules installed.`,
      };
    }

    const detox = await this.project.getManifest('detox');
    if (!detox) {
      return {
        status: SKIPPED,
        message: `Detox is not installed in node_modules, skipping.`,
      };
    }

    const expectedJest = detox.getDependencyVersion('jest', SCOPES);
    if (!expectedJest) {
      return {
        status: SKIPPED,
        message: `Your Detox version doesn't impose any restrictions on Jest, skipping.`,
      };
    }

    const jest = await this.project.getManifest('jest');
    if (!jest) {
      return {
        status: FAILURE,
        message: `Jest is not installed in node_modules, cannot verify compatibility.`,
      };
    }

    const actualJest = jest.version;
    const minVersion = semver.coerce(expectedJest);
    const actionName = minVersion
      ? semver.lt(actualJest, minVersion)
        ? 'upgrade'
        : 'downgrade'
      : 'switch';

    return flattenResult({
      status: semver.satisfies(actualJest, expectedJest) ? SUCCESS : FAILURE,
      successMessage: `jest@${actualJest} is compatible with detox@${detox.version}`,
      failureMessage: [
        `jest@${actualJest} is not compatible with detox@${detox.version}`,
        `Please ${actionName} jest to range: ${expectedJest}`,
      ],
    });
  }
}
