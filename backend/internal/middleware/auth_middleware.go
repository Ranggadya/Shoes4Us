package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/ranggadya/shoes4us/backend/internal/domain"
	"github.com/ranggadya/shoes4us/backend/pkg/response"
	"github.com/ranggadya/shoes4us/backend/pkg/token"
)

type claimsContextKey struct{}

// ContextWithClaims returns a new context carrying the authenticated user's JWT claims.
func ContextWithClaims(ctx context.Context, claims *token.UserClaims) context.Context {
	return context.WithValue(ctx, claimsContextKey{}, claims)
}

// ClaimsFromContext retrieves the authenticated user's JWT claims from the context, if present.
func ClaimsFromContext(ctx context.Context) (*token.UserClaims, bool) {
	if ctx == nil {
		return nil, false
	}
	claims, ok := ctx.Value(claimsContextKey{}).(*token.UserClaims)
	if !ok || claims == nil {
		return nil, false
	}
	return claims, true
}

// RequireAuth verifies a JWT extracted from `Authorization: Bearer <token>` first,
// falling back to the `token` cookie.
func RequireAuth(jwtMgr *token.JWTManager) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if jwtMgr == nil {
				response.WriteError(w, domain.NewUnauthorized("Autentikasi tidak tersedia"))
				return
			}

			rawToken := extractToken(r)
			if rawToken == "" {
				response.WriteError(w, domain.NewUnauthorized("Token autentikasi tidak ditemukan"))
				return
			}

			claims, err := jwtMgr.Verify(rawToken)
			if err != nil || claims == nil || strings.TrimSpace(claims.UserID) == "" {
				response.WriteError(w, domain.NewUnauthorized("Token tidak valid atau sudah kadaluarsa"))
				return
			}

			ctx := ContextWithClaims(r.Context(), claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// RequireAdmin ensures the request context holds authenticated claims with Role == "ADMIN".
func RequireAdmin(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		claims, ok := ClaimsFromContext(r.Context())
		if !ok || claims == nil {
			response.WriteError(w, domain.NewUnauthorized("Autentikasi diperlukan"))
			return
		}
		if !strings.EqualFold(strings.TrimSpace(claims.Role), domain.RoleAdmin) {
			response.WriteError(w, domain.NewForbidden("Akses ditolak: hanya admin yang diizinkan"))
			return
		}
		next.ServeHTTP(w, r)
	})
}

func extractToken(r *http.Request) string {
	authHeader := strings.TrimSpace(r.Header.Get("Authorization"))
	if len(authHeader) > 7 && strings.EqualFold(authHeader[:7], "Bearer ") {
		if tok := strings.TrimSpace(authHeader[7:]); tok != "" {
			return tok
		}
	}

	if cookie, err := r.Cookie("token"); err == nil && cookie != nil {
		if tok := strings.TrimSpace(cookie.Value); tok != "" {
			return tok
		}
	}

	return ""
}

