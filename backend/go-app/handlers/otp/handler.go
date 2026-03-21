package otp

import (
	"errors"
	"log"
	"mypracticum/backend/domain"
	"mypracticum/backend/pkg/format"
	"mypracticum/backend/service"
	"net/http"

	"github.com/gin-gonic/gin"
)

type OTPHandler struct {
	tokenSvc *service.TokenService
	otpSvc   *service.OTPService
}

func NewOTPHandler(otpSvc *service.OTPService, tokenSvc *service.TokenService) *OTPHandler {
	return &OTPHandler{tokenSvc: tokenSvc, otpSvc: otpSvc}
}

// Send handles POST on '/otp/send'
func (h *OTPHandler) Send(ctx *gin.Context) {
	var req SendOTPRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		log.Printf("[OTPHandler.Send] Invalid request payload")
		ctx.JSON(400, gin.H{"error": "invalid request"})
		return
	}

	cleanEmail := format.SanitizeEmail(req.Email)

	log.Printf("[OTPHandler.Send] Sending OTP to email: %s", cleanEmail)
	if err := h.otpSvc.SendOTP(ctx.Request.Context(), cleanEmail); err != nil {
		// 1) business “not found” (no user with that email)
		var nf service.NotFoundError
		if errors.As(err, &nf) {
			log.Printf("[OTPHandler.Send] User not found: %s", cleanEmail)
			ctx.JSON(404, gin.H{"error": nf.Error()})
			return
		}

		var rl service.TooManyRequestsError
		if errors.As(err, &rl) {
			log.Printf("[OTPHandler.Send] Rate limited for: %s", cleanEmail)
			ctx.JSON(http.StatusTooManyRequests, gin.H{"error": rl.Error()})
			return
		}

		// 2) external service failures (SMTP, Smoove, etc.)
		log.Printf("[OTPHandler.Send] Failed to send OTP to %s: %v", cleanEmail, err)
		ctx.JSON(503, gin.H{"error": "could not send OTP, please try again later"})
		return
	}

	log.Printf("[OTPHandler.Send] OTP sent successfully to: %s", cleanEmail)
	ctx.Status(204)
}

// Verify handles POST on '/otp/verify'
func (h *OTPHandler) Verify(ctx *gin.Context) {
	var req VerifyOTPRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		log.Printf("[OTPHandler.Verify] Invalid request payload")
		ctx.JSON(400, gin.H{"error": "invalid request payload"})
		return
	}

	log.Printf("[OTPHandler.Verify] Verifying OTP for email: %s", req.Email)
	userID, roles, err := h.otpSvc.VerifyOTP(ctx.Request.Context(), req.Email, req.Code)
	if err != nil {
		// combine wrong code & unknown user into “unauthorized”
		var ve domain.ValidationError
		var nf service.NotFoundError
		if errors.As(err, &ve) || errors.As(err, &nf) {
			log.Printf("[OTPHandler.Verify] Invalid credentials for email: %s", req.Email)
			ctx.JSON(401, gin.H{"error": "invalid credentials"})
			return
		}

		// all other errors are service outages
		log.Printf("[OTPHandler.Verify] Verification failed for %s: %v", req.Email, err)
		ctx.JSON(503, gin.H{"error": "verification failed, please try again later"})
		return
	}

	log.Printf("[OTPHandler.Verify] OTP verified for email: %s, userID: %s, roles: %v", req.Email, userID, roles)
	token, err := h.tokenSvc.GenerateToken(ctx.Request.Context(), userID, roles)
	if err != nil {
		log.Printf("[OTPHandler.Verify] Token generation failed for %s: %v", req.Email, err)
		ctx.JSON(500, gin.H{"error": "token generation failed"})
		return
	}

	log.Printf("[OTPHandler.Verify] Login successful for: %s", req.Email)
	ctx.JSON(200, gin.H{"token": token})
}

// Ping handles GET on '/ping' to wake server up
func (h *OTPHandler) Ping(ctx *gin.Context) {
	ctx.JSON(200, gin.H{"message": "pong"})
}
