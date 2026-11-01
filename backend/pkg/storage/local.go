package storage

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
)

// LocalUploader saves uploaded files to a local directory on the server disk.
type LocalUploader struct {
	baseDir string
}

// NewLocalUploader creates a new LocalUploader for the given base directory.
func NewLocalUploader(baseDir string) *LocalUploader {
	dir := strings.TrimSpace(baseDir)
	if dir == "" {
		dir = "./uploads"
	}
	return &LocalUploader{baseDir: dir}
}

// Upload writes the file stream to baseDir and returns the URL path (/uploads/<filename>).
func (l *LocalUploader) Upload(ctx context.Context, r io.Reader, filename string, contentType string) (string, error) {
	if r == nil {
		return "", fmt.Errorf("storage: file reader cannot be nil")
	}

	cleanFilename := strings.TrimSpace(filepath.Base(filename))
	if cleanFilename == "" || cleanFilename == "." {
		return "", fmt.Errorf("storage: filename cannot be empty")
	}

	if err := os.MkdirAll(l.baseDir, 0o755); err != nil {
		return "", fmt.Errorf("storage: failed to create upload directory: %w", err)
	}

	dstPath := filepath.Join(l.baseDir, cleanFilename)
	dst, err := os.Create(dstPath)
	if err != nil {
		return "", fmt.Errorf("storage: failed to create local file: %w", err)
	}
	defer dst.Close()

	if _, err := io.Copy(dst, r); err != nil {
		return "", fmt.Errorf("storage: failed to write file data: %w", err)
	}

	return "/uploads/" + cleanFilename, nil
}
