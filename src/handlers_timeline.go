package irlmoji

import (
	"github.com/codegangsta/martini"
	"github.com/codegangsta/martini-contrib/render"
	"github.com/ericflo/irlmoji/src/models"
	"log"
)

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
