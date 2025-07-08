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
	"mypracticum/backend/middleware"
	"mypracticum/backend/pkg/jwt"
	"mypracticum/backend/pkg/otp"
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

	jwtMgr := jwt.NewManager(
		cfg.JWTSecret,
		cfg.JWTIssuer,
		cfg.JWTTTL*time.Second, // or however you parse TTL
	)

	otpHttpClient := otp.NewHttpOtpClient(cfg.OtpServiceURL)

	// 3. Build services
	tokenSvc := service.NewTokenService(jwtMgr, repoFactory.UserRepo())
	userSvc := service.NewUserService(repoFactory.UserRepo())
	entrySvc := service.NewEntryService(repoFactory.EntryRepo())
	contactSvc := service.NewContactService(repoFactory.ContactRepo())

	// 4. Build handlers
	entryH := entryHandlerPkg.NewEntryHandler(entrySvc)
	contactH := contactHandlerPkg.NewContactHandler(contactSvc)
	otpH := OTPHandlerPkg.NewOTPHandler(otpHttpClient, tokenSvc, userSvc)

	// 5. Configure CORS
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		AllowCredentials: true,
	}))

	// 6. Mount routes
	handlers.RegisterPublic(r, otpH)

	authMw := middleware.JWTMiddleware(tokenSvc)
	handlers.RegisterProtected(r, entryH, contactH, authMw)

	// 7. Start server
	r.Run(":8080")
}
