export interface ConnectedFormValues {
    host: string;
    port: string;
    database: string;
    username: string;
    password: string;
    query: string;
}
interface ConnectedFormProps {
    values: ConnectedFormValues;
    onChange: (patch: Partial<ConnectedFormValues>) => void;
    errors?: Partial<Record<keyof ConnectedFormValues, string>>;
}
export declare function buildConnectionString(values: ConnectedFormValues): string;
export declare function ConnectedForm({ values, onChange, errors }: ConnectedFormProps): import("react/jsx-runtime").JSX.Element;
export {};
