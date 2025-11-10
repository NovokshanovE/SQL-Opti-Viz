package server

import (
	"fmt"
	"io/fs"
	"net/http"
	"os"
	"strings"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"github.com/evgeny/sql-opti-viz/backend/pkg/types"
)

type Config struct {
	Analyzer       types.Analyzer
	StaticDir      string
	StaticFS       fs.FS
	AllowedOrigins []string
	DevMode        bool
}

func New(config Config) (*gin.Engine, error) {
	if !config.DevMode {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()
	router.RedirectTrailingSlash = false
	router.Use(gin.Recovery(), gin.Logger())

	if len(config.AllowedOrigins) > 0 {
		corsConfig := cors.DefaultConfig()
		corsConfig.AllowOrigins = config.AllowedOrigins
		corsConfig.AllowCredentials = true
		corsConfig.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization"}
		corsConfig.AllowMethods = []string{http.MethodGet, http.MethodPost, http.MethodOptions}
		router.Use(cors.New(corsConfig))
	}

	router.GET("/healthz", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	api := router.Group("/api")
	{
		api.POST("/analyze", func(c *gin.Context) {
			var req types.AnalyzeRequest
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{
					"error":   "invalid_request",
					"details": err.Error(),
				})
				return
			}

			if config.Analyzer == nil {
				c.JSON(http.StatusNotImplemented, gin.H{
					"error":   "analyzer_not_configured",
					"details": "Analyzer component is not available yet",
				})
				return
			}

			resp, err := config.Analyzer.Analyze(c.Request.Context(), req)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"error":   "analyze_failed",
					"details": err.Error(),
				})
				return
			}

			c.JSON(http.StatusOK, resp)
		})
	}

	setupStaticRoutes(router, config.StaticDir, config.StaticFS)

	return router, nil
}

func setupStaticRoutes(router *gin.Engine, staticDir string, staticFS fs.FS) {
	switch {
	case staticFS != nil:
		serveFromFS(router, staticFS)
	case staticDir != "":
		serveFromDirectory(router, staticDir)
	default:
		registerServiceStatus(router)
	}
}

func serveFromDirectory(router *gin.Engine, staticDir string) {
	dirFS := os.DirFS(staticDir)
	serveFromFS(router, dirFS)
}

func serveFromFS(router *gin.Engine, filesystem fs.FS) {
	fileServer := http.FS(filesystem)

	router.GET("/", func(c *gin.Context) {
		c.FileFromFS("index.html", fileServer)
	})

	router.NoRoute(func(c *gin.Context) {
		if strings.HasPrefix(c.Request.URL.Path, "/api/") {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "not_found",
				"details": fmt.Sprintf("path %s not found", c.Request.URL.Path),
			})
			return
		}

		requestPath := strings.TrimPrefix(c.Request.URL.Path, "/")
		if requestPath != "" {
			if _, err := fs.Stat(filesystem, requestPath); err == nil {
				c.FileFromFS(requestPath, fileServer)
				return
			}
		}

		c.FileFromFS("index.html", fileServer)
	})
}

func registerServiceStatus(router *gin.Engine) {
	router.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"service": "SQL-Opti-Viz",
			"version": "dev",
			"status":  "running",
		})
	})
}
