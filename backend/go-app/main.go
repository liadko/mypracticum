package main

import (
	"log"

	"mypracticum/backend/db"
	"mypracticum/backend/handlers"
	"mypracticum/backend/middleware"
	"mypracticum/backend/repository/postgres"
	"mypracticum/backend/service"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	log.Print("------ [SERVER RESTARTING] ------")

	// 1. Connect to Postgres
	connStr := "postgres://postgres:mypassword@localhost:5432/mypracticum?sslmode=disable"
	dbConn, err := db.Connect(connStr)
	if err != nil {
		log.Fatal("DB connect:", err)
	}
	log.Println("Database connected successfully!")

	// 2. Build repositories via factory
	repoFactory := postgres.NewPostgresFactory(dbConn)

	// 3. Build services
	authSvc := service.NewAuthService(repoFactory.UserRepo())
	entrySvc := service.NewEntryService(repoFactory.EntryRepo())
	contactSvc := service.NewContactService(repoFactory.ContactRepo())

	// 4. Build handlers
	entryH := handlers.NewEntryHandler(entrySvc)
	contactH := handlers.NewContactHandler(contactSvc)

	// 5. Configure Gin + CORS + auth middleware
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		AllowCredentials: true,
	}))

	r.Use(middleware.AuthMiddleware(authSvc))

	// 6. Mount routes
	handlers.RegisterRoutes(r, entryH, contactH)

	// 7. Start server
	r.Run(":8080")
}
