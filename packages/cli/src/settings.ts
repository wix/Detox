/** The `client` section's settings — same mechanism as `SERVER_SETTINGS`. */
import { z } from 'zod';
import type { SettingDescriptor } from '@detox-remote/core';

const WS_URL = z
  .string()
  .regex(/^wss?:\/\//i, 'must be a ws:// or wss:// URL');

export const CLIENT_SETTINGS = [
  {
    key: 'server',
    schema: WS_URL,
    env: 'DETOX_CLIENT_SERVER',
    help: 'The Detox Server (or relay) this project dials, ws:// or wss://',
  },
  {
    key: 'token',
    schema: z.string().min(1),
    // No `strictEnv`: unlike a daemon's own token, this one presents to a
    // server rather than gating a door — falling back to the file is safe.
    env: 'DETOX_CLIENT_TOKEN',
    help: "That server's bearer token, when it has auth on",
  },
] as const satisfies readonly SettingDescriptor[];
