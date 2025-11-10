package main

import (
	"io/fs"
	"log"
	"os"
	"strings"

	"github.com/evgeny/sql-opti-viz/backend/internal/analyzer"
	"github.com/evgeny/sql-opti-viz/backend/internal/rules"
	"github.com/evgeny/sql-opti-viz/backend/internal/server"
	"github.com/evgeny/sql-opti-viz/backend/ui"
)

func main() {
	ruleEngine := rules.NewEngine(
		rules.NewSeqScanRule(),
		rules.NewLeadingWildcardRule(),
		rules.NewFunctionOnColumnRule(),
	)

	analyzerSvc := analyzer.New(ruleEngine)

	staticDir := os.Getenv("STATIC_DIR")
	var staticFS fs.FS

	if staticDir == "" {
		if embedded, err := ui.BuildFS(); err == nil {
			staticFS = embedded
		} else {
			log.Printf("warning: embedded UI assets unavailable: %v", err)
		}
	}

	config := server.Config{
		StaticDir:      staticDir,
		StaticFS:       staticFS,
		AllowedOrigins: parseAllowedOrigins(os.Getenv("ALLOW_ORIGINS")),
		DevMode:        os.Getenv("GIN_MODE") != "release",
		Analyzer:       analyzerSvc,
	}

	router, err := server.New(config)
	if err != nil {
		log.Fatalf("failed to create server: %v", err)
	}

	addr := ":" + getEnv("PORT", "8080")
	if err := router.Run(addr); err != nil {
		log.Fatalf("server exited: %v", err)
	}
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

func parseAllowedOrigins(raw string) []string {
	if raw == "" {
		return nil
	}
	parts := strings.Split(raw, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if trimmed := strings.TrimSpace(p); trimmed != "" {
			out = append(out, trimmed)
		}
	}
	return out
}
