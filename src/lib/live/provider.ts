/**
 * Live classroom provider abstraction.
 *
 * EntreVault owns the classroom *experience* (layout, chat, whiteboard, roster,
 * attendance, recording metadata). The real-time media layer — camera, mic,
 * screen share and server-side recording — is delegated to an external provider
 * (LiveKit, Daily, Agora, 100ms, ...).
 *
 * NOTHING in this file fakes media. Until a provider is configured, the app must
 * clearly say so; see `DEV_PLACEHOLDER_PROVIDER`.
 *
 * To connect a real provider:
 *   1. Add its credentials as backend secrets (never in frontend code).
 *   2. Create an edge function that mints a short-lived, per-user room token
 *      after verifying the caller's course access.
 *   3. Implement `LiveProviderAdapter` for that provider and register it below.
 */

export type ClassroomRole = "teacher" | "student";

export interface JoinRequest {
  sessionId: string;
  roomName: string;
  userId: string;
  displayName: string;
  role: ClassroomRole;
}

export interface JoinGrant {
  /** Short-lived token minted server-side. */
  token: string;
  /** Provider websocket / room URL. */
  url: string;
}

export interface LiveProviderAdapter {
  id: string;
  label: string;
  /** True only when real credentials + a token endpoint are wired up. */
  isConfigured: boolean;
  /** Capabilities the classroom UI should enable. */
  capabilities: {
    camera: boolean;
    microphone: boolean;
    screenShare: boolean;
    serverRecording: boolean;
    participantMute: boolean;
  };
  requestJoinGrant(request: JoinRequest): Promise<JoinGrant>;
}

/**
 * Development placeholder. It is intentionally NOT functional: it advertises no
 * media capabilities and throws if anything tries to join a media room.
 */
export const DEV_PLACEHOLDER_PROVIDER: LiveProviderAdapter = {
  id: "placeholder",
  label: "Not connected (development placeholder)",
  isConfigured: false,
  capabilities: {
    camera: false,
    microphone: false,
    screenShare: false,
    serverRecording: false,
    participantMute: false,
  },
  async requestJoinGrant() {
    throw new Error(
      "No live video provider is connected yet. Connect LiveKit, Daily, Agora or 100ms to enable camera, microphone, screen sharing and recording.",
    );
  },
};

const registry: Record<string, LiveProviderAdapter> = {
  [DEV_PLACEHOLDER_PROVIDER.id]: DEV_PLACEHOLDER_PROVIDER,
};

export function registerLiveProvider(adapter: LiveProviderAdapter) {
  registry[adapter.id] = adapter;
}

export function getLiveProvider(id?: string | null): LiveProviderAdapter {
  return (id && registry[id]) || DEV_PLACEHOLDER_PROVIDER;
}

export function liveProviderIds() {
  return Object.keys(registry);
}
