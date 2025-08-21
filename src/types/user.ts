export type User = {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  industry?: string;
  phone?: string;
  avatar?: string;
  createdAt: number;
  updatedAt: number;
  isActive: boolean;
  subscription?: UserSubscription;
};

export type UserSubscription = {
  plan: "free" | "basic" | "premium" | "enterprise";
  status: "active" | "inactive" | "trial" | "cancelled";
  startDate: number;
  endDate?: number;
  features: string[];
};

export type UserRegistrationData = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  company?: string;
  industry?: string;
  phone?: string;
};

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  company?: string;
  industry?: string;
  phone?: string;
  avatar?: string;
  createdAt: number;
  updatedAt: number;
};
