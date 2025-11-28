package main

import (
	_ "embed"
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
	smtpPkg "mypracticum/backend/pkg/notifier/smtp"
	"mypracticum/backend/repository/postgres"
	"mypracticum/backend/service"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

// This tells Go to embed the files into the 'otpTemplate'
// and 'inviteTemplate' string variables at compile time.
//
//go:embed "pkg/notifier/smtp/templates/otp.html"
var otpTemplate string

//go:embed "pkg/notifier/smtp/templates/invite.html"
var inviteTemplate string

func main() {
	log.Print("------ [SERVER RESTARTING] ------")
	// 1) Load config (app.yaml for defaults and .env for secretes+overrides)
	_ = godotenv.Load() // loads .env into os.Env --- for development only

	cfg := config.Load()
	cfg.Validate()

	// Load templates

	// 1. Connect to Postgres, and Logger
	db, err := db.Connect(cfg.Auth.DatabaseURL)
	if err != nil {
		log.Fatalf("failed to open DB: %v", err)
	}
	log.Println("Database connected successfully!")

	// 2. Build repositories and managers and clients
	repoFactory := postgres.NewPostgresFactory(db)
	store := inmem.NewStore()
	globalOTPLimiter := inmem.NewLimiter(store, cfg.OTP.GlobalOTPWindow)
	sendOTPLimiter := inmem.NewLimiter(store, cfg.OTP.SendWindow)

	jwtMgr := jwt.NewManager(cfg.Auth)

	smtpNotifier := smtpPkg.NewSMTPNotifier(cfg.SMTP, otpTemplate, inviteTemplate)

	// 3. Build services
	tokenSvc := service.NewTokenService(jwtMgr, repoFactory.UserRepo())
	userSvc := service.NewUserService(repoFactory.UserRepo())
	entrySvc := service.NewEntryService(repoFactory.EntryRepo())
	contactSvc := service.NewContactService(repoFactory.ContactRepo(), userSvc, smtpNotifier)
	otpSvc := service.NewOTPService(userSvc, store, smtpNotifier, sendOTPLimiter, cfg.OTP)

	// 4. Build handlers
	entryH := entryHandlerPkg.NewEntryHandler(entrySvc)
	contactH := contactHandlerPkg.NewContactHandler(contactSvc)
	userH := userHandlerPkg.NewUserHandler(userSvc)
	otpH := OTPHandlerPkg.NewOTPHandler(otpSvc, tokenSvc)

	// 5. Configure CORS
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{
			"https://practicum.temurot.com",
			"http://localhost:5173",
		},

		AllowMethods:  []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:  []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders: []string{"Content-Length"},
		MaxAge:        12 * time.Hour, // preflight request cache duration
	}))

	// 6. Mount routes
	limiterMw := middleware.OTPRateLimit(globalOTPLimiter)
	handlers.RegisterOTPPublic(r, otpH, limiterMw)

	authMw := middleware.JWTMiddleware(tokenSvc)
	handlers.RegisterProtected(r, entryH, contactH, userH, authMw)

	// 7. Start server
	r.Run(":" + cfg.Port)
}
