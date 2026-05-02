-- Move car relationship from Driver to Trip

-- Step 1: Add carId as nullable to Trip first
ALTER TABLE "Trip" ADD COLUMN "carId" TEXT;

-- Step 2: Migrate existing data - copy carId from driver to their trips
UPDATE "Trip" t
SET "carId" = d."carId"
FROM "Driver" d
WHERE t."driverId" = d."id" AND d."carId" IS NOT NULL;

-- Step 3: For any trips where the driver had no car assigned, assign the first active car
UPDATE "Trip"
SET "carId" = (SELECT "id" FROM "Car" WHERE "status" = 'Active' LIMIT 1)
WHERE "carId" IS NULL;

-- Step 4: Make carId NOT NULL now that all rows have a value
ALTER TABLE "Trip" ALTER COLUMN "carId" SET NOT NULL;

-- Step 5: Add foreign key constraint
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 6: Drop the old driver-car relationship
ALTER TABLE "Driver" DROP CONSTRAINT IF EXISTS "Driver_carId_fkey";
ALTER TABLE "Driver" DROP COLUMN IF EXISTS "carId";
