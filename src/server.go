package irlmoji

import (
	"github.com/codegangsta/martini"
	"github.com/codegangsta/martini-contrib/binding"
	"github.com/codegangsta/martini-contrib/gzip"
	"github.com/codegangsta/martini-contrib/render"
	"github.com/ericflo/irlmoji/src/models"
	_ "github.com/lib/pq"
	"log"
	"net/http"
	"os"
)

const DEFAULT_LIMIT uint32 = 50

var IRLMOJI_API_BASIC_USER string
var IRLMOJI_DBURI string

func readEnv() {
	IRLMOJI_API_BASIC_USER = os.Getenv("IRLMOJI_API_BASIC_USER")
	IRLMOJI_DBURI = os.Getenv("IRLMOJI_DBURI")
}

func createAllTables(db *models.DB) error {
	if err := db.CreateTable("user", &models.User{}); err != nil {
		return err
	}
	if err := db.CreateTable("irlmoji", &models.IRLMoji{}); err != nil {
		return err
	}
	return nil
}

type Limit struct {
	Limit uint32 `form:"limit"`
}

func (limit Limit) Validate(errors *binding.Errors, req *http.Request) {
	if limit.Limit == 0 {
		limit.Limit = DEFAULT_LIMIT
	}
}

func JsonErr(err string) map[string]string {
	return map[string]string{"error": err}
}

func HandleIndex(r render.Render) {
	r.JSON(200, map[string]string{"hello": "you've reached the irlmoji api"})
}

func HandleGetHomeTimeline(r render.Render, limit Limit, db *models.DB) {
	timeline, err := db.GetAllIMs(limit.Limit)
	if err != nil {
		r.JSON(500, JsonErr("Internal error: "+err.Error()))
		return
	}
	r.JSON(200, map[string][]*models.IRLMoji{"timeline": timeline})
}

func HandleGetUserTimeline(r render.Render, limit Limit, params martini.Params, db *models.DB) {
	user, err := db.GetUserWithUsername(params["username"])
	if err != nil {
		r.JSON(404, JsonErr("Username '"+params["username"]+"' not found."))
		return
	}
	timeline, err := db.GetIMsForUser(user.Id, limit.Limit)
	if err != nil {
		log.Println("Error getting IMs for user", user.Username, err.Error())
		r.JSON(500, JsonErr("Sorry, an internal server error has occurred."))
		return
	}
	r.JSON(200, map[string][]*models.IRLMoji{"timeline": timeline})
}

func HandleNotFound(r render.Render) {
	r.JSON(404, JsonErr("Resource not found."))
}

func Main() {
	// Read in any environment variables we care about
	readEnv()

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
	m.Get("/api/v1/timelines/home.json", binding.Form(Limit{}), HandleGetHomeTimeline)
	m.Get("/api/v1/timelines/user/username/:username.json", binding.Form(Limit{}), HandleGetUserTimeline)
	m.NotFound(HandleNotFound)

	m.Run()
}
