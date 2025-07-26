package handlers

import (
	"github.com/gin-gonic/gin"

	contactPkg "mypracticum/backend/handlers/contact"
	entryPkg "mypracticum/backend/handlers/entry"
	otpPkg "mypracticum/backend/handlers/otp"
	userPkg "mypracticum/backend/handlers/user"
)

// RegisterPublic mounts all public endpoints
// ADD parameter oauthH *oauthPkg.OAuthHandler
func RegisterPublic(r *gin.Engine, otpH *otpPkg.OTPHandler, otpLimiter gin.HandlerFunc) {
	pub := r.Group("/api/v1")
	pub.Use(otpLimiter)

	pub.POST("/otp/send", otpH.Send)
	pub.POST("/otp/verify", otpH.Verify)

	//pub.GET("/login/google", oauthH.LoginGoogle)
	//pub.GET("/login/callback", oauthH.HandleCallback)
}

// RegisterProtected mounts everything behind auth
func RegisterProtected(r *gin.Engine, entryH *entryPkg.EntryHandler, contactH *contactPkg.ContactHandler, userH *userPkg.UserHandler, mws ...gin.HandlerFunc) {
	prot := r.Group("/api/v1")
	prot.Use(mws...)

	// entries
	prot.GET("/entries", entryH.List)
	prot.POST("/entries", entryH.Create)
	prot.DELETE("/entries/:entryId", entryH.Delete)

	// contacts
	prot.GET("/contacts", contactH.List)
	prot.POST("/contacts", contactH.Create)
	prot.PUT("/contacts/:contactId", contactH.Update)

	// users
	prot.GET("/users/me", userH.GetMe)
	prot.PATCH("/users/me", userH.UpdateSignature)

}
