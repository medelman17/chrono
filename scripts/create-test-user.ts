import { prisma } from '../lib/prisma';

async function createTestUser() {
  // Replace this with your actual Clerk user ID
  const clerkUserId = 'user_2qY6XXXXXXXXXXX'; // You'll need to get this from Clerk dashboard
  
  try {
    const user = await prisma.user.upsert({
      where: { clerkId: clerkUserId },
      update: {},
      create: {
        clerkId: clerkUserId,
        email: 'test@example.com', // Replace with your actual email
        name: 'Test User',
      },
    });
    
    console.log('User created/updated:', user);
  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();