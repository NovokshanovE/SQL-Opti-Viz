package rules

import (
	"context"
	"fmt"

	"github.com/evgeny/sql-opti-viz/backend/pkg/types"
)

type FunctionOnColumnRule struct{}

func NewFunctionOnColumnRule() *FunctionOnColumnRule {
	return &FunctionOnColumnRule{}
}

func (r *FunctionOnColumnRule) Name() string {
	return "FunctionOnColumn"
}

func (r *FunctionOnColumnRule) Apply(_ context.Context, input Input) ([]types.Suggestion, error) {
	suggestions := make([]types.Suggestion, 0)
	seen := make(map[string]struct{})

	walkAST(input.AST, func(node map[string]any) {
		expr, ok := node["A_Expr"].(map[string]any)
		if !ok {
			return
		}

		checkOperand := func(operand any) {
			funcName, args, ok := extractFunctionCall(operand)
			if !ok || len(args) == 0 {
				return
			}

			column := extractColumnName(args[0])
			if column == "" {
				return
			}

			key := funcName + ":" + column
			if _, exists := seen[key]; exists {
				return
			}
			seen[key] = struct{}{}

			suggestions = append(suggestions, types.Suggestion{
				Title:          "Function applied to column in predicate",
				Description:    fmt.Sprintf("Function %s is applied to column %s in a predicate, disabling index usage.", funcName, column),
				Recommendation: fmt.Sprintf("Pre-compute %s or rewrite the predicate to avoid wrapping the column in a function.", column),
				Severity:       types.SeverityMedium,
			})
		}

		checkOperand(expr["lexpr"])
		checkOperand(expr["rexpr"])
	})

	return suggestions, nil
}



