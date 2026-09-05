export type AdminStats = {
  totalUsers: number;
  connectedAccounts: number;
  pendingAccounts: number;
  totalContacts: number;
  totalMutualContacts: number;
};

export type AdminAccountSummary = {
  telegramId: number;
  firstName: string;
  username: string;
  photoUrl: string;
  phone: string;
  mtprotoUsername: string;
  mtprotoUserId: number | null;
  isVerified: boolean;
  contactCount: number | null;
  mutualContactCount: number | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminPerson = {
  id: string;
  name: string;
  username: string;
  phone: string;
  bot: boolean;
  mutual: boolean;
};

export type AdminDialog = {
  id: string;
  title: string;
  type: 'user' | 'group' | 'channel';
  unread: number;
  lastMessage: string;
  lastAt: string | null;
  members: number | null;
};

export type AdminChatMessage = {
  id: string;
  out: boolean;
  text: string;
  date: string | null;
};

export type AdminTelegramSession = {
  hash: string;
  current: boolean;
  officialApp: boolean;
  device: string;
  platform: string;
  systemVersion: string;
  appName: string;
  appVersion: string;
  ip: string;
  country: string;
  region: string;
  createdAt: string | null;
  activeAt: string | null;
};

export type AdminLiveProfile = {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  phone: string;
};

export type AdminAccountDetail = {
  telegramId: number;
  firstName: string;
  username: string;
  photoUrl: string;
  languageCode: string;
  gender: 'male' | 'female' | null;
  isAdultConfirmed: boolean;
  isVerified: boolean;
  phone: string;
  mtprotoUsername: string;
  mtprotoUserId: number | null;
  posts: number;
  matchedProfileSlug: string | null;
  contactCount: number | null;
  mutualContactCount: number | null;
  createdAt: string;
  updatedAt: string;
};
