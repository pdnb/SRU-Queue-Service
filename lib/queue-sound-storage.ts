const listeners = new Set<() => void>();

function emitSoundStorageChange() {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeSoundStorage(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export const QUEUE_SOUND_ENABLED_KEY = "queue-sound-enabled";
export const QUEUE_SOUND_MUTED_KEY = "queue-sound-muted";

export function readSoundEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(QUEUE_SOUND_ENABLED_KEY) === "true";
}

export function writeSoundEnabled(enabled: boolean) {
  localStorage.setItem(QUEUE_SOUND_ENABLED_KEY, String(enabled));
  emitSoundStorageChange();
}

export function readSoundMuted(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(QUEUE_SOUND_MUTED_KEY) === "true";
}

export function writeSoundMuted(muted: boolean) {
  localStorage.setItem(QUEUE_SOUND_MUTED_KEY, String(muted));
  emitSoundStorageChange();
}
