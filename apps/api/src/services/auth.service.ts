import { prisma } from "../config/prisma.js";
import { supabaseAdmin } from "../config/supabase.js";
import type {
  LoginInput,
  RefreshTokenInput,
  RegisterUserInput,
  RegisterOwnerInput,
} from "../validations/auth.validation.js";

function toAuthSession(
  session: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  },
  profile: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    role: string;
    status: string;
    ownerApplication: unknown;
  }
) {
  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresIn: session.expires_in,
    user: {
      id: profile.id,
      fullName: profile.fullName,
      email: profile.email,
      phone: profile.phone ?? "",
      role: profile.role,
      status: profile.status,
      ownerApplication: profile.ownerApplication,
    },
  };
}

export async function registerOwnerService(data: RegisterOwnerInput) {
  const existingProfile = await prisma.profile.findUnique({
    where: {
      email: data.email,
    },
  });

  if (existingProfile) {
    return {
      success: false,
      statusCode: 409,
      message: "An account with this email already exists",
    };
  }

  const { data: authData, error } = await supabaseAdmin.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: {
      fullName: data.fullName,
      role: "OWNER",
    },
  });

  if (error || !authData.user) {
    return {
      success: false,
      statusCode: 400,
      message: error?.message || "Failed to create owner account",
    };
  }

  try {
    const profile = await prisma.profile.create({
      data: {
        id: authData.user.id,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        role: "OWNER",
        status: "PENDING",
        ownerApplication: {
          create: {
            businessName: data.businessName,
            city: data.city,
            status: "PENDING",
          },
        },
      },
      include: {
        ownerApplication: true,
      },
    });
    return {
      success: true,
      statusCode: 201,
      message:
        "Owner registration submitted successfully. Your account is waiting for admin approval.",
      data: {
        profile,
      },
    };
  } catch (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);

    return {
      success: false,
      statusCode: 500,
      message: "Failed to create owner profile",
    };
  }
}

export async function loginService(data: LoginInput) {
  const { data: authData, error } = await supabaseAdmin.auth.signInWithPassword(
    {
      email: data.email,
      password: data.password,
    },
  );

  if (error || !authData.user || !authData.session) {
    return {
      success: false,
      statusCode: 401,
      message: "Invalid email or password",
    };
  }

  const profile = await prisma.profile.findUnique({
    where: {
      id: authData.user.id,
    },
    include: {
      ownerApplication: true,
    },
  });

  if (!profile) {
    return {
      success: false,
      statusCode: 404,
      message: "User profile not found",
    };
  }

  return {
    success: true,
    statusCode: 200,
    message: "Login successful",
    data: toAuthSession(authData.session, profile),
  };
}

export async function refreshSessionService(data: RefreshTokenInput) {
  const { data: authData, error } = await supabaseAdmin.auth.refreshSession({
    refresh_token: data.refreshToken,
  });

  if (error || !authData.session || !authData.user) {
    return {
      success: false,
      statusCode: 401,
      message: "Invalid or expired refresh token",
    };
  }

  const profile = await prisma.profile.findUnique({
    where: {
      id: authData.user.id,
    },
    include: {
      ownerApplication: true,
    },
  });

  if (!profile) {
    return {
      success: false,
      statusCode: 401,
      message: "Profile not found",
    };
  }

  return {
    success: true,
    statusCode: 200,
    message: "Session refreshed successfully",
    data: toAuthSession(authData.session, profile),
  };
}

export async function registerUserService(data: RegisterUserInput) {
  const existingProfile = await prisma.profile.findUnique({
    where: {
      email: data.email,
    },
  });

  if (existingProfile) {
    return {
      success: false,
      statusCode: 409,
      message: "An account with this email already exists",
    };
  }

  const { data: authData, error } = await supabaseAdmin.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: {
      fullName: data.fullName,
      role: "USER",
    },
  });

  if (error || !authData.user) {
    return {
      success: false,
      statusCode: 400,
      message: error?.message || "Failed to create user account",
    };
  }

  try {
    const profile = await prisma.profile.create({
      data: {
        id: authData.user.id,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        role: "USER",
        status: "ACTIVE",
      },
    });

    return {
      success: true,
      statusCode: 201,
      message: "User account created successfully",
      data: {
        profile,
      },
    };
  } catch {
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);

    return {
      success: false,
      statusCode: 500,
      message: "Failed to create user profile",
    };
  }
}
