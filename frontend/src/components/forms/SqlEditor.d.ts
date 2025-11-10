interface SqlEditorProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
    placeholder?: string;
    error?: string;
}
export declare function SqlEditor({ value, onChange, label, placeholder, error }: SqlEditorProps): import("react/jsx-runtime").JSX.Element;
export {};
