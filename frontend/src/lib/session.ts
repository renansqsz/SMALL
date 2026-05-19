import { ApiError, getJson } from "@/lib/api";
import type { SessionResponse } from "@/lib/types";

let cachedSession: SessionResponse | null | undefined;
let pendingSession: Promise<SessionResponse | null> | null = null;
let sessionGeneration = 0;

export function clearSessionCache() {
  sessionGeneration += 1;
  cachedSession = undefined;
  pendingSession = null;
}

export function seedSession(session: SessionResponse | null) {
  sessionGeneration += 1;
  cachedSession = session;
  pendingSession = null;
}

export async function getSession(force = false): Promise<SessionResponse | null> {
  if (!force) {
    if (cachedSession !== undefined) {
      return cachedSession;
    }

    if (pendingSession) {
      return pendingSession;
    }
  }

  const requestGeneration = sessionGeneration;
  const request = getJson<SessionResponse>("/auth/me")
    .then((session) => {
      if (sessionGeneration === requestGeneration) {
        cachedSession = session;
      }
      return session;
    })
    .catch((error: unknown) => {
      if (error instanceof ApiError && error.status === 401) {
        if (sessionGeneration === requestGeneration) {
          cachedSession = null;
        }
        return null;
      }

      throw error;
    })
    .finally(() => {
      if (sessionGeneration === requestGeneration) {
        pendingSession = null;
      }
    });

  pendingSession = request;
  return request;
}
