package rules

import (
	"context"
	"fmt"

	"github.com/evgeny/sql-opti-viz/backend/pkg/types"
)

type Input struct {
	AST     map[string]any
	Plan    map[string]any
	Request types.AnalyzeRequest
}

type Rule interface {
	Name() string
	Apply(ctx context.Context, input Input) ([]types.Suggestion, error)
}

type Engine struct {
	rules []Rule
}

func NewEngine(rules ...Rule) *Engine {
	return &Engine{rules: rules}
}

func (e *Engine) Evaluate(ctx context.Context, input Input) ([]types.Suggestion, error) {
	if e == nil {
		return nil, nil
	}

	suggestions := make([]types.Suggestion, 0)
	for _, rule := range e.rules {
		result, err := rule.Apply(ctx, input)
		if err != nil {
			return nil, fmt.Errorf("rule %s: %w", rule.Name(), err)
		}
		if len(result) > 0 {
			suggestions = append(suggestions, result...)
		}
	}
	return suggestions, nil
}



