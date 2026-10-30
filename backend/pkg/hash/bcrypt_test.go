package hash_test

import (
	"testing"

	"github.com/ranggadya/shoes4us/backend/pkg/hash"
)

func TestHashAndCheckPassword(t *testing.T) {
	raw := "SecretPass123!"
	hashed, err := hash.HashPassword(raw)
	if err != nil {
		t.Fatalf("expected no error hashing password, got: %v", err)
	}
	if hashed == "" || hashed == raw {
		t.Fatalf("expected bcrypt hash different from plaintext, got: %q", hashed)
	}

	if !hash.CheckPasswordHash(raw, hashed) {
		t.Fatalf("expected CheckPasswordHash to return true for matching password")
	}
	if hash.CheckPasswordHash("WrongPassword", hashed) {
		t.Fatalf("expected CheckPasswordHash to return false for wrong password")
	}
}

func TestHashTokenSHA256(t *testing.T) {
	tokenA := hash.HashTokenSHA256("reset-token-abc")
	tokenB := hash.HashTokenSHA256("reset-token-abc")
	tokenC := hash.HashTokenSHA256("reset-token-xyz")

	if len(tokenA) != 64 {
		t.Fatalf("expected 64-char hex SHA-256 digest, got length %d (%q)", len(tokenA), tokenA)
	}
	if tokenA != tokenB {
		t.Fatalf("expected deterministic SHA-256 hash, got %q != %q", tokenA, tokenB)
	}
	if tokenA == tokenC {
		t.Fatalf("expected different SHA-256 hashes for different inputs")
	}
}
