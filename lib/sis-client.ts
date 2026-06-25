export interface SisStudent {
  studentId: string;
  prefix: string;
  firstName: string;
  lastName: string;
  fullName: string;
  picture: string;
}

export interface SisClient {
  lookupStudent(studentId: string): Promise<SisStudent | null>;
}

const MOCK_STUDENTS: Record<string, SisStudent> = {
  "64010001": {
    studentId: "64010001",
    prefix: "นาย",
    firstName: "สมชาย",
    lastName: "ใจดี",
    fullName: "สมชาย ใจดี",
    picture: "https://i.pravatar.cc/300",
  },
  "64010002": {
    studentId: "64010002",
    prefix: "นางสาว",
    firstName: "สมหญิง",
    lastName: "รักเรียน",
    fullName: "สมหญิง รักเรียน",
    picture: "https://i.pravatar.cc/300",
  },
  "64010003": {
    studentId: "64010003",   
    prefix: "นาย", 
    firstName: "วิชัย",
    lastName: "เก่งมาก",
    fullName: "วิชัย เก่งมาก",
    picture: "https://i.pravatar.cc/300",
  },
};

const cache = new Map<string, { student: SisStudent; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

function getCached(studentId: string): SisStudent | null {
  const entry = cache.get(studentId);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(studentId);
    return null;
  }
  return entry.student;
}

function setCache(student: SisStudent) {
  cache.set(student.studentId, {
    student,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

class MockSisClient implements SisClient {
  async lookupStudent(studentId: string): Promise<SisStudent | null> {
    const cached = getCached(studentId);
    if (cached) return cached;

    const student = MOCK_STUDENTS[studentId] ?? null;
    if (student) setCache(student);
    return student;
  }
}

class HttpSisClient implements SisClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
  ) {}

  async lookupStudent(studentId: string): Promise<SisStudent | null> {
    const cached = getCached(studentId);
    if (cached) return cached;

    const response = await fetch(
      `${this.baseUrl}/get_user/${encodeURIComponent(studentId)}?api_token=${this.apiKey}`,
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: "application/json",
        },
        cache: "no-store",
      },
    );

    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error(`SIS API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      code?: string;
      prefix_th?: string;
      first_name_th?: string;
      last_name_th?: string;
      fullName?: string;
      picture?: string;
    };

    const student: SisStudent = {
      studentId: data.code ?? studentId,
      prefix: data.prefix_th ?? "",
      firstName: data.first_name_th ?? "",
      lastName: data.last_name_th ?? "",
      fullName:
        data.fullName ??
        `${data.prefix_th ?? ""}${data.first_name_th ?? ""} ${data.last_name_th ?? ""}`.trim(),
      picture: data.picture ?? "",
    };

    setCache(student);
    return student;
  }
}

export function createSisClient(): SisClient {
  if (process.env.SIS_MOCK === "true" || !process.env.SIS_API_URL) {
    return new MockSisClient();
  }

  return new HttpSisClient(
    process.env.SIS_API_URL,
    process.env.SIS_API_KEY ?? "",
  );
}

export const sisClient = createSisClient();
