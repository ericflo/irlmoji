package models

import (
	"database/sql"
	"log"
	"time"
)

type Heart struct {
	UserId      string    `json:"userId"`
	IRLMojiId   uint64    `json:"irlmojiId" binding:"required"`
	TimeCreated time.Time `json:"timeCreated"`
	User        User      `json:"user"`
}

func (h *Heart) CreateTableSQL() string {
	// TODO: Foreign key constraints
	return `
    CREATE TABLE heart (
        user_id TEXT NOT NULL,
        irlmoji_id BIGINT NOT NULL,
        time_created timestamp NOT NULL,
        FOREIGN KEY (user_id) REFERENCES auth_user(id),
        FOREIGN KEY (irlmoji_id) REFERENCES irlmoji(id),
        UNIQUE (user_id, irlmoji_id)
    );
    `
}

const BASE_HEART_QUERY string = `
SELECT
	H.user_id,
    H.irlmoji_id,
    H.time_created,
    U.id,
    U.username,
    U.pic,
    U.twitter_access_token,
    U.twitter_access_secret,
    U.time_created,
    U.time_updated
FROM heart H
LEFT OUTER JOIN auth_user U
     ON (H.user_id = U.id)
`

// DATABASE ACCESS STUFF

func HeartRowReturn(err error, heart *Heart) (*Heart, error) {
	switch {
	case err == sql.ErrNoRows:
		return nil, nil
	case err != nil:
		return nil, err
	default:
		heart.User.IsAdmin = heart.User.GetIsAdmin()
		return heart, nil
	}
}

func HeartRowsReturn(rows *sql.Rows) ([]*Heart, error) {
	hearts := make([]*Heart, 0)
	for rows.Next() {
		if heart, err := ParseHeartSQL(rows); err != nil {
			log.Println("Error parsing row result:", err)
			continue
		} else {
			hearts = append(hearts, heart)
		}
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return hearts, nil
}

func ParseHeartSQL(rows Scannable) (*Heart, error) {
	var heart Heart
	err := rows.Scan(
		&heart.UserId,
		&heart.IRLMojiId,
		&heart.TimeCreated,
		&heart.User.Id,
		&heart.User.Username,
		&heart.User.Pic,
		&heart.User.TwitterAccessToken,
		&heart.User.TwitterAccessSecret,
		&heart.User.TimeCreated,
		&heart.User.TimeUpdated,
	)

	switch {
	case err != nil:
		return nil, err
	default:
		heart.User.IsAdmin = heart.User.GetIsAdmin()
		return &heart, nil
	}
}

func (db *DB) GetHeart(userId string, imId uint64) (*Heart, error) {
	var heart Heart
	err := db.SQLDB.QueryRow(`
        SELECT user_id, irlmoji_id, time_created
        FROM heart WHERE user_id = $1 AND irlmoji_id = $2`,
		userId,
		imId,
	).Scan(
		&heart.UserId,
		&heart.IRLMojiId,
		&heart.TimeCreated,
	)
	return HeartRowReturn(err, &heart)
}

func (db *DB) CreateHeart(userId string, imId uint64) (*Heart, error) {
	t := time.Now().UTC()
	heart := Heart{
		UserId:      userId,
		IRLMojiId:   imId,
		TimeCreated: t,
	}
	_, err := db.SQLDB.Exec(`
        INSERT INTO heart(user_id, irlmoji_id, time_created)
        VALUES ($1, $2, $3)`,
		heart.UserId,
		heart.IRLMojiId,
		heart.TimeCreated,
	)
	if err != nil {
		return nil, err
	}
	return &heart, nil
}

func (db *DB) DeleteHeart(userId string, imId uint64) error {
	_, err := db.SQLDB.Exec(`
        DELETE FROM heart WHERE user_id = $1 AND irlmoji_id = $2`,
		userId,
		imId,
	)
	return err
}

func (db *DB) ToggleHeart(userId string, imId uint64) (*Heart, error) {
	// TODO: Do this in a transaction
	heart, err := db.GetHeart(userId, imId)
	if err != nil {
		return nil, err
	}
	if heart == nil {
		return db.CreateHeart(userId, imId)
	}
	return nil, db.DeleteHeart(userId, imId)
}

func (db *DB) AnnotateHearted(im *IRLMoji, userId string) error {
	if userId == "" {
		return nil
	}
	heart, err := db.GetHeart(userId, im.Id)
	if err != nil {
		return err
	}
	im.Hearted = heart != nil
	return nil
}

func (db *DB) GetHeartsForIRLMoji(irlmojiId uint64, limit uint32) ([]*Heart, error) {
	rows, err := db.SQLDB.Query(BASE_HEART_QUERY+`
        WHERE H.irlmoji_id = $1
        ORDER BY H.time_created DESC
        LIMIT $2`,
		irlmojiId,
		limit,
	)
	if err != nil {
		return nil, err
	}
	return HeartRowsReturn(rows)
}
