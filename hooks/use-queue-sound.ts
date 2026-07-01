"use client";

import { useCallback, useSyncExternalStore } from "react";
import { unlockAudio } from "@/lib/queue-announcement";
import {
  readSoundEnabled,
  readSoundMuted,
  subscribeSoundStorage,
  writeSoundEnabled,
  writeSoundMuted,
} from "@/lib/queue-sound-storage";

export function useQueueSound() {
  const enabled = useSyncExternalStore(
    subscribeSoundStorage,
    readSoundEnabled,
    () => false,
  );
  const muted = useSyncExternalStore(
    subscribeSoundStorage,
    readSoundMuted,
    () => false,
  );

  const enableSound = useCallback(async () => {
    await unlockAudio();
    writeSoundEnabled(true);
  }, []);

  const toggleMuted = useCallback(() => {
    writeSoundMuted(!readSoundMuted());
  }, []);

  return {
    ready: true,
    enabled,
    muted,
    canAnnounce: enabled && !muted,
    enableSound,
    toggleMuted,
  };
}
