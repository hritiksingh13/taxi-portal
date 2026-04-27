// apps/backend/src/cron/autoEndTrips.ts
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Auto-end cron job: runs every 5 minutes.
 * Finds trips with status=Active and endDate < now(), marks them as Ended, and frees the driver.
 */
export function startAutoEndCron() {
  cron.schedule('*/5 * * * *', async () => {
    try {
      const now = new Date();

      const expiredTrips = await prisma.trip.findMany({
        where: {
          status: 'Active',
          endDate: { lt: now },
        },
        include: { driver: true },
      });

      if (expiredTrips.length === 0) return;

      console.log(`⏰ Auto-ending ${expiredTrips.length} expired trip(s)...`);

      for (const trip of expiredTrips) {
        await prisma.$transaction(async (tx) => {
          await tx.trip.update({
            where: { id: trip.id },
            data: { status: 'Ended' },
          });

          // Only free the driver if they're still marked as Busy
          if (trip.driver.status === 'Busy') {
            await tx.driver.update({
              where: { id: trip.driverId },
              data: { status: 'Free' },
            });
          }
        });

        console.log(`  ✅ Trip ${trip.id} auto-ended. Driver ${trip.driver.name} freed.`);
      }
    } catch (error) {
      console.error('❌ Auto-end cron error:', error);
    }
  });

  console.log('⏰ Auto-end cron job scheduled (every 5 minutes)');
}
