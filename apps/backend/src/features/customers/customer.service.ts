// apps/backend/src/features/customers/customer.service.ts
import { PrismaClient, Customer, Prisma } from '@prisma/client';
import { AppError } from '../../core/exceptions/global.exception';

const prisma = new PrismaClient();

export class CustomerService {
  async getAllCustomers(): Promise<Customer[]> {
    return await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { trips: true } },
      },
    });
  }

  async getCustomerById(id: string): Promise<Customer> {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        trips: {
          orderBy: { startTime: 'desc' },
          take: 10,
          include: { driver: true, agent: true },
        },
        _count: { select: { trips: true } },
      },
    });

    if (!customer) throw new AppError('Customer not found', 404);
    return customer;
  }

  async createCustomer(data: { name: string; email?: string; phone: string }): Promise<Customer> {
    if (data.email) {
      const existing = await prisma.customer.findUnique({ where: { email: data.email } });
      if (existing) throw new AppError('A customer with this email already exists', 409);
    }

    return await prisma.customer.create({
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone,
      },
    });
  }

  async updateCustomer(id: string, data: Prisma.CustomerUpdateInput): Promise<Customer> {
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new AppError('Customer not found', 404);
    return await prisma.customer.update({ where: { id }, data });
  }

  async deleteCustomer(id: string): Promise<void> {
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new AppError('Customer not found', 404);
    await prisma.customer.delete({ where: { id } });
  }
}
