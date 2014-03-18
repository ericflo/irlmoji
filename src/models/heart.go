package models

import (
	"time"
)

type Heart struct {
	UserId      string    `json:"userId" binding:"required"`
	IMId        uint64    `json:"irlmojiId" binding:"required"`
	TimeCreated time.Time `json:"timeCreated"`
}

func (h *Heart) CreateTableSQL() string {
	// TODO: Foreign key constraints
	return `
    CREATE TABLE heart (
        user_id TEXT NOT NULL,
        irlmoji_id BIGINT NOT NULL,
        time_created timestamp NOT NULL
    );
    `
}

// DATABASE ACCESS STUFF

func HeartRowReturn(err error, user *User) (*User, error) {
	switch {
	case err != nil:
		return nil, err
	default:
		return user, nil
	}
}

// TODO: The rest
