package rules

func extractPlanRoot(plan map[string]any) map[string]any {
	if plan == nil {
		return nil
	}

	if root, ok := plan["Plan"].(map[string]any); ok {
		return root
	}

	return plan
}

func traversePlan(node map[string]any, visit func(map[string]any)) {
	if node == nil {
		return
	}

	visit(node)

	if childrenRaw, ok := node["Plans"]; ok {
		if children, ok := childrenRaw.([]any); ok {
			for _, child := range children {
				if childNode, ok := child.(map[string]any); ok {
					traversePlan(childNode, visit)
				}
			}
		}
	}
}

func getString(node map[string]any, key string) string {
	if node == nil {
		return ""
	}
	if value, ok := node[key]; ok {
		if str, ok := value.(string); ok {
			return str
		}
	}
	return ""
}



