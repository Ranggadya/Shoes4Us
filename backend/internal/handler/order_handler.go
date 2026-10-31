package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/ranggadya/shoes4us/backend/internal/domain"
	"github.com/ranggadya/shoes4us/backend/internal/middleware"
	"github.com/ranggadya/shoes4us/backend/internal/service"
	"github.com/ranggadya/shoes4us/backend/pkg/response"
)

// OrderHandler manages HTTP endpoints for orders, checkout, and cancellation.
type OrderHandler struct {
	orderService   domain.OrderService
	paymentService service.PaymentService
}

// NewOrderHandler creates a new OrderHandler.
func NewOrderHandler(orderService domain.OrderService) *OrderHandler {
	return &OrderHandler{orderService: orderService}
}

// WithPaymentService injects a PaymentService instance into OrderHandler.
func (h *OrderHandler) WithPaymentService(paymentService service.PaymentService) *OrderHandler {
	h.paymentService = paymentService
	return h
}

// CreateOrder handles POST /api/orders.
func (h *OrderHandler) CreateOrder(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.ClaimsFromContext(r.Context())
	if !ok || claims == nil {
		response.WriteError(w, domain.NewUnauthorized("Silakan login untuk membuat pesanan"))
		return
	}

	var input domain.CreateOrderInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		response.WriteError(w, domain.NewBadRequest("Format request tidak valid"))
		return
	}

	order, err := h.orderService.Checkout(r.Context(), claims.UserID, input)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	response.WriteCreated(w, "Pesanan berhasil dibuat", map[string]any{
		"order": order,
	})
}

// ListOrders handles GET /api/orders.
func (h *OrderHandler) ListOrders(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.ClaimsFromContext(r.Context())
	if !ok || claims == nil {
		response.WriteError(w, domain.NewUnauthorized("Silakan login untuk melihat pesanan"))
		return
	}

	q := r.URL.Query()
	page, _ := strconv.Atoi(q.Get("page"))
	if page < 1 {
		page = 1
	}
	limit, _ := strconv.Atoi(q.Get("limit"))
	if limit < 1 || limit > 100 {
		limit = 20
	}

	filter := domain.OrderFilter{
		Scope: strings.ToLower(strings.TrimSpace(q.Get("scope"))),
		Page:  page,
		Limit: limit,
	}

	if st := strings.TrimSpace(q.Get("status")); st != "" {
		orderSt := domain.OrderStatus(strings.ToUpper(st))
		filter.Status = &orderSt
	}

	orders, total, err := h.orderService.ListOrders(r.Context(), claims.UserID, claims.Role, filter)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	totalPages := (total + limit - 1) / limit
	if totalPages < 1 {
		totalPages = 1
	}

	meta := domain.PaginationMeta{
		Page:       page,
		Limit:      limit,
		Total:      total,
		TotalPages: totalPages,
	}

	response.WriteSuccess(w, http.StatusOK, "Berhasil mengambil pesanan", map[string]any{
		"orders": orders,
	}, meta)
}

// GetOrderDetail handles GET /api/orders/{orderId}.
func (h *OrderHandler) GetOrderDetail(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.ClaimsFromContext(r.Context())
	if !ok || claims == nil {
		response.WriteError(w, domain.NewUnauthorized("Silakan login untuk melihat detail pesanan"))
		return
	}

	orderID := strings.TrimSpace(chi.URLParam(r, "orderId"))
	if orderID == "" {
		response.WriteError(w, domain.NewBadRequest("Order ID wajib diisi"))
		return
	}

	order, err := h.orderService.GetOrderDetail(r.Context(), claims.UserID, claims.Role, orderID)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	response.WriteSuccess(w, http.StatusOK, "Detail pesanan berhasil diambil", map[string]any{
		"order": order,
	}, nil)
}

// CancelOrder handles customer-initiated PATCH /api/orders/{orderId}.
func (h *OrderHandler) CancelOrder(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.ClaimsFromContext(r.Context())
	if !ok || claims == nil {
		response.WriteError(w, domain.NewUnauthorized("Silakan login untuk membatalkan pesanan"))
		return
	}

	orderID := strings.TrimSpace(chi.URLParam(r, "orderId"))
	if orderID == "" {
		response.WriteError(w, domain.NewBadRequest("Order ID wajib diisi"))
		return
	}

	var body struct {
		Status string `json:"status"`
	}
	_ = json.NewDecoder(r.Body).Decode(&body)

	var (
		order *domain.Order
		err   error
	)

	if claims.Role == "ADMIN" && strings.TrimSpace(body.Status) != "" && !strings.EqualFold(body.Status, string(domain.StatusCancelled)) {
		order, err = h.orderService.UpdateOrderStatus(r.Context(), orderID, domain.OrderStatus(strings.ToUpper(body.Status)))
	} else {
		order, err = h.orderService.CancelOrder(r.Context(), claims.UserID, claims.Role, orderID)
	}

	if err != nil {
		response.WriteError(w, err)
		return
	}

	response.WriteSuccess(w, http.StatusOK, "Pesanan berhasil dibatalkan", map[string]any{
		"order": order,
	}, nil)
}

// UpdateOrderStatus handles admin status transitions PATCH /api/orders/{orderId}/status.
func (h *OrderHandler) UpdateOrderStatus(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.ClaimsFromContext(r.Context())
	if !ok || claims == nil {
		response.WriteError(w, domain.NewUnauthorized("Silakan login terlebih dahulu"))
		return
	}
	if claims.Role != "ADMIN" {
		response.WriteError(w, domain.NewForbidden("Akses ditolak: hanya ADMIN yang dapat mengubah status pesanan"))
		return
	}

	orderID := strings.TrimSpace(chi.URLParam(r, "orderId"))
	if orderID == "" {
		response.WriteError(w, domain.NewBadRequest("Order ID wajib diisi"))
		return
	}

	var body struct {
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.WriteError(w, domain.NewBadRequest("Format request tidak valid"))
		return
	}

	newStatus := domain.OrderStatus(strings.ToUpper(strings.TrimSpace(body.Status)))
	order, err := h.orderService.UpdateOrderStatus(r.Context(), orderID, newStatus)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	response.WriteSuccess(w, http.StatusOK, fmt.Sprintf("Status pesanan berhasil diubah menjadi %s", newStatus), map[string]any{
		"order": order,
	}, nil)
}

// ProcessPayment handles POST /api/payment for confirming order payment and clearing the cart.
func (h *OrderHandler) ProcessPayment(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.ClaimsFromContext(r.Context())
	if !ok || claims == nil {
		response.WriteError(w, domain.NewUnauthorized("Silakan login untuk memproses pembayaran"))
		return
	}

	var body struct {
		OrderID string `json:"orderId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.WriteError(w, domain.NewBadRequest("Format request tidak valid"))
		return
	}

	if h.paymentService == nil {
		response.WriteError(w, domain.NewInternal("Layanan pembayaran belum dikonfigurasi"))
		return
	}

	res, err := h.paymentService.CreatePayment(r.Context(), claims.UserID, claims.Role, body.OrderID)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	response.WriteSuccess(w, http.StatusOK, "Pembayaran berhasil dikonfirmasi", res, nil)
}
