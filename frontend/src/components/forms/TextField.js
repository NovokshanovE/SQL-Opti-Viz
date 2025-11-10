import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import clsx from 'clsx';
export function TextField({ label, helperText, error, ...rest }) {
    return (_jsxs("label", { className: "form-field", children: [_jsx("span", { className: "form-field__label", children: label }), _jsx("input", { className: clsx('form-field__input', error && 'form-field__input--error'), ...rest }), error ? _jsx("span", { className: "form-field__error", children: error }) : null, !error && helperText ? _jsx("span", { className: "form-field__helper", children: helperText }) : null] }));
}
