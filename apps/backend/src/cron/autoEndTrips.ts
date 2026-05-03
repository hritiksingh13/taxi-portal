// apps/backend/src/cron/autoEndTrips.ts
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Auto-manage trip lifecycle: runs every 5 minutes.
 * 1. Finds Scheduled trips whose startDate <= now and activates them.
 * 2. Finds Active trips with endDate < now and marks them as Ended.
 */
export function startAutoEndCron() {
  cron.schedule('*/5 * * * *', async () => {
    try {
      const now = new Date();

      // ── 1. Auto-activate scheduled trips whose start time has arrived ──
      const tripsToActivate = await prisma.trip.findMany({
        where: {
          status: 'Scheduled',
          startDate: { lte: now },
        },
        include: { driver: true },
      });

      if (tripsToActivate.length > 0) {
        console.log(`🚀 Auto-activating ${tripsToActivate.length} scheduled trip(s)...`);
        for (const trip of tripsToActivate) {
          await prisma.trip.update({
            where: { id: trip.id },
            data: { status: 'Active' },
          });
          console.log(`  ✅ Trip ${trip.id} activated. Driver: ${trip.driver.name}`);
        }
      }

      // ── 2. Auto-end active trips whose end date has passed ──
      const expiredTrips = await prisma.trip.findMany({
        where: {
          status: 'Active',
          endDate: { lt: now },
        },
        include: { driver: true },
      });

      if (expiredTrips.length > 0) {
        console.log(`⏰ Auto-ending ${expiredTrips.length} expired trip(s)...`);
        for (const trip of expiredTrips) {
          await prisma.trip.update({
            where: { id: trip.id },
            data: { status: 'Ended' },
          });
          console.log(`  ✅ Trip ${trip.id} auto-ended. Driver: ${trip.driver.name}`);
        }
      }
    } catch (error) {
      console.error('❌ Auto trip lifecycle cron error:', error);
    }
  });

  console.log('⏰ Trip lifecycle cron job scheduled (every 5 minutes)');
}
