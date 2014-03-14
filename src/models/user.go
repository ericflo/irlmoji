package models

import (
	"errors"
	"fmt"
	_ "github.com/lib/pq"
	"time"
)

type User struct {
	Id                  string    `json:"id"`
	Username            string    `json:"username"`
	TwitterAccessToken  string    `json:"-"`
	TwitterAccessSecret string    `json:"-"`
	TimeCreated         time.Time `json:"time_created"`
	TimeUpdated         time.Time `json:"time_updated"`
}

func (user *User) CreateTableSQL() string {
	return `
    CREATE TABLE auth_user (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        twitter_access_token TEXT NOT NULL,
        twitter_access_secret TEXT NOT NULL,
        time_created timestamp NOT NULL,
        time_updated timestamp NOT NULL
    );
    `
}

// DATABASE ACCESS STUFF

func UserRowReturn(err error, user *User) (*User, error) {
	switch {
	case err != nil:
		return nil, err
	default:
		return user, nil
	}
}

func (db *DB) GetUserWithId(id string) (*User, error) {
	var user User
	err := db.SQLDB.QueryRow(`
        SELECT id, username, twitter_access_token, twitter_access_secret,
               time_created, time_updated
        FROM auth_user WHERE id = $1`, id).Scan(
		&user.Id,
		&user.Username,
		&user.TwitterAccessToken,
		&user.TwitterAccessSecret,
		&user.TimeCreated,
		&user.TimeUpdated,
	)
	return UserRowReturn(err, &user)
}

func (db *DB) GetUserWithUsername(username string) (*User, error) {
	var user User
	err := db.SQLDB.QueryRow(`
        SELECT id, username, twitter_access_token, twitter_access_secret,
               time_created, time_updated
        FROM auth_user WHERE UPPER(username) = UPPER($1)`, username).Scan(
		&user.Id,
		&user.Username,
		&user.TwitterAccessToken,
		&user.TwitterAccessSecret,
		&user.TimeCreated,
		&user.TimeUpdated,
	)
	return UserRowReturn(err, &user)
}

func (db *DB) CreateUser(id, username, twitterAccessToken, twitterAccessSecret string) (*User, error) {
	t := time.Now().UTC()
	user := User{
		Id:                  id,
		Username:            username,
		TwitterAccessToken:  twitterAccessToken,
		TwitterAccessSecret: twitterAccessSecret,
		TimeCreated:         t,
		TimeUpdated:         t,
	}

	if id != "" {
		tmpUser, tmpErr := db.GetUserWithId(id)
		if tmpErr != nil {
			return nil, tmpErr
		}
		if tmpUser != nil {
			reason := fmt.Sprintf("User with id %v already exists.", id)
			return nil, errors.New(reason)
		}
	}
	if username != "" {
		tmpUser, tmpErr := db.GetUserWithUsername(username)
		if tmpErr != nil {
			return nil, tmpErr
		}
		if tmpUser != nil {
			reason := fmt.Sprintf("User with username %v already exists.",
				username)
			return nil, errors.New(reason)
		}
	}

	_, err := db.SQLDB.Exec(`
        INSERT INTO auth_user(
            id, username, twitter_access_token, twitter_access_secret,
            time_created, time_updated
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
		user.Id,
		user.Username,
		user.TwitterAccessToken,
		user.TwitterAccessSecret,
		user.TimeCreated,
		user.TimeUpdated,
	)
	if err != nil {
		return nil, err
	}

	return &user, nil
}
