package models

import (
	"database/sql"
	"github.com/lib/pq"
	"log"
)

const DUPE_CODE string = "42P07"

type Model interface {
	CreateTableSQL() string
}

type DB struct {
	SQLDB *sql.DB
}

func OpenDB(driverName, dataSourceName string) (*DB, error) {
	db, err := sql.Open(driverName, dataSourceName)
	if err != nil {
		return nil, err
	}
	db.SetMaxIdleConns(8)
	//db.SetMaxIdleConns(-1)
	return &DB{SQLDB: db}, nil
}

type Scannable interface {
	Scan(dest ...interface{}) error
}

func (db *DB) CreateTable(displayName string, m Model) error {
	res, err := db.SQLDB.Exec(m.CreateTableSQL())
	if err != nil {
		pgError, ok := err.(pq.PGError)
		// If we couldn't convert the error into a PGError, bail immediately
		if !ok {
			log.Printf("Error creating %s table: %v\n", displayName,
				err.Error())
			return err
		}
		// We expect dupe table creation errors, so we can ignore it
		// (this is smelly code)
		if pgError.Get('C') == DUPE_CODE {
			err = nil
		}
		return err
	}
	log.Printf("Created %s table: %v\n", displayName, res)
	return nil
}
