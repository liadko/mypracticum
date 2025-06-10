package main

import (
	"log"

	"mypracticum/backend/db"
)

func main() {
	log.Print("------ [SERVER RESTARTING] ------\n\n")

	connStr := "host=localhost " +
		"port=5432 " +
		"user=postgres " +
		"password=PostgresKodi555 " +
		"dbname=mypracticum " +
		"sslmode=disable"

	dbConn, err := db.Connect(connStr)
	if err != nil {
		log.Fatal("DB connect:", err)
	}
	if err := db.Migrate(dbConn); err != nil {
		log.Fatal("DB migrate:", err)
	}

	log.Println("Database connected successfully!")

	// r := gin.Default()
	// handlers.RegisterEntriesRoutes(r, dbConn)
	// r.Run(":8080")
}
