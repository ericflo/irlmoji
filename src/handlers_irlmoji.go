package irlmoji

import (
	"github.com/codegangsta/martini"
	"github.com/codegangsta/martini-contrib/binding"
	"github.com/codegangsta/martini-contrib/render"
	"github.com/ericflo/irlmoji/src/models"
	"log"
)

func HandleGetHomeTimeline(r render.Render, limit Limit, db *models.DB) {
	timeline, err := db.GetAllIMs(limit.GetLimit())
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
	timeline, err := db.GetIMsForUser(user.Id, limit.GetLimit())
	if err != nil {
		log.Println("Error getting IMs for user", user.Username, err.Error())
		r.JSON(500, JsonErr("Sorry, an internal server error has occurred."))
		return
	}
	r.JSON(200, map[string][]*models.IRLMoji{"timeline": timeline})
}

func HandleCreateIRLMoji(r render.Render, bindErr binding.Errors, im models.IRLMoji, db *models.DB, backchannel Backchannel) {
	if bindErr.Count() > 0 {
		r.JSON(400, JsonErrBinding(bindErr))
		return
	}

	if backchannel.UserId() == "" {
		r.JSON(403, JsonErr("The provided credentials were invalid."))
		return
	}

	user, err := db.GetUserWithId(backchannel.UserId())
	if err != nil {
		r.JSON(403, "Could not find a user with your credentials.")
		return
	}

	// Now let's create that user, shall we?
	insertedIM, err := db.InsertIM(user.Id, im.Emoji, im.Picture)
	if err != nil {
		log.Println("Error creating user:", err.Error())
		r.JSON(500, JsonErr("Sorry, an internal server error has occurred."))
		return
	}

	r.JSON(200, map[string]*models.IRLMoji{"irlmoji": insertedIM})
}
