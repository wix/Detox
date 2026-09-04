// Device allocation — the wire shape. The `type` is a driver name the server
// resolves (spec 015) and the `device` query and descriptor are
// that driver's own vocabulary, carried verbatim: the core never parses
// either. The typed view per driver name lives client-side (`detox/client`'s
// `AllocationMap`, which a driver package augments).

export interface AllocateDeviceRequest {
  type: string;
  /** The driver's own query — validated by the driver, opaque on the wire. */
  device?: unknown;
}

/** The device's own app-facing listener (spec 015): what a manual launch must dial. */
export interface AllocateDeviceApps {
  serverUrl: string;
}

export interface AllocateDeviceResponse {
  /** Server-scoped handle for this allocation; every later call carries it. */
  allocationId: string;
  /** The driver's descriptor of the device (`{udid}` on iOS) — verbatim from the driver. */
  device: unknown;
  /** Human-readable device name, e.g. `iPhone 17`. */
  name: string;
  /** Human-readable OS, e.g. `iOS 26.5`. */
  os: string;
  /** Allocation always boots, so this is `booted` on success. */
  state: 'booted';
  /**
   * The device's own app gateway (spec 015, additive): its `serverUrl` is a
   * loopback address on the machine that owns the device, forwarded untouched
   * through a relay.
   */
  apps: AllocateDeviceApps;
}
