import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function ResultsTabs({ activeTab, onChange, tabs }) {
    return (_jsxs("div", { className: "results-tabs", children: [_jsx("div", { className: "results-tabs__list", role: "tablist", children: tabs.map((tab) => (_jsx("button", { type: "button", role: "tab", "aria-selected": activeTab === tab.key, className: activeTab === tab.key
                        ? 'results-tabs__button results-tabs__button--active'
                        : 'results-tabs__button', onClick: () => onChange(tab.key), children: tab.label }, tab.key))) }), _jsx("div", { className: "results-tabs__panel", role: "tabpanel", children: tabs.find((tab) => tab.key === activeTab)?.content })] }));
}
