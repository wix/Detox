import which from 'which';

import type { ActionResult, Rule } from '../../../types';
import { FAILURE, SUCCESS } from '../../../constants';
import { flattenResult } from '../../../utils';

export class GlobalNodeInstallationRule implements Rule {
  readonly id = 'DETOX-001';
  readonly alias = 'global-node-installation';
  readonly description = `Checks if Node is installed globally and which version is installed.`;

  async check(): Promise<ActionResult> {
    const nodeVersion = process.version;
    const nodeLocation = await which('node');
    console.log('LOGGING NODE version', nodeVersion);
    console.log('LOGGING WHICH NODE', nodeLocation);

    return flattenResult({
      status: nodeVersion && nodeLocation ? SUCCESS : FAILURE,
      successMessage: `Node ${nodeVersion} globally installed at ${nodeLocation}`,
      failureMessage: [
        `Node not globally installed`,
        `Ensure it is installed via the Node website, a tool such as Homebrew, or an version manager like NVM`,
      ],
    });
  }
}
