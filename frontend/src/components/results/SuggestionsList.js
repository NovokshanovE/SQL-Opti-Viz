import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const severityTone = {
    High: 'suggestion-card__badge--high',
    Medium: 'suggestion-card__badge--medium',
    Low: 'suggestion-card__badge--low'
};
export function SuggestionsList({ suggestions }) {
    if (!suggestions.length) {
        return (_jsx("div", { className: "results-placeholder results-placeholder--empty", children: _jsx("p", { children: "No optimization suggestions detected for this query." }) }));
    }
    return (_jsx("div", { className: "suggestions", children: suggestions.map((item, index) => (_jsxs("article", { className: "suggestion-card", children: [_jsxs("header", { className: "suggestion-card__header", children: [_jsx("h3", { className: "suggestion-card__title", children: item.title }), _jsx("span", { className: `suggestion-card__badge ${severityTone[item.severity]}`, children: item.severity })] }), _jsx("p", { className: "suggestion-card__description", children: item.description }), _jsx("p", { className: "suggestion-card__recommendation", children: item.recommendation })] }, `${item.title}-${index}`))) }));
}
