package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"os"
	"sort"
	"strings"

	"github.com/evgeny/sql-opti-viz/backend/internal/analyzer"
	"github.com/evgeny/sql-opti-viz/backend/internal/rules"
	"github.com/evgeny/sql-opti-viz/backend/pkg/types"
)

func main() {
	mode := flag.String("mode", string(types.ModeManual), "Analysis mode: manual or connected")
	sqlPath := flag.String("sql", "", "Path to SQL query file or '-' for stdin")
	explainPath := flag.String("explain", "", "Path to EXPLAIN JSON (manual mode)")
	connString := flag.String("conn", "", "PostgreSQL connection string (connected mode)")
	format := flag.String("format", "json", "Output format: json or text")
	printAST := flag.Bool("print-ast", false, "Render AST as ASCII tree (text format)")
	printPlan := flag.Bool("print-plan", false, "Render explain plan as ASCII tree (text format)")
	astDepth := flag.Int("ast-depth", 4, "Maximum depth when rendering AST")
	flag.Parse()

	if *sqlPath == "" {
		fatalf("--sql is required")
	}

	query, err := readInput(*sqlPath)
	if err != nil {
		fatalf("failed to read SQL: %v", err)
	}

	engine := rules.NewEngine(
		rules.NewSeqScanRule(),
		rules.NewLeadingWildcardRule(),
		rules.NewFunctionOnColumnRule(),
	)
	svc := analyzer.New(engine)

	req := types.AnalyzeRequest{
		Mode:  types.AnalyzeMode(strings.ToLower(*mode)),
		Query: string(query),
	}

	switch req.Mode {
	case types.ModeManual:
		if *explainPath == "" {
			fatalf("manual mode requires --explain pointing to EXPLAIN JSON")
		}
		explainBytes, err := readInput(*explainPath)
		if err != nil {
			fatalf("failed to read explain JSON: %v", err)
		}
		req.ExplainJSON = explainBytes
	case types.ModeConnected:
		if strings.TrimSpace(*connString) == "" {
			fatalf("connected mode requires --conn with PostgreSQL connection string")
		}
		req.ConnectionString = *connString
	default:
		fatalf("unsupported mode %q", *mode)
	}

	resp, err := svc.Analyze(context.Background(), req)
	if err != nil {
		fatalf("analysis failed: %v", err)
	}

	if strings.ToLower(*format) == "text" {
		printHuman(resp, *printAST, *printPlan, *astDepth)
		return
	}

	enc := json.NewEncoder(os.Stdout)
	enc.SetIndent("", "  ")
	if err := enc.Encode(resp); err != nil {
		fatalf("failed to encode response: %v", err)
	}
}

func readInput(path string) ([]byte, error) {
	var reader io.Reader
	if path == "-" {
		reader = os.Stdin
	} else {
		file, err := os.Open(path)
		if err != nil {
			return nil, err
		}
		defer file.Close()
		reader = file
	}
	return io.ReadAll(reader)
}

func printHuman(resp types.AnalyzeResponse, showAST, showPlan bool, astDepth int) {
	fmt.Println("Suggestions:")
	if len(resp.Suggestions) == 0 {
		fmt.Println("  (none)")
	} else {
		for i, s := range resp.Suggestions {
			fmt.Printf("%d. [%s] %s\n", i+1, s.Severity, s.Title)
			if s.Description != "" {
				fmt.Printf("   - %s\n", s.Description)
			}
			if s.Recommendation != "" {
				fmt.Printf("   * %s\n", s.Recommendation)
			}
			fmt.Println()
		}
	}

	if showPlan {
		fmt.Println("Explain plan:")
		if tree := buildPlanTree(resp.ExplainPlan); tree != nil {
			renderTree(*tree, os.Stdout)
		} else {
			fmt.Println("  (unavailable)")
		}
	}

	if showAST {
		fmt.Println("AST:")
		if tree := buildASTTree("root", resp.AST, astDepth); tree != nil {
			renderTree(*tree, os.Stdout)
		} else {
			fmt.Println("  (unavailable)")
		}
	}
}

func fatalf(format string, args ...any) {
	fmt.Fprintf(os.Stderr, format+"\n", args...)
	os.Exit(1)
}

type treeNode struct {
	Label    string
	Children []treeNode
}

func renderTree(root treeNode, w io.Writer) {
	renderTreeRecursive(root, "", true, w)
}

func renderTreeRecursive(node treeNode, prefix string, isLast bool, w io.Writer) {
	branch := "├──"
	childPrefix := prefix + "│   "
	if isLast {
		branch = "└──"
		childPrefix = prefix + "    "
	}
	if prefix == "" {
		fmt.Fprintf(w, "%s\n", node.Label)
	} else {
		fmt.Fprintf(w, "%s%s %s\n", prefix, branch, node.Label)
	}
	for i, child := range node.Children {
		last := i == len(node.Children)-1
		renderTreeRecursive(child, childPrefix, last, w)
	}
}

func buildPlanTree(plan any) *treeNode {
	// EXPLAIN (FORMAT JSON) usually returns an array with a single element.
	if arr, ok := plan.([]any); ok && len(arr) > 0 {
		plan = arr[0]
	}
	if wrapper, ok := plan.(map[string]any); ok {
		if inner, ok := wrapper["Plan"]; ok {
			plan = inner
		} else {
			plan = wrapper
		}
	}

	node, ok := plan.(map[string]any)
	if !ok {
		return nil
	}
	return buildPlanTreeRecursive(node)
}

func buildPlanTreeRecursive(node map[string]any) *treeNode {
	title := toString(node["Node Type"])
	if title == "" {
		title = "Plan Node"
	}
	var parts []string
	if rel := toString(node["Relation Name"]); rel != "" {
		parts = append(parts, rel)
	}
	if alias := toString(node["Alias"]); alias != "" {
		parts = append(parts, "as "+alias)
	}
	if len(parts) > 0 {
		title = fmt.Sprintf("%s (%s)", title, strings.Join(parts, ", "))
	}
	if filter := toString(node["Filter"]); filter != "" {
		title += " | " + filter
	}

	var children []treeNode
	if rawChildren, ok := node["Plans"].([]any); ok {
		for _, child := range rawChildren {
			if childNode, ok := child.(map[string]any); ok {
				if t := buildPlanTreeRecursive(childNode); t != nil {
					children = append(children, *t)
				}
			}
		}
	}

	return &treeNode{Label: title, Children: children}
}

func buildASTTree(label string, value any, maxDepth int) *treeNode {
	if maxDepth < 0 {
		return nil
	}
	switch v := value.(type) {
	case map[string]any:
		keys := make([]string, 0, len(v))
		for k := range v {
			keys = append(keys, k)
		}
		sort.Strings(keys)
		children := make([]treeNode, 0, len(keys))
		for _, k := range keys {
			child := buildASTTree(k, v[k], maxDepth-1)
			if child != nil {
				children = append(children, *child)
			}
		}
		return &treeNode{Label: label, Children: children}
	case []any:
		children := make([]treeNode, 0, len(v))
		for i, item := range v {
			child := buildASTTree(fmt.Sprintf("[%d]", i), item, maxDepth-1)
			if child != nil {
				children = append(children, *child)
			}
		}
		return &treeNode{Label: label, Children: children}
	case string:
		return &treeNode{Label: fmt.Sprintf("%s: %q", label, v)}
	case fmt.Stringer:
		return &treeNode{Label: fmt.Sprintf("%s: %s", label, v.String())}
	case nil:
		return &treeNode{Label: fmt.Sprintf("%s: null", label)}
	default:
		return &treeNode{Label: fmt.Sprintf("%s: %v", label, v)}
	}
}

func toString(v any) string {
	switch t := v.(type) {
	case string:
		return t
	case fmt.Stringer:
		return t.String()
	case json.Number:
		return t.String()
	case float64:
		return fmt.Sprintf("%g", t)
	case int64:
		return fmt.Sprintf("%d", t)
	case nil:
		return ""
	default:
		return fmt.Sprintf("%v", t)
	}
}
