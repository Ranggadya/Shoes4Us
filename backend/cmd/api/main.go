package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/ranggadya/shoes4us/backend/internal/config"
	"github.com/ranggadya/shoes4us/backend/internal/database"
	"github.com/ranggadya/shoes4us/backend/internal/handler"
	"github.com/ranggadya/shoes4us/backend/internal/repository"
	"github.com/ranggadya/shoes4us/backend/internal/service"
	"github.com/ranggadya/shoes4us/backend/pkg/token"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("failed to load configuration: %v", err)
	}

	if err := os.MkdirAll(cfg.UploadDir, 0o755); err != nil {
		log.Fatalf("failed to create upload directory %q: %v", cfg.UploadDir, err)
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	var pool *pgxpool.Pool
	if cfg.DatabaseURL != "" {
		pool, err = database.NewPostgresPool(ctx, cfg.DatabaseURL)
		if err != nil {
			log.Fatalf("failed to connect to PostgreSQL: %v", err)
		}
		defer pool.Close()
		log.Println("connected to PostgreSQL database pool")
	} else {
		log.Println("warning: DATABASE_URL is empty; starting server without database connection")
	}

	jwtMgr := token.NewJWTManager(cfg.JWTSecret, cfg.JWTExpiresHours)
	userRepo := repository.NewUserRepository(pool)
	authSvc := service.NewAuthService(userRepo, jwtMgr).
		WithResetURLBase(cfg.FrontendURL).
		WithDevResetLinkLogging(strings.TrimSpace(cfg.SMTPHost) == "")
	userSvc := service.NewUserService(userRepo)
	authHandler := handler.NewAuthHandler(authSvc)
	userHandler := handler.NewUserHandler(userSvc)

	categoryRepo := repository.NewCategoryRepository(pool)
	productRepo := repository.NewProductRepository(pool)
	productSvc := service.NewProductService(categoryRepo, productRepo)
	productHandler := handler.NewProductHandler(productSvc).WithUploadDir(cfg.UploadDir)

	reviewRepo := repository.NewReviewRepository(pool)
	reviewSvc := service.NewReviewService(reviewRepo)
	reviewHandler := handler.NewReviewHandler(reviewSvc)

	cartRepo := repository.NewCartRepository(pool)
	cartSvc := service.NewCartService(cartRepo, productRepo)
	cartHandler := handler.NewCartHandler(cartSvc)

	wishlistRepo := repository.NewWishlistRepository(pool)
	wishlistSvc := service.NewWishlistService(wishlistRepo)
	wishlistHandler := handler.NewWishlistHandler(wishlistSvc)

	router := handler.NewRouter(handler.RouterDependencies{
		AllowedOrigins:  cfg.AllowedOrigins,
		UploadDir:       cfg.UploadDir,
		JWTSecret:       cfg.JWTSecret,
		JWTManager:      jwtMgr,
		AuthHandler:     authHandler,
		UserHandler:     userHandler,
		ProductHandler:  productHandler,
		ReviewHandler:   reviewHandler,
		CartHandler:     cartHandler,
		WishlistHandler: wishlistHandler,
	})

	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           router,
		ReadHeaderTimeout: 10 * time.Second,
	}

	errCh := make(chan error, 1)
	go func() {
		log.Printf("Shoes4Us API listening on http://localhost:%s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			errCh <- err
		}
		close(errCh)
	}()

	select {
	case err := <-errCh:
		if err != nil {
			log.Fatalf("server error: %v", err)
		}
	case <-ctx.Done():
		log.Println("shutting down server gracefully...")
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if err := srv.Shutdown(shutdownCtx); err != nil {
			log.Printf("graceful shutdown error: %v", err)
		}
	}
}
