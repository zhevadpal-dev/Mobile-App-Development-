export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: number;
}

export interface StoredUserAccount extends User {
  password: string; // In production this would be a hash; for mock AsyncStorage we store mock credential
}

export interface AuthSession {
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials {
  name: string;
  email: string;
  password: string;
}
