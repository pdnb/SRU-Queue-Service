const THAI_LETTER_NAMES: Record<string, string> = {
  A: "เอ",
  B: "บี",
  C: "ซี",
  D: "ดี",
  E: "อี",
  F: "เอฟ",
  G: "จี",
  H: "เอช",
  I: "ไอ",
  J: "เจ",
  K: "เค",
  L: "แอล",
  M: "เอ็ม",
  N: "เอ็น",
  O: "โอ",
  P: "พี",
  Q: "คิว",
  R: "อาร์",
  S: "เอส",
  T: "ที",
  U: "ยู",
  V: "วี",
  W: "ดับเบิลยู",
  X: "เอ็กซ์",
  Y: "วาย",
  Z: "แซด",
};

const THAI_DIGIT_NAMES = [
  "ศูนย์",
  "หนึ่ง",
  "สอง",
  "สาม",
  "สี่",
  "ห้า",
  "หก",
  "เจ็ด",
  "แปด",
  "เก้า",
] as const;

const DISPLAY_NO_PATTERN = /^([A-Za-z]+)(\d+)$/;

export function speakDisplayNo(displayNo: string): string {
  const match = DISPLAY_NO_PATTERN.exec(displayNo.trim());
  if (!match) return displayNo;

  const prefix = match[1].toUpperCase();
  const digits = match[2];

  const prefixSpoken = [...prefix]
    .map((char) => THAI_LETTER_NAMES[char] ?? char)
    .join(" ");

  const digitsSpoken = [...digits]
    .map((digit) => {
      const index = Number(digit);
      return Number.isInteger(index) && index >= 0 && index <= 9
        ? THAI_DIGIT_NAMES[index]
        : digit;
    })
    .join(" ");

  return `${prefixSpoken} ${digitsSpoken}`;
}

export function buildDisplayAnnouncementText(
  displayNo: string,
  counterName: string,
): string {
  return `เชิญหมายเลข ${speakDisplayNo(displayNo)} ที่ ${counterName}`;
}

export function buildTicketAnnouncementText(
  displayNo: string,
  counterName: string,
): string {
  return `คิวของคุณ ${speakDisplayNo(displayNo)} กรุณาไปที่ ${counterName}`;
}

const REPEAT_PAUSE_MS = 600;

type AnnouncementJob = {
  text: string;
  repeats: number;
  withChime: boolean;
};

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioContext) {
    const AudioContextClass =
      window.AudioContext ??
      (window as Window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return null;
    audioContext = new AudioContextClass();
  }
  return audioContext;
}

export async function unlockAudio(): Promise<void> {
  const context = getAudioContext();
  if (!context) return;

  if (context.state === "suspended") {
    await context.resume();
  }

  const buffer = context.createBuffer(1, 1, 22050);
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.connect(context.destination);
  source.start();
}

async function playSyntheticChime(): Promise<void> {
  const context = getAudioContext();
  if (!context) return;

  if (context.state === "suspended") {
    await context.resume();
  }

  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(880, now);
  oscillator.frequency.exponentialRampToValueAtTime(660, now + 0.12);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.35, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.5);

  await new Promise((resolve) => setTimeout(resolve, 520));
}

export async function playChime(): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    const audio = new Audio("/chime.mp3");
    audio.volume = 0.7;
    await audio.play();
    await new Promise<void>((resolve) => {
      audio.onended = () => resolve();
      audio.onerror = () => resolve();
    });
  } catch {
    await playSyntheticChime();
  }
}

function speak(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      resolve();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "th-TH";
    utterance.rate = 0.92;
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class AnnouncementQueue {
  private jobs: AnnouncementJob[] = [];
  private running = false;

  enqueue(job: AnnouncementJob) {
    this.jobs.push(job);
    void this.run();
  }

  private async run() {
    if (this.running) return;
    this.running = true;

    while (this.jobs.length > 0) {
      const job = this.jobs.shift();
      if (!job) break;

      if (job.withChime) {
        await playChime();
      }

      for (let round = 0; round < job.repeats; round += 1) {
        if (round > 0) {
          await delay(REPEAT_PAUSE_MS);
        }
        await speak(job.text);
      }
    }

    this.running = false;
  }
}

const queue = new AnnouncementQueue();

export function announceForDisplay(displayNo: string, counterName: string) {
  queue.enqueue({
    text: buildDisplayAnnouncementText(displayNo, counterName),
    repeats: 2,
    withChime: true,
  });
}

export function announceForTicket(displayNo: string, counterName: string) {
  queue.enqueue({
    text: buildTicketAnnouncementText(displayNo, counterName),
    repeats: 1,
    withChime: true,
  });
}
