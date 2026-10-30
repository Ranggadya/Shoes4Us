package domain

import "net/http"

// AppError represents a structured domain/application error with an HTTP status code.
type AppError struct {
	Status  int    `json:"-"`
	Code    string `json:"code"`
	Message string `json:"message"`
}

// Error implements the standard error interface.
func (e *AppError) Error() string {
	if e == nil {
		return ""
	}
	return e.Message
}

func NewBadRequest(msg string) *AppError {
	return &AppError{
		Status:  http.StatusBadRequest,
		Code:    "BAD_REQUEST",
		Message: msg,
	}
}

func NewUnauthorized(msg string) *AppError {
	return &AppError{
		Status:  http.StatusUnauthorized,
		Code:    "UNAUTHORIZED",
		Message: msg,
	}
}

func NewForbidden(msg string) *AppError {
	return &AppError{
		Status:  http.StatusForbidden,
		Code:    "FORBIDDEN",
		Message: msg,
	}
}

func NewNotFound(msg string) *AppError {
	return &AppError{
		Status:  http.StatusNotFound,
		Code:    "NOT_FOUND",
		Message: msg,
	}
}

func NewConflict(msg string) *AppError {
	return &AppError{
		Status:  http.StatusConflict,
		Code:    "CONFLICT",
		Message: msg,
	}
}

func NewInternal(msg string) *AppError {
	return &AppError{
		Status:  http.StatusInternalServerError,
		Code:    "INTERNAL_ERROR",
		Message: msg,
	}
}
