export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface User {
  id: number;
  username: string;
  email?: string;
  roles?: string[];
}

export type LoginResult =
  | { ok: true }
  | { ok: false; reason: 'credentials' | 'locked' };
