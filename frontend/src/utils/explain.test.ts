import { describe, expect, it } from 'vitest';

import { buildFlowFromPlan } from './explain';

describe('buildFlowFromPlan', () => {
  it('transforms plan into nodes and edges', () => {
    const plan = {
      Plan: {
        'Node Type': 'Seq Scan',
        'Relation Name': 'users',
        Plans: [
          {
            'Node Type': 'Index Scan',
            'Index Name': 'users_age_idx',
          },
        ],
      },
    };

    const { nodes, edges } = buildFlowFromPlan(plan);

    expect(nodes.length).toBe(2);
    expect(edges.length).toBe(1);
    const titles = nodes.map((node) => node.data.title);
    expect(titles).toContain('Seq Scan');
    expect(titles).toContain('Index Scan');
  });
});
