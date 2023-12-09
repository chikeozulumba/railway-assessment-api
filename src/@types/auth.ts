import { UserProvider } from 'src/models';

export enum AuthProvider {
  google = 'google',
  github = 'github',
}

export type AuthUser = {
  name: string;
  picture: string;
  iss: string;
  aud: string;
  auth_time: number;
  user_id: string;
  sub: string;
  iat: number;
  exp: number;
  firebase: {
    identities: Record<string, any>;
    // identities: { 'github.com': [Array] };
    sign_in_provider: string;
  };
  uid: string;
  provider: UserProvider;
};
