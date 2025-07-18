package otp

import (
	"errors"
	"log"
	"mypracticum/backend/domain"
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
		ctx.JSON(400, gin.H{"error": "invalid request"})
		return
	}

	if err := h.otpSvc.SendOTP(ctx.Request.Context(), req.Email); err != nil {
		// 1) business “not found” (no user with that email)
		var nf service.NotFoundError
		if errors.As(err, &nf) {
			ctx.JSON(404, gin.H{"error": nf.Error()})
			return
		}

		var rl service.TooManyRequestsError
		if errors.As(err, &rl) {
			ctx.JSON(http.StatusTooManyRequests, gin.H{"error": rl.Error()})
			return
		}

		// 2) external service failures (SMTP, Smoove, etc.)
		log.Printf("ERROR: SendOTP failed for %q: %v", req.Email, err)
		ctx.JSON(503, gin.H{"error": "could not send OTP, please try again later"})
		return
	}

	ctx.Status(204)
}

// Verify handles POST on '/otp/verify'
func (h *OTPHandler) Verify(ctx *gin.Context) {
	var req VerifyOTPRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(400, gin.H{"error": "invalid request payload"})
		return
	}

	userID, err := h.otpSvc.VerifyOTP(ctx.Request.Context(), req.Email, req.Code)
	if err != nil {
		// combine wrong code & unknown user into “unauthorized”
		var ve domain.ValidationError
		var nf service.NotFoundError
		if errors.As(err, &ve) || errors.As(err, &nf) {
			ctx.JSON(401, gin.H{"error": "invalid credentials"})
			return
		}

		// all other errors are service outages
		ctx.JSON(503, gin.H{"error": "verification failed, please try again later"})
		return
	}

	token, err := h.tokenSvc.GenerateToken(ctx.Request.Context(), userID)
	if err != nil {
		ctx.JSON(500, gin.H{"error": "token generation failed"})
		return
	}
	ctx.JSON(200, gin.H{"token": token})
}
