import type { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { supabaseAdmin } from "../config/supabase.js";

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authorization token is required",
    });
  }

  const token = authHeader.split(" ")[1];

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }

  const profile = await prisma.profile.findUnique({
    where: {
      id: user.id,
    },
    include: {
      ownerApplication: true,
    },
  });

  if (!profile) {
    return res.status(401).json({
      success: false,
      message: "Profile not found",
    });
  }

  req.user = {
    authUser: user,
    profile,
  };

  next();
}