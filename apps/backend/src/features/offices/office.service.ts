// apps/backend/src/features/offices/office.service.ts
import { PrismaClient, Prisma } from '@prisma/client';
import { AppError } from '../../core/exceptions/global.exception';

const prisma = new PrismaClient();

export class OfficeService {
  async getAll() {
    return prisma.office.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async create(data: Prisma.OfficeCreateInput) {
    return prisma.office.create({ data });
  }

  async update(id: string, data: Prisma.OfficeUpdateInput) {
    const office = await prisma.office.findUnique({ where: { id } });
    if (!office) throw new AppError('Office not found', 404);
    return prisma.office.update({ where: { id }, data });
  }

  async delete(id: string) {
    const office = await prisma.office.findUnique({ where: { id } });
    if (!office) throw new AppError('Office not found', 404);
    await prisma.office.delete({ where: { id } });
  }
}
