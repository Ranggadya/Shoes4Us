package service

import (
	"errors"
	"net/mail"
	"strings"
	"unicode/utf8"

	"github.com/ranggadya/shoes4us/backend/internal/domain"
	"github.com/ranggadya/shoes4us/backend/pkg/hash"
)

const (
	minNameRunes     = 2
	maxNameRunes     = 100
	maxEmailBytes    = 254
	minPasswordRunes = 8
	maxPasswordBytes = 72
)

func validatePersonName(raw string) (string, error) {
	clean := strings.TrimSpace(raw)
	runes := utf8.RuneCountInString(clean)
	if runes < minNameRunes {
		return "", domain.NewBadRequest("Nama minimal 2 karakter")
	}
	if runes > maxNameRunes {
		return "", domain.NewBadRequest("Nama maksimal 100 karakter")
	}
	return clean, nil
}

func validateEmailAddress(raw string) (string, error) {
	clean := strings.ToLower(strings.TrimSpace(raw))
	if clean == "" || len(clean) > maxEmailBytes || strings.ContainsAny(clean, " \t\r\n") {
		return "", domain.NewBadRequest("Format email tidak valid")
	}

	parsed, err := mail.ParseAddress(clean)
	if err != nil || !strings.EqualFold(parsed.Address, clean) {
		return "", domain.NewBadRequest("Format email tidak valid")
	}

	at := strings.IndexByte(clean, '@')
	if at <= 0 || at >= len(clean)-1 {
		return "", domain.NewBadRequest("Format email tidak valid")
	}

	domainPart := clean[at+1:]
	if strings.HasPrefix(domainPart, ".") || strings.HasSuffix(domainPart, ".") || strings.Contains(domainPart, "..") || !strings.Contains(domainPart, ".") {
		return "", domain.NewBadRequest("Format email tidak valid")
	}

	return clean, nil
}

func validateNewPassword(password string, label string) error {
	if utf8.RuneCountInString(password) < minPasswordRunes {
		return domain.NewBadRequest(label + " minimal 8 karakter")
	}
	if len([]byte(password)) > maxPasswordBytes {
		return domain.NewBadRequest(label + " maksimal 72 byte")
	}
	return nil
}

func hashPasswordOrErr(password string, label string) (string, error) {
	hashedPassword, err := hash.HashPassword(password)
	if err != nil {
		if errors.Is(err, hash.ErrPasswordTooLong) {
			return "", domain.NewBadRequest(label + " maksimal 72 byte")
		}
		return "", domain.NewInternal("Gagal mengenkripsi password")
	}
	return hashedPassword, nil
}
