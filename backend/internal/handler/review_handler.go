package handler

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/ranggadya/shoes4us/backend/internal/domain"
	"github.com/ranggadya/shoes4us/backend/internal/middleware"
	"github.com/ranggadya/shoes4us/backend/pkg/response"
)

// ReviewHandler handles endpoints for product reviews and rating summaries.
type ReviewHandler struct {
	reviewService domain.ReviewService
}

// NewReviewHandler creates a new ReviewHandler.
func NewReviewHandler(reviewService domain.ReviewService) *ReviewHandler {
	return &ReviewHandler{reviewService: reviewService}
}

// GetReviews handles GET /api/reviews?productId=:id&summaryOnly=true|false.
func (h *ReviewHandler) GetReviews(w http.ResponseWriter, r *http.Request) {
	productID := strings.TrimSpace(r.URL.Query().Get("productId"))
	if productID == "" {
		response.WriteError(w, domain.NewBadRequest("Product ID is required"))
		return
	}

	summaryOnly := strings.EqualFold(r.URL.Query().Get("summaryOnly"), "true")
	if summaryOnly {
		summary, err := h.reviewService.GetSummary(r.Context(), productID)
		if err != nil {
			response.WriteError(w, err)
			return
		}

		response.WriteSuccess(w, http.StatusOK, "Ringkasan ulasan berhasil diambil", map[string]any{
			"summary": summary,
		}, nil)
		return
	}

	reviews, summary, err := h.reviewService.GetReviews(r.Context(), productID)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	response.WriteSuccess(w, http.StatusOK, "Daftar ulasan berhasil diambil", map[string]any{
		"reviews": reviews,
		"summary": summary,
	}, nil)
}

// CreateReview handles POST /api/reviews for authenticated users.
func (h *ReviewHandler) CreateReview(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.ClaimsFromContext(r.Context())
	if !ok || claims == nil {
		response.WriteError(w, domain.NewUnauthorized("Silakan login terlebih dahulu"))
		return
	}

	var input domain.CreateReviewInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		response.WriteError(w, domain.NewBadRequest("Format request tidak valid"))
		return
	}

	if strings.TrimSpace(input.ProductID) == "" {
		response.WriteError(w, domain.NewBadRequest("Product ID is required"))
		return
	}
	if input.Rating < 1 || input.Rating > 5 {
		response.WriteError(w, domain.NewBadRequest("Rating harus antara 1 sampai 5"))
		return
	}
	if strings.TrimSpace(input.Comment) == "" {
		response.WriteError(w, domain.NewBadRequest("Ulasan tidak boleh kosong"))
		return
	}

	review, err := h.reviewService.CreateReview(r.Context(), claims.UserID, claims.Name, input)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	response.WriteCreated(w, "Review berhasil ditambahkan", map[string]any{
		"review": review,
	})
}
