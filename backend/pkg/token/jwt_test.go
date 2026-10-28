package token_test

import (
	"testing"

	"github.com/ranggadya/shoes4us/backend/pkg/token"
)

func TestJWTManager_SignAndVerify(t *testing.T) {
	mgr := token.NewJWTManager("test-secret-key", 24)

	claims := token.UserClaims{
		UserID: "user-uuid-123",
		Email:  "customer@shoes4us.com",
		Name:   "Rangga",
		Role:   "USER",
	}

	signed, err := mgr.Sign(claims)
	if err != nil {
		t.Fatalf("expected no error signing token, got: %v", err)
	}
	if signed == "" {
		t.Fatal("expected non-empty signed JWT string")
	}

	verified, err := mgr.Verify(signed)
	if err != nil {
		t.Fatalf("expected no error verifying token, got: %v", err)
	}
	if verified.UserID != claims.UserID || verified.Email != claims.Email || verified.Name != claims.Name || verified.Role != claims.Role {
		t.Fatalf("claims mismatch: got %+v, want %+v", verified, claims)
	}

	otherMgr := token.NewJWTManager("different-secret", 24)
	if _, err := otherMgr.Verify(signed); err == nil {
		t.Fatal("expected error when verifying token with wrong secret, got nil")
	}

	if _, err := mgr.Verify("invalid.jwt.token"); err == nil {
		t.Fatal("expected error when verifying malformed token, got nil")
	}
}

