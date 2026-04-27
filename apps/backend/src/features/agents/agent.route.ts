// apps/backend/src/features/agents/agent.route.ts
import { Router } from 'express';
import { AgentController } from './agent.controller';
import { validateRequest } from '../../middleware/validation.middleware';
import { createAgentSchema, updateAgentSchema, getAgentSchema } from './agent.dto';
import { catchAsync } from '../../core/exceptions/catchAsync.util';

const router = Router();
const agentController = new AgentController();

router
  .route('/')
  .get(catchAsync(agentController.getAllAgents))
  .post(validateRequest(createAgentSchema), catchAsync(agentController.createAgent));

router
  .route('/:id')
  .get(validateRequest(getAgentSchema), catchAsync(agentController.getAgentById))
  .patch(validateRequest(updateAgentSchema), catchAsync(agentController.updateAgent))
  .delete(validateRequest(getAgentSchema), catchAsync(agentController.deleteAgent));

export default router;
