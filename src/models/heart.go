package models

import (
	"database/sql"
	"time"
)

type Heart struct {
	UserId      string    `json:"userId"`
	IRLMojiId   uint64    `json:"irlmojiId" binding:"required"`
	TimeCreated time.Time `json:"timeCreated"`
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

// DATABASE ACCESS STUFF

func HeartRowReturn(err error, heart *Heart) (*Heart, error) {
	switch {
	case err == sql.ErrNoRows:
		return nil, nil
	case err != nil:
		return nil, err
	default:
		return heart, nil
	}
}

// TODO: The rest

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
