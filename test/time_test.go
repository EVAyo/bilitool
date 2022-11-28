package test

import (
	"github.com/XiaoMiku01/bilibili-live-m3u8/tool"
	"log"
	"testing"
	"time"
)

func TestTime(t *testing.T) {
	time.Since(time.Now())
	log.Println(tool.FmtDuration(time.Second * time.Duration(float32(60))))
}
