package irlmoji

import (
	"bytes"
	"code.google.com/p/go-uuid/uuid"
	_ "code.google.com/p/vp8-go/webp"
	"fmt"
	"github.com/codegangsta/martini-contrib/render"
	"github.com/ericflo/irlmoji/src/models"
	"github.com/nfnt/resize"
	"image"
	_ "image/gif"
	"image/jpeg"
	_ "image/png"
	"io/ioutil"
	"launchpad.net/goamz/aws"
	"launchpad.net/goamz/s3"
	"log"
	"mime/multipart"
	"net/http"
)

var THUMBNAIL_SIZES []int = []int{1000, 500, 200, 100, 50}

func generateThumbnails(file multipart.File, userId, pathPrefix string, bucket *s3.Bucket) error {
	file.Seek(0, 0)

	img, _, err := image.Decode(file)
	if err != nil {
		log.Println("Error decoding image", err)
		return err
	}

	var buf bytes.Buffer
	for _, i := range THUMBNAIL_SIZES {
		resized := resize.Resize(uint(i), 0, img, resize.Lanczos3)
		err = jpeg.Encode(&buf, resized, nil)
		if err != nil {
			return err
		}
		path := fmt.Sprintf("%s/%d.jpg", pathPrefix, i)
		err = bucket.Put(path, buf.Bytes(), "image/jpeg", s3.PublicRead)
		if err != nil {
			return err
		}
		buf.Reset()
	}

	return err
}

func HandleUpload(r render.Render, w http.ResponseWriter, req *http.Request, backchannel Backchannel, db *models.DB) {
	file, header, err := req.FormFile("file")
	defer file.Close()

	if err != nil {
		fmt.Fprintln(w, err)
		return
	}

	data, err := ioutil.ReadAll(file)
	if err != nil {
		fmt.Fprintln(w, err)
		return
	}

	s := s3.New(AWS_AUTH, aws.USEast)
	bucket := s.Bucket(AWS_S3_BUCKET_NAME)
	mimetype := header.Header.Get("Content-Type")
	imageId := uuid.New()

	// Upload the original
	path := fmt.Sprintf("uploads/original/%s/%s/%s", backchannel.UserId(),
		imageId, header.Filename)
	err = bucket.Put(path, data, mimetype, s3.PublicRead)
	if err != nil {
		fmt.Fprintln(w, err)
		return
	}

	// Now resize and upload those
	pathPrefix := fmt.Sprintf("uploads/resized/%s/%s", backchannel.UserId(),
		imageId)
	err = generateThumbnails(file, backchannel.UserId(), pathPrefix, bucket)
	if err != nil {
		fmt.Fprintln(w, err)
		return
	}

	r.JSON(200, map[string]string{"path": path})
}
