-- Migration: add_payroll_and_offices
-- All changes are ADDITIVE ONLY — no columns dropped, no data modified.
-- Safe to run on production with existing data.

-- 1. Add optional email to Driver (for payslip delivery)
ALTER TABLE "Driver" ADD COLUMN IF NOT EXISTS "email" TEXT;

-- 2. Create DriverLeave table
CREATE TABLE IF NOT EXISTS "DriverLeave" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "driverId" TEXT NOT NULL,

    CONSTRAINT "DriverLeave_pkey" PRIMARY KEY ("id")
);

-- 3. Create DriverAdvance table
CREATE TABLE IF NOT EXISTS "DriverAdvance" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "deductFromSalary" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "driverId" TEXT NOT NULL,

    CONSTRAINT "DriverAdvance_pkey" PRIMARY KEY ("id")
);

-- 4. Create DriverSalaryConfig table
CREATE TABLE IF NOT EXISTS "DriverSalaryConfig" (
    "id" TEXT NOT NULL,
    "baseSalary" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "driverId" TEXT NOT NULL,

    CONSTRAINT "DriverSalaryConfig_pkey" PRIMARY KEY ("id")
);

-- 5. Create SalarySlip table
CREATE TABLE IF NOT EXISTS "SalarySlip" (
    "id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "baseSalary" DOUBLE PRECISION NOT NULL,
    "totalLeaves" INTEGER NOT NULL,
    "leaveDeduction" DOUBLE PRECISION NOT NULL,
    "totalAdvances" DOUBLE PRECISION NOT NULL,
    "netSalary" DOUBLE PRECISION NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "driverId" TEXT NOT NULL,

    CONSTRAINT "SalarySlip_pkey" PRIMARY KEY ("id")
);

-- 6. Create Office table
CREATE TABLE IF NOT EXISTS "Office" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "monthlyRent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Office_pkey" PRIMARY KEY ("id")
);

-- 7. Add unique constraints (idempotent via DO blocks)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'DriverSalaryConfig_driverId_key'
    ) THEN
        ALTER TABLE "DriverSalaryConfig" ADD CONSTRAINT "DriverSalaryConfig_driverId_key" UNIQUE ("driverId");
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'SalarySlip_driverId_month_year_key'
    ) THEN
        ALTER TABLE "SalarySlip" ADD CONSTRAINT "SalarySlip_driverId_month_year_key" UNIQUE ("driverId", "month", "year");
    END IF;
END $$;

-- 8. Add foreign keys (idempotent via DO blocks)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'DriverLeave_driverId_fkey'
    ) THEN
        ALTER TABLE "DriverLeave"
            ADD CONSTRAINT "DriverLeave_driverId_fkey"
            FOREIGN KEY ("driverId") REFERENCES "Driver"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'DriverAdvance_driverId_fkey'
    ) THEN
        ALTER TABLE "DriverAdvance"
            ADD CONSTRAINT "DriverAdvance_driverId_fkey"
            FOREIGN KEY ("driverId") REFERENCES "Driver"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'DriverSalaryConfig_driverId_fkey'
    ) THEN
        ALTER TABLE "DriverSalaryConfig"
            ADD CONSTRAINT "DriverSalaryConfig_driverId_fkey"
            FOREIGN KEY ("driverId") REFERENCES "Driver"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'SalarySlip_driverId_fkey'
    ) THEN
        ALTER TABLE "SalarySlip"
            ADD CONSTRAINT "SalarySlip_driverId_fkey"
            FOREIGN KEY ("driverId") REFERENCES "Driver"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
