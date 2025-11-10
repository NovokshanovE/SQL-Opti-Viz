import type { Edge, Node } from 'reactflow';
export interface PlanNodeData {
    title: string;
    subtitle?: string;
    metrics: Array<{
        label: string;
        value: string;
    }>;
    filter?: string;
    nodeType: string;
}
interface FlowDiagram {
    nodes: Node<PlanNodeData>[];
    edges: Edge[];
}
export declare function buildFlowFromPlan(plan: unknown): FlowDiagram;
export {};
