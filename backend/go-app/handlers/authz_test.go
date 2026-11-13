package handlers

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	contactPkg "mypracticum/backend/handlers/contact"
	entryPkg "mypracticum/backend/handlers/entry"
	reportPkg "mypracticum/backend/handlers/report"
	userPkg "mypracticum/backend/handlers/user"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// newRouter mounts the real routes behind a stand-in for the JWT middleware.
// The handlers get nil services on purpose: a role check has to reject the
// request before any service runs, so reaching one panics and fails the test.
func newRouter(roles ...string) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	fakeAuth := func(c *gin.Context) {
		c.Set("userID", uuid.New())
		c.Set("roles", roles)
		c.Next()
	}
	RegisterProtected(r,
		entryPkg.NewEntryHandler(nil),
		contactPkg.NewContactHandler(nil),
		userPkg.NewUserHandler(nil),
		reportPkg.NewReportHandler(nil),
		fakeAuth,
	)
	return r
}

func TestAdminAndReportRoutesRejectLowerRoles(t *testing.T) {
	id := uuid.NewString()
	routes := []struct{ method, path string }{
		{http.MethodGet, "/api/v1/admin/classes"},
		{http.MethodPost, "/api/v1/admin/classes"},
		{http.MethodGet, "/api/v1/admin/students"},
		{http.MethodPost, "/api/v1/admin/classes/" + id + "/students/import"},
		{http.MethodPost, "/api/v1/admin/entries/approve"},
		{http.MethodPost, "/api/v1/admin/entries/manual"},
		{http.MethodPost, "/api/v1/admin/entries/manual/delete"},
		{http.MethodPost, "/api/v1/admin/entries/delete"},
		{http.MethodPost, "/api/v1/users"},
		{http.MethodGet, "/api/v1/reports/classes"},
		{http.MethodGet, "/api/v1/reports/students"},
		{http.MethodGet, "/api/v1/reports/students/" + id},
		{http.MethodGet, "/api/v1/reports/mentors"},
		{http.MethodGet, "/api/v1/reports/mentors/" + id},
	}

	for _, role := range []string{"student", "mentor"} {
		router := newRouter(role)
		for _, route := range routes {
			t.Run(role+" "+route.method+" "+route.path, func(t *testing.T) {
				rec := httptest.NewRecorder()
				req := httptest.NewRequest(route.method, route.path, strings.NewReader("{}"))
				router.ServeHTTP(rec, req)
				if rec.Code != http.StatusForbidden {
					t.Fatalf("got %d, want 403", rec.Code)
				}
			})
		}
	}
}

func TestAnalystCannotUseAdminRoutes(t *testing.T) {
	router := newRouter("analyst")
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/admin/entries/delete", strings.NewReader("{}"))
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusForbidden {
		t.Fatalf("got %d, want 403", rec.Code)
	}
}

func TestStudentCannotApproveEntries(t *testing.T) {
	router := newRouter("student")
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPatch, "/api/v1/entries/"+uuid.NewString()+"/approval", strings.NewReader(`{"approved":true}`))
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusForbidden {
		t.Fatalf("got %d, want 403", rec.Code)
	}
}
