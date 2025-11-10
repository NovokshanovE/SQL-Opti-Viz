import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';
import { buildFlowFromPlan } from '../../utils/explain';
import { PlanNode } from './PlanNode';
export function ExplainPlanGraph({ plan }) {
    const { nodes, edges } = useMemo(() => buildFlowFromPlan(plan), [plan]);
    const nodeTypes = useMemo(() => ({ planNode: PlanNode }), []);
    if (nodes.length === 0) {
        return (_jsx("div", { className: "results-placeholder results-placeholder--empty", children: _jsx("p", { children: "No EXPLAIN plan available yet." }) }));
    }
    return (_jsx("div", { className: "plan-graph", children: _jsxs(ReactFlow, { nodes: nodes.map((node) => ({ ...node, type: 'planNode' })), edges: edges, fitView: true, fitViewOptions: { padding: 0.25 }, zoomOnScroll: false, panOnScroll: true, nodesDraggable: false, nodeTypes: nodeTypes, children: [_jsx(MiniMap, { pannable: true, zoomable: true }), _jsx(Controls, { showInteractive: false }), _jsx(Background, { color: "#1f2937", gap: 12 })] }) }));
}
