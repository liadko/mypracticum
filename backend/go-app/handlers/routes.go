package handlers

import (
	"github.com/gin-gonic/gin"

	contactPkg "mypracticum/backend/handlers/contact"
	entryPkg "mypracticum/backend/handlers/entry"
	otpPkg "mypracticum/backend/handlers/otp"
	reportPkg "mypracticum/backend/handlers/report"
	userPkg "mypracticum/backend/handlers/user"
	"mypracticum/backend/middleware"
)

// RegisterOTPPublic mounts all public endpoints for OTP handling
func RegisterOTPPublic(r *gin.Engine, otpH *otpPkg.OTPHandler, otpLimiter gin.HandlerFunc) {
	pub := r.Group("/api/v1")
	pub.Use(otpLimiter)

	pub.POST("/otp/send", otpH.Send)
	pub.POST("/otp/verify", otpH.Verify)

	pub.GET("/ping", otpH.Ping)
}

// RegisterProtected mounts everything behind auth
func RegisterProtected(r *gin.Engine, entryH *entryPkg.EntryHandler, contactH *contactPkg.ContactHandler, userH *userPkg.UserHandler, reportH *reportPkg.ReportHandler, mws ...gin.HandlerFunc) {
	prot := r.Group("/api/v1")
	prot.Use(mws...)

	// entries
	prot.GET("/entries", entryH.ListEntries)
	prot.POST("/entries", entryH.Create)
	prot.DELETE("/entries/:entryId", entryH.Delete)
	prot.PATCH("/entries/:entryId/approval", entryH.SetApproval)
	prot.GET("/entries/manual", entryH.ListManualEntries)

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
	prot.GET("/admin/classes", userH.ListClasses)
	prot.POST("/admin/classes", userH.CreateClass)
	prot.PUT("/admin/classes/:classId", userH.UpdateClass)
	prot.GET("/admin/students", userH.GetStudents)
	prot.POST("/admin/classes/:classId/students/import", userH.ImportStudents)
	prot.POST("/admin/entries/approve", entryH.BulkApprove)
	prot.POST("/admin/entries/manual", entryH.BulkAddManualEntries)
	prot.POST("/admin/entries/manual/delete", entryH.DeleteManualEntries)
	prot.POST("/admin/entries/delete", entryH.DeleteEntries)

	reports := prot.Group("/reports")
	reports.Use(middleware.RequireAnyRole("admin", "analyst"))
	reports.GET("/classes", reportH.ListClasses)
	reports.GET("/mentors", reportH.ListMentors)
	reports.GET("/mentors/:mentorId", reportH.GetMentor)
	reports.GET("/students", reportH.ListStudents)
	reports.GET("/students/:studentId", reportH.GetStudent)

}
