package ui

import (
	"embed"
	"io/fs"
)

// Content embeds the compiled frontend assets located in the build directory.
//
//go:embed build/*
var content embed.FS

// BuildFS returns a filesystem rooted at the bundled build directory.
func BuildFS() (fs.FS, error) {
	return fs.Sub(content, "build")
}
