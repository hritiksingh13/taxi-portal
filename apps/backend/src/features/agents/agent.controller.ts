// apps/backend/src/features/agents/agent.controller.ts
import { Request, Response } from 'express';
import { AgentService } from './agent.service';

const agentService = new AgentService();

export class AgentController {
  createAgent = async (req: Request, res: Response) => {
    const agent = await agentService.createAgent(req.body);
    res.status(201).json({ status: 'success', data: { agent } });
  };

  getAllAgents = async (req: Request, res: Response) => {
    const agents = await agentService.getAllAgents();
    res.status(200).json({ status: 'success', results: agents.length, data: { agents } });
  };

  getAgentById = async (req: Request, res: Response) => {
    const agent = await agentService.getAgentById(req.params.id);
    res.status(200).json({ status: 'success', data: { agent } });
  };

  updateAgent = async (req: Request, res: Response) => {
    const agent = await agentService.updateAgent(req.params.id, req.body);
    res.status(200).json({ status: 'success', data: { agent } });
  };

  deleteAgent = async (req: Request, res: Response) => {
    await agentService.deleteAgent(req.params.id);
    res.status(204).json({ status: 'success', data: null });
  };
}
