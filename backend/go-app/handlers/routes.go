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

}

// RegisterProtected mounts everything behind auth
func RegisterProtected(r *gin.Engine, entryH *entryPkg.EntryHandler, contactH *contactPkg.ContactHandler, userH *userPkg.UserHandler, mws ...gin.HandlerFunc) {
	prot := r.Group("/api/v1")
	prot.Use(mws...)

	// entries
	prot.GET("/entries", entryH.List)
	prot.POST("/entries", entryH.Create)
	prot.DELETE("/entries/:entryId", entryH.Delete)
	prot.PATCH("/entries/:entryId/approval", entryH.SetApproval)

	// contacts
	prot.GET("/contacts", contactH.List)
	prot.POST("/contacts", contactH.Create)
	prot.PUT("/contacts/:contactId", contactH.Update)
	prot.POST("/contacts/:contactId/invite", contactH.InviteMentor)

	// users
	prot.GET("/users/me", userH.GetMe)
	prot.PATCH("/users/me", userH.UpdateProfile)
	prot.PATCH("/users/me/signature", userH.UpdateSignature)
	prot.POST("/users", userH.AddUser)

	// admin
	prot.GET("/admin/students", userH.GetStudents)
	prot.POST("/admin/students/import", userH.ImportStudents)
	prot.POST("/admin/entries/approve", entryH.BulkApprove)
	prot.POST("/admin/entries/manual", entryH.BulkAddManualEntries)

}
