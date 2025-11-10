import type { Edge, Node } from 'reactflow';

interface PlanNode {
  [key: string]: unknown;
  'Node Type'?: string;
  Plans?: PlanNode[];
  'Relation Name'?: string;
  'Alias'?: string;
  'Index Name'?: string;
}

export interface PlanNodeData {
  title: string;
  subtitle?: string;
  metrics: Array<{ label: string; value: string }>;
  filter?: string;
  nodeType: string;
}

interface FlowDiagram {
  nodes: Node<PlanNodeData>[];
  edges: Edge[];
}

interface LayoutResult {
  id: string;
  y: number;
  height: number;
  ids: string[];
}

export function buildFlowFromPlan(plan: unknown): FlowDiagram {
  const nodes: Node<PlanNodeData>[] = [];
  const edges: Edge[] = [];
  const nodeLookup = new Map<string, Node<PlanNodeData>>();

  const rootPlan = normalizePlan(plan);
  if (!rootPlan) {
    return { nodes, edges };
  }

  const horizontalSpacing = 480;
  const verticalSpacing = 220;
  const margin = 48;

  let leafCounter = 0;
  let idCounter = 0;

  function shiftSubtree(result: LayoutResult, delta: number) {
    if (delta === 0) {
      return;
    }
    result.y += delta;
    result.ids.forEach((id) => {
      const entry = nodeLookup.get(id);
      if (entry) {
        entry.position.y += delta;
      }
    });
  }

  function shiftDown(children: LayoutResult[], startIdx: number, delta: number) {
    for (let i = startIdx; i < children.length; i++) {
      shiftSubtree(children[i], delta);
    }
  }

  function shiftUp(children: LayoutResult[], endIdx: number, delta: number) {
    for (let i = 0; i <= endIdx; i++) {
      shiftSubtree(children[i], delta);
    }
  }

  function traverse(planNode: PlanNode, depth: number, parentId?: string): LayoutResult {
    const nodeId = `plan-${idCounter++}`;
    const childPlans = Array.isArray(planNode.Plans) ? planNode.Plans.filter(Boolean) : [];

    const childResults = childPlans.map((child) => traverse(child, depth + 1, nodeId));

    if (childResults.length > 1) {
      for (let i = 1; i < childResults.length; i++) {
        const prev = childResults[i - 1];
        const curr = childResults[i];
        const requiredGap = (prev.height + curr.height) / 2 + margin;
        const diff = curr.y - prev.y;
        if (diff < requiredGap) {
          const delta = requiredGap - diff;
          shiftDown(childResults, i, delta);
        }
      }
    }

    let yPosition: number;
    if (childResults.length > 0) {
      yPosition =
        (childResults[0].y + childResults[childResults.length - 1].y) / 2;
    } else {
      yPosition = leafCounter * verticalSpacing;
      leafCounter += 1;
    }

    const nodeType = planNode['Node Type'] ?? 'Plan Node';
    const relation = planNode['Relation Name'] as string | undefined;
    const alias = planNode['Alias'] as string | undefined;
    const indexName = planNode['Index Name'] as string | undefined;
    const subtitle = [relation, alias, indexName].filter(Boolean).join(' · ');
    const metrics = buildMetrics(planNode);
    const filter = typeof planNode.Filter === 'string' ? planNode.Filter : undefined;

    let estimatedHeight = 140 + metrics.length * 32;
    if (filter) {
      estimatedHeight += 70;
    }

    childResults.forEach((child, idx) => {
      const requiredGap = (estimatedHeight + child.height) / 2 + margin;
      const diff = Math.abs(child.y - yPosition);
      if (diff < requiredGap) {
        const delta = requiredGap - diff;
        if (child.y >= yPosition) {
          shiftDown(childResults, idx, delta);
        } else {
          shiftUp(childResults, idx, -delta);
        }
        yPosition =
          (childResults[0].y + childResults[childResults.length - 1].y) / 2;
      }
    });

    const nodeEntry: Node<PlanNodeData> = {
      id: nodeId,
      position: {
        x: depth * horizontalSpacing,
        y: yPosition
      },
      data: {
        title: nodeType,
        subtitle,
        metrics,
        filter,
        nodeType
      }
    };

    nodes.push(nodeEntry);
    nodeLookup.set(nodeId, nodeEntry);

    if (parentId) {
      edges.push({ id: `${parentId}->${nodeId}`, source: parentId, target: nodeId });
    }

    const subtreeIds = [nodeId];
    childResults.forEach((child) => {
      subtreeIds.push(...child.ids);
    });

    return { id: nodeId, y: nodeEntry.position.y, height: estimatedHeight, ids: subtreeIds };
  }

  traverse(rootPlan, 0);

  return { nodes, edges };
}

function normalizePlan(plan: unknown): PlanNode | null {
  if (!plan || typeof plan !== 'object') {
    return null;
  }

  const record = plan as Record<string, unknown>;
  if (record.Plan && typeof record.Plan === 'object') {
    return record.Plan as PlanNode;
  }

  return plan as PlanNode;
}

function buildMetrics(node: PlanNode): Array<{ label: string; value: string }> {
  const entries: Array<{ label: string; value: string }> = [];

  const actualRows = formatNumber(node['Actual Rows']);
  const planRows = formatNumber(node['Plan Rows']);
  const actualTime = formatNumber(node['Actual Total Time']);
  const totalCost = formatNumber(node['Total Cost']);
  const rowsRemoved = formatNumber(node['Rows Removed by Filter']);

  if (actualRows) {
    entries.push({ label: 'Actual rows', value: actualRows });
  }
  if (planRows) {
    entries.push({ label: 'Plan rows', value: planRows });
  }
  if (actualTime) {
    entries.push({ label: 'Actual time', value: `${actualTime} ms` });
  }
  if (totalCost) {
    entries.push({ label: 'Total cost', value: totalCost });
  }
  if (rowsRemoved) {
    entries.push({ label: 'Rows removed by filter', value: rowsRemoved });
  }

  if (entries.length === 0) {
    const width = formatNumber(node['Plan Width']);
    if (width) {
      entries.push({ label: 'Plan width', value: width });
    }
  }

  return entries;
}

function formatNumber(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (Math.abs(value) >= 1000) {
      return value.toLocaleString(undefined, { maximumFractionDigits: 1 });
    }
    return value % 1 === 0 ? value.toString() : value.toFixed(2);
  }
  return null;
}
