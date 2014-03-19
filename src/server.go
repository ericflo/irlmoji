package irlmoji

import (
	"github.com/codegangsta/martini"
	"github.com/codegangsta/martini-contrib/binding"
	"github.com/codegangsta/martini-contrib/gzip"
	"github.com/codegangsta/martini-contrib/render"
	"github.com/ericflo/irlmoji/src/models"
	_ "github.com/lib/pq"
	"launchpad.net/goamz/aws"
	"log"
	"os"
)

const DEFAULT_LIMIT uint32 = 50

var IRLMOJI_API_BASIC_USER string
var IRLMOJI_DBURI string
var TWITTER_CONSUMER_KEY string
var TWITTER_CONSUMER_SECRET string
var AWS_S3_BUCKET_NAME string

var AWS_AUTH aws.Auth

func readEnv() {
	IRLMOJI_API_BASIC_USER = os.Getenv("IRLMOJI_API_BASIC_USER")
	IRLMOJI_DBURI = os.Getenv("IRLMOJI_DBURI")
	TWITTER_CONSUMER_KEY = os.Getenv("TWITTER_CONSUMER_KEY")
	TWITTER_CONSUMER_SECRET = os.Getenv("TWITTER_CONSUMER_SECRET")
	AWS_S3_BUCKET_NAME = os.Getenv("AWS_S3_BUCKET_NAME")
}

func createAllTables(db *models.DB) error {
	if err := db.CreateTable("user", &models.User{}); err != nil {
		return err
	}
	if err := db.CreateTable("irlmoji", &models.IRLMoji{}); err != nil {
		return err
	}
	if err := db.CreateTable("heart", &models.Heart{}); err != nil {
		return err
	}
	return nil
}

type Limit struct {
	Limit uint32 `form:"limit"`
}

func (limit Limit) GetLimit() uint32 {
	if limit.Limit == uint32(0) {
		return DEFAULT_LIMIT
	}
	return limit.Limit
}

func JsonErr(err string) map[string]string {
	return map[string]string{"error": err}
}

func JsonErrBinding(err binding.Errors) map[string]interface{} {
	return map[string]interface{}{"error": map[string]interface{}{
		"fields":  err.Fields,
		"overall": err.Overall,
	}}
}

func HandleIndex(r render.Render) {
	r.JSON(200, map[string]string{"hello": "you've reached the irlmoji api"})
}

func HandleNotFound(r render.Render) {
	r.JSON(404, JsonErr("Resource not found."))
}

func Main() {
	// Read in any environment variables we care about
	readEnv()

	var err error

	AWS_AUTH, err = aws.EnvAuth()
	if err != nil {
		panic(err.Error())
	}

	// Open database connection
	db, err := models.OpenDB("postgres", IRLMOJI_DBURI)
	if err != nil {
		log.Fatalf("Error opening database connection: %v", err.Error())
		return
	}
	if err = createAllTables(db); err != nil {
		log.Fatalf("Error creating database table: %v", err.Error())
	}

	// Start setting up martini
	m := martini.Classic()

	// Set up the middleware
	m.Use(gzip.All())
	m.Use(render.Renderer())
	m.Use(BackchannelAuth(IRLMOJI_API_BASIC_USER))

	// Inject the database
	m.Map(db)

	// Map the URL routes
	m.Get("/", HandleIndex)

	// User routes (see handlers_user.go)
	m.Get("/api/v1/users/current.json", HandleGetCurrentUser)
	m.Post("/api/v1/users/twitter.json", binding.Json(models.UserForm{}), HandleCreateUserByTwitter)

	// IRLMoji routes (see handlers_irlmoji.go)
	m.Get("/api/v1/timelines/home.json", binding.Form(Limit{}), HandleGetHomeTimeline)
	m.Get("/api/v1/timelines/user/username/:username.json", binding.Form(Limit{}), HandleGetUserTimeline)
	m.Get("/api/v1/timelines/emoji/:emoji.json", binding.Form(Limit{}), HandleGetEmojiTimeline)
	m.Post("/api/v1/irlmoji.json", binding.Json(models.IRLMoji{}), HandleCreateIRLMoji)
	m.Post("/api/v1/irlmoji/id/:irlmojiId/heart.json", binding.Json(models.Heart{}), HandleToggleHeart)

	m.Post("/upload", HandleUpload)

	m.NotFound(HandleNotFound)

	m.Run()
}
