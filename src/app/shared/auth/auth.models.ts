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
