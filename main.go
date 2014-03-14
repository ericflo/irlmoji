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
