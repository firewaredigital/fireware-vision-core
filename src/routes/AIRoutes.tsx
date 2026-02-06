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
  return (
    <>
      <Route path="/ai/agents" element={
        <ModuleGuard moduleKey="ai_agents" redirectTo="/dashboard">
          <AIAgents />
        </ModuleGuard>
      } />
      <Route path="/ai/agents/new" element={
        <ModuleGuard moduleKey="ai_agents" redirectTo="/dashboard">
          <AIAgentForm />
        </ModuleGuard>
      } />
      <Route path="/ai/agents/:id" element={
        <ModuleGuard moduleKey="ai_agents" redirectTo="/dashboard">
          <AIAgentDetail />
        </ModuleGuard>
      } />
      <Route path="/ai/agents/:id/test" element={
        <ModuleGuard moduleKey="ai_agents" redirectTo="/dashboard">
          <AIAgentPlayground />
        </ModuleGuard>
      } />
      <Route path="/ai/tools" element={
        <ModuleGuard moduleKey="ai_agents" redirectTo="/dashboard">
          <AITools />
        </ModuleGuard>
      } />
      <Route path="/ai/policies" element={
        <ModuleGuard moduleKey="ai_agents" redirectTo="/dashboard">
          <AIPolicies />
        </ModuleGuard>
      } />
      <Route path="/ai/evals" element={
        <ModuleGuard moduleKey="ai_agents" redirectTo="/dashboard">
          <AIEvals />
        </ModuleGuard>
      } />
      <Route path="/ai/runs" element={
        <ModuleGuard moduleKey="ai_agents" redirectTo="/dashboard">
          <AIRuns />
        </ModuleGuard>
      } />
    </>
  );
}
