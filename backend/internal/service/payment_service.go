package service

import (
	"context"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/ranggadya/shoes4us/backend/internal/domain"
)

// PaymentResult holds token and redirect URL returned upon payment confirmation.
type PaymentResult struct {
	Token       string `json:"token"`
	RedirectURL string `json:"redirect_url"`
}

// PaymentService abstracts payment simulation and cart clearing upon payment.
type PaymentService interface {
	CreatePayment(ctx context.Context, userID, userRole, orderID string) (*PaymentResult, error)
}

type paymentService struct {
	orderRepo domain.OrderRepository
	cartRepo  domain.CartRepository
}

// NewPaymentService creates a new PaymentService instance.
func NewPaymentService(orderRepo domain.OrderRepository, cartRepo domain.CartRepository) PaymentService {
	return &paymentService{
		orderRepo: orderRepo,
		cartRepo:  cartRepo,
	}
}

// CreatePayment confirms payment for an order, marks it PAID, and clears the user's cart.
func (s *paymentService) CreatePayment(ctx context.Context, userID, userRole, orderID string) (*PaymentResult, error) {
	if strings.TrimSpace(userID) == "" {
		return nil, domain.NewUnauthorized("Silakan login untuk memproses pembayaran")
	}

	orderID = strings.TrimSpace(orderID)
	if orderID == "" {
		return nil, domain.NewBadRequest("Order ID wajib diisi")
	}

	order, err := s.orderRepo.FindByID(ctx, orderID)
	if err != nil {
		return nil, err
	}
	if order == nil {
		return nil, domain.NewNotFound("Pesanan tidak ditemukan")
	}

	if userRole != "ADMIN" && order.UserID != userID {
		return nil, domain.NewForbidden("Anda tidak memiliki akses ke pesanan ini")
	}

	// Update order status to PAID if currently PENDING or PROCESSING
	if order.Status == domain.StatusPending || order.Status == domain.StatusProcessing {
		_, err = s.orderRepo.UpdateStatusWithTx(ctx, orderID, domain.StatusPaid, false)
		if err != nil {
			return nil, err
		}
	}

	// Clear user's active shopping cart
	cart, _ := s.cartRepo.FindCartByUserID(ctx, userID)
	if cart != nil && cart.ID != "" {
		_ = s.cartRepo.ClearCart(ctx, cart.ID)
	}

	token := "sim-token-" + uuid.NewString()[:8] + "-" + orderID
	redirectURL := fmt.Sprintf("/status-pesanan?orderId=%s", orderID)

	return &PaymentResult{
		Token:       token,
		RedirectURL: redirectURL,
	}, nil
}
