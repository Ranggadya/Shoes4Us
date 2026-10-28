package response_test

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/ranggadya/shoes4us/backend/internal/domain"
	"github.com/ranggadya/shoes4us/backend/pkg/response"
)

func TestWriteError_FormatsAppErrorEnvelope(t *testing.T) {
	rec := httptest.NewRecorder()
	response.WriteError(rec, domain.NewBadRequest("Ukuran sepatu wajib dipilih"))

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rec.Code)
	}
	var body map[string]any
	_ = json.Unmarshal(rec.Body.Bytes(), &body)
	if body["success"] != false || body["message"] != "Ukuran sepatu wajib dipilih" {
		t.Fatalf("unexpected body: %#v", body)
	}
	errObj, ok := body["error"].(map[string]any)
	if !ok || errObj["message"] != "Ukuran sepatu wajib dipilih" {
		t.Fatalf("expected nested error.message, got %#v", body["error"])
	}
	if errObj["code"] != "BAD_REQUEST" {
		t.Fatalf("expected error.code BAD_REQUEST, got %#v", errObj["code"])
	}
}

func TestWriteError_FallbackInternalError(t *testing.T) {
	rec := httptest.NewRecorder()
	response.WriteError(rec, errors.New("unexpected db failure"))

	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", rec.Code)
	}
	var body map[string]any
	_ = json.Unmarshal(rec.Body.Bytes(), &body)
	if body["success"] != false {
		t.Fatalf("expected success=false, got %#v", body)
	}
	errObj, ok := body["error"].(map[string]any)
	if !ok || errObj["code"] != "INTERNAL_ERROR" {
		t.Fatalf("expected error.code INTERNAL_ERROR, got %#v", body["error"])
	}
}

func TestWriteSuccess_And_WriteCreated(t *testing.T) {
	rec := httptest.NewRecorder()
	response.WriteSuccess(rec, http.StatusOK, "Berhasil", map[string]string{"id": "1"}, map[string]int{"total": 1})

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
	var body map[string]any
	_ = json.Unmarshal(rec.Body.Bytes(), &body)
	if body["success"] != true || body["message"] != "Berhasil" {
		t.Fatalf("unexpected success body: %#v", body)
	}
	if body["meta"] == nil {
		t.Fatalf("expected meta to be present, got nil")
	}

	recCreated := httptest.NewRecorder()
	response.WriteCreated(recCreated, "Produk dibuat", map[string]string{"slug": "nike-air"})
	if recCreated.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d", recCreated.Code)
	}
}

