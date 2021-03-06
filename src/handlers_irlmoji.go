package irlmoji

import (
	"github.com/codegangsta/martini"
	"github.com/codegangsta/martini-contrib/binding"
	"github.com/codegangsta/martini-contrib/render"
	"github.com/ericflo/irlmoji/src/models"
	"log"
	"strconv"
)

func hasMoreTimeline(limit Limit, timeline []*models.IRLMoji) (bool, []*models.IRLMoji) {
	if len(timeline) <= int(limit.GetLimit()) {
		return false, timeline
	}
	hasMore := len(timeline) == int(limit.GetLimit())+1
	return hasMore, timeline[:limit.GetLimit()]
}

func HandleGetHomeTimeline(r render.Render, limit Limit, db *models.DB, backchannel Backchannel) {
	timeline, err := db.GetAllIMs(limit.GetLimit() + uint32(1))
	if err != nil {
		r.JSON(500, JsonErr("Internal error: "+err.Error()))
		return
	}
	for _, im := range timeline {
		err = db.AnnotateHearted(im, backchannel.UserId())
		if err != nil {
			log.Println("Error annotating hearted info:", err.Error())
			r.JSON(500, "Sorry, an internal server error has occurred.")
			return
		}
	}
	hasMore, timeline := hasMoreTimeline(limit, timeline)
	r.JSON(200, map[string]interface{}{
		"timeline": timeline,
		"hasMore":  hasMore,
	})
}

func HandleGetUserTimeline(r render.Render, limit Limit, params martini.Params, db *models.DB, backchannel Backchannel) {
	user, err := db.GetUserWithUsername(params["username"])
	if err != nil {
		r.JSON(404, JsonErr("Username '"+params["username"]+"' not found."))
		return
	}
	timeline, err := db.GetIMsForUser(user.Id, limit.GetLimit()+uint32(1))
	if err != nil {
		log.Println("Error getting IMs for user", user.Username, err.Error())
		r.JSON(500, JsonErr("Sorry, an internal server error has occurred."))
		return
	}
	for _, im := range timeline {
		err = db.AnnotateHearted(im, backchannel.UserId())
		if err != nil {
			log.Println("Error annotating hearted info:", err.Error())
			r.JSON(500, "Sorry, an internal server error has occurred.")
			return
		}
	}
	hasMore, timeline := hasMoreTimeline(limit, timeline)
	r.JSON(200, map[string]interface{}{
		"timeline": timeline,
		"hasMore":  hasMore,
	})
}

func HandleGetEmojiTimeline(r render.Render, limit Limit, params martini.Params, db *models.DB, backchannel Backchannel) {
	timeline, err := db.GetIMsForEmoji(params["emoji"], limit.GetLimit()+uint32(1))
	if err != nil {
		log.Println("Error getting IMs for emoji", params["emoji"], err.Error())
		r.JSON(500, JsonErr("Sorry, an internal server error has occurred."))
		return
	}
	for _, im := range timeline {
		err = db.AnnotateHearted(im, backchannel.UserId())
		if err != nil {
			log.Println("Error annotating hearted info:", err.Error())
			r.JSON(500, "Sorry, an internal server error has occurred.")
			return
		}
	}
	hasMore, timeline := hasMoreTimeline(limit, timeline)
	r.JSON(200, map[string]interface{}{
		"timeline": timeline,
		"hasMore":  hasMore,
	})
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

func HandleGetIRLMoji(r render.Render, db *models.DB, params martini.Params, backchannel Backchannel, limit Limit) {
	irlmojiId, err := strconv.ParseUint(params["irlmojiId"], 10, 64)
	if err != nil {
		r.JSON(404, JsonErr("Invalid IRLMoji id provided:"+
			params["irlmojiId"]))
	}
	im, err := db.GetIMWithId(irlmojiId)
	if err != nil {
		r.JSON(404, JsonErr("The provided IRLMoji id was invalid:"+
			params["irlmojiId"]))
		return
	}
	hearts, err := db.GetHeartsForIRLMoji(irlmojiId, limit.GetLimit())
	if err == nil {
		im.Hearts = hearts
	} else {
		log.Println("WARNING: Could not get IRLMoji hearts:", err.Error())
	}
	err = db.AnnotateHearted(im, backchannel.UserId())
	if err != nil {
		log.Println("Error annotating hearted info:", err.Error())
		r.JSON(500, "Sorry, an internal server error has occurred.")
		return
	}
	r.JSON(200, map[string]*models.IRLMoji{"irlmoji": im})
}

func HandleDeleteIRLMoji(r render.Render, db *models.DB, params martini.Params, backchannel Backchannel) {
	if backchannel.UserId() == "" {
		r.JSON(403, JsonErr("The provided credentials were invalid."))
		return
	}

	user, err := db.GetUserWithId(backchannel.UserId())
	if err != nil {
		r.JSON(403, "Could not find a user with your credentials.")
		return
	}

	irlmojiId, err := strconv.ParseUint(params["irlmojiId"], 10, 64)
	if err != nil {
		r.JSON(404, JsonErr("Invalid IRLMoji id provided:"+
			params["irlmojiId"]))
	}

	im, err := db.GetIMWithId(irlmojiId)
	if err != nil {
		r.JSON(404, JsonErr("The provided IRLMoji id was invalid."))
		return
	}

	if im.UserId != user.Id && !user.IsAdmin {
		r.JSON(403, "You are not allowed to delete that IRLMoji.")
		return
	}

	err = db.DeleteIMWithId(im.Id)
	if err != nil {
		log.Println("Error deleting IRLMoji:", err.Error())
		r.JSON(500, JsonErr("There was an error deleting that IRLMoji."))
	}
	r.JSON(200, map[string]string{"status": "ok"})
}

func HandleToggleHeart(r render.Render, bindErr binding.Errors, heart models.Heart, db *models.DB, backchannel Backchannel) {
	if bindErr.Count() > 0 {
		r.JSON(400, JsonErrBinding(bindErr))
		return
	}

	if backchannel.UserId() == "" {
		r.JSON(403, JsonErr("The provided credentials were invalid."))
		return
	}

	im, err := db.GetIMWithId(heart.IRLMojiId)
	if err != nil {
		r.JSON(404, JsonErr("The provided IRLMoji id was invalid."))
		return
	}

	user, err := db.GetUserWithId(backchannel.UserId())
	if err != nil {
		r.JSON(403, "Could not find a user with your credentials.")
		return
	}

	_, err = db.ToggleHeart(user.Id, im.Id)
	if err != nil {
		log.Println("Error toggling heart:", err.Error())
		r.JSON(500, "Sorry, an internal server error has occurred.")
	}

	im, err = db.GetIMWithId(heart.IRLMojiId)
	if err != nil {
		log.Println("Error getting IRLMoji after toggling heart:", err.Error())
		r.JSON(500, "Sorry, an internal server error has occurred.")
		return
	}

	err = db.AnnotateHearted(im, user.Id)
	if err != nil {
		log.Println("Error annotating hearted info:", err.Error())
		r.JSON(500, "Sorry, an internal server error has occurred.")
		return
	}

	r.JSON(200, map[string]*models.IRLMoji{"irlmoji": im})
}
