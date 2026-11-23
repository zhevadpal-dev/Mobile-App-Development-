export interface PixelAvatarConfig {
  skinColor?: string;
  skinTone?: string;
  hair?: string;
  hairStyle?: string;
  hairColor?: string;
  glasses?: string;
  accessories?: string;
  clothing?: string;
  clothingColor?: string;
  outfitColor?: string;
  backgroundColor?: string;
  bgColor?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: number;
  photoUri?: string;
  avatarBgColor?: string;
  pixelAvatar?: PixelAvatarConfig;
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
