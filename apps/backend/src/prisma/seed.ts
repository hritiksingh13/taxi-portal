// apps/backend/src/prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Cars
  const [camry, civic, swift] = await Promise.all([
    prisma.car.upsert({
      where: { licensePlate: 'MH12AB1234' },
      update: {},
      create: { brand: 'Toyota Camry', licensePlate: 'MH12AB1234', transmissionType: 'Automatic', status: 'Active' },
    }),
    prisma.car.upsert({
      where: { licensePlate: 'MH14CD5678' },
      update: {},
      create: { brand: 'Honda Civic', licensePlate: 'MH14CD5678', transmissionType: 'Automatic', status: 'Active' },
    }),
    prisma.car.upsert({
      where: { licensePlate: 'MH01EF9012' },
      update: {},
      create: { brand: 'Maruti Swift', licensePlate: 'MH01EF9012', transmissionType: 'Manual', status: 'Maintenance' },
    }),
  ]);

  // Agents
  const [uber, ola, privateBooking] = await Promise.all([
    prisma.agent.upsert({
      where: { name: 'Uber' },
      update: {},
      create: { name: 'Uber', contactDetails: 'partner-support@uber.com · +1-800-592-3456' },
    }),
    prisma.agent.upsert({
      where: { name: 'Ola' },
      update: {},
      create: { name: 'Ola', contactDetails: 'fleet@olacabs.com · +91-80-67350900' },
    }),
    prisma.agent.upsert({
      where: { name: 'Private Booking' },
      update: {},
      create: { name: 'Private Booking', contactDetails: 'Direct client bookings via office' },
    }),
  ]);

  // Drivers
  const [rahul, priya, amit] = await Promise.all([
    prisma.driver.upsert({
      where: { phoneNumber: '+919876543210' },
      update: {},
      create: { name: 'Rahul Sharma', phoneNumber: '+919876543210', status: 'Free' },
    }),
    prisma.driver.upsert({
      where: { phoneNumber: '+919812345678' },
      update: {},
      create: { name: 'Priya Nair', phoneNumber: '+919812345678', status: 'Free' },
    }),
    prisma.driver.upsert({
      where: { phoneNumber: '+919898765432' },
      update: {},
      create: { name: 'Amit Patel', phoneNumber: '+919898765432', status: 'Offline' },
    }),
  ]);

  // Driver–Agent links
  await Promise.all([
    prisma.driverAgent.upsert({
      where: { driverId_agentId: { driverId: rahul.id, agentId: uber.id } },
      update: {},
      create: { driverId: rahul.id, agentId: uber.id },
    }),
    prisma.driverAgent.upsert({
      where: { driverId_agentId: { driverId: rahul.id, agentId: ola.id } },
      update: {},
      create: { driverId: rahul.id, agentId: ola.id },
    }),
    prisma.driverAgent.upsert({
      where: { driverId_agentId: { driverId: priya.id, agentId: uber.id } },
      update: {},
      create: { driverId: priya.id, agentId: uber.id },
    }),
    prisma.driverAgent.upsert({
      where: { driverId_agentId: { driverId: priya.id, agentId: privateBooking.id } },
      update: {},
      create: { driverId: priya.id, agentId: privateBooking.id },
    }),
    prisma.driverAgent.upsert({
      where: { driverId_agentId: { driverId: amit.id, agentId: ola.id } },
      update: {},
      create: { driverId: amit.id, agentId: ola.id },
    }),
  ]);

  // Customers
  await Promise.all([
    prisma.customer.upsert({
      where: { email: 'priya.singh@example.com' },
      update: {},
      create: { name: 'Priya Singh', email: 'priya.singh@example.com', phone: '+919876000001' },
    }),
    prisma.customer.upsert({
      where: { email: 'vikram.mehta@example.com' },
      update: {},
      create: { name: 'Vikram Mehta', email: 'vikram.mehta@example.com', phone: '+919876000002' },
    }),
    prisma.customer.upsert({
      where: { email: 'sneha.iyer@example.com' },
      update: {},
      create: { name: 'Sneha Iyer', email: 'sneha.iyer@example.com', phone: '+919876000003' },
    }),
  ]);

  console.log('✅ Seed complete!');
  console.log(`   🚗 3 cars | 👤 3 drivers | 🏢 3 platforms | 👥 3 customers`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
