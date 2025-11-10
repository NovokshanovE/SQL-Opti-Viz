import type { AnalyzeMode } from '../types/api';
interface ModeToggleProps {
    mode: AnalyzeMode;
    onChange: (mode: AnalyzeMode) => void;
}
export declare function ModeToggle({ mode, onChange }: ModeToggleProps): import("react/jsx-runtime").JSX.Element;
export {};
