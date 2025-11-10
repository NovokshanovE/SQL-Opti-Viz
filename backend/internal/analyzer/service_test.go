package analyzer

import (
	"context"
	"encoding/json"
	"testing"

	"github.com/evgeny/sql-opti-viz/backend/internal/rules"
	"github.com/evgeny/sql-opti-viz/backend/pkg/types"
)

func TestAnalyzeManualModeSuccess(t *testing.T) {
	engine := rules.NewEngine(
		rules.NewSeqScanRule(),
		rules.NewLeadingWildcardRule(),
		rules.NewFunctionOnColumnRule(),
	)
	service := New(engine)

	explain := map[string]any{
		"Plan": map[string]any{
			"Node Type":     "Seq Scan",
			"Relation Name": "users",
		},
	}

	explainJSON, err := json.Marshal(explain)
	if err != nil {
		t.Fatalf("marshal explain: %v", err)
	}

	req := types.AnalyzeRequest{
		Mode:        types.ModeManual,
		Query:       "SELECT * FROM users WHERE lower(email) LIKE '%foo';",
		ExplainJSON: explainJSON,
	}

	resp, err := service.Analyze(context.Background(), req)
	if err != nil {
		t.Fatalf("analyze manual: %v", err)
	}

	if resp.ExplainPlan == nil {
		t.Fatalf("expected explain plan in response")
	}

	if len(resp.Suggestions) != 3 {
		t.Fatalf("expected 3 suggestions, got %d", len(resp.Suggestions))
	}
}

func TestAnalyzeManualInvalidExplainJSON(t *testing.T) {
	service := New(rules.NewEngine())

	req := types.AnalyzeRequest{
		Mode:        types.ModeManual,
		Query:       "SELECT 1",
		ExplainJSON: []byte("not-json"),
	}

	if _, err := service.Analyze(context.Background(), req); err == nil {
		t.Fatalf("expected error for invalid explain json")
	}
}

func TestAnalyzeMissingQuery(t *testing.T) {
	service := New(rules.NewEngine())

	req := types.AnalyzeRequest{
		Mode: types.ModeManual,
	}

	if _, err := service.Analyze(context.Background(), req); err == nil {
		t.Fatalf("expected error when query is missing")
	}
}

func TestAnalyzeConnectedRequiresConnectionString(t *testing.T) {
	service := New(rules.NewEngine())

	req := types.AnalyzeRequest{
		Mode:  types.ModeConnected,
		Query: "SELECT 1",
	}

	if _, err := service.Analyze(context.Background(), req); err == nil {
		t.Fatalf("expected error when connection string missing in connected mode")
	}
}
