/* eslint-disable import/no-unresolved,node/no-missing-import,node/no-unsupported-features/es-syntax */
import GenyInstance from '../../../allocation/drivers/android/genycloud/services/dto/GenyInstance';
import { DeviceCookie } from '../DeviceCookie';

interface AndroidDeviceCookie extends DeviceCookie {
  adbName: string;
}

interface GenycloudEmulatorCookie extends AndroidDeviceCookie {
  instance: GenyInstance;
}
