package types

import (
	"context"
	"encoding/json"
)

type AnalyzeMode string

const (
	ModeConnected AnalyzeMode = "connected"
	ModeManual    AnalyzeMode = "manual"
)

type AnalyzeRequest struct {
	Mode             AnalyzeMode     `json:"mode"`
	ConnectionString string          `json:"connection_string,omitempty"`
	Query            string          `json:"query"`
	ExplainJSON      json.RawMessage `json:"explain_json,omitempty"`
}

type Severity string

const (
	SeverityLow    Severity = "Low"
	SeverityMedium Severity = "Medium"
	SeverityHigh   Severity = "High"
)

type Suggestion struct {
	Title          string   `json:"title"`
	Description    string   `json:"description"`
	Recommendation string   `json:"recommendation"`
	Severity       Severity `json:"severity"`
}

type AnalyzeResponse struct {
	AST         any          `json:"ast"`
	ExplainPlan any          `json:"explain_plan"`
	Suggestions []Suggestion `json:"suggestions"`
}

type Analyzer interface {
	Analyze(ctx context.Context, req AnalyzeRequest) (AnalyzeResponse, error)
}
