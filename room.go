package bilibili_live_m3u8

import (
	"errors"
	"fmt"
	"github.com/XiaoMiku01/bilibili-live-m3u8/tool"
	"github.com/imroc/req/v3"
	"github.com/tidwall/gjson"
	"io"
	"log"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"time"

	"github.com/XiaoMiku01/bilibili-live-m3u8/parse"
)

type Room struct {
	RoomId   int64
	RealId   int64
	LiveTime int64
	StopFlag bool
	Title    string
	Uname    string
	Cover    string
	M3u8Url  string
	LastTs   int64

	RecordLen     int64
	RecordTime    float32
	withBytesChan bool
	BytesChan     chan []byte
	//Bufio       *bytes.Buffer
	fileIO      *os.File
	withoutFile bool
	StopFuncs   []func(r *Room) bool
}

func NewRoom(roomId int64) *Room {
	return &Room{RoomId: roomId, StopFlag: false, fileIO: nil, withoutFile: false}
}

func (r *Room) Listen() {
	var err error
	if err := r.getRoomInfo(); err != nil {
		log.Printf("%s", err)
		return
	}
	log.Printf("开始监听直播间 %d %s", r.RoomId, r.Uname)
	for {
		if err = r.getLiveTime(); err != nil {
			log.Printf("%s", err)
			continue
		}
		r.StopFlag = false
		r.RecordLen = 0
		r.RecordTime = 0
		if r.withBytesChan {
			r.BytesChan = make(chan []byte, 1024)
		} else {
			r.BytesChan = nil
		}
		if r.LiveTime >= 0 && !r.StopFlag {
			// 直播中
			if err := r.getRoomInfo(); err != nil {
				log.Printf("获取直播间信息失败: %s", err)
				continue
			}
			if err := r.getM3u8Url(); err != nil {
				log.Printf("%s", err)
				continue
			}
			log.Printf("%s 直播间 %d 开始直播, 标题: %s", r.Uname, r.RoomId, r.Title)
			for _, f := range r.StopFuncs {
				go func(f func(r *Room) bool) {
					defer func() {
						if err := recover(); err != nil {
							log.Printf("StopFunc panic: %v", err)
						}
					}()
					for fr := f(r); !fr; fr = f(r) {
						time.Sleep(time.Second)
					}
					r.StopFlag = true
					if r.withBytesChan {
						close(r.BytesChan)
					}
				}(f)
			}
			if r.fileIO == nil && !r.withoutFile {
				timeString := time.Now().Format("2006-01-02 15-04-05")
				dirname := fmt.Sprintf("%d_%s", r.RoomId, r.Uname)
				filename := fmt.Sprintf("%s_%s.ts", timeString, r.Title)
				// 判断文件夹是否存在
				if _, err := os.Stat(dirname); os.IsNotExist(err) {
					// 创建文件夹
					if err := os.Mkdir(dirname, os.ModePerm); err != nil {
						log.Printf("创建文件夹失败: %s", err)
						return
					}
				}
				fileFullPath := filepath.Join(dirname, filename)
				file, err := os.OpenFile(fileFullPath, os.O_CREATE|os.O_RDWR|os.O_APPEND, 0666)
				if err != nil {
					log.Printf("创建文件失败: %s", err)
					return
				}
				r.fileIO = file
			}
			r.LastTs = 0
			if err := r.record(); err != nil {
				if err.Error() != "403" {
					log.Printf("%s", err)
					continue
				}
				//log.Printf("录制失败: %s", err)
				//continue
			}
			log.Printf("%s 直播间 %d 结束直播", r.Uname, r.RoomId)
			if r.fileIO != nil {
				if err := r.fileIO.Close(); err != nil {
					log.Printf("关闭文件失败: %s", err)
				}
				r.fileIO = nil
			}
			close(r.BytesChan)
		} else {
			// 未开播
			//time.Sleep(time.Second * 5)
		}
		time.Sleep(time.Second * 5)
	}
}

func (r *Room) SetStopFunc(fs ...func(r *Room) bool) {
	for _, f := range fs {
		r.StopFuncs = append(r.StopFuncs, f)
	}
}

func (r *Room) SetFileIO(file *os.File) {
	r.fileIO = file
}

//func (r *Room) SetBytesChan(bts *chan []byte, withoutFile bool) {
//	if withoutFile {
//		r.withoutFile = true
//	}
//	r.BytesChan = bts
//}

func (r *Room) WithBytesChan(withoutFile bool) {
	if withoutFile {
		r.withoutFile = true
	}
	r.withBytesChan = true
}

func (r *Room) getRoomInfo() error {
	roomInfo, _ := req.R().Get("https://api.live.bilibili.com/xlive/web-room/v1/index/getInfoByRoom?room_id=" + strconv.Itoa(int(r.RoomId)))
	r.Title = gjson.Get(roomInfo.String(), "data.room_info.title").String()
	r.Cover = gjson.Get(roomInfo.String(), "data.room_info.cover").String()
	r.Uname = gjson.Get(roomInfo.String(), "data.anchor_info.base_info.uname").String()
	if r.Title == "" || r.Cover == "" || r.Uname == "" {
		return errors.New("获取直播间信息失败")
	}
	return nil
}
func (r *Room) getLiveTime() (err error) {
	roomInfo, err := req.R().Get("https://api.live.bilibili.com/xlive/web-room/v1/index/getRoomPlayInfo?room_id=" + strconv.Itoa(int(r.RoomId)))
	if err != nil {
		r.RealId = 0
		r.LiveTime = 0
		return err
	}
	realId := gjson.Get(roomInfo.String(), "data.room_id").Int()
	liveTime := gjson.Get(roomInfo.String(), "data.live_time").Int()
	if liveTime <= 0 && realId != 0 {
		r.RealId = realId
		r.LiveTime = -1
		return nil
	} else if liveTime == 0 && realId == 0 {
		r.RealId = 0
		r.LiveTime = 0
		return errors.New(roomInfo.String())
	}
	r.RealId = realId
	r.LiveTime = liveTime
	return nil
}

func (r *Room) getM3u8Url() error {
	var (
		m3u8Url string
		err     error
	)
	streamInfo, err := req.R().SetQueryParams(
		map[string]string{
			"room_id":  strconv.Itoa(int(r.RealId)),
			"qn":       "10000",
			"platform": "web",
			"codec":    "0,1",
			"protocol": "0,1",
			"format":   "0,1,2",
			"ptype":    "8",
			"dolby":    "5",
		},
	).Get("https://api.live.bilibili.com/xlive/web-room/v2/index/getRoomPlayInfo")
	if err != nil {
		return err
	}
	baseUrlPath := "data.playurl_info.playurl.stream.1.format.0.codec.0"
	baseUrl := gjson.Get(streamInfo.String(), baseUrlPath+".base_url").String()
	host := gjson.Get(streamInfo.String(), baseUrlPath+".url_info.0.host").String()
	params := gjson.Get(streamInfo.String(), baseUrlPath+".url_info.0.extra").String()
	if baseUrl == "" || host == "" || params == "" {
		return errors.New("获取直播流地址失败")
	}
	m3u8Url = host + baseUrl + params
	r.M3u8Url = m3u8Url
	return nil
}

func (r *Room) record() error {
	syncByte := uint8(71)
	re := regexp.MustCompile(`/(\d+).ts`)
	var err error
	go func() {
		for {
			if r.LiveTime <= 0 && !r.StopFlag {
				break
			}
			if err = r.getM3u8Url(); err != nil {
				log.Printf("获取直播流地址失败: %s", err)
				if err = r.getLiveTime(); err != nil {
					log.Printf("获取直播状态失败: %s", err)
					continue
				}
				continue
			}
			time.Sleep(time.Second * 30)
		}
		//log.Printf("%s 直播间 %d 结束直播", r.Uname, r.RoomId)
	}()
	for r.LiveTime > 0 && !r.StopFlag {
		m3u8Result, err := parse.FromURL(r.M3u8Url)
		if err != nil {
			log.Printf("获取直播流失败: %s", err)
			return err
		}
		for _, seg := range m3u8Result.M3u8.Segments {
			timeStampString := re.FindStringSubmatch(seg.URI)[1]
			timeStamp, _ := strconv.ParseInt(timeStampString, 10, 64)
			if timeStamp <= r.LastTs {
				continue
			}
			r.LastTs = timeStamp
			body, err := tool.Get(tool.ResolveURL(m3u8Result.URL, seg.URI))
			if err != nil {
				return err
			}
			bytesAll, err := io.ReadAll(body)
			if err != nil {
				return fmt.Errorf("read bytes: %s, %s", bytesAll, err.Error())
			}
			bLen := len(bytesAll)
			for j := 0; j < bLen; j++ {
				if bytesAll[j] == syncByte {
					bytesAll = bytesAll[j:]
					break
				}
			}
			var n int
			if r.fileIO != nil {
				n, _ = r.fileIO.Write(bytesAll)
			}
			if r.BytesChan != nil {
				r.BytesChan <- bytesAll
				n = len(bytesAll)
			}
			r.RecordLen += int64(n)
			r.RecordTime += seg.Duration
			//log.Println(i, seg.URI, timeStamp)
			fmt.Printf("\r%s 直播间 %d 正在直播, 已录制 %.5f MB (%s) \t", r.Uname, r.RoomId, float64(r.RecordLen)/1024/1024, tool.FmtDuration(time.Second*time.Duration(r.RecordTime)))
		}
	}
	return nil
}
