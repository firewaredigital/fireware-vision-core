import { Route } from 'react-router-dom';
import { ModuleGuard } from '@/components/guards/ModuleGuard';
import AIAgents from '@/pages/ai/AIAgents';
import AIAgentForm from '@/pages/ai/AIAgentForm';
import AIAgentDetail from '@/pages/ai/AIAgentDetail';
import AIAgentPlayground from '@/pages/ai/AIAgentPlayground';
import AITools from '@/pages/ai/AITools';
import AIPolicies from '@/pages/ai/AIPolicies';
import AIEvals from '@/pages/ai/AIEvals';
import AIRuns from '@/pages/ai/AIRuns';

export function AIRoutes() {
  return [
    <Route key="ai-agents" path="/ai/agents" element={
      <ModuleGuard moduleKey="ai_agents" redirectTo="/dashboard">
        <AIAgents />
      </ModuleGuard>
    } />,
    <Route key="ai-agents-new" path="/ai/agents/new" element={
      <ModuleGuard moduleKey="ai_agents" redirectTo="/dashboard">
        <AIAgentForm />
      </ModuleGuard>
    } />,
    <Route key="ai-agents-id" path="/ai/agents/:id" element={
      <ModuleGuard moduleKey="ai_agents" redirectTo="/dashboard">
        <AIAgentDetail />
      </ModuleGuard>
    } />,
    <Route key="ai-agents-test" path="/ai/agents/:id/test" element={
      <ModuleGuard moduleKey="ai_agents" redirectTo="/dashboard">
        <AIAgentPlayground />
      </ModuleGuard>
    } />,
    <Route key="ai-tools" path="/ai/tools" element={
      <ModuleGuard moduleKey="ai_agents" redirectTo="/dashboard">
        <AITools />
      </ModuleGuard>
    } />,
    <Route key="ai-policies" path="/ai/policies" element={
      <ModuleGuard moduleKey="ai_agents" redirectTo="/dashboard">
        <AIPolicies />
      </ModuleGuard>
    } />,
    <Route key="ai-evals" path="/ai/evals" element={
      <ModuleGuard moduleKey="ai_agents" redirectTo="/dashboard">
        <AIEvals />
      </ModuleGuard>
    } />,
    <Route key="ai-runs" path="/ai/runs" element={
      <ModuleGuard moduleKey="ai_agents" redirectTo="/dashboard">
        <AIRuns />
      </ModuleGuard>
    } />,
  ];
}
