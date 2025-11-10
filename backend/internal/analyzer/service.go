package analyzer

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
	pgquery "github.com/pganalyze/pg_query_go/v5"

	"github.com/evgeny/sql-opti-viz/backend/internal/rules"
	"github.com/evgeny/sql-opti-viz/backend/pkg/types"
)

type Service struct {
	engine *rules.Engine
}

func New(engine *rules.Engine) *Service {
	return &Service{engine: engine}
}

func (s *Service) Analyze(ctx context.Context, req types.AnalyzeRequest) (types.AnalyzeResponse, error) {
	if strings.TrimSpace(req.Query) == "" {
		return types.AnalyzeResponse{}, errors.New("query is required")
	}

	ast, err := parseAST(req.Query)
	if err != nil {
		return types.AnalyzeResponse{}, fmt.Errorf("parse AST: %w", err)
	}

	plan, err := s.obtainPlan(ctx, req)
	if err != nil {
		return types.AnalyzeResponse{}, err
	}

	suggestions := []types.Suggestion{}
	if s.engine != nil {
		suggestions, err = s.engine.Evaluate(ctx, rules.Input{
			AST:     ast,
			Plan:    plan,
			Request: req,
		})
		if err != nil {
			return types.AnalyzeResponse{}, fmt.Errorf("run rule engine: %w", err)
		}
	}

	return types.AnalyzeResponse{
		AST:         ast,
		ExplainPlan: plan,
		Suggestions: suggestions,
	}, nil
}

func parseAST(query string) (map[string]any, error) {
	jsonStr, err := pgquery.ParseToJSON(query)
	if err != nil {
		return nil, err
	}

	var ast map[string]any
	if err := json.Unmarshal([]byte(jsonStr), &ast); err != nil {
		return nil, err
	}

	return ast, nil
}

func (s *Service) obtainPlan(ctx context.Context, req types.AnalyzeRequest) (map[string]any, error) {
	switch req.Mode {
	case types.ModeConnected:
		if strings.TrimSpace(req.ConnectionString) == "" {
			return nil, errors.New("connection_string is required for connected mode")
		}
		return runExplain(ctx, req.ConnectionString, req.Query)
	case types.ModeManual:
		if len(req.ExplainJSON) == 0 {
			return nil, errors.New("explain_json is required for manual mode")
		}
		return decodePlan(req.ExplainJSON)
	default:
		return nil, fmt.Errorf("unsupported mode %q", req.Mode)
	}
}

func decodePlan(raw json.RawMessage) (map[string]any, error) {
	var payload any
	if err := json.Unmarshal(raw, &payload); err != nil {
		return nil, fmt.Errorf("decode explain_json: %w", err)
	}
	return normalizePlan(payload)
}

func runExplain(ctx context.Context, connStr, query string) (map[string]any, error) {
	conn, err := pgx.Connect(ctx, connStr)
	if err != nil {
		return nil, err
	}
	defer conn.Close(ctx)

	explainQuery := fmt.Sprintf("EXPLAIN (FORMAT JSON, COSTS, ANALYZE, BUFFERS) %s", query)
	rows, err := conn.Query(ctx, explainQuery)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var raw json.RawMessage
	if rows.Next() {
		if err := rows.Scan(&raw); err != nil {
			return nil, err
		}
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	if len(raw) == 0 {
		return nil, errors.New("empty explain result")
	}

	var payload any
	if err := json.Unmarshal(raw, &payload); err != nil {
		return nil, err
	}

	return normalizePlan(payload)
}

func normalizePlan(payload any) (map[string]any, error) {
	switch value := payload.(type) {
	case map[string]any:
		return value, nil
	case []any:
		if len(value) == 0 {
			return nil, errors.New("empty explain result")
		}
		if first, ok := value[0].(map[string]any); ok {
			return first, nil
		}
		return nil, errors.New("unexpected explain array shape")
	default:
		return nil, errors.New("unsupported explain plan format")
	}
}

