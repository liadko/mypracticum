package postgres

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"mypracticum/backend/domain"
	userhandler "mypracticum/backend/handlers/user"
	"mypracticum/backend/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func TestClassReportingDatesHTTP(t *testing.T) {
	resetDB(t)
	repo := NewPostgresUserRepo(testDB)
	class, err := repo.CreateClass(context.Background(), domain.Class{Name: "מחזור בדיקה", PrivateClinicCap: 175})
	if err != nil {
		t.Fatal(err)
	}
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(func(c *gin.Context) { c.Set("roles", []string{"admin"}) })
	r.PATCH("/classes/:classId/reporting-start-dates", userhandler.NewUserHandler(service.NewUserService(repo)).UpdateClassReportingStartDates)
	request := func(id, body string) *httptest.ResponseRecorder {
		rec := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodPatch, "/classes/"+id+"/reporting-start-dates", strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		r.ServeHTTP(rec, req)
		return rec
	}
	body := `{"reportingStartDates":{"client":"2026-11-01","mentor":"2026-11-16","therapist":"2027-01-03"}}`
	rec := request(class.ID.String(), body)
	if rec.Code != http.StatusOK {
		t.Fatalf("status=%d body=%s", rec.Code, rec.Body.String())
	}
	var response userhandler.AdminClassResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &response); err != nil {
		t.Fatal(err)
	}
	if response.Name != class.Name || response.PrivateClinicCap != 175 || response.ReportingStartDates.Mentor == nil || *response.ReportingStartDates.Mentor != "2026-11-16" {
		t.Fatalf("unexpected response: %+v", response)
	}
	got, err := repo.FindClassByID(context.Background(), class.ID)
	if err != nil || got.ClientStartDate.Format("2006-01-02") != "2026-11-01" || got.TherapistStartDate.Format("2006-01-02") != "2027-01-03" {
		t.Fatalf("read-back: %+v, %v", got, err)
	}
	for _, invalid := range []string{"{}", `{"reportingStartDates":{}}`, strings.Replace(body, "2026-11-16", "2026-02-30", 1), strings.Replace(body, "2026-11-16", "16/11/2026", 1), strings.Replace(body, `"2026-11-16"`, "null", 1)} {
		if rec := request(class.ID.String(), invalid); rec.Code != http.StatusBadRequest {
			t.Fatalf("invalid dates: status=%d body=%s", rec.Code, rec.Body.String())
		}
	}
	if rec := request(uuid.NewString(), body); rec.Code != http.StatusNotFound {
		t.Fatalf("unknown class: %d", rec.Code)
	}
	if rec := request("bad-id", body); rec.Code != http.StatusBadRequest {
		t.Fatalf("invalid ID: %d", rec.Code)
	}
	unchanged, err := repo.FindClassByID(context.Background(), class.ID)
	if err != nil || !unchanged.MentorStartDate.Equal(*got.MentorStartDate) || unchanged.PrivateClinicCap != 175 {
		t.Fatal("invalid requests modified the class")
	}
}
