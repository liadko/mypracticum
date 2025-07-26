package otp

type SendOTPRequest struct {
	Email string `json:"email" binding:"required,email"`
}
type VerifyOTPRequest struct {
	Email string `json:"email" binding:"required"`
	Code  string `json:"code" binding:"required"`
}
