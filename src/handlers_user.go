package irlmoji

import (
	"github.com/codegangsta/martini-contrib/binding"
	"github.com/codegangsta/martini-contrib/render"
	"github.com/ericflo/irlmoji/src/models"
	"github.com/kurrik/oauth1a"
	"github.com/kurrik/twittergo"
	"log"
	"net/http"
)

func HandleGetCurrentUser(r render.Render, backchannel Backchannel, db *models.DB) {
	if backchannel.UserId() == "" {
		r.JSON(200, map[string]*models.User{"user": nil})
		return
	}
	if user, err := db.GetUserWithId(backchannel.UserId()); err == nil {
		r.JSON(200, map[string]*models.User{"user": user})
	} else {
		log.Println("Error getting current user:", err.Error())
		r.JSON(500, JsonErr("Sorry, an internal server error has occurred."))
	}
}

func HandleCreateUserByTwitter(r render.Render, bindErr binding.Errors, userForm models.UserForm, db *models.DB) {
	if bindErr.Count() > 0 {
		r.JSON(400, JsonErrBinding(bindErr))
		return
	}

	// Build Twitter client
	config := &oauth1a.ClientConfig{
		ConsumerKey:    TWITTER_CONSUMER_KEY,
		ConsumerSecret: TWITTER_CONSUMER_SECRET,
	}
	oauthUser := oauth1a.NewAuthorizedConfig(userForm.TwitterAccessToken,
		userForm.TwitterAccessSecret)
	client := twittergo.NewClient(config, oauthUser)

	// Build request to send to Twitter
	req, err := http.NewRequest("GET", "/1.1/account/verify_credentials.json", nil)
	if err != nil {
		log.Println("Could not build request for Twitter:", err.Error())
		r.JSON(500, JsonErr("Sorry, an internal server error has occurred."))
	}

	// Send it
	resp, err := client.SendRequest(req)
	if err != nil {
		log.Println("Error sending request to Twitter:", err.Error())
		r.JSON(504, JsonErr("Could not communicate properly with Twitter, "+
			"please try again soon."))
		return
	}

	// Parse the response
	var result = &twittergo.User{}
	if err = resp.Parse(result); err != nil {
		log.Println("Error parsing Twitter result:", err.Error(), "Response:",
			resp)
		r.JSON(504, JsonErr("Got a bad response from Twitter, please try "+
			"again soon."))
		return
	}

	user, err := db.GetUserWithId(result.IdStr())
	if err == nil {
		r.JSON(200, map[string]*models.User{"user": user})
		return
	}

	// Now let's create that user, shall we?
	user, err = db.CreateUser(
		result.IdStr(),
		result.ScreenName(),
		(*result)["profile_image_url"].(string),
		userForm.TwitterAccessToken,
		userForm.TwitterAccessSecret,
	)
	if err != nil {
		log.Println("Error creating user:", err.Error())
		r.JSON(500, JsonErr("Sorry, an internal server error has occurred."))
		return
	}

	r.JSON(200, map[string]*models.User{"user": user})
}
