/*
  Warnings:

  - A unique constraint covering the columns `[resetToken]` on the table `accounts` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "accounts" ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_resetToken_key" ON "accounts"("resetToken");
