package rules

import (
	"context"
	"fmt"

	"github.com/evgeny/sql-opti-viz/backend/pkg/types"
)

type SeqScanRule struct{}

func NewSeqScanRule() *SeqScanRule {
	return &SeqScanRule{}
}

func (r *SeqScanRule) Name() string {
	return "SeqScan"
}

func (r *SeqScanRule) Apply(_ context.Context, input Input) ([]types.Suggestion, error) {
	root := extractPlanRoot(input.Plan)
	if root == nil {
		return nil, nil
	}

	suggestions := make([]types.Suggestion, 0)
	traversePlan(root, func(node map[string]any) {
		if getString(node, "Node Type") == "Seq Scan" {
			relation := getString(node, "Relation Name")
			if relation == "" {
				relation = "target table"
			}
			suggestions = append(suggestions, types.Suggestion{
				Title:          "Sequential scan detected",
				Description:    fmt.Sprintf("The query plan uses a sequential scan on %q.", relation),
				Recommendation: fmt.Sprintf("Consider adding an appropriate index on %q or rewriting the filter to enable index usage.", relation),
				Severity:       types.SeverityHigh,
			})
		}
	})

	return suggestions, nil
}



