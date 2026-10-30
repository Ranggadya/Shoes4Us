package response

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/ranggadya/shoes4us/backend/internal/domain"
)

// ErrorField holds the nested error details inside an error response envelope.
type ErrorField struct {
	Message string `json:"message"`
	Code    string `json:"code,omitempty"`
}

// Envelope is the uniform JSON response wrapper used across all endpoints.
type Envelope struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    any         `json:"data,omitempty"`
	Meta    any         `json:"meta,omitempty"`
	Error   *ErrorField `json:"error,omitempty"`
}

// WriteJSON serializes payload as JSON with the given HTTP status code.
func WriteJSON(w http.ResponseWriter, status int, payload Envelope) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

// WriteSuccess writes a standard success JSON envelope.
func WriteSuccess(w http.ResponseWriter, status int, message string, data any, meta any) {
	WriteJSON(w, status, Envelope{
		Success: true,
		Message: message,
		Data:    data,
		Meta:    meta,
	})
}

// WriteCreated writes a 201 Created success JSON envelope.
func WriteCreated(w http.ResponseWriter, message string, data any) {
	WriteSuccess(w, http.StatusCreated, message, data, nil)
}

// WriteError maps domain.AppError (or generic error) into a standard error JSON envelope.
func WriteError(w http.ResponseWriter, err error) {
	status := http.StatusInternalServerError
	code := "INTERNAL_ERROR"
	msg := "Terjadi kesalahan pada server"

	var appErr *domain.AppError
	if errors.As(err, &appErr) && appErr != nil {
		if appErr.Status != 0 {
			status = appErr.Status
		}
		if appErr.Code != "" {
			code = appErr.Code
		}
		if appErr.Message != "" {
			msg = appErr.Message
		}
	}

	WriteJSON(w, status, Envelope{
		Success: false,
		Message: msg,
		Error: &ErrorField{
			Message: msg,
			Code:    code,
		},
	})
}
