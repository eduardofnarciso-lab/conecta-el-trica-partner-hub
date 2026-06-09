// Service stubs — ready to swap for real API/Supabase calls later.
import {
  mockCampaigns,
  mockTransactions,
  mockRewards,
  mockRanking,
  mockReferrals,
  currentUser,
  adminOverview,
  adminPartners,
  adminApprovals,
} from "./mocks";

const delay = <T,>(data: T, ms = 200) => new Promise<T>((r) => setTimeout(() => r(data), ms));

export const authService = {
  login: async (email: string, _password: string) =>
    delay({ ok: true, user: { ...currentUser, email } }),
  logout: async () => delay({ ok: true }),
};

export const campaignService = {
  list: async () => delay(mockCampaigns),
  get: async (id: string) => delay(mockCampaigns.find((c) => c.id === id) ?? null),
};

export const pointsService = {
  balance: async () => delay(currentUser.points),
  transactions: async () => delay(mockTransactions),
};

export const rewardService = {
  list: async () => delay(mockRewards),
  redeem: async (id: string) => delay({ ok: true, id }),
};

export const partnerService = {
  me: async () => delay(currentUser),
  ranking: async () => delay(mockRanking),
  referrals: async () => delay(mockReferrals),
  submitReferral: async (data: unknown) => delay({ ok: true, data }),
};

export const adminService = {
  overview: async () => delay(adminOverview),
  partners: async () => delay(adminPartners),
  approvals: async () => delay(adminApprovals),
};
