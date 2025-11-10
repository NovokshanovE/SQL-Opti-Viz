import { jsx as _jsx } from "react/jsx-runtime";
import { JsonView, darkStyles } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';
export function AstTree({ ast }) {
    if (!ast) {
        return (_jsx("div", { className: "results-placeholder results-placeholder--empty", children: _jsx("p", { children: "No AST available for this query." }) }));
    }
    return (_jsx("div", { className: "ast-tree", children: _jsx(JsonView, { data: ast, style: darkStyles, shouldExpandNode: (level) => level < 2 }) }));
}
