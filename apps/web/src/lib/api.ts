// 统一 API 客户端。后端响应格式 { code, data, message }。
// 通过 next.config rewrites 代理到后端，cookie 同源。

export interface ApiEnvelope<T> {
  code: number;
  data: T | null;
  message: string;
}

export class ApiError extends Error {
  constructor(
    public code: number,
    message: string,
  ) {
    super(message);
  }
}

// 同源部署留空 → 走 next rewrites 的 /api 代理；跨源部署（如 GitHub Pages）
// 设 NEXT_PUBLIC_API_BASE=https://your-backend 指向后端绝对地址。
const BASE = (process.env.NEXT_PUBLIC_API_BASE || '') + '/api/v1';

async function request<T>(method: string, path: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
  const res = await fetch(BASE + path, {
    method,
    credentials: 'include',
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  let json: ApiEnvelope<T>;
  try {
    json = (await res.json()) as ApiEnvelope<T>;
  } catch {
    throw new ApiError(res.status, '网络好像走神了，请稍后再试');
  }

  if (json.code !== 0) {
    throw new ApiError(json.code, json.message || '出了点小问题');
  }
  return json.data as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown, headers?: Record<string, string>) =>
    request<T>('POST', path, body, headers),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  del: <T>(path: string) => request<T>('DELETE', path),
};

// ---------- 领域类型（与后端 view 对齐） ----------
export interface Profile {
  userId: string;
  nickname: string;
  role: string;
  level: string;
  trustScore: number;
  interestedTopics: string[];
  blockedTopics: string[];
  dailyWriteQuota: number;
  dailyClaimQuota: number;
}

export interface LetterReader {
  letterId: string;
  title: string | null;
  salutation: string | null;
  content: string;
  signature: string | null;
  signedDate: string | null;
  category: string;
  mood: string | null;
  fuzzyTime: string;
}

export interface ClaimResult {
  claimId: string;
  expiresAt: string;
  letter: LetterReader;
}

export interface SentLetter {
  letterId: string;
  title: string | null;
  category: string;
  status: string;
  replyCount: number;
  createdAt: string;
}

export interface ReceivedReply {
  replyId: string;
  letterId: string;
  letterTitle: string | null;
  content: string;
  isFavorited: boolean;
  fuzzyTime: string;
}

export interface ReplyingItem {
  claimId: string;
  letterId: string;
  letterTitle: string | null;
  content: string;
  expiresAt: string;
}

export interface NotificationItem {
  id: string;
  type: string;
  payload: { message?: string; letterId?: string };
  isRead: boolean;
  createdAt: string;
}
