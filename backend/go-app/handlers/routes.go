package handlers

import (
	"github.com/gin-gonic/gin"

	contactPkg "mypracticum/backend/handlers/contact"
	entryPkg "mypracticum/backend/handlers/entry"
	otpPkg "mypracticum/backend/handlers/otp"
)

// RegisterPublic mounts all public endpoints
// ADD parameter oauthH *oauthPkg.OAuthHandler
func RegisterPublic(r *gin.Engine, otpH *otpPkg.OTPHandler) {
	pub := r.Group("")

	pub.POST("/otp", otpH.Send)
	pub.POST("/otp/verify", otpH.Verify)

	//pub.GET("/login/google", oauthH.LoginGoogle)
	//pub.GET("/login/callback", oauthH.HandleCallback)
}

// RegisterProtected mounts everything behind auth
func RegisterProtected(r *gin.Engine, entryH *entryPkg.EntryHandler, contactH *contactPkg.ContactHandler, mws ...gin.HandlerFunc) {
	prot := r.Group("")
	prot.Use(mws...)

	// entries
	prot.GET("/entries", entryH.List)
	prot.POST("/entries", entryH.Create)
	prot.DELETE("/entries/:entryId", entryH.Delete)

	// contacts
	prot.GET("/contacts", contactH.List)
	prot.POST("/contacts", contactH.Create)
	prot.PUT("/contacts/:contactId", contactH.Update)
}
