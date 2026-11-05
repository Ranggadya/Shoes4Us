package service

import (
	"context"
	"fmt"
	"math"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/ranggadya/shoes4us/backend/internal/domain"
)

type orderService struct {
	orderRepo   domain.OrderRepository
	cartRepo    domain.CartRepository
	productRepo domain.ProductRepository
	couponSvc   domain.CouponService
}

var _ domain.OrderService = (*orderService)(nil)

var allowedTransitions = map[domain.OrderStatus][]domain.OrderStatus{
	domain.StatusPending:    {domain.StatusProcessing, domain.StatusPaid, domain.StatusCancelled},
	domain.StatusProcessing: {domain.StatusPaid, domain.StatusCancelled},
	domain.StatusPaid:       {domain.StatusProcessing, domain.StatusShipped, domain.StatusCancelled},
	domain.StatusShipped:    {domain.StatusDelivered},
	domain.StatusDelivered:  {},
	domain.StatusCancelled:  {},
}

// NewOrderService constructs a domain.OrderService implementation.
func NewOrderService(
	orderRepo domain.OrderRepository,
	cartRepo domain.CartRepository,
	productRepo domain.ProductRepository,
) domain.OrderService {
	return &orderService{
		orderRepo:   orderRepo,
		cartRepo:    cartRepo,
		productRepo: productRepo,
		couponSvc:   NewCouponService(),
	}
}

// enrichOrderLogistics ensures shipped/delivered orders always carry a courier name and tracking resi.
func enrichOrderLogistics(ord *domain.Order) {
	if ord == nil {
		return
	}
	if ord.Status != domain.StatusShipped && ord.Status != domain.StatusDelivered {
		return
	}
	if ord.TrackingNumber != nil && strings.TrimSpace(*ord.TrackingNumber) != "" {
		return
	}

	prefix := "JNE"
	if ord.ShippingCourier != nil {
		cUpper := strings.ToUpper(*ord.ShippingCourier)
		switch {
		case strings.Contains(cUpper, "SICEPAT"):
			prefix = "SCP"
		case strings.Contains(cUpper, "J&T") || strings.Contains(cUpper, "JNT"):
			prefix = "JNT"
		case strings.Contains(cUpper, "JNE"):
			prefix = "JNE"
		}
	}

	seed := strings.ReplaceAll(strings.ToUpper(ord.OrderNumber), "ORD-", "")
	seed = strings.ReplaceAll(seed, "-", "")
	if len(seed) < 8 {
		seed = strings.ToUpper(strings.ReplaceAll(ord.ID, "-", ""))
	}
	if len(seed) > 10 {
		seed = seed[:10]
	}

	resi := fmt.Sprintf("%s-%s", prefix, seed)
	ord.TrackingNumber = &resi
}

// Checkout atomically creates an order from the user's current cart and deducts per-size stock.
func (s *orderService) Checkout(ctx context.Context, userID string, input domain.CreateOrderInput) (*domain.Order, error) {
	if strings.TrimSpace(userID) == "" {
		return nil, domain.NewUnauthorized("Silakan login untuk membuat pesanan")
	}

	if strings.TrimSpace(input.ShippingAddress) == "" {
		return nil, domain.NewBadRequest("Alamat pengiriman wajib diisi")
	}
	if strings.TrimSpace(input.ShippingCity) == "" {
		return nil, domain.NewBadRequest("Kota pengiriman wajib diisi")
	}
	if strings.TrimSpace(input.ShippingPhone) == "" {
		return nil, domain.NewBadRequest("Nomor telepon pengiriman wajib diisi")
	}

	cart, err := s.cartRepo.FindCartByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if cart == nil || len(cart.Items) == 0 {
		return nil, domain.NewBadRequest("Keranjang Anda kosong")
	}

	// Pre-validate stock availability for each cart item
	for _, it := range cart.Items {
		if it.Size != nil && strings.TrimSpace(*it.Size) != "" {
			availStock, err := s.productRepo.GetSizeStock(ctx, it.ProductID, *it.Size)
			if err != nil {
				return nil, err
			}
			if availStock < it.Quantity {
				return nil, domain.NewBadRequest(fmt.Sprintf("Stok produk %q untuk ukuran %s tidak mencukupi (tersedia: %d)", it.Product.Name, *it.Size, availStock))
			}
		} else {
			prod, err := s.productRepo.FindByIDOrSlug(ctx, it.ProductID)
			if err != nil || prod == nil {
				return nil, domain.NewNotFound(fmt.Sprintf("Produk %s tidak ditemukan", it.ProductID))
			}
			if prod.Stock < it.Quantity {
				return nil, domain.NewBadRequest(fmt.Sprintf("Stok produk %q tidak mencukupi (tersedia: %d)", prod.Name, prod.Stock))
			}
		}
	}

	// Resolve shipping courier and fee
	var shippingCourierPtr *string
	shippingCost := input.ShippingCost
	if cleanCourier := strings.TrimSpace(input.ShippingCourier); cleanCourier != "" {
		if matchedCourier := domain.FindCourierByCodeOrName(cleanCourier); matchedCourier != nil {
			cName := matchedCourier.Name
			shippingCourierPtr = &cName
			shippingCost = matchedCourier.Cost
		} else {
			shippingCourierPtr = &cleanCourier
		}
	}

	// Resolve promotional coupon discount if provided
	var couponCodePtr *string
	var discountAmount float64
	if cleanCode := strings.TrimSpace(input.CouponCode); cleanCode != "" {
		valRes, err := s.couponSvc.Validate(domain.ValidateCouponInput{
			Code:        cleanCode,
			Subtotal:    cart.Totals.Subtotal,
			ShippingFee: shippingCost,
		})
		if err != nil {
			return nil, err
		}
		code := valRes.Code
		couponCodePtr = &code
		discountAmount = valRes.DiscountAmount
	}

	totalAmount := math.Max(0, cart.Totals.Subtotal+shippingCost-discountAmount)

	now := time.Now()
	orderID := uuid.NewString()
	orderNumber := fmt.Sprintf("ORD-%s-%s", now.Format("20060102"), strings.ToUpper(uuid.NewString()[:8]))

	sAddr := strings.TrimSpace(input.ShippingAddress)
	sCity := strings.TrimSpace(input.ShippingCity)
	sPostal := strings.TrimSpace(input.ShippingPostalCode)
	sPhone := strings.TrimSpace(input.ShippingPhone)
	pMethod := strings.TrimSpace(input.PaymentMethod)

	order := &domain.Order{
		ID:                 orderID,
		OrderNumber:        orderNumber,
		UserID:             userID,
		Status:             domain.StatusPending,
		TotalAmount:        totalAmount,
		ShippingAddress:    &sAddr,
		ShippingCity:       &sCity,
		ShippingPostalCode: &sPostal,
		ShippingPhone:      &sPhone,
		ShippingCourier:    shippingCourierPtr,
		ShippingCost:       shippingCost,
		CouponCode:         couponCodePtr,
		DiscountAmount:     discountAmount,
		PaymentMethod:      &pMethod,
		CreatedAt:          now,
		UpdatedAt:          now,
	}

	orderItems := make([]domain.OrderItem, len(cart.Items))
	for i, ci := range cart.Items {
		orderItems[i] = domain.OrderItem{
			ID:        uuid.NewString(),
			OrderID:   orderID,
			ProductID: ci.ProductID,
			Quantity:  ci.Quantity,
			Price:     ci.Product.Price,
			Size:      ci.Size,
			Product: domain.OrderItemProduct{
				ID:       ci.Product.ID,
				Name:     ci.Product.Name,
				Price:    ci.Product.Price,
				ImageURL: ci.Product.ImageURL,
			},
		}
	}

	if err := s.orderRepo.CreateOrderWithTx(ctx, order, orderItems, cart.ID); err != nil {
		return nil, err
	}

	order.Items = orderItems
	return order, nil
}

// ListOrders returns user orders or all orders if scope=all and caller is ADMIN.
func (s *orderService) ListOrders(ctx context.Context, userID, userRole string, filter domain.OrderFilter) ([]domain.Order, int, error) {
	if strings.TrimSpace(userID) == "" {
		return nil, 0, domain.NewUnauthorized("Silakan login untuk melihat pesanan")
	}

	if filter.Scope == "all" && userRole == "ADMIN" {
		filter.UserID = ""
	} else {
		filter.Scope = ""
		filter.UserID = userID
	}

	orders, total, err := s.orderRepo.FindAll(ctx, filter)
	if err != nil {
		return nil, 0, err
	}
	for i := range orders {
		enrichOrderLogistics(&orders[i])
	}
	return orders, total, nil
}

// GetOrderDetail retrieves a single order and enforces ownership/role permissions.
func (s *orderService) GetOrderDetail(ctx context.Context, userID, userRole, orderID string) (*domain.Order, error) {
	if strings.TrimSpace(userID) == "" {
		return nil, domain.NewUnauthorized("Silakan login untuk melihat detail pesanan")
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

	enrichOrderLogistics(order)
	return order, nil
}

// CancelOrder allows customer or admin to cancel an order and restock inventory safely.
func (s *orderService) CancelOrder(ctx context.Context, userID, userRole, orderID string) (*domain.Order, error) {
	if strings.TrimSpace(userID) == "" {
		return nil, domain.NewUnauthorized("Silakan login untuk membatalkan pesanan")
	}

	order, err := s.orderRepo.FindByID(ctx, orderID)
	if err != nil {
		return nil, err
	}
	if order == nil {
		return nil, domain.NewNotFound("Pesanan tidak ditemukan")
	}

	if userRole != "ADMIN" && order.UserID != userID {
		return nil, domain.NewForbidden("Anda tidak memiliki akses untuk membatalkan pesanan ini")
	}

	// Only PENDING or PROCESSING orders can be cancelled by user
	if order.Status != domain.StatusPending && order.Status != domain.StatusProcessing {
		return nil, domain.NewBadRequest(fmt.Sprintf("Pesanan dengan status %s tidak dapat dibatalkan", order.Status))
	}

	return s.orderRepo.UpdateStatusWithTx(ctx, orderID, domain.StatusCancelled, true)
}

// UpdateOrderStatus updates order state according to business state machine rules.
func (s *orderService) UpdateOrderStatus(ctx context.Context, orderID string, newStatus domain.OrderStatus) (*domain.Order, error) {
	order, err := s.orderRepo.FindByID(ctx, orderID)
	if err != nil {
		return nil, err
	}
	if order == nil {
		return nil, domain.NewNotFound("Pesanan tidak ditemukan")
	}

	validNextList, exists := allowedTransitions[order.Status]
	if !exists {
		return nil, domain.NewBadRequest(fmt.Sprintf("Status pesanan %s tidak valid", order.Status))
	}

	isAllowed := false
	for _, next := range validNextList {
		if next == newStatus {
			isAllowed = true
			break
		}
	}

	if !isAllowed {
		return nil, domain.NewBadRequest(fmt.Sprintf("Perubahan status tidak valid: %s → %s", order.Status, newStatus))
	}

	restock := (newStatus == domain.StatusCancelled)
	updated, err := s.orderRepo.UpdateStatusWithTx(ctx, orderID, newStatus, restock)
	if err != nil {
		return nil, err
	}
	enrichOrderLogistics(updated)
	return updated, nil
}
