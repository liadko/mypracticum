package main

import (
	"context"
	"log"
	"os"

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
	smtpPkg "mypracticum/backend/pkg/smtp"
	"mypracticum/backend/repository/postgres"
	"mypracticum/backend/service"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	log.Print("------ [SERVER RESTARTING] ------")
	// 1) Load config (app.yaml for defaults and .env for secretes+overrides)
	_ = godotenv.Load() // loads .env into os.Env --- for development only

	cfg := config.Load()
	cfg.Validate()

	// Load email templates (optional). Paths are relative to the project root.
	// Adjust filenames/paths to match your project layout.
	otpTmplPath := "pkg/smtp/templates/otp.html"
	reminderTmplPath := "pkg/smtp/templates/reminder.html"

	var otpTemplate, reminderTemplate string

	if b, err := os.ReadFile(otpTmplPath); err != nil {
		log.Printf("warning: couldn't read OTP template %s: %v", otpTmplPath, err)
	} else {
		otpTemplate = string(b)
		log.Printf("loaded OTP template (%d bytes) from %s", len(otpTemplate), otpTmplPath)
	}

	if b, err := os.ReadFile(reminderTmplPath); err != nil {
		log.Printf("warning: couldn't read reminder template %s: %v", reminderTmplPath, err)
	} else {
		reminderTemplate = string(b)
		log.Printf("loaded reminder template (%d bytes) from %s", len(reminderTemplate), reminderTmplPath)
	}

	var smtpNotifier *smtpPkg.SMTPNotifier
	if cfg.SMTP.Host != "" && true {
		smtpNotifier := smtpPkg.NewSMTPNotifier(cfg.SMTP, otpTemplate, reminderTemplate)
		// If it does, pass otpTemplate; otherwise this remains a simple smoke test.
		if err := smtpNotifier.SendOTP(context.Background(), "liadkoren@gmail.com", "ליעד", "123456"); err != nil {
			log.Printf("SMTP test send failed: %v", err)
		} else {
			log.Printf("SMTP test email sent to liadkoren@gmail.com (check inbox/spam)")
		}
	}

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

	//smooveNotifier := smoovePkg.NewSmooveClient(cfg.Smoove.BaseURL, cfg.Smoove.APIKey)

	// 3. Build services
	tokenSvc := service.NewTokenService(jwtMgr, repoFactory.UserRepo())
	userSvc := service.NewUserService(repoFactory.UserRepo())
	entrySvc := service.NewEntryService(repoFactory.EntryRepo())
	contactSvc := service.NewContactService(repoFactory.ContactRepo(), userSvc)
	otpSvc := service.NewOTPService(userSvc, store, smtpNotifier, sendOTPLimiter, cfg.OTP)

	// 4. Build handlers
	entryH := entryHandlerPkg.NewEntryHandler(entrySvc)
	contactH := contactHandlerPkg.NewContactHandler(contactSvc)
	userH := userHandlerPkg.NewUserHandler(userSvc)
	otpH := OTPHandlerPkg.NewOTPHandler(otpSvc, tokenSvc)

	// 5. Configure CORS
	r := gin.Default()

	// r.Use(cors.New(cors.Config{
	// 	AllowOrigins:     []string{"http://localhost:5173"},
	// 	AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
	// 	AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
	// 	AllowCredentials: true,
	// }))

	r.Use(cors.Default()) // temporary: allow all origins until i have a stable domain

	// 6. Mount routes
	limiterMw := middleware.OTPRateLimit(globalOTPLimiter)
	handlers.RegisterPublic(r, otpH, limiterMw)

	authMw := middleware.JWTMiddleware(tokenSvc)
	handlers.RegisterProtected(r, entryH, contactH, userH, authMw)

	// 7. Start server
	r.Run(":" + cfg.Port)
}
