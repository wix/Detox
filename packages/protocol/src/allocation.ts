// Device allocation - type-safe request → response binding

export interface AllocationMap {
  'ios.simulator': {
    request: { id?: string; name?: string; type?: string; os?: string };
    response: { udid: string };
  };
  'ios.device': {
    request: { id?: string; name?: string };
    response: { udid: string };
  };
  'android.emulator': {
    request: { avdName?: string };
    response: { adbName: string };
  };
  'android.device': {
    request: { adbName?: string };
    response: { adbName: string };
  };
}

export type DeviceType = keyof AllocationMap;

export interface AllocateDeviceRequest<T extends DeviceType = DeviceType> {
  type: T;
  device?: AllocationMap[T]['request'];
}

export interface AllocateDeviceResponse<T extends DeviceType = DeviceType> {
  /** Server-scoped handle for this allocation; every later call carries it. */
  allocationId: string;
  device: AllocationMap[T]['response'];
  /** Human-readable device name, e.g. `iPhone 17`. */
  name: string;
  /** Human-readable OS, e.g. `iOS 26.5`. */
  os: string;
  /** Allocation always boots, so this is `booted` on success. */
  state: 'booted';
}

