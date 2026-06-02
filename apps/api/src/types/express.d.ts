import type { User } from "@supabase/supabase-js";
import type { Profile } from "../generated/prisma/client.js";

type ProfileWithOwnerApplication = Prisma.ProfileGetPayload<{
  include: {
    ownerApplication: true;
  };
}>;
declare global {
  namespace Express {
    interface Request {
      user?: {
        authUser: User;
        profile: ProfileWithOwnerApplication;
      };
    }
  }
}

export {};