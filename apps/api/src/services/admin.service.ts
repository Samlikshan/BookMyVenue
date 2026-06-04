import { prisma } from "../config/prisma.js";

export async function getPendingOwnersService() {
  const pendingOwners = await prisma.profile.findMany({
    where: {
      role: "OWNER",
      status: "PENDING",
    },
    include: {
      ownerApplication: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return {
    success: true,
    statusCode: 200,
    message: "Pending owners fetched successfully",
    data: {
      owners: pendingOwners,
    },
  };
}

export async function approveOwnerService(ownerId: string, adminId: string) {
  const owner = await prisma.profile.findUnique({
    where: {
      id: ownerId,
    },
    include: {
      ownerApplication: true,
    },
  });

  if (!owner) {
    return {
      success: false,
      statusCode: 404,
      message: "Owner not found",
    };
  }

  if (owner.role !== "OWNER") {
    return {
      success: false,
      statusCode: 400,
      message: "Selected user is not an owner",
    };
  }

  if (owner.status !== "PENDING") {
    return {
      success: false,
      statusCode: 400,
      message: "Only pending owners can be approved",
    };
  }

  const updatedOwner = await prisma.profile.update({
    where: {
      id: ownerId,
    },
    data: {
      status: "ACTIVE",
      ownerApplication: owner.ownerApplication
        ? {
            update: {
              status: "APPROVED",
              reviewedBy: adminId,
              reviewedAt: new Date(),
            },
          }
        : undefined,
    },
    include: {
      ownerApplication: true,
    },
  });

  return {
    success: true,
    statusCode: 200,
    message: "Owner approved successfully",
    data: {
      owner: updatedOwner,
    },
  };
}

export async function rejectOwnerService(
  ownerId: string,
  adminId: string,
  rejectionReason?: string
) {
  const owner = await prisma.profile.findUnique({
    where: {
      id: ownerId,
    },
    include: {
      ownerApplication: true,
    },
  });

  if (!owner) {
    return {
      success: false,
      statusCode: 404,
      message: "Owner not found",
    };
  }

  if (owner.role !== "OWNER") {
    return {
      success: false,
      statusCode: 400,
      message: "Selected user is not an owner",
    };
  }

  if (owner.status !== "PENDING") {
    return {
      success: false,
      statusCode: 400,
      message: "Only pending owners can be rejected",
    };
  }

  const updatedOwner = await prisma.profile.update({
    where: {
      id: ownerId,
    },
    data: {
      status: "REJECTED",
      ownerApplication: owner.ownerApplication
        ? {
            update: {
              status: "REJECTED",
              reviewedBy: adminId,
              reviewedAt: new Date(),
              rejectionReason: rejectionReason || null,
            },
          }
        : undefined,
    },
    include: {
      ownerApplication: true,
    },
  });

  return {
    success: true,
    statusCode: 200,
    message: "Owner rejected successfully",
    data: {
      owner: updatedOwner,
    },
  };
}