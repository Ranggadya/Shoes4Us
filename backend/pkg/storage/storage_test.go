package storage_test

import (
	"bytes"
	"context"
	"errors"
	"io"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/ranggadya/shoes4us/backend/internal/config"
	"github.com/ranggadya/shoes4us/backend/pkg/storage"
)

type mockS3Client struct {
	putObjectFn func(ctx context.Context, params *s3.PutObjectInput, optFns ...func(*s3.Options)) (*s3.PutObjectOutput, error)
}

func (m *mockS3Client) PutObject(ctx context.Context, params *s3.PutObjectInput, optFns ...func(*s3.Options)) (*s3.PutObjectOutput, error) {
	if m.putObjectFn != nil {
		return m.putObjectFn(ctx, params, optFns...)
	}
	return &s3.PutObjectOutput{}, nil
}

func TestLocalUploader_UploadSuccess(t *testing.T) {
	tempDir := t.TempDir()
	uploader := storage.NewLocalUploader(tempDir)

	content := []byte("fake-image-content")
	filename := "test-product.jpg"
	contentType := "image/jpeg"

	url, err := uploader.Upload(context.Background(), bytes.NewReader(content), filename, contentType)
	if err != nil {
		t.Fatalf("unexpected upload error: %v", err)
	}

	expectedURL := "/uploads/" + filename
	if url != expectedURL {
		t.Errorf("expected url %q, got %q", expectedURL, url)
	}

	savedFile := filepath.Join(tempDir, filename)
	data, err := os.ReadFile(savedFile)
	if err != nil {
		t.Fatalf("failed to read saved file: %v", err)
	}

	if !bytes.Equal(data, content) {
		t.Errorf("saved content does not match uploaded content")
	}
}

func TestLocalUploader_EmptyFilenameOrNilReader(t *testing.T) {
	tempDir := t.TempDir()
	uploader := storage.NewLocalUploader(tempDir)

	_, err := uploader.Upload(context.Background(), nil, "test.jpg", "image/jpeg")
	if err == nil {
		t.Errorf("expected error for nil reader, got nil")
	}

	_, err = uploader.Upload(context.Background(), strings.NewReader("data"), "", "image/jpeg")
	if err == nil {
		t.Errorf("expected error for empty filename, got nil")
	}
}

func TestR2Uploader_UploadSuccess(t *testing.T) {
	var capturedBucket, capturedKey, capturedContentType string
	var capturedBody []byte

	mockClient := &mockS3Client{
		putObjectFn: func(ctx context.Context, params *s3.PutObjectInput, optFns ...func(*s3.Options)) (*s3.PutObjectOutput, error) {
			capturedBucket = *params.Bucket
			capturedKey = *params.Key
			capturedContentType = *params.ContentType
			b, _ := io.ReadAll(params.Body)
			capturedBody = b
			return &s3.PutObjectOutput{}, nil
		},
	}

	uploader := storage.NewR2UploaderWithClient(mockClient, "shoes4us-bucket", "https://pub-abc123xyz.r2.dev")

	content := []byte("r2-sample-image-data")
	filename := "nike-shoe-42.png"
	contentType := "image/png"

	url, err := uploader.Upload(context.Background(), bytes.NewReader(content), filename, contentType)
	if err != nil {
		t.Fatalf("unexpected upload error: %v", err)
	}

	expectedKey := "products/" + filename
	expectedURL := "https://pub-abc123xyz.r2.dev/" + expectedKey

	if url != expectedURL {
		t.Errorf("expected url %q, got %q", expectedURL, url)
	}
	if capturedBucket != "shoes4us-bucket" {
		t.Errorf("expected bucket %q, got %q", "shoes4us-bucket", capturedBucket)
	}
	if capturedKey != expectedKey {
		t.Errorf("expected key %q, got %q", expectedKey, capturedKey)
	}
	if capturedContentType != contentType {
		t.Errorf("expected contentType %q, got %q", contentType, capturedContentType)
	}
	if !bytes.Equal(capturedBody, content) {
		t.Errorf("expected body %q, got %q", content, capturedBody)
	}
}

func TestR2Uploader_ErrorPropagation(t *testing.T) {
	mockClient := &mockS3Client{
		putObjectFn: func(ctx context.Context, params *s3.PutObjectInput, optFns ...func(*s3.Options)) (*s3.PutObjectOutput, error) {
			return nil, errors.New("r2 access denied")
		},
	}

	uploader := storage.NewR2UploaderWithClient(mockClient, "shoes4us-bucket", "https://pub-abc123xyz.r2.dev")
	_, err := uploader.Upload(context.Background(), strings.NewReader("data"), "img.jpg", "image/jpeg")
	if err == nil {
		t.Fatal("expected error from R2 upload failure, got nil")
	}
	if !strings.Contains(err.Error(), "r2 access denied") {
		t.Errorf("expected error message to contain 'r2 access denied', got %v", err)
	}
}

func TestNewUploader_FactoryFallback(t *testing.T) {
	cfg := &config.Config{
		UploadDir: t.TempDir(),
	}

	uploader, err := storage.NewUploader(cfg)
	if err != nil {
		t.Fatalf("unexpected factory error: %v", err)
	}

	if _, ok := uploader.(*storage.LocalUploader); !ok {
		t.Errorf("expected *storage.LocalUploader fallback when CF_R2 is empty, got %T", uploader)
	}
}
