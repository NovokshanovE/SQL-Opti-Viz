import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AnalyzerPage } from './AnalyzerPage';

describe('AnalyzerPage', () => {
  it('requires SQL and EXPLAIN JSON before enabling analysis', () => {
    render(<AnalyzerPage />);

    const analyzeButton = screen.getByRole('button', { name: /analyze/i });
    expect(analyzeButton).toBeDisabled();

    const sqlTextarea = screen.getByLabelText(/sql query/i);
    const explainTextarea = screen.getByLabelText(/explain json/i);

    fireEvent.change(sqlTextarea, { target: { value: 'SELECT 1;' } });
    expect(analyzeButton).toBeDisabled();

    fireEvent.change(explainTextarea, {
      target: { value: '{"Plan": {"Node Type": "Seq Scan"}}' },
    });

    expect(analyzeButton).toBeEnabled();
  });
});
