import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
  const { userId } = await auth();
  console.log("Clerk userId:", userId);

  if (!userId) {
    return null;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });
    console.log("Database user:", user);

    return user;
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
}

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}