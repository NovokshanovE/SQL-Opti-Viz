package rules

import (
	"context"
	"fmt"
	"strings"

	"github.com/evgeny/sql-opti-viz/backend/pkg/types"
)

type LeadingWildcardRule struct{}

func NewLeadingWildcardRule() *LeadingWildcardRule {
	return &LeadingWildcardRule{}
}

func (r *LeadingWildcardRule) Name() string {
	return "LeadingWildcard"
}

func (r *LeadingWildcardRule) Apply(_ context.Context, input Input) ([]types.Suggestion, error) {
	suggestions := make([]types.Suggestion, 0)
	seen := make(map[string]struct{})

	walkAST(input.AST, func(node map[string]any) {
		expr, ok := node["A_Expr"].(map[string]any)
		if !ok {
			return
		}

		kind, _ := expr["kind"].(string)
		if kind != "AEXPR_LIKE" {
			return
		}

		pattern, ok := extractConstString(expr["rexpr"])
		if !ok || !strings.HasPrefix(pattern, "%") {
			return
		}

		column := extractColumnName(expr["lexpr"])
		key := column + ":" + pattern
		if _, exists := seen[key]; exists {
			return
		}
		seen[key] = struct{}{}

		if column == "" {
			column = "column"
		}

		suggestions = append(suggestions, types.Suggestion{
			Title:          "Leading wildcard in LIKE pattern",
			Description:    fmt.Sprintf("Predicate `LIKE '%s'` prevents index usage on %s.", pattern, column),
			Recommendation: fmt.Sprintf("Rewrite the predicate on %s to avoid a leading wildcard or use full-text search mechanisms.", column),
			Severity:       types.SeverityMedium,
		})
	})

	return suggestions, nil
}



