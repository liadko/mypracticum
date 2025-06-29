package handlers

import "github.com/gin-gonic/gin"

// RegisterRoutes mounts all entry and contact endpoints under /api/:studentId
func RegisterRoutes(
	r *gin.Engine,
	entryH *EntryHandler,
	contactH *ContactHandler,
) {
	api := r.Group("/api/:studentId")
	{
		// Entry routes
		api.GET("/entries", entryH.List)
		api.POST("/entries", entryH.Create)
		api.DELETE("/entries/:entryId", entryH.Delete)
		//api.PATCH("/entries/:entryId", entryH.Update)

		// Contact routes
		api.GET("/contacts", contactH.List)
		//api.POST("/contacts", contactH.Create)
		//api.PATCH("/contacts/:contactId", contactH.Update)
		//api.DELETE("/contacts/:contactId", contactH.Delete)
	}
}
