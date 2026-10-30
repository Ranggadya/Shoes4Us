package handler_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/ranggadya/shoes4us/backend/internal/handler"
)

func TestRouter_HealthCheckAndCORS(t *testing.T) {
	r := handler.NewRouter(handler.RouterDependencies{
		AllowedOrigins: []string{"http://localhost:3000"},
	})
	req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	req.Header.Set("Origin", "http://localhost:3000")
	rec := httptest.NewRecorder()

	r.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
	if got := rec.Header().Get("Access-Control-Allow-Origin"); got != "http://localhost:3000" {
		t.Fatalf("expected CORS origin http://localhost:3000, got %q", got)
	}
	if got := rec.Header().Get("Access-Control-Allow-Credentials"); got != "true" {
		t.Fatalf("expected Access-Control-Allow-Credentials true, got %q", got)
	}

	var body struct {
		Success bool              `json:"success"`
		Message string            `json:"message"`
		Data    map[string]string `json:"data"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("failed to unmarshal response body: %v", err)
	}
	if !body.Success || body.Message != "OK" || body.Data["status"] != "ok" {
		t.Fatalf("unexpected health response body: %+v", body)
	}
}

func TestRouter_CORSPreflightAndStaticUploads(t *testing.T) {
	tmpDir := t.TempDir()
	sampleFile := filepath.Join(tmpDir, "shoe.txt")
	if err := os.WriteFile(sampleFile, []byte("nike-air"), 0o644); err != nil {
		t.Fatalf("failed to write temp upload file: %v", err)
	}

	r := handler.NewRouter(handler.RouterDependencies{
		UploadDir: tmpDir,
	})

	// Default CORS origins include http://localhost:5173
	preReq := httptest.NewRequest(http.MethodOptions, "/api/health", nil)
	preReq.Header.Set("Origin", "http://localhost:5173")
	preReq.Header.Set("Access-Control-Request-Method", "PATCH")
	preReq.Header.Set("Access-Control-Request-Headers", "Authorization, Content-Type")
	preRec := httptest.NewRecorder()
	r.ServeHTTP(preRec, preReq)

	if got := preRec.Header().Get("Access-Control-Allow-Origin"); got != "http://localhost:5173" {
		t.Fatalf("expected default CORS origin http://localhost:5173, got %q", got)
	}

	// Static uploads serving
	upReq := httptest.NewRequest(http.MethodGet, "/uploads/shoe.txt", nil)
	upRec := httptest.NewRecorder()
	r.ServeHTTP(upRec, upReq)

	if upRec.Code != http.StatusOK {
		t.Fatalf("expected 200 for static upload, got %d", upRec.Code)
	}
	if upRec.Body.String() != "nike-air" {
		t.Fatalf("expected 'nike-air', got %q", upRec.Body.String())
	}
}
