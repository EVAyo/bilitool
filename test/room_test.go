package test

import (
	bilibililivem3u8 "github.com/XiaoMiku01/bilibili-live-m3u8"
	"testing"
	"time"
)

func TestRoom(t *testing.T) {
	room := bilibililivem3u8.NewRoom(23141761)
	go room.Listen()
	select {
	case <-time.After(time.Second * 30):

	}
}
