-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CENADI_DIRECTOR', 'DIVISION_DIRECTOR', 'DIVISION_SECRETARY');

-- CreateEnum
CREATE TYPE "Division" AS ENUM ('DEP', 'DEL', 'DTB', 'DIRE', 'DAAF');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'DIVISION_SECRETARY',
    "division" "Division",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
