package handlers

import "github.com/gin-gonic/gin"

// RegisterPublic mounts all public endpoints
func RegisterPublic(r *gin.Engine, otpH *OtpHandler) {
	pub := r.Group("/api/")
	pub.POST("/otp", otpH.Send)
	pub.POST("/otp/verify", otpH.Verify)
}

// RegisterProtected mounts everything behind auth
func RegisterProtected(r *gin.Engine, authMw gin.HandlerFunc, entryH *EntryHandler, contactH *ContactHandler) {
	prot := r.Group("/api/")
	prot.Use(authMw)

	// entries
	prot.GET("/entries", entryH.List)
	prot.POST("/entries", entryH.Create)
	prot.DELETE("/entries/:entryId", entryH.Delete)

	// contacts
	prot.GET("/contacts", contactH.List)
	prot.POST("/contacts", contactH.Create)
	prot.PUT("/contacts/:contactId", contactH.Update)
}
