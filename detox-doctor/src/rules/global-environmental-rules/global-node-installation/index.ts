import { execSync } from 'child_process';
import type { ActionResult, Rule } from '../../../types';
import { FAILURE, SUCCESS } from '../../../constants';
import { flattenResult } from '../../../utils';

export class GlobalNodeInstallationRule implements Rule {
  readonly id = 'DETOX-00?';
  readonly alias = 'global-node-installation';
  readonly description = `Checks if Node is installed globally and which version is installed.`;

  async check(): Promise<ActionResult> {
    const nodeVersion = execSync('node -v').toString().replace('\n', '');
    const nodeLocation = execSync('which node').toString().replace('\n', '');

    return flattenResult({
      status: nodeVersion && nodeLocation ? SUCCESS : FAILURE,
      successMessage: `Node version ${nodeVersion} globally installed at ${nodeLocation}`,
      failureMessage: [
        `Node not globally installed`,
        `Ensure it is installed via the Node website, a tool such as Homebrew, or an version manager like NVM`,
      ],
    });
  }
}
