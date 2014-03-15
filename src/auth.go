package irlmoji

import (
	"crypto/subtle"
	"encoding/base64"
	"github.com/codegangsta/martini"
	"github.com/codegangsta/martini-contrib/render"
	"log"
	"net/http"
	"strings"
)

const AUTH_MESSAGE string = "You must provide authorization."

type Backchannel interface {
	UserId() string
	GuestId() string
}

type BackchannelUser struct {
	Uid string
	Gid string
}

func (bu BackchannelUser) UserId() string {
	return bu.Uid
}

func (bu BackchannelUser) GuestId() string {
	return bu.Gid
}

func SecureCompare(given, actual string) bool {
	if subtle.ConstantTimeEq(int32(len(given)), int32(len(actual))) == 1 {
		return subtle.ConstantTimeCompare([]byte(given), []byte(actual)) == 1
	} else {
		// Securely compare actual to itself to keep constant time,
		// but always return false
		return subtle.ConstantTimeCompare([]byte(actual), []byte(actual)) == 1 && false
	}
}

func BackchannelAuth(basicUsername string) martini.Handler {
	return func(r render.Render, req *http.Request, res http.ResponseWriter, c martini.Context) {
		auth := req.Header.Get("Authorization")
		if auth == "" || len(auth) < 6 {
			res.Header().Set(
				"WWW-Authenticate",
				"Basic realm=\""+AUTH_MESSAGE+"\"",
			)
			r.JSON(401, JsonErr(AUTH_MESSAGE))
			return
		}
		auth = auth[6:]
		data, err := base64.StdEncoding.DecodeString(auth)
		if err != nil {
			log.Println("Error decoding auth string:", err.Error())
			r.JSON(400, JsonErr("The provided auth header was invalid."))
			return
		}
		authParts := strings.Split(string(data), ":")
		if len(authParts) != 2 {
			log.Println("Error splitting auth string:", err.Error())
			r.JSON(400, JsonErr("The provided auth header was invalid."))
			return
		}
		userParts := strings.Split(authParts[1], "_")
		if len(userParts) != 2 {
			log.Println("WARNING: Correct basic auth user but wrong pass:",
				auth)
			r.JSON(400, JsonErr("The provided auth header was invalid."))
			return
		}
		if !SecureCompare(authParts[0], IRLMOJI_API_BASIC_USER) {
			log.Println("Invalid basic auth user attempt:", authParts[0])
			r.JSON(403, JsonErr("The provided credentials were invalid."))
			return
		}
		var userId string
		if userParts[0] != "0" {
			userId = userParts[0]
		}
		backchannel := BackchannelUser{Uid: userId, Gid: userParts[1]}
		c.MapTo(&backchannel, (*Backchannel)(nil))
	}
}
