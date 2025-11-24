/* eslint-disable import/no-unresolved,node/no-missing-import,node/no-unsupported-features/es-syntax */
import { DeviceCookie } from '../../common/drivers/DeviceCookie';

export interface DeallocOptions {
  shutdown?: boolean;
}

export interface AllocationDriverBase {
  init?(): Promise<void>;
  allocate(deviceConfig: any): Promise<DeviceCookie>;
  postAllocate?(deviceCookie: DeviceCookie, configs?: { deviceConfig: Detox.DetoxDeviceConfig }): Promise<DeviceCookie | void>;
  free(cookie: DeviceCookie, options: DeallocOptions): Promise<void>;
  cleanup?(): Promise<void>;
  emergencyCleanup?(): void;
  isRecoverableError?(error: any): boolean;
}
