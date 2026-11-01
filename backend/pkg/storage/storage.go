package storage

import (
	"context"
	"fmt"
	"io"
	"strings"

	"github.com/ranggadya/shoes4us/backend/internal/config"
)

// Uploader defines the contract for uploading binary files to a storage provider.
type Uploader interface {
	Upload(ctx context.Context, r io.Reader, filename string, contentType string) (string, error)
}

// NewUploader creates an Uploader based on application configuration.
// If Cloudflare R2 credentials are provided, it returns an R2Uploader.
// Otherwise, it defaults to LocalUploader storing in cfg.UploadDir.
func NewUploader(cfg *config.Config) (Uploader, error) {
	if cfg == nil {
		return nil, fmt.Errorf("storage: config cannot be nil")
	}

	if cfg.CFR2AccountID != "" && cfg.CFR2AccessKeyID != "" && cfg.CFR2SecretKey != "" && cfg.CFR2BucketName != "" {
		return NewR2Uploader(context.Background(), R2Config{
			AccountID:       cfg.CFR2AccountID,
			AccessKeyID:     cfg.CFR2AccessKeyID,
			SecretAccessKey: cfg.CFR2SecretKey,
			BucketName:      cfg.CFR2BucketName,
			PublicURL:       cfg.CFR2PublicURL,
		})
	}

	uploadDir := strings.TrimSpace(cfg.UploadDir)
	if uploadDir == "" {
		uploadDir = "./uploads"
	}
	return NewLocalUploader(uploadDir), nil
}
