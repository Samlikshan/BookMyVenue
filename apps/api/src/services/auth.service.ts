import { prisma } from "../config/prisma.js";
import { supabaseAdmin } from "../config/supabase.js";
import type { RegisterOwnerInput } from "../validations/auth.validation.js";

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
