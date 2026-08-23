// The 009↔010 seam (spec 009): `detox test` resolves the
// config once and writes this shape to a 0600 temp file named by
// DETOX_CONFIG_SNAPSHOT_PATH; the runner side (spec 010) JSON.parses it and
// maps it onto compat's `init` options — it re-resolves nothing. The type
// lives here so 010 imports a type and structurally cannot import a
// resolver. Unknown config keys ride through verbatim (the index
// signatures), so a future consumer never changes the format.

/** The v21 device query — the closed three-field matcher. */
export interface ConfigSnapshotQuery {
  model?: string;
  os?: string;
  deviceId?: string;
}

export interface ConfigSnapshotClient {
  /** Always present in a written snapshot — the run-scoped server fills it in. */
  server: string;
  /** Only when one is configured — auth is opt-in and off by default. */
  token?: string;
  [key: string]: unknown;
}

export interface ConfigSnapshotApp {
  name: string;
  /** Optional — derived client-side at `init`, never invented here. */
  bundleId?: string;
  /** Resolved absolute against the CLI's cwd. */
  binaryPath?: string;
  [key: string]: unknown;
}

export interface ConfigSnapshotDevice {
  type: string;
  query: ConfigSnapshotQuery;
  [key: string]: unknown;
}

export interface ConfigSnapshot {
  configurationName: string;
  client: ConfigSnapshotClient;
  apps: ConfigSnapshotApp[];
  device: ConfigSnapshotDevice;
  [key: string]: unknown;
}
