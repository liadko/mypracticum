// handlers/otp/handler.go
package otp

import (
	"errors"
	"net/http"

	"mypracticum/backend/pkg/otp"
	"mypracticum/backend/service"

	"github.com/gin-gonic/gin"
)

type OTPHandler struct {
	client   otp.Client
	tokenSvc *service.TokenService
	userSvc  *service.UserService
}

func NewOTPHandler(client otp.Client, tokenSvc *service.TokenService, userSvc *service.UserService) *OTPHandler {
	return &OTPHandler{client: client, tokenSvc: tokenSvc, userSvc: userSvc}
}

// Send handles POST on '/otp'
func (h *OTPHandler) Send(ctx *gin.Context) {
	// 1) Bind and validate the incoming JSON payload
	var req SendOTPRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 2) Ensure a user with this email actually exists
	if _, err := h.userSvc.GetUserByEmail(ctx.Request.Context(), req.Email); err != nil {
		var notFound service.NotFoundError
		if errors.As(err, &notFound) {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 3) Delegate to the OTP client
	err := h.client.Send(ctx, req.Email)
	switch {
	case err == nil:
		ctx.Status(http.StatusNoContent)
	case errors.Is(err, otp.ErrInvalidRequest):
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
	case errors.Is(err, otp.ErrServiceUnavailable):
		ctx.JSON(http.StatusServiceUnavailable, gin.H{"error": "OTP service unavailable"})
	default:
		ctx.JSON(http.StatusBadGateway, gin.H{"error": "failed to send OTP"})
	}
}

// Verify handles POST on '/otp/verify'
func (h *OTPHandler) Verify(ctx *gin.Context) {
	// 1) Bind & validate
	var req VerifyOTPRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 2) Verify OTP; handle all error cases first
	if err := h.client.Verify(ctx, req.Email, req.Code); err != nil {
		switch {
		case errors.Is(err, otp.ErrInvalidRequest):
			ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})

		case errors.Is(err, otp.ErrInvalidCode):
			ctx.JSON(http.StatusUnauthorized, gin.H{"error": "invalid code"})
		case errors.Is(err, otp.ErrServiceUnavailable):
			ctx.JSON(http.StatusServiceUnavailable, gin.H{"error": "OTP service unavailable"})
		default:
			ctx.JSON(http.StatusBadGateway, gin.H{"error": "verification failed"})
		}
		return
	}

	// 3) Success path: look up user and issue token
	user, svcErr := h.userSvc.GetUserByEmail(ctx.Request.Context(), req.Email)
	if svcErr != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": svcErr.Error()})
		return
	}
	token, genErr := h.tokenSvc.GenerateToken(ctx.Request.Context(), user.ID)
	if genErr != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": genErr.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"token": token})
}
