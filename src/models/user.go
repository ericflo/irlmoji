package models

import (
	"errors"
	"fmt"
	"github.com/codegangsta/martini-contrib/binding"
	_ "github.com/lib/pq"
	"net/http"
	"time"
)

type User struct {
	Id                  string    `json:"id" binding:"required"`
	Username            string    `json:"username" binding:"required"`
	TwitterAccessToken  string    `json:"-" binding:"required"`
	TwitterAccessSecret string    `json:"-" binding:"required"`
	TimeCreated         time.Time `json:"timeCreated"`
	TimeUpdated         time.Time `json:"timeUpdated"`
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

// This is needed because we don't want to expose the access token/secret
// normally, but we do want to ingest them, and martini's binding module isn't
// expressive enough to represent that concisely.
type UserForm struct {
	TwitterAccessToken  string `json:"twitterAccessToken" binding:"required"`
	TwitterAccessSecret string `json:"twitterAccessSecret" binding:"required"`
}

func (userForm UserForm) Validate(errors *binding.Errors, req *http.Request) {
	// TODO (although I'm not crazy about this API that binding exposes.)
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
