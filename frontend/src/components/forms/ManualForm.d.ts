export interface ManualFormValues {
    query: string;
    explainJson: string;
}
interface ManualFormProps {
    values: ManualFormValues;
    onChange: (patch: Partial<ManualFormValues>) => void;
    errors?: Partial<Record<keyof ManualFormValues, string>>;
}
export declare function ManualForm({ values, onChange, errors }: ManualFormProps): import("react/jsx-runtime").JSX.Element;
export {};
