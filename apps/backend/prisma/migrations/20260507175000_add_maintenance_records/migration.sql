-- Add maintenance tracking fields to Car (additive only — no data loss)
ALTER TABLE "Car" ADD COLUMN IF NOT EXISTS "lastMaintenanceDate" TIMESTAMP(3);
ALTER TABLE "Car" ADD COLUMN IF NOT EXISTS "nextMaintenanceDue" TIMESTAMP(3);

-- Create MaintenanceRecord table for current + historical maintenance tracking
CREATE TABLE IF NOT EXISTS "MaintenanceRecord" (
    "id" TEXT NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "details" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "carId" TEXT NOT NULL,

    CONSTRAINT "MaintenanceRecord_pkey" PRIMARY KEY ("id")
);

-- Add foreign key (only if it doesn't already exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'MaintenanceRecord_carId_fkey'
    ) THEN
        ALTER TABLE "MaintenanceRecord"
            ADD CONSTRAINT "MaintenanceRecord_carId_fkey"
            FOREIGN KEY ("carId") REFERENCES "Car"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
