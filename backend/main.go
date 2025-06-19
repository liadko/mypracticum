package main

import (
	"log"

	"mypracticum/backend/db"
	"mypracticum/backend/handlers"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	log.Print("------ [SERVER RESTARTING] ------\n\n")

	connStr := `postgres://postgres:PostgresKodi555@localhost:5432/mypracticum?sslmode=disable`

	dbConn, err := db.Connect(connStr)
	if err != nil {
		log.Fatal("DB connect:", err)
	}

	log.Println("Database connected successfully!")

	r := gin.Default()
	// --- 2. Configure and Use the CORS Middleware ---
	config := cors.DefaultConfig()
	// Allow the origin of your React development server
	config.AllowOrigins = []string{"http://localhost:5173"}
	// You might want to allow other headers if needed, like Authorization
	config.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type"}

	r.Use(cors.New(config))

	handlers.RegisterEntriesRoutes(r, dbConn)
	r.Run(":8080")
}
