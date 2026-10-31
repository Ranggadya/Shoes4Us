package domain

import (
	"context"
	"time"
)

type ReviewUser struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type ReviewDistribution struct {
	Five  int `json:"5"`
	Four  int `json:"4"`
	Three int `json:"3"`
	Two   int `json:"2"`
	One   int `json:"1"`
}

type ReviewSummary struct {
	Total         int                `json:"total"`
	AverageRating float64            `json:"averageRating"`
	Distribution  ReviewDistribution `json:"distribution"`
}

type Review struct {
	ID        string      `json:"id"`
	ProductID string      `json:"productId"`
	UserID    string      `json:"userId"`
	Rating    int         `json:"rating"`
	Title     *string     `json:"title"`
	Comment   string      `json:"comment"`
	Verified  bool        `json:"verified"`
	Helpful   int         `json:"helpful"`
	CreatedAt time.Time   `json:"createdAt"`
	UpdatedAt time.Time   `json:"updatedAt"`
	User      *ReviewUser `json:"user,omitempty"`
}

type CreateReviewInput struct {
	ProductID string  `json:"productId"`
	Rating    int     `json:"rating"`
	Title     *string `json:"title,omitempty"`
	Comment   string  `json:"comment"`
}

type ReviewRepository interface {
	FindByProductID(ctx context.Context, productID string) ([]Review, error)
	GetSummary(ctx context.Context, productID string) (*ReviewSummary, error)
	Create(ctx context.Context, review *Review) error
}

type ReviewService interface {
	GetReviews(ctx context.Context, productID string) ([]Review, *ReviewSummary, error)
	GetSummary(ctx context.Context, productID string) (*ReviewSummary, error)
	CreateReview(ctx context.Context, userID, userName string, input CreateReviewInput) (*Review, error)
}
