package main

import (
	"encoding/json"
	"github.com/ericflo/irlmoji/src"
	"io/ioutil"
	"log"
	"os"
)

const ENV_WARNING string = ("WARNING: Could not read env.json file, so unless " +
	"you've set the environment variables manually, the app will not work.")

// Reads env.json, which should contain a single JSON object, and adds all the
// key/value pairs from that object into the environment as environment
// variables.  Ideally this would be done by something like envdir, but this is
// a bit easier.
func readEnv() {
	file, err := ioutil.ReadFile("./env.json")
	if err != nil {
		log.Println(err.Error())
		log.Println(ENV_WARNING)
		return
	}
	var env map[string]string
	if err = json.Unmarshal(file, &env); err != nil {
		log.Println(err.Error())
		log.Println(ENV_WARNING)
		return
	}
	for key, value := range env {
		if err = os.Setenv(key, value); err != nil {
			log.Println("WARNING: Could not set environment variable", key,
				"to", value)
		}
	}
}

func main() {
	readEnv()
	irlmoji.Main()
}
