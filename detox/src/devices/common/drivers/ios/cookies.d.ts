/* eslint-disable import/no-unresolved,node/no-missing-import,node/no-unsupported-features/es-syntax */
import { DeviceCookie } from '../DeviceCookie';

interface IosSimulatorCookie extends DeviceCookie {
  udid: string;
  type?: string;
  bootArgs?: string;
  headless?: boolean;
}
