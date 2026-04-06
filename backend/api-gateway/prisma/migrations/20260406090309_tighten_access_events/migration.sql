-- /*
--   Warnings:

--   - The `reason` column on the `access_events` table would be dropped and recreated. This will lead to data loss if there is data in the column.
--   - Changed the type of `action` on the `access_events` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

-- */
-- -- CreateEnum
-- CREATE TYPE "AccessAction" AS ENUM ('ENTRY', 'EXIT', 'DENIED');

-- -- CreateEnum
-- CREATE TYPE "AccessReason" AS ENUM ('OUT_OF_HOURS', 'INVALID_RFID', 'INACTIVE_ACCOUNT', 'UNAUTHORIZED_AREA', 'UNKNOWN_GEOFENCE');

-- -- AlterTable
-- ALTER TABLE "access_events" DROP COLUMN "action",
-- ADD COLUMN     "action" "AccessAction" NOT NULL,
-- DROP COLUMN "reason",
-- ADD COLUMN     "reason" "AccessReason";

-- -- CreateIndex
-- CREATE INDEX "access_events_accountId_timestamp_idx" ON "access_events"("accountId", "timestamp");

-- -- CreateIndex
-- CREATE INDEX "access_events_geofenceId_timestamp_idx" ON "access_events"("geofenceId", "timestamp");

-- -- CreateIndex
-- CREATE INDEX "access_events_action_timestamp_idx" ON "access_events"("action", "timestamp");

-- -- AddForeignKey
-- ALTER TABLE "access_events" ADD CONSTRAINT "access_events_geofenceId_fkey" FOREIGN KEY ("geofenceId") REFERENCES "geofences"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "AccessAction" AS ENUM ('ENTRY', 'EXIT', 'DENIED');

-- CreateEnum
CREATE TYPE "AccessReason" AS ENUM ('OUT_OF_HOURS', 'INVALID_RFID', 'INACTIVE_ACCOUNT', 'UNAUTHORIZED_AREA', 'UNKNOWN_GEOFENCE');

-- Convert action from text to enum without dropping data
ALTER TABLE "access_events"
ALTER COLUMN "action" TYPE "AccessAction"
USING (
  CASE
    WHEN "action" = 'ENTRY' THEN 'ENTRY'::"AccessAction"
    WHEN "action" = 'EXIT' THEN 'EXIT'::"AccessAction"
    WHEN "action" = 'DENIED' THEN 'DENIED'::"AccessAction"
    ELSE 'DENIED'::"AccessAction"
  END
);

-- Convert reason from text to enum without dropping data
ALTER TABLE "access_events"
ALTER COLUMN "reason" TYPE "AccessReason"
USING (
  CASE
    WHEN "reason" IS NULL THEN NULL
    WHEN BTRIM("reason") = '' THEN NULL
    WHEN "reason" = 'Parking entitlement missing' THEN 'UNAUTHORIZED_AREA'::"AccessReason"
    WHEN "reason" = 'Out of hours' THEN 'OUT_OF_HOURS'::"AccessReason"
    WHEN "reason" = 'Invalid RFID' THEN 'INVALID_RFID'::"AccessReason"
    WHEN "reason" = 'Inactive account' THEN 'INACTIVE_ACCOUNT'::"AccessReason"
    WHEN "reason" = 'Unauthorized area' THEN 'UNAUTHORIZED_AREA'::"AccessReason"
    WHEN "reason" = 'Unknown geofence' THEN 'UNKNOWN_GEOFENCE'::"AccessReason"
    ELSE NULL
  END
);

-- CreateIndex
CREATE INDEX "access_events_accountId_timestamp_idx" ON "access_events"("accountId", "timestamp");

-- CreateIndex
CREATE INDEX "access_events_geofenceId_timestamp_idx" ON "access_events"("geofenceId", "timestamp");

-- CreateIndex
CREATE INDEX "access_events_action_timestamp_idx" ON "access_events"("action", "timestamp");

-- AddForeignKey
ALTER TABLE "access_events"
ADD CONSTRAINT "access_events_geofenceId_fkey"
FOREIGN KEY ("geofenceId") REFERENCES "geofences"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;