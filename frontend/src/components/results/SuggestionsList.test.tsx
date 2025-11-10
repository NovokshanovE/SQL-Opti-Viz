import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SuggestionsList } from './SuggestionsList';

describe('SuggestionsList', () => {
  it('shows empty state when there are no suggestions', () => {
    render(<SuggestionsList suggestions={[]} />);

    expect(screen.getByText(/no optimization suggestions/i)).toBeInTheDocument();
  });

  it('renders suggestion content', () => {
    render(
      <SuggestionsList
        suggestions={[
          {
            title: 'Sequential scan detected',
            description: 'Plan uses a sequential scan.',
            recommendation: 'Add an index.',
            severity: 'High',
          },
        ]}
      />
    );

    expect(screen.getByText(/Sequential scan detected/i)).toBeInTheDocument();
    expect(screen.getByText(/Add an index/i)).toBeInTheDocument();
    expect(screen.getByText(/High/i)).toBeInTheDocument();
  });
});
