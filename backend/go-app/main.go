package main

import (
	"log"
	"time"

	"mypracticum/backend/config"
	"mypracticum/backend/db"
	"mypracticum/backend/handlers"
	contactHandlerPkg "mypracticum/backend/handlers/contact"
	entryHandlerPkg "mypracticum/backend/handlers/entry"
	OTPHandlerPkg "mypracticum/backend/handlers/otp"
	userHandlerPkg "mypracticum/backend/handlers/user"
	"mypracticum/backend/middleware"
	"mypracticum/backend/pkg/cache/inmem"
	"mypracticum/backend/pkg/jwt"
	smoovePkg "mypracticum/backend/pkg/smoove"
	"mypracticum/backend/repository/postgres"
	"mypracticum/backend/service"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	log.Print("------ [SERVER RESTARTING] ------")

	cfg := config.LoadAuthConfig() // holds DatabaseURL, JWTSecret, JWTIssuer, JWTTTL

	// 1. Connect to Postgres, and Logger
	db, err := db.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("failed to open DB: %v", err)
	}
	log.Println("Database connected successfully!")

	// 2. Build repositories and managers and clients
	repoFactory := postgres.NewPostgresFactory(db)
	store := inmem.NewStore()
	globalOTPLimiter := inmem.NewLimiter(store, 3*time.Second)
	sendOTPLimiter := inmem.NewLimiter(store, 2*time.Minute)

	jwtMgr := jwt.NewManager(
		cfg.JWTSecret,
		cfg.JWTIssuer,
		cfg.JWTTTL,
	)

	smooveNotifier := smoovePkg.NewSmooveClient(cfg.SmooveBaseURL, cfg.SmooveAPIKey)

	// 3. Build services
	tokenSvc := service.NewTokenService(jwtMgr, repoFactory.UserRepo())
	userSvc := service.NewUserService(repoFactory.UserRepo())
	entrySvc := service.NewEntryService(repoFactory.EntryRepo())
	contactSvc := service.NewContactService(repoFactory.ContactRepo())
	otpSvc := service.NewOTPService(repoFactory.UserRepo(), store, smooveNotifier, sendOTPLimiter, 5*time.Minute)

	// 4. Build handlers
	entryH := entryHandlerPkg.NewEntryHandler(entrySvc)
	contactH := contactHandlerPkg.NewContactHandler(contactSvc)
	userH := userHandlerPkg.NewUserHandler(userSvc)
	otpH := OTPHandlerPkg.NewOTPHandler(otpSvc, tokenSvc, userSvc)

	// 5. Configure CORS
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		AllowCredentials: true,
	}))

	// 6. Mount routes
	limiterMw := middleware.OTPRateLimit(globalOTPLimiter)
	handlers.RegisterPublic(r, otpH, limiterMw)

	authMw := middleware.JWTMiddleware(tokenSvc)
	handlers.RegisterProtected(r, entryH, contactH, userH, authMw)

	// 7. Start server
	r.Run(":8080")
}
