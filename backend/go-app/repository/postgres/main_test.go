package postgres

import (
	"context"
	"database/sql"
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"testing"
	"time"

	"github.com/testcontainers/testcontainers-go"
	tcpostgres "github.com/testcontainers/testcontainers-go/modules/postgres"
	"github.com/testcontainers/testcontainers-go/wait"

	mydb "mypracticum/backend/db"
)

// testDB is shared by every test in this package. It points at a throwaway
// container, so these tests can never reach the production database.
var testDB *sql.DB

// TestMain runs once for the whole package: it starts Postgres, replays every
// migration, runs the tests, then tears the container down.
func TestMain(m *testing.M) {
	flag.Parse() // testing.Short needs parsed flags, and TestMain runs before that.
	if testing.Short() {
		fmt.Println("skipping repository integration tests in -short mode")
		os.Exit(0)
	}
	os.Exit(run(m))
}

func run(m *testing.M) int {
	ctx := context.Background()

	container, err := tcpostgres.Run(ctx, "postgres:17",
		tcpostgres.WithDatabase("practicum_test"),
		tcpostgres.WithUsername("test"),
		tcpostgres.WithPassword("test"),
		testcontainers.WithWaitStrategy(
			wait.ForLog("database system is ready to accept connections").
				WithOccurrence(2).
				WithStartupTimeout(90*time.Second),
		),
	)
	if err != nil {
		fmt.Fprintf(os.Stderr, "start postgres (is Docker running?): %v\n", err)
		return 1
	}
	defer func() { _ = testcontainers.TerminateContainer(container) }()

	url, err := container.ConnectionString(ctx, "sslmode=disable")
	if err != nil {
		fmt.Fprintf(os.Stderr, "connection string: %v\n", err)
		return 1
	}

	testDB, err = mydb.Connect(url)
	if err != nil {
		fmt.Fprintf(os.Stderr, "connect: %v\n", err)
		return 1
	}
	defer testDB.Close()

	// Migration files hold several statements, which only the simple protocol
	// accepts, so they get their own connection.
	migrator, err := mydb.Connect(url + "&default_query_exec_mode=simple_protocol")
	if err != nil {
		fmt.Fprintf(os.Stderr, "connect migrator: %v\n", err)
		return 1
	}
	defer migrator.Close()

	if err := applyMigrations(ctx, migrator); err != nil {
		fmt.Fprintf(os.Stderr, "migrations: %v\n", err)
		return 1
	}
	return m.Run()
}

func migrationFiles() ([]string, error) {
	files, err := filepath.Glob(filepath.Join("..", "..", "db", "migrations", "*.up.sql"))
	if err != nil {
		return nil, err
	}
	sort.Strings(files)
	return files, nil
}

func applyMigrations(ctx context.Context, db *sql.DB) error {
	files, err := migrationFiles()
	if err != nil {
		return err
	}
	if len(files) == 0 {
		return fmt.Errorf("no migrations found")
	}
	for _, file := range files {
		content, err := os.ReadFile(file)
		if err != nil {
			return err
		}
		if _, err := db.ExecContext(ctx, string(content)); err != nil {
			return fmt.Errorf("%s: %w", filepath.Base(file), err)
		}
	}
	return nil
}
