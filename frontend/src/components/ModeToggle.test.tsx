import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ModeToggle } from './ModeToggle';

describe('ModeToggle', () => {
  it('renders both modes and fires change events', () => {
    const handleChange = vi.fn();
    render(<ModeToggle mode="manual" onChange={handleChange} />);

    const connectedButton = screen.getByRole('tab', { name: /connected mode/i });
    const manualButton = screen.getByRole('tab', { name: /manual mode/i });

    expect(manualButton).toHaveAttribute('aria-selected', 'true');

    fireEvent.click(connectedButton);
    expect(handleChange).toHaveBeenCalledWith('connected');
  });
});
