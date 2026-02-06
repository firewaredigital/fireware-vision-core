import { Route } from 'react-router-dom';
import { ModuleGuard } from '@/components/guards/ModuleGuard';
import { ProtectedLayout } from '@/components/guards/ProtectedLayout';
import AIAgents from '@/pages/ai/AIAgents';
import AIAgentForm from '@/pages/ai/AIAgentForm';
import AIAgentDetail from '@/pages/ai/AIAgentDetail';
import AIAgentPlayground from '@/pages/ai/AIAgentPlayground';
import AITools from '@/pages/ai/AITools';
import AIPolicies from '@/pages/ai/AIPolicies';
import AIEvals from '@/pages/ai/AIEvals';
import AIRuns from '@/pages/ai/AIRuns';
import AIAnalytics from '@/pages/ai/AIAnalytics';

export function AIRoutes() {
  return [
    <Route key="ai-agents" path="/ai/agents" element={
      <ProtectedLayout><ModuleGuard moduleKey="ai_agents" redirectTo="/dashboard"><AIAgents /></ModuleGuard></ProtectedLayout>
    } />,
    <Route key="ai-agents-new" path="/ai/agents/new" element={
      <ProtectedLayout><ModuleGuard moduleKey="ai_agents" redirectTo="/dashboard"><AIAgentForm /></ModuleGuard></ProtectedLayout>
    } />,
    <Route key="ai-agents-id" path="/ai/agents/:id" element={
      <ProtectedLayout><ModuleGuard moduleKey="ai_agents" redirectTo="/dashboard"><AIAgentDetail /></ModuleGuard></ProtectedLayout>
    } />,
    <Route key="ai-agents-test" path="/ai/agents/:id/test" element={
      <ProtectedLayout><ModuleGuard moduleKey="ai_agents" redirectTo="/dashboard"><AIAgentPlayground /></ModuleGuard></ProtectedLayout>
    } />,
    <Route key="ai-tools" path="/ai/tools" element={
      <ProtectedLayout><ModuleGuard moduleKey="ai_agents" redirectTo="/dashboard"><AITools /></ModuleGuard></ProtectedLayout>
    } />,
    <Route key="ai-policies" path="/ai/policies" element={
      <ProtectedLayout><ModuleGuard moduleKey="ai_agents" redirectTo="/dashboard"><AIPolicies /></ModuleGuard></ProtectedLayout>
    } />,
    <Route key="ai-evals" path="/ai/evals" element={
      <ProtectedLayout><ModuleGuard moduleKey="ai_agents" redirectTo="/dashboard"><AIEvals /></ModuleGuard></ProtectedLayout>
    } />,
    <Route key="ai-runs" path="/ai/runs" element={
      <ProtectedLayout><ModuleGuard moduleKey="ai_agents" redirectTo="/dashboard"><AIRuns /></ModuleGuard></ProtectedLayout>
    } />,
    <Route key="ai-analytics" path="/ai/analytics" element={
      <ProtectedLayout><ModuleGuard moduleKey="ai_agents" redirectTo="/dashboard"><AIAnalytics /></ModuleGuard></ProtectedLayout>
    } />,
  ];
}
