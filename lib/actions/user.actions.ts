"use server";

import { revalidatePath } from "next/cache";

import User from "../database/models/user.model";
import { connectToDatabase } from "../database/mongoose";
import { handleError } from "../utils";

// CREATE
export async function createUser(user: CreateUserParams) {
  try {
    await connectToDatabase();

    const newUser = await User.create(user);

    return JSON.parse(JSON.stringify(newUser));
  } catch (error) {
    handleError(error);
  }
}

// READ
export async function getUserById(userId: string) {
  try {
    await connectToDatabase();

    const user = await User.findOne({ clerkId: userId });

    if (!user) {
      // Instead of throwing an error, return null and let the calling code handle it
      console.warn(`User not found for clerkId: ${userId}. User may need to be synced from Clerk.`);
      return null;
    }

    return JSON.parse(JSON.stringify(user));
  } catch (error) {
    handleError(error);
    return null;
  }
}



// GET OR CREATE USER - Fixed to handle existing users properly
export async function getOrCreateUser(userId: string) {
  try {
    await connectToDatabase();

    // First, try to find the existing user
    let user = await User.findOne({ clerkId: userId });

    if (user) {
      // User already exists, return it
      return JSON.parse(JSON.stringify(user));
    }

    // User doesn't exist, create a new one
    try {
      const newUserData = {
        clerkId: userId,
        email: `temp_${userId.slice(-8)}@imaginify.com`,
        username: `user_${userId.slice(-8)}`,
        photo: `https://img.clerk.com/preview.png`,
        firstName: "",
        lastName: "",
      };

      user = await User.create(newUserData);
      console.log(`Created new user for clerkId: ${userId}`);
      
      return JSON.parse(JSON.stringify(user));
    } catch (createError: any) {
      // If creation fails due to duplicate key, try to find the user again
      // This handles race conditions where another request created the user
      if (createError.code === 11000) {
        console.log(`User was created by another request, fetching existing user for clerkId: ${userId}`);
        const existingUser = await User.findOne({ clerkId: userId });
        if (existingUser) {
          return JSON.parse(JSON.stringify(existingUser));
        }
      }
      // Re-throw the error if it's not a duplicate key error
      throw createError;
    }

  } catch (error) {
    handleError(error);
    return null;
  }
}



// UPDATE
export async function updateUser(clerkId: string, user: UpdateUserParams) {
  try {
    await connectToDatabase();

    const updatedUser = await User.findOneAndUpdate({ clerkId }, user, {
      new: true,
    });

    if (!updatedUser) throw new Error("User update failed");
    
    return JSON.parse(JSON.stringify(updatedUser));
  } catch (error) {
    handleError(error);
  }
}

// DELETE
export async function deleteUser(clerkId: string) {
  try {
    await connectToDatabase();

    // Find user to delete
    const userToDelete = await User.findOne({ clerkId });

    if (!userToDelete) {
      throw new Error("User not found");
    }

    // Delete user
    const deletedUser = await User.findByIdAndDelete(userToDelete._id);
    revalidatePath("/");

    return deletedUser ? JSON.parse(JSON.stringify(deletedUser)) : null;
  } catch (error) {
    handleError(error);
  }
}

// USE CREDITS
export async function updateCredits(userId: string, creditFee: number) {
  try {
    await connectToDatabase();

    const updatedUserCredits = await User.findOneAndUpdate(
      { _id: userId },
      { $inc: { creditBalance: creditFee }},
      { new: true }
    )

    if(!updatedUserCredits) throw new Error("User credits update failed");

    return JSON.parse(JSON.stringify(updatedUserCredits));
  } catch (error) {
    handleError(error);
  }
}