package irlmoji

import (
	"os"
)

func GetenvDefault(key, def string) string {
	resp := os.Getenv(key)
	if resp == "" {
		return def
	}
	return resp
}
