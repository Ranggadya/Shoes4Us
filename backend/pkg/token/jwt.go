package token

import (
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// UserClaims represents the authenticated user payload embedded in a JWT.
type UserClaims struct {
	UserID string `json:"userId"`
	Email  string `json:"email"`
	Name   string `json:"name"`
	Role   string `json:"role"`
}

type jwtClaims struct {
	UserClaims
	jwt.RegisteredClaims
}

// JWTManager signs and verifies HMAC-SHA256 JWT tokens.
type JWTManager struct {
	secret      []byte
	expiryHours int
}

// NewJWTManager constructs a JWTManager with the given secret and token lifetime in hours.
func NewJWTManager(secret string, expiryHours int) *JWTManager {
	if expiryHours <= 0 {
		expiryHours = 168
	}
	return &JWTManager{
		secret:      []byte(secret),
		expiryHours: expiryHours,
	}
}

// Sign creates a signed HS256 JWT string for the given UserClaims.
func (m *JWTManager) Sign(claims UserClaims) (string, error) {
	now := time.Now()
	rc := jwtClaims{
		UserClaims: claims,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   claims.UserID,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(time.Duration(m.expiryHours) * time.Hour)),
		},
	}

	tok := jwt.NewWithClaims(jwt.SigningMethodHS256, rc)
	return tok.SignedString(m.secret)
}

// Verify parses and validates a signed JWT string, returning its UserClaims.
func (m *JWTManager) Verify(tokenStr string) (*UserClaims, error) {
	parsed, err := jwt.ParseWithClaims(tokenStr, &jwtClaims{}, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return m.secret, nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := parsed.Claims.(*jwtClaims)
	if !ok || !parsed.Valid {
		return nil, errors.New("invalid token claims")
	}

	if claims.UserID == "" && claims.Subject != "" {
		claims.UserID = claims.Subject
	}

	return &claims.UserClaims, nil
}
