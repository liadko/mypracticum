package handlers

import "github.com/gin-gonic/gin"

type OtpHandler struct {
}

func NewOtpHandler() *OtpHandler {
	return &OtpHandler{}
}

func (h *OtpHandler) Send(ctx *gin.Context) {

}

func (h *OtpHandler) Verify(ctx *gin.Context) {

}
