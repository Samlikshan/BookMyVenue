export type UserRole = "USER" | "OWNER" | "ADMIN";

export type UserStatus = "ACTIVE" | "PENDING" | "REJECTED" | "SUSPENDED";

export type OwnerApplication = {
  id: string;
  userId: string;
  businessName: string;
  city: string;
  status: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  ownerApplication: OwnerApplication | null;
  createdAt?: string;
  updatedAt?: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterUserInput = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
};

export type RegisterOwnerInput = RegisterUserInput & {
  businessName: string;
  city: string;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
};
