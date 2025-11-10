import { InputHTMLAttributes } from 'react';
interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    helperText?: string;
    error?: string;
}
export declare function TextField({ label, helperText, error, ...rest }: TextFieldProps): import("react/jsx-runtime").JSX.Element;
export {};
