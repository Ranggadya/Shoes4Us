package handler

import (
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/ranggadya/shoes4us/backend/internal/middleware"
	"github.com/ranggadya/shoes4us/backend/pkg/response"
	"github.com/ranggadya/shoes4us/backend/pkg/token"
)

// RouterDependencies holds configuration and optional domain handlers to mount onto the HTTP router.
type RouterDependencies struct {
	AllowedOrigins []string
	UploadDir      string
	JWTSecret      string
	JWTManager     *token.JWTManager
	AuthHandler    *AuthHandler
	UserHandler    *UserHandler
	ProductHandler *ProductHandler
	ReviewHandler  *ReviewHandler
	CartHandler    *CartHandler
	WishlistHandler *WishlistHandler
	OrderHandler    *OrderHandler
}

// NewRouter constructs the root Chi HTTP router with CORS, static uploads, and /api endpoints.
func NewRouter(deps RouterDependencies) http.Handler {
	r := chi.NewRouter()

	r.Use(chimw.RealIP)
	r.Use(chimw.Recoverer)
	r.Use(middleware.NewCORSMiddleware(deps.AllowedOrigins))

	jwtMgr := deps.JWTManager
	if jwtMgr == nil && strings.TrimSpace(deps.JWTSecret) != "" {
		jwtMgr = token.NewJWTManager(deps.JWTSecret, 168)
	}

	uploadDir := strings.TrimSpace(deps.UploadDir)
	if uploadDir == "" {
		uploadDir = "./uploads"
	}
	fileServer := http.StripPrefix("/uploads/", http.FileServer(http.Dir(uploadDir)))
	r.Get("/uploads/*", func(w http.ResponseWriter, req *http.Request) {
		fileServer.ServeHTTP(w, req)
	})

	r.Route("/api", func(api chi.Router) {
		api.Get("/health", func(w http.ResponseWriter, _ *http.Request) {
			response.WriteSuccess(w, http.StatusOK, "OK", map[string]string{"status": "ok"}, nil)
		})

		if deps.AuthHandler != nil {
			api.Route("/auth", func(auth chi.Router) {
				auth.Post("/register", deps.AuthHandler.Register)
				auth.Post("/login", deps.AuthHandler.Login)
				auth.Post("/forgot-password", deps.AuthHandler.ForgotPassword)
				auth.Post("/reset-password", deps.AuthHandler.ResetPassword)
				if jwtMgr != nil {
					auth.With(middleware.RequireAuth(jwtMgr)).Get("/me", deps.AuthHandler.Me)
				}
			})
		}

		if deps.UserHandler != nil && jwtMgr != nil {
			api.Route("/users", func(users chi.Router) {
				users.Use(middleware.RequireAuth(jwtMgr))
				users.Get("/me", deps.UserHandler.GetMe)
				users.Put("/me", deps.UserHandler.UpdateMe)
				users.Patch("/{id}", deps.UserHandler.UpdateProfile)
				users.Patch("/{id}/password", deps.UserHandler.UpdatePassword)
				users.With(middleware.RequireAdmin).Get("/", deps.UserHandler.ListUsers)
				users.With(middleware.RequireAdmin).Delete("/{id}", deps.UserHandler.DeleteUser)
			})
		}

		if deps.ProductHandler != nil {
			api.Get("/categories", deps.ProductHandler.ListCategories)
			if jwtMgr != nil {
				api.With(middleware.RequireAuth(jwtMgr), middleware.RequireAdmin).Post("/categories", deps.ProductHandler.CreateCategory)
			}

			api.Route("/products", func(products chi.Router) {
				products.Get("/", deps.ProductHandler.ListProducts)
				products.Get("/{id}", deps.ProductHandler.GetProduct)

				if jwtMgr != nil {
					products.Group(func(admin chi.Router) {
						admin.Use(middleware.RequireAuth(jwtMgr), middleware.RequireAdmin)
						admin.Post("/", deps.ProductHandler.CreateProduct)
						admin.Put("/{id}", deps.ProductHandler.UpdateProduct)
						admin.Delete("/{id}", deps.ProductHandler.DeleteProduct)
					})
				}
			})
		}

		if deps.ReviewHandler != nil {
			api.Route("/reviews", func(reviews chi.Router) {
				reviews.Get("/", deps.ReviewHandler.GetReviews)
				if jwtMgr != nil {
					reviews.With(middleware.RequireAuth(jwtMgr)).Post("/", deps.ReviewHandler.CreateReview)
				}
			})
		}

		if deps.CartHandler != nil && jwtMgr != nil {
			api.Route("/cart", func(cart chi.Router) {
				cart.Use(middleware.RequireAuth(jwtMgr))
				cart.Get("/", deps.CartHandler.GetCart)
				cart.Post("/", deps.CartHandler.AddToCart)
				cart.Delete("/", deps.CartHandler.ClearCart)
				cart.Route("/{itemId}", func(item chi.Router) {
					item.Patch("/", deps.CartHandler.UpdateCartItem)
					item.Put("/", deps.CartHandler.UpdateCartItem)
					item.Delete("/", deps.CartHandler.RemoveCartItem)
				})
			})
		}

		if deps.WishlistHandler != nil && jwtMgr != nil {
			api.Route("/wishlist", func(wl chi.Router) {
				wl.Use(middleware.RequireAuth(jwtMgr))
				wl.Get("/", deps.WishlistHandler.GetWishlist)
				wl.Post("/", deps.WishlistHandler.AddToWishlist)
				wl.Delete("/{productId}", deps.WishlistHandler.RemoveFromWishlist)
			})
		}

		if deps.OrderHandler != nil && jwtMgr != nil {
			api.With(middleware.RequireAuth(jwtMgr)).Post("/payment", deps.OrderHandler.ProcessPayment)

			api.Route("/orders", func(orders chi.Router) {
				orders.Use(middleware.RequireAuth(jwtMgr))
				orders.Get("/", deps.OrderHandler.ListOrders)
				orders.Post("/", deps.OrderHandler.CreateOrder)
				orders.Get("/{orderId}", deps.OrderHandler.GetOrderDetail)
				orders.Patch("/{orderId}", deps.OrderHandler.CancelOrder)
				orders.With(middleware.RequireAdmin).Patch("/{orderId}/status", deps.OrderHandler.UpdateOrderStatus)
			})
		}
	})

	return r
}
