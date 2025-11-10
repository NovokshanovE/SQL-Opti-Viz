export type AnalyzeMode = 'connected' | 'manual';
export interface AnalyzeRequestBase {
    mode: AnalyzeMode;
    query: string;
}
export interface ConnectedAnalyzeRequest extends AnalyzeRequestBase {
    mode: 'connected';
    connection_string: string;
}
export interface ManualAnalyzeRequest extends AnalyzeRequestBase {
    mode: 'manual';
    explain_json: unknown;
}
export type AnalyzeRequest = ConnectedAnalyzeRequest | ManualAnalyzeRequest;
export type Severity = 'Low' | 'Medium' | 'High';
export interface Suggestion {
    title: string;
    description: string;
    recommendation: string;
    severity: Severity;
}
export interface AnalyzeResponse {
    ast: unknown;
    explain_plan: unknown;
    suggestions: Suggestion[];
}
export interface AnalyzeError {
    error: string;
    details?: string;
}
