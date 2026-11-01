package storage

import (
	"context"
	"fmt"
	"io"
	"path/filepath"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

// R2Config holds configuration credentials for Cloudflare R2.
type R2Config struct {
	AccountID       string
	AccessKeyID     string
	SecretAccessKey string
	BucketName      string
	PublicURL       string
}

// S3UploaderAPI defines the interface subset of S3 Client used for uploading objects.
type S3UploaderAPI interface {
	PutObject(ctx context.Context, params *s3.PutObjectInput, optFns ...func(*s3.Options)) (*s3.PutObjectOutput, error)
}

// R2Uploader uploads files to Cloudflare R2 object storage.
type R2Uploader struct {
	s3Client   S3UploaderAPI
	bucketName string
	publicURL  string
}

// NewR2Uploader creates an R2Uploader using AWS S3 SDK v2 configured for Cloudflare R2.
func NewR2Uploader(ctx context.Context, cfg R2Config) (*R2Uploader, error) {
	if cfg.AccountID == "" || cfg.AccessKeyID == "" || cfg.SecretAccessKey == "" || cfg.BucketName == "" {
		return nil, fmt.Errorf("storage: incomplete Cloudflare R2 credentials")
	}

	endpointURL := fmt.Sprintf("https://%s.r2.cloudflarestorage.com", cfg.AccountID)

	awsCfg, err := awsconfig.LoadDefaultConfig(ctx,
		awsconfig.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(cfg.AccessKeyID, cfg.SecretAccessKey, "")),
		awsconfig.WithRegion("auto"),
	)
	if err != nil {
		return nil, fmt.Errorf("storage: failed to load aws config for R2: %w", err)
	}

	s3Client := s3.NewFromConfig(awsCfg, func(o *s3.Options) {
		o.BaseEndpoint = aws.String(endpointURL)
	})

	publicURL := strings.TrimRight(cfg.PublicURL, "/")
	if publicURL == "" {
		publicURL = endpointURL + "/" + cfg.BucketName
	}

	return &R2Uploader{
		s3Client:   s3Client,
		bucketName: cfg.BucketName,
		publicURL:  publicURL,
	}, nil
}

// NewR2UploaderWithClient creates an R2Uploader using an injected S3 client (ideal for unit testing).
func NewR2UploaderWithClient(client S3UploaderAPI, bucketName, publicURL string) *R2Uploader {
	return &R2Uploader{
		s3Client:   client,
		bucketName: bucketName,
		publicURL:  strings.TrimRight(publicURL, "/"),
	}
}

// Upload uploads the file to Cloudflare R2 bucket with key "products/<filename>".
func (r *R2Uploader) Upload(ctx context.Context, reader io.Reader, filename string, contentType string) (string, error) {
	if reader == nil {
		return "", fmt.Errorf("storage: file reader cannot be nil")
	}

	cleanFilename := strings.TrimSpace(filepath.Base(filename))
	if cleanFilename == "" || cleanFilename == "." {
		return "", fmt.Errorf("storage: filename cannot be empty")
	}

	key := "products/" + cleanFilename
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	_, err := r.s3Client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(r.bucketName),
		Key:         aws.String(key),
		Body:        reader,
		ContentType: aws.String(contentType),
	})
	if err != nil {
		return "", fmt.Errorf("storage: failed to upload object to Cloudflare R2: %w", err)
	}

	return fmt.Sprintf("%s/%s", r.publicURL, key), nil
}
