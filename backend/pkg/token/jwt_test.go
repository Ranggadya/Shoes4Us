package token_test

import (
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
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

func TestJWTManager_VerifyHardening(t *testing.T) {
	secret := "test-secret-key-for-hardening-checks"
	mgr := token.NewJWTManager(secret, 24)

	t.Run("rejects expired token", func(t *testing.T) {
		tok := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
			"userId": "user-1",
			"exp":    time.Now().Add(-5 * time.Minute).Unix(),
		})
		signed, err := tok.SignedString([]byte(secret))
		if err != nil {
			t.Fatalf("sign failed: %v", err)
		}
		if _, err := mgr.Verify(signed); err == nil {
			t.Fatal("expected expired token to fail verification")
		}
	})

	t.Run("rejects token missing exp claim", func(t *testing.T) {
		tok := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
			"userId": "user-1",
			"role":   "USER",
		})
		signed, err := tok.SignedString([]byte(secret))
		if err != nil {
			t.Fatalf("sign failed: %v", err)
		}
		if _, err := mgr.Verify(signed); err == nil {
			t.Fatal("expected token without exp claim to fail verification")
		}
	})

	t.Run("rejects non-HS256 HMAC method such as HS512", func(t *testing.T) {
		tok := jwt.NewWithClaims(jwt.SigningMethodHS512, jwt.MapClaims{
			"userId": "user-1",
			"exp":    time.Now().Add(time.Hour).Unix(),
		})
		signed, err := tok.SignedString([]byte(secret))
		if err != nil {
			t.Fatalf("sign failed: %v", err)
		}
		if _, err := mgr.Verify(signed); err == nil {
			t.Fatal("expected HS512 token to be rejected when HS256 is pinned")
		}
	})

	t.Run("rejects none alg token", func(t *testing.T) {
		tok := jwt.NewWithClaims(jwt.SigningMethodNone, jwt.MapClaims{
			"userId": "user-1",
			"exp":    time.Now().Add(time.Hour).Unix(),
		})
		signed, err := tok.SignedString(jwt.UnsafeAllowNoneSignatureType)
		if err != nil {
			t.Fatalf("sign failed: %v", err)
		}
		if _, err := mgr.Verify(signed); err == nil {
			t.Fatal("expected alg=none token to be rejected")
		}
	})
}
