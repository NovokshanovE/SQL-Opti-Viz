import { jsx as _jsx } from "react/jsx-runtime";
const modes = ['connected', 'manual'];
export function ModeToggle({ mode, onChange }) {
    return (_jsx("div", { className: "mode-toggle", role: "tablist", "aria-label": "Analysis mode", children: modes.map((itemMode) => {
            const isActive = mode === itemMode;
            return (_jsx("button", { type: "button", "aria-selected": isActive, role: "tab", className: isActive ? 'mode-toggle__button mode-toggle__button--active' : 'mode-toggle__button', onClick: () => onChange(itemMode), children: itemMode === 'connected' ? 'Connected mode' : 'Manual mode' }, itemMode));
        }) }));
}
