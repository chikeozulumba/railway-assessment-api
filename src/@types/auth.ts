export enum AuthProvider {
  google = 'google',
  github = 'github',
}

export type AuthUser = {
  azp: string;
  exp: number;
  iat: number;
  iss: string;
  nbf: number;
  sid: string;
  sub: string;
  userId: string;
};
