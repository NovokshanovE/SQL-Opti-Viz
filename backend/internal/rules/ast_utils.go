package rules

import "strings"

func walkAST(node any, visit func(map[string]any)) {
	switch typed := node.(type) {
	case map[string]any:
		visit(typed)
		for _, value := range typed {
			walkAST(value, visit)
		}
	case []any:
		for _, item := range typed {
			walkAST(item, visit)
		}
	}
}

func extractColumnName(node any) string {
	colRef, ok := node.(map[string]any)
	if !ok {
		return ""
	}

	refData, ok := colRef["ColumnRef"].(map[string]any)
	if !ok {
		return ""
	}

	fields, ok := refData["fields"].([]any)
	if !ok || len(fields) == 0 {
		return ""
	}

	if field, ok := fields[len(fields)-1].(map[string]any); ok {
		if strNode, ok := field["String"].(map[string]any); ok {
			if name, ok := strNode["sval"].(string); ok {
				return name
			}
		}
	}

	return ""
}

func extractConstString(node any) (string, bool) {
	m, ok := node.(map[string]any)
	if !ok {
		return "", false
	}

	aConst, ok := m["A_Const"].(map[string]any)
	if !ok {
		return "", false
	}

	if strNode, ok := aConst["sval"].(map[string]any); ok {
		if str, ok := strNode["sval"].(string); ok {
			return str, true
		}
	}

	return "", false
}

func extractFunctionCall(node any) (funcName string, args []any, ok bool) {
	m, ok := node.(map[string]any)
	if !ok {
		return "", nil, false
	}

	funcCall, ok := m["FuncCall"].(map[string]any)
	if !ok {
		return "", nil, false
	}

	nameParts, ok := funcCall["funcname"].([]any)
	if !ok || len(nameParts) == 0 {
		return "", nil, false
	}

	namePart, ok := nameParts[len(nameParts)-1].(map[string]any)
	if !ok {
		return "", nil, false
	}

	if strNode, ok := namePart["String"].(map[string]any); ok {
		raw, _ := strNode["sval"].(string)
		args, _ := funcCall["args"].([]any)
		return strings.ToLower(raw), args, true
	}

	return "", nil, false
}

