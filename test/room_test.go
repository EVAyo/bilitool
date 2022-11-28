package test

import (
	bilibililivem3u8 "github.com/XiaoMiku01/bilibili-live-m3u8"
	"log"
	"testing"
	"time"
)

func TestRoom(t *testing.T) {
	room := bilibililivem3u8.NewRoom(21696950)
	go room.Listen()
	select {
	case <-time.After(time.Second * 30):

	}
}

func TestChannel(t *testing.T) {
	room := bilibililivem3u8.NewRoomWithBytesChan(5424)
	room.WithBytesChan(true)
	go room.Listen()
	go func() {
		room.BytesChan = make(chan []byte, 1024)
		room.SetStopFunc(func(r *bilibililivem3u8.Room) bool {
			if r.RecordLen >= 10*1024*1024 {
				return true
			}
			return false
		})
		for room.LiveTime >= 0 {
			//log.Println(len(room.BytesChan))
			data, ok := <-room.BytesChan
			log.Println(ok, len(data))
			if !ok {
				break
			}
			t.Log(len(data))
		}
		log.Println("end")
	}()
	select {
	case <-time.After(time.Second * 30):

	}
}
