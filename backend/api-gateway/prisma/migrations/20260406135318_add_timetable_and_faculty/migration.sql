/*
  Warnings:

  - You are about to drop the column `classId` on the `attendance_records` table. All the data in the column will be lost.
  - The `status` column on the `attendance_records` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[accountId,classSessionTemplateId,scheduledDate]` on the table `attendance_records` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `classSessionTemplateId` to the `attendance_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scheduledDate` to the `attendance_records` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED');

-- CreateEnum
CREATE TYPE "AttendanceMethod" AS ENUM ('QR', 'BLE', 'MANUAL', 'GEOFENCE');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'FACULTY';

-- AlterTable
ALTER TABLE "attendance_records" DROP COLUMN "classId",
ADD COLUMN     "classSessionTemplateId" TEXT NOT NULL,
ADD COLUMN     "geofenceValidated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "markedByFacultyId" TEXT,
ADD COLUMN     "method" "AttendanceMethod" NOT NULL DEFAULT 'QR',
ADD COLUMN     "qrToken" TEXT,
ADD COLUMN     "scheduledDate" TIMESTAMP(3) NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "AttendanceStatus" NOT NULL DEFAULT 'ABSENT';

-- CreateTable
CREATE TABLE "faculty_profiles" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "title" TEXT,

    CONSTRAINT "faculty_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "credits" INTEGER NOT NULL DEFAULT 3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sections" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "year" INTEGER NOT NULL,

    CONSTRAINT "sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_groups" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "student_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_group_memberships" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,

    CONSTRAINT "student_group_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faculty_assignments" (
    "id" TEXT NOT NULL,
    "facultyAccountId" TEXT NOT NULL,
    "sectionId" TEXT,
    "groupId" TEXT,

    CONSTRAINT "faculty_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_session_templates" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "groupId" TEXT,
    "facultyAccountId" TEXT,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "room" TEXT NOT NULL,
    "geofenceId" TEXT,

    CONSTRAINT "class_session_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "faculty_profiles_accountId_key" ON "faculty_profiles"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "courses_code_key" ON "courses"("code");

-- CreateIndex
CREATE UNIQUE INDEX "sections_courseId_code_term_year_key" ON "sections"("courseId", "code", "term", "year");

-- CreateIndex
CREATE UNIQUE INDEX "student_groups_sectionId_code_key" ON "student_groups"("sectionId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "student_group_memberships_groupId_accountId_key" ON "student_group_memberships"("groupId", "accountId");

-- CreateIndex
CREATE INDEX "attendance_records_accountId_scheduledDate_idx" ON "attendance_records"("accountId", "scheduledDate");

-- CreateIndex
CREATE INDEX "attendance_records_classSessionTemplateId_scheduledDate_idx" ON "attendance_records"("classSessionTemplateId", "scheduledDate");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_accountId_classSessionTemplateId_schedul_key" ON "attendance_records"("accountId", "classSessionTemplateId", "scheduledDate");

-- AddForeignKey
ALTER TABLE "faculty_profiles" ADD CONSTRAINT "faculty_profiles_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_groups" ADD CONSTRAINT "student_groups_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_group_memberships" ADD CONSTRAINT "student_group_memberships_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "student_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_group_memberships" ADD CONSTRAINT "student_group_memberships_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faculty_assignments" ADD CONSTRAINT "faculty_assignments_facultyAccountId_fkey" FOREIGN KEY ("facultyAccountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faculty_assignments" ADD CONSTRAINT "faculty_assignments_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faculty_assignments" ADD CONSTRAINT "faculty_assignments_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "student_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_session_templates" ADD CONSTRAINT "class_session_templates_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_session_templates" ADD CONSTRAINT "class_session_templates_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "student_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_session_templates" ADD CONSTRAINT "class_session_templates_geofenceId_fkey" FOREIGN KEY ("geofenceId") REFERENCES "geofences"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_classSessionTemplateId_fkey" FOREIGN KEY ("classSessionTemplateId") REFERENCES "class_session_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
