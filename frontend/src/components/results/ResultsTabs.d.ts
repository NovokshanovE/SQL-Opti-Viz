import { ReactNode } from 'react';
export type ResultTabKey = 'plan' | 'suggestions' | 'ast';
interface ResultsTabsProps {
    activeTab: ResultTabKey;
    onChange: (tab: ResultTabKey) => void;
    tabs: Array<{
        key: ResultTabKey;
        label: string;
        content: ReactNode;
    }>;
}
export declare function ResultsTabs({ activeTab, onChange, tabs }: ResultsTabsProps): import("react/jsx-runtime").JSX.Element;
export {};
