package main

import (
	"fmt"
	"log"
	"os"

	"mypracticum/backend/db"
)

func main() {
	fmt.Println("\n\n")

	// connStr := "host=localhost " +
	// 	"port=5432 " +
	// 	"user=postgres " +
	// 	"password=PostgresKodi555 " +
	// 	"dbname=mypracticum " +
	// 	"sslmode=disable"

	// Get the database connection string from the environment variable
	connStr := os.Getenv("DATABASE_URL")
	if connStr == "" {
		log.Fatal("DATABASE_URL environment variable is not set")
	}

	dbConn, err := db.Connect(connStr)
	if err != nil {
		log.Fatal("DB connect:", err)
	}
	if err := db.Migrate(dbConn); err != nil {
		log.Fatal("DB migrate:", err)
	}

	fmt.Println("Database connected successfully!")

	// r := gin.Default()
	// handlers.RegisterEntriesRoutes(r, dbConn)
	// r.Run(":8080")
}
