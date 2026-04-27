// apps/backend/src/features/agents/agent.service.ts
import { PrismaClient, Agent, Prisma } from '@prisma/client';
import { AppError } from '../../core/exceptions/global.exception';

const prisma = new PrismaClient();

export class AgentService {
  async getAllAgents(): Promise<Agent[]> {
    return await prisma.agent.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        driverAgents: {
          include: {
            driver: { select: { id: true, name: true, status: true } },
          },
        },
        _count: { select: { trips: true } },
      },
    });
  }

  async getAgentById(id: string): Promise<Agent> {
    const agent = await prisma.agent.findUnique({
      where: { id },
      include: {
        driverAgents: {
          include: { driver: true },
        },
      },
    });

    if (!agent) {
      throw new AppError('Agent not found', 404);
    }
    return agent;
  }

  async createAgent(data: Prisma.AgentCreateInput): Promise<Agent> {
    const existing = await prisma.agent.findUnique({ where: { name: data.name } });
    if (existing) {
      throw new AppError('An agent with this name already exists', 409);
    }
    return await prisma.agent.create({ data });
  }

  async updateAgent(id: string, data: Prisma.AgentUpdateInput): Promise<Agent> {
    const agent = await prisma.agent.findUnique({ where: { id } });
    if (!agent) {
      throw new AppError('Agent not found', 404);
    }
    return await prisma.agent.update({ where: { id }, data });
  }

  async deleteAgent(id: string): Promise<void> {
    const agent = await prisma.agent.findUnique({ where: { id } });
    if (!agent) {
      throw new AppError('Agent not found', 404);
    }
    await prisma.agent.delete({ where: { id } });
  }
}
