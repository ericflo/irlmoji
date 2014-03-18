package models

import (
	"database/sql"
	"log"
	"time"
)

type IRLMoji struct {
	Id          uint64    `json:"id"`
	UserId      string    `json:"userId"`
	Emoji       string    `json:"emoji" binding:"required"`
	Picture     string    `json:"picture" binding:"required"`
	TimeCreated time.Time `json:"timeCreated"`
	User        User      `json:"user"`
}

func (im *IRLMoji) CreateTableSQL() string {
	return `
    CREATE TABLE irlmoji (
        id BIGSERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        emoji TEXT NOT NULL,
        picture TEXT NOT NULL,
        time_created timestamp NOT NULL
    );
    `
}

const BASE_QUERY string = `
SELECT
    I.id,
    I.user_id,
    I.emoji,
    I.picture,
    I.time_created,
    U.id,
    U.username,
    U.pic,
    U.twitter_access_token,
    U.twitter_access_secret,
    U.time_created,
    U.time_updated
FROM irlmoji I
LEFT OUTER JOIN auth_user U
ON (I.user_id = U.id)
`

// DATABASE ACCESS STUFF

func IMRowReturn(err error, im *IRLMoji) (*IRLMoji, error) {
	switch {
	case err != nil:
		return nil, err
	default:
		return im, nil
	}
}

func IMRowsReturn(rows *sql.Rows) ([]*IRLMoji, error) {
	ims := make([]*IRLMoji, 0)
	for rows.Next() {
		if im, err := ParseIMSQL(rows); err != nil {
			log.Println("Error parsing row result:", err)
			continue
		} else {
			ims = append(ims, im)
		}
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return ims, nil
}

func ParseIMSQL(rows Scannable) (*IRLMoji, error) {
	var im IRLMoji
	err := rows.Scan(
		&im.Id,
		&im.UserId,
		&im.Emoji,
		&im.Picture,
		&im.TimeCreated,
		&im.User.Id,
		&im.User.Username,
		&im.User.Pic,
		&im.User.TwitterAccessToken,
		&im.User.TwitterAccessSecret,
		&im.User.TimeCreated,
		&im.User.TimeUpdated,
	)

	switch {
	case err != nil:
		return nil, err
	default:
		return &im, nil
	}
}

func (db *DB) GetIMWithId(id uint64) (*IRLMoji, error) {
	var im IRLMoji
	err := db.SQLDB.QueryRow(BASE_QUERY+"WHERE I.id = $1", id).Scan(
		&im.Id,
		&im.UserId,
		&im.Emoji,
		&im.Picture,
		&im.TimeCreated,
		&im.User.Id,
		&im.User.Username,
		&im.User.Pic,
		&im.User.TwitterAccessToken,
		&im.User.TwitterAccessSecret,
		&im.User.TimeCreated,
		&im.User.TimeUpdated,
	)
	return IMRowReturn(err, &im)
}

func (db *DB) GetAllIMs(limit uint32) ([]*IRLMoji, error) {
	rows, err := db.SQLDB.Query(BASE_QUERY+`
		ORDER BY I.time_created DESC
        LIMIT $1`,
		limit,
	)
	if err != nil {
		return nil, err
	}
	return IMRowsReturn(rows)
}

func (db *DB) GetIMsForUser(userId string, limit uint32) ([]*IRLMoji, error) {
	rows, err := db.SQLDB.Query(BASE_QUERY+`
        WHERE I.user_id = $1
        ORDER BY I.time_created DESC
        LIMIT $2`,
		userId,
		limit,
	)
	if err != nil {
		return nil, err
	}
	return IMRowsReturn(rows)
}

func (db *DB) GetIMsForEmoji(emoji string, limit uint32) ([]*IRLMoji, error) {
	rows, err := db.SQLDB.Query(BASE_QUERY+`
        WHERE I.emoji = $1
        ORDER BY I.time_created DESC
        LIMIT $2`,
		emoji,
		limit,
	)
	if err != nil {
		return nil, err
	}
	return IMRowsReturn(rows)
}

func (db *DB) InsertIM(userId, emoji, picture string) (im *IRLMoji, err error) {
	im = &IRLMoji{
		UserId:      userId,
		Emoji:       emoji,
		Picture:     picture,
		TimeCreated: time.Now().UTC(),
	}
	err = db.SQLDB.QueryRow(`
        INSERT INTO irlmoji (user_id, emoji, picture, time_created)
        VALUES ($1, $2, $3, $4)
        RETURNING id`,
		im.UserId,
		im.Emoji,
		im.Picture,
		im.TimeCreated,
	).Scan(&im.Id)
	if err != nil {
		return nil, err
	}
	return im, nil
}
