CREATE TABLE "presence_locations" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "presence_locations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ble_detections" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "seenBy" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ble_detections_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "presence_locations_accountId_recordedAt_idx" ON "presence_locations"("accountId", "recordedAt");
CREATE INDEX "ble_detections_accountId_recordedAt_idx" ON "ble_detections"("accountId", "recordedAt");
CREATE INDEX "ble_detections_deviceId_recordedAt_idx" ON "ble_detections"("deviceId", "recordedAt");

ALTER TABLE "presence_locations"
ADD CONSTRAINT "presence_locations_accountId_fkey"
FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ble_detections"
ADD CONSTRAINT "ble_detections_accountId_fkey"
FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;