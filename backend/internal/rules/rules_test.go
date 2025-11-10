package rules

import (
	"context"
	"testing"

	"github.com/evgeny/sql-opti-viz/backend/pkg/types"
)

func TestSeqScanRule(t *testing.T) {
	rule := NewSeqScanRule()
	input := Input{
		Plan: map[string]any{
			"Plan": map[string]any{
				"Node Type":    "Seq Scan",
				"Relation Name": "users",
			},
		},
	}

	suggestions, err := rule.Apply(context.Background(), input)
	if err != nil {
		t.Fatalf("apply rule: %v", err)
	}

	if len(suggestions) != 1 {
		t.Fatalf("expected 1 suggestion, got %d", len(suggestions))
	}

	if suggestions[0].Severity != types.SeverityHigh {
		t.Fatalf("expected severity High, got %s", suggestions[0].Severity)
	}
}

func TestLeadingWildcardRule(t *testing.T) {
	rule := NewLeadingWildcardRule()
	input := Input{
		AST: map[string]any{
			"stmts": []any{
				map[string]any{
					"stmt": map[string]any{
						"SelectStmt": map[string]any{
							"whereClause": map[string]any{
								"A_Expr": map[string]any{
									"kind": "AEXPR_LIKE",
									"lexpr": map[string]any{
										"ColumnRef": map[string]any{
											"fields": []any{
												map[string]any{
													"String": map[string]any{"sval": "email"},
												},
											},
										},
									},
									"rexpr": map[string]any{
										"A_Const": map[string]any{
											"sval": map[string]any{
												"sval": "%foo",
											},
										},
									},
								},
							},
						},
					},
				},
			},
		},
	}

	suggestions, err := rule.Apply(context.Background(), input)
	if err != nil {
		t.Fatalf("apply rule: %v", err)
	}

	if len(suggestions) != 1 {
		t.Fatalf("expected 1 suggestion, got %d", len(suggestions))
	}

	if suggestions[0].Severity != types.SeverityMedium {
		t.Fatalf("expected severity Medium, got %s", suggestions[0].Severity)
	}
}

func TestFunctionOnColumnRule(t *testing.T) {
	rule := NewFunctionOnColumnRule()
	input := Input{
		AST: map[string]any{
			"stmts": []any{
				map[string]any{
					"stmt": map[string]any{
						"SelectStmt": map[string]any{
							"whereClause": map[string]any{
								"A_Expr": map[string]any{
									"kind": "AEXPR_OP",
									"lexpr": map[string]any{
										"FuncCall": map[string]any{
											"funcname": []any{
												map[string]any{"String": map[string]any{"sval": "lower"}},
											},
											"args": []any{
												map[string]any{
													"ColumnRef": map[string]any{
														"fields": []any{
															map[string]any{"String": map[string]any{"sval": "email"}},
														},
													},
												},
											},
										},
									},
									"rexpr": map[string]any{
										"A_Const": map[string]any{
											"sval": map[string]any{"sval": "foo"},
										},
									},
								},
							},
						},
					},
				},
			},
		},
	}

	suggestions, err := rule.Apply(context.Background(), input)
	if err != nil {
		t.Fatalf("apply rule: %v", err)
	}

	if len(suggestions) != 1 {
		t.Fatalf("expected 1 suggestion, got %d", len(suggestions))
	}
}

func TestEngineAggregatesRules(t *testing.T) {
	engine := NewEngine(
		NewSeqScanRule(),
		NewLeadingWildcardRule(),
		NewFunctionOnColumnRule(),
	)

	input := Input{
		Plan: map[string]any{
			"Plan": map[string]any{
				"Node Type":    "Seq Scan",
				"Relation Name": "users",
			},
		},
		AST: map[string]any{
			"stmts": []any{
				map[string]any{
					"stmt": map[string]any{
						"SelectStmt": map[string]any{
							"whereClause": map[string]any{
								"A_Expr": map[string]any{
									"kind": "AEXPR_LIKE",
									"lexpr": map[string]any{
										"FuncCall": map[string]any{
											"funcname": []any{
												map[string]any{"String": map[string]any{"sval": "lower"}},
											},
											"args": []any{
												map[string]any{
													"ColumnRef": map[string]any{
														"fields": []any{
															map[string]any{"String": map[string]any{"sval": "email"}},
														},
													},
												},
											},
										},
									},
									"rexpr": map[string]any{
										"A_Const": map[string]any{
											"sval": map[string]any{"sval": "%foo"},
										},
									},
								},
							},
						},
					},
				},
			},
		},
	}

	suggestions, err := engine.Evaluate(context.Background(), input)
	if err != nil {
		t.Fatalf("evaluate engine: %v", err)
	}

	if len(suggestions) != 3 {
		t.Fatalf("expected 3 suggestions, got %d", len(suggestions))
	}
}



