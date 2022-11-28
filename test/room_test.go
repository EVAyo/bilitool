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

func TestChannel(t *testing.T) {
	var ch = make(chan int, 10)
	go func() {
		for i := 0; i < 10; i++ {
			ch <- i
		}
	}()
	for i := range ch {
		t.Log(i)
	}
}
