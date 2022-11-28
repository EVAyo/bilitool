package main

import (
	"github.com/XiaoMiku01/bilibili-live-m3u8"
	"gopkg.in/alecthomas/kingpin.v2"
)

func main() {
	var roomId = kingpin.Flag("r", "房间号").Short('r').Required().Int64()
	kingpin.Parse()
	room := bilibili_live_m3u8.NewRoom(*roomId)
	//room.SetStopFunc(func(r *bilibili_live_m3u8.Room) bool {
	//	//time.Sleep(10 * time.Second)
	//	if r.RecordLen >= 50*1024*1024 {
	//		return true
	//	}
	//	return false
	//})
	//file, _ := os.Create("test.ts")
	//room.SetFileIO(file)
	//btsChan := make(chan []byte, 1024)
	//room.SetBytesChan(&btsChan, true)
	room.Listen()
	//n := 0
	//for bt := range btsChan {
	//	n += len(bt)
	//	//fmt.Printf("\r %.5f MB", float64(n)/1024/1024)
	//}

}
