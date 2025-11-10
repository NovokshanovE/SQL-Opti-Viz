import type { NodeProps } from 'reactflow';
import { Handle, Position } from 'reactflow';

import type { PlanNodeData } from '../../utils/explain';

export function PlanNode({ data }: NodeProps<PlanNodeData>) {
  return (
    <div className="plan-node">
      <Handle
        type="target"
        position={Position.Left}
        className="plan-node__handle plan-node__handle--left"
      />
      <div className="plan-node__header">
        <span className="plan-node__type">{data.nodeType}</span>
        {data.subtitle ? <span className="plan-node__subtitle">{data.subtitle}</span> : null}
      </div>
      <dl className="plan-node__metrics">
        {data.metrics.map((metric) => (
          <div key={metric.label} className="plan-node__metric">
            <dt>{metric.label}</dt>
            <dd>{metric.value}</dd>
          </div>
        ))}
      </dl>
      {data.filter ? (
        <div className="plan-node__filter">
          <span className="plan-node__filter-label">Filter</span>
          <span className="plan-node__filter-value">{data.filter}</span>
        </div>
      ) : null}
      <Handle
        type="source"
        position={Position.Right}
        className="plan-node__handle plan-node__handle--right"
      />
    </div>
  );
}
