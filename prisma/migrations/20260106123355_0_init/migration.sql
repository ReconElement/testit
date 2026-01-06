-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('admin', 'supervisor', 'agent', 'candidate');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "role" "UserType" NOT NULL DEFAULT 'candidate',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
