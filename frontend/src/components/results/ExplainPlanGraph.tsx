import { useMemo } from 'react';
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';

import { buildFlowFromPlan } from '../../utils/explain';
import { PlanNode } from './PlanNode';

interface ExplainPlanGraphProps {
  plan: unknown;
}

export function ExplainPlanGraph({ plan }: ExplainPlanGraphProps) {
  const { nodes, edges } = useMemo(() => buildFlowFromPlan(plan), [plan]);
  const nodeTypes = useMemo(() => ({ planNode: PlanNode }), []);

  if (nodes.length === 0) {
    return (
      <div className="results-placeholder results-placeholder--empty">
        <p>No EXPLAIN plan available yet.</p>
      </div>
    );
  }

  return (
    <div className="plan-graph">
      <ReactFlow
        nodes={nodes.map((node) => ({ ...node, type: 'planNode' }))}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        zoomOnScroll={false}
        panOnScroll
        nodesDraggable={false}
        nodeTypes={nodeTypes}
      >
        <MiniMap pannable zoomable />
        <Controls showInteractive={false} />
        <Background color="#1f2937" gap={12} />
      </ReactFlow>
    </div>
  );
}
