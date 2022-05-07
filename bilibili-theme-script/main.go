package main

import (
	"encoding/json"
	"fmt"
	qrcodeTerminal "github.com/Baozisoftware/qrcode-terminal-go"
	"io"
	"io/ioutil"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"
)

var flags bool

func main() {
	flags = true
	var (
		data    []byte
		s       LoginStatus
		msg     CheckLoginStatusResp
		account TureLogin
		itemId  string
		num     string
		item    ItemPropertiesResp
	)
	file, err2 := readCookiesFromFile()
	var cookies, crsf string
	if os.IsNotExist(err2) {
		println("不存在cookies信息，进行扫码登录")
		response, err := http.Get("https://passport.bilibili.com/qrcode/getLoginUrl")
		if err != nil {
			println("网络未连接或请求错误")
		}
		data = readAllByte(response)
		if json.Unmarshal(data, &s) != nil {
			println(" api json格式解析错误")
			pause()
		}
		qrcodeTerminal.New2(qrcodeTerminal.ConsoleColors.BrightBlack, qrcodeTerminal.ConsoleColors.BrightWhite, qrcodeTerminal.QRCodeRecoveryLevels.Low).Get(s.Data.Url).Print()
		for !checkLoginStatus(s, &msg) {
			time.Sleep(time.Duration(500) * time.Millisecond)
		}
		println("登录成功")
		marshal, _ := json.Marshal(msg)
		_ = json.Unmarshal(marshal, &account)
		account.Data.Url = account.Data.Url[strings.Index(account.Data.Url, "?")+1:]
		cookies = FormDataToCookies(account.Data.Url)
		if writeCookiesToFile(cookies) != nil {
			println("写入cookies失败")
			pause()
			return
		}
		crsf = getCrsf(cookies)
	} else {
		cookies = file
		crsf = getCrsf(cookies)
	}
	println("b站用户" + getPersonInfo(cookies).Data.Uname + "已登录")
s:
	println("请输入商品编号")
	_, _ = fmt.Scanf("%s\n", &itemId)
	println("请输入购买数量")
	_, _ = fmt.Scanf("%s\n", &num)
	resp, _ := http.Get("https://api.bilibili.com/x/garb/mall/item/suit/v2?item_id=" + itemId + "&part=suit")
	_ = json.Unmarshal(readAllByte(resp), &item)
	if item.Data.Item.ItemId == 0 {
		println("商品不存在")
		goto s
	}
	_ = json.Unmarshal(readAllByte(resp), &item)
	parseInt, _ := strconv.ParseInt(item.Data.Item.Properties.SaleTimeBegin, 10, 64)
	format := time.Unix(parseInt, 0).Format("2006-01-02 15:04:05")
	println(item.Data.Item.Name + "商品开售时间：" + format)
	if time.Now().Unix()-parseInt < 0 {
		println("商品还未发售，正在等待中....")
	}
	for time.Now().Unix()-parseInt < 0 {
		fmt.Printf("\r还有%d秒开始抢购...", parseInt-time.Now().Unix())
		time.Sleep(time.Duration(10) * time.Millisecond)
	}
	for i := 0; i < 10; i++ {
		go catchGrab(itemId, crsf, cookies, num)
	}
	pause()
}

func catchGrab(itemId string, crsf string, cookies string, num string) {
	failCount := 0
	var ord orderResp
	for flags {
		data := make([]byte, 256)
		data = catch(itemId, crsf, cookies, num)
		_ = json.Unmarshal(data, &ord)
		println(string(data))
		if ord.Code == 0 {
			pay(ord.Data.PayData, cookies)
			confirm(ord.Data.OrderId, crsf, cookies)
			break
		}
		if ord.Code == 26125 {
			println("请先充值b币")
			flags = false
			pause()
			os.Exit(0)
		}
		if ord.Code == -412 {
			println("你的ip被封禁了！")
			flags = false
			pause()
			os.Exit(0)
		}
		if ord.Code == 26021 {
			println("该商品已达购买数量上限，不支持继续购买")
			flags = false
			pause()
			os.Exit(0)
		}
		if ord.Code == 26105{
			println("该商品已售罄，看看其他商品吧~")
			flags = false
			pause()
			os.Exit(0)
		}
		failCount++
		if failCount == 10 {
			time.Sleep(time.Duration(200) * time.Millisecond)
		}
		time.Sleep(time.Duration(100) * time.Millisecond)
	}
}

func pay(data string, cookies string) {
	var (
		req payReq
		res payBpReq
	)
	c := &http.Client{}
	request, _ := http.NewRequest("POST", "https://pay.bilibili.com/payplatform/pay/pay", strings.NewReader(toPayParam(data)))
	request.Header.Add("content-type", "application/json")
	request.Header.Add("cookie", cookies)
	do, _ := c.Do(request)
	_ = json.Unmarshal(readAllByte(do), &req)
	bpRequest, _ := http.NewRequest("POST", "https://pay.bilibili.com/paywallet/pay/payBp", strings.NewReader(req.Data.PayChannelParam))
	bpRequest.Header.Add("content-type", "application/json")
	bpRequest.Header.Add("cookie", cookies)
	response, _ := c.Do(bpRequest)
	_ = json.Unmarshal(readAllByte(response), &res)
	if res.Success {
		flags = false
		println("购买成功！！！")
	}
	println(string(readAllByte(response)))
}

func toPayParam(data string) string {
	var s payParam
	_ = json.Unmarshal([]byte(data), &s)
	s.AccessKey = "7830d79d1390587a9ef7a282407c1611"
	s.AppName = "tv.danmaku.bili"
	s.AppVersion = 6580300
	s.SdkVersion = "1.4.9"
	s.RealChannel = "bp"
	s.PayChannelId = 99
	s.PayChannel = "bp"
	s.Network = "wifi"
	s.Device = "ANDROID"
	marshal, _ := json.Marshal(s)
	return string(marshal)
}

func confirm(id string, crsf string, cookies string) {
	values := url.Values{}
	values.Add("csrf", crsf)
	values.Add("order_id", id)
	request, err := http.NewRequest("POST", "https://api.bilibili.com/x/garb/trade/confirm", strings.NewReader(values.Encode()))
	if err != nil {
		println("出现错误")
	}
	c := &http.Client{}
	request.Header.Add("content-type", "application/x-www-form-urlencoded")
	request.Header.Add("cookie", cookies)
	request.Header.Add("x-crsf-token", crsf)
	do, _ := c.Do(request)
	println("confirm:" + string(readAllByte(do)))
}
func pause() {
	var s string
	_, _ = fmt.Scan(&s)
	if s == "exit" {
	} else {
		pause()
	}
}

func FormDataToCookies(u string) string {
	return strings.ReplaceAll(u, "&", ";")
}

func getCrsf(u string) string {
	split := strings.Split(u, ";")
	for i := range split {
		if strings.Contains(split[i], "bili_jct") {
			return split[i][strings.Index(split[i], "=")+1:]
		}
	}
	return ""
}

func writeCookiesToFile(cookies string) error {
	_, err := os.Create("cookies.txt")
	if err != nil {
		return err
	}
	err = ioutil.WriteFile("cookies.txt", []byte(cookies), 0666)
	if err != nil {
		return err
	}
	return nil
}
func getPersonInfo(cookies string) personalInfo {
	c := &http.Client{}
	request, _ := http.NewRequest("GET", "https://api.bilibili.com/x/web-interface/nav", nil)
	request.Header.Add("cookie", cookies)
	do, _ := c.Do(request)
	allByte := readAllByte(do)
	var s personalInfo
	json.Unmarshal(allByte, &s)
	return s
}
func readCookiesFromFile() (string, error) {
	file, err := ioutil.ReadFile("cookies.txt")
	if err != nil {
		return "", err
	}
	return string(file), nil
}

func catch(itemId string, crsf string, cookis string, num string) []byte {
	data := make([]byte, 0)
	client := &http.Client{}
	values := url.Values{}
	values.Add("item_id", itemId)
	values.Add("platform", "android")
	values.Add("currency", "bp")
	values.Add("add_month", "-1")
	values.Add("buy_num", num)
	values.Add("coupon_token", "")
	values.Add("hasBiliapp", "true")
	values.Add("csrf", crsf)
	request, _ := http.NewRequest("POST", "https://api.bilibili.com/x/garb/trade/create", strings.NewReader(values.Encode()))
	request.Header.Add("content-type", "application/x-www-form-urlencoded")
	request.Header.Add("cookie", cookis)
	request.Header.Add("x-crsf-token", crsf)
	//request.Header.Add("user-agent", "Mozilla/5.0 (Linux; Android 7.1.2; M2006J10C Build/N6F26Q; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/81.0.4044.117 Mobile Safari/537.36 os/android model/M2006J10C build/6580300 osVer/7.1.2 sdkInt/25 network/2 BiliApp/6580300 mobi_app/android channel/xiaomi_cn_tv.danmaku.bili_20190930 Buvid/XY8F46C80709C2AC8F13C26A1F4452AF1A37F sessionID/788ebcdd innerVer/6580310 c_locale/zh_CN s_locale/zh_CN disable_rcmd/0 6.58.0 os/android model/M2006J10C mobi_app/android build/6580300 channel/xiaomi_cn_tv.danmaku.bili_20190930 innerVer/6580310 osVer/7.1.2 network/2")
	do, _ := client.Do(request)
	data = readAllByte(do)
	return data
}

func checkLoginStatus(s LoginStatus, msg *CheckLoginStatusResp) bool {
	var (
		data []byte
	)
	form := "oauthKey=" + s.Data.OauthKey + "&gourl=https://passport.bilibili.com/account/security"
	post, err := http.Post("https://passport.bilibili.com/qrcode/getLoginInfo", "application/x-www-form-urlencoded", strings.NewReader(form))
	if err != nil {
		return false
	}
	request, err := http.NewRequest("POST", "https://passport.bilibili.com/qrcode/getLoginInfo", strings.NewReader(form))
	if err != nil {
		println("未知错误")
	}
	request.Header.Set("contentType", "application/x-www-form-urlencoded")
	_, err = http.DefaultClient.Do(request)
	if err != nil {
		println("未知错误")
	}
	data = readAllByte(post)
	err = json.Unmarshal(data, msg)
	if err != nil {
		return false
	}
	return msg.Status
}

func readAllByte(get *http.Response) []byte {
	var buff [1024]byte
	data := make([]byte, 0)
	for true {
		read, err := get.Body.Read(buff[:])
		if err == io.EOF {
			break
		}
		data = append(data, buff[:read]...)
	}
	return data
}

// 下列结构体都是由插件根据json自动生成的
type payReq struct {
	Errno   int    `json:"errno"`
	Msg     string `json:"msg"`
	ShowMsg string `json:"showMsg"`
	Data    struct {
		TraceId         string `json:"traceId"`
		ServerTime      int64  `json:"serverTime"`
		CustomerId      int    `json:"customerId"`
		OrderId         string `json:"orderId"`
		TxId            int64  `json:"txId"`
		PayChannel      string `json:"payChannel"`
		DeviceType      int    `json:"deviceType"`
		PayChannelParam string `json:"payChannelParam"`
		PayChannelUrl   string `json:"payChannelUrl"`
		QueryOrderReqVO struct {
			TraceId           string `json:"traceId"`
			CheckThirdChannel string `json:"checkThirdChannel"`
			CustomerId        string `json:"customerId"`
			Sign              string `json:"sign"`
			SignType          string `json:"signType"`
			Version           string `json:"version"`
			TxIds             string `json:"txIds"`
			Timestamp         string `json:"timestamp"`
		} `json:"queryOrderReqVO"`
		ReturnUrl string `json:"returnUrl"`
	} `json:"data"`
	Errtag int `json:"errtag"`
}
type LoginStatus struct {
	Code   int  `json:"code"`
	Status bool `json:"status"`
	Ts     int  `json:"ts"`
	Data   struct {
		Url      string `json:"url"`
		OauthKey string `json:"oauthKey"`
	} `json:"data"`
}

type CheckLoginStatusResp struct {
	Status  bool        `json:"status"`
	Data    interface{} `json:"data"`
	Message string      `json:"message"`
}

type TureLogin struct {
	Status  bool       `json:"status"`
	Data    AccountUrl `json:"data"`
	Message string     `json:"message"`
}
type AccountUrl struct {
	Url string `json:"url"`
}
type ItemPropertiesResp struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Ttl     int    `json:"ttl"`
	Data    struct {
		Item struct {
			ItemId     int    `json:"item_id"`
			Name       string `json:"name"`
			State      string `json:"state"`
			TabId      int    `json:"tab_id"`
			SuitItemId int    `json:"suit_item_id"`
			Properties struct {
				Desc                  string `json:"desc"`
				FanDesc               string `json:"fan_desc"`
				FanId                 string `json:"fan_id"`
				FanItemIds            string `json:"fan_item_ids"`
				FanMid                string `json:"fan_mid"`
				FanNoColor            string `json:"fan_no_color"`
				FanRecommendDesc      string `json:"fan_recommend_desc"`
				FanRecommendJumpType  string `json:"fan_recommend_jump_type"`
				FanRecommendJumpValue string `json:"fan_recommend_jump_value"`
				FanShareImage         string `json:"fan_share_image"`
				ImageCover            string `json:"image_cover"`
				ImageCoverColor       string `json:"image_cover_color"`
				ImageCoverLong        string `json:"image_cover_long"`
				ImageDesc             string `json:"image_desc"`
				IsHide                string `json:"is_hide"`
				ItemIdCard            string `json:"item_id_card"`
				ItemIdEmoji           string `json:"item_id_emoji"`
				ItemIdThumbup         string `json:"item_id_thumbup"`
				RankInvestorShow      string `json:"rank_investor_show"`
				RealnameAuth          string `json:"realname_auth"`
				SaleBpForeverRaw      string `json:"sale_bp_forever_raw"`
				SaleBpPmRaw           string `json:"sale_bp_pm_raw"`
				SaleBuyNumLimit       string `json:"sale_buy_num_limit"`
				SaleQuantity          string `json:"sale_quantity"`
				SaleQuantityLimit     string `json:"sale_quantity_limit"`
				SaleRegionIpLimit     string `json:"sale_region_ip_limit"`
				SaleReserveSwitch     string `json:"sale_reserve_switch"`
				SaleTimeBegin         string `json:"sale_time_begin"`
				SaleType              string `json:"sale_type"`
				SuitCardType          string `json:"suit_card_type"`
				Type                  string `json:"type"`
			} `json:"properties"`
			CurrentActivity struct {
				Type           string `json:"type"`
				TimeLimit      bool   `json:"time_limit"`
				TimeLeft       int    `json:"time_left"`
				Tag            string `json:"tag"`
				PriceBpMonth   int    `json:"price_bp_month"`
				PriceBpForever int    `json:"price_bp_forever"`
			} `json:"current_activity"`
			CurrentSources interface{} `json:"current_sources"`
			FinishSources  interface{} `json:"finish_sources"`
			SaleLeftTime   int         `json:"sale_left_time"`
			SaleTimeEnd    int         `json:"sale_time_end"`
			SaleSurplus    int         `json:"sale_surplus"`
		} `json:"item"`
		SaleSurplus  int `json:"sale_surplus"`
		SaleLeftTime int `json:"sale_left_time"`
		SuitItems    struct {
			Card []struct {
				ItemId     int    `json:"item_id"`
				Name       string `json:"name"`
				State      string `json:"state"`
				TabId      int    `json:"tab_id"`
				SuitItemId int    `json:"suit_item_id"`
				Properties struct {
					Hot               string `json:"hot"`
					Image             string `json:"image"`
					RealnameAuth      string `json:"realname_auth"`
					SaleType          string `json:"sale_type"`
					ImagePreviewSmall string `json:"image_preview_small,omitempty"`
				} `json:"properties"`
				CurrentActivity interface{} `json:"current_activity"`
				CurrentSources  interface{} `json:"current_sources"`
				FinishSources   interface{} `json:"finish_sources"`
				SaleLeftTime    int         `json:"sale_left_time"`
				SaleTimeEnd     int         `json:"sale_time_end"`
				SaleSurplus     int         `json:"sale_surplus"`
				Items           interface{} `json:"items"`
			} `json:"card"`
			CardBg []struct {
				ItemId     int    `json:"item_id"`
				Name       string `json:"name"`
				State      string `json:"state"`
				TabId      int    `json:"tab_id"`
				SuitItemId int    `json:"suit_item_id"`
				Properties struct {
					Image             string `json:"image"`
					ImagePreviewSmall string `json:"image_preview_small"`
					RealnameAuth      string `json:"realname_auth"`
					SaleType          string `json:"sale_type"`
				} `json:"properties"`
				CurrentActivity interface{} `json:"current_activity"`
				CurrentSources  interface{} `json:"current_sources"`
				FinishSources   interface{} `json:"finish_sources"`
				SaleLeftTime    int         `json:"sale_left_time"`
				SaleTimeEnd     int         `json:"sale_time_end"`
				SaleSurplus     int         `json:"sale_surplus"`
				Items           interface{} `json:"items"`
			} `json:"card_bg"`
			EmojiPackage []struct {
				ItemId     int    `json:"item_id"`
				Name       string `json:"name"`
				State      string `json:"state"`
				TabId      int    `json:"tab_id"`
				SuitItemId int    `json:"suit_item_id"`
				Properties struct {
					Addable              string `json:"addable"`
					Biz                  string `json:"biz"`
					Image                string `json:"image"`
					IsSymbol             string `json:"is_symbol"`
					ItemIds              string `json:"item_ids"`
					Permanent            string `json:"permanent"`
					Preview              string `json:"preview"`
					RealnameAuth         string `json:"realname_auth"`
					RecentlyUsed         string `json:"recently_used"`
					Recommend            string `json:"recommend"`
					RefMid               string `json:"ref_mid"`
					Removable            string `json:"removable"`
					SaleType             string `json:"sale_type"`
					SettingPannelNotShow string `json:"setting_pannel_not_show"`
					Size                 string `json:"size"`
					Sortable             string `json:"sortable"`
				} `json:"properties"`
				CurrentActivity interface{} `json:"current_activity"`
				CurrentSources  interface{} `json:"current_sources"`
				FinishSources   interface{} `json:"finish_sources"`
				SaleLeftTime    int         `json:"sale_left_time"`
				SaleTimeEnd     int         `json:"sale_time_end"`
				SaleSurplus     int         `json:"sale_surplus"`
				Items           []struct {
					ItemId     int    `json:"item_id"`
					Name       string `json:"name"`
					State      string `json:"state"`
					TabId      int    `json:"tab_id"`
					SuitItemId int    `json:"suit_item_id"`
					Properties struct {
						Associate string `json:"associate"`
						Image     string `json:"image"`
						IsSymbol  string `json:"is_symbol"`
						RefMid    string `json:"ref_mid"`
						SaleType  string `json:"sale_type"`
					} `json:"properties"`
					CurrentActivity interface{} `json:"current_activity"`
					CurrentSources  interface{} `json:"current_sources"`
					FinishSources   interface{} `json:"finish_sources"`
					SaleLeftTime    int         `json:"sale_left_time"`
					SaleTimeEnd     int         `json:"sale_time_end"`
					SaleSurplus     int         `json:"sale_surplus"`
				} `json:"items"`
			} `json:"emoji_package"`
			Loading []struct {
				ItemId     int    `json:"item_id"`
				Name       string `json:"name"`
				State      string `json:"state"`
				TabId      int    `json:"tab_id"`
				SuitItemId int    `json:"suit_item_id"`
				Properties struct {
					ImagePreviewSmall string `json:"image_preview_small"`
					LoadingFrameUrl   string `json:"loading_frame_url"`
					LoadingUrl        string `json:"loading_url"`
					RealnameAuth      string `json:"realname_auth"`
					Ver               string `json:"ver"`
				} `json:"properties"`
				CurrentActivity interface{} `json:"current_activity"`
				CurrentSources  interface{} `json:"current_sources"`
				FinishSources   interface{} `json:"finish_sources"`
				SaleLeftTime    int         `json:"sale_left_time"`
				SaleTimeEnd     int         `json:"sale_time_end"`
				SaleSurplus     int         `json:"sale_surplus"`
				Items           interface{} `json:"items"`
			} `json:"loading"`
			PlayIcon []struct {
				ItemId     int    `json:"item_id"`
				Name       string `json:"name"`
				State      string `json:"state"`
				TabId      int    `json:"tab_id"`
				SuitItemId int    `json:"suit_item_id"`
				Properties struct {
					DragIcon        string `json:"drag_icon"`
					DragIconHash    string `json:"drag_icon_hash"`
					Icon            string `json:"icon"`
					IconHash        string `json:"icon_hash"`
					RealnameAuth    string `json:"realname_auth"`
					SquaredImage    string `json:"squared_image"`
					StaticIconImage string `json:"static_icon_image"`
					Ver             string `json:"ver"`
				} `json:"properties"`
				CurrentActivity interface{} `json:"current_activity"`
				CurrentSources  interface{} `json:"current_sources"`
				FinishSources   interface{} `json:"finish_sources"`
				SaleLeftTime    int         `json:"sale_left_time"`
				SaleTimeEnd     int         `json:"sale_time_end"`
				SaleSurplus     int         `json:"sale_surplus"`
				Items           interface{} `json:"items"`
			} `json:"play_icon"`
			Skin []struct {
				ItemId     int    `json:"item_id"`
				Name       string `json:"name"`
				State      string `json:"state"`
				TabId      int    `json:"tab_id"`
				SuitItemId int    `json:"suit_item_id"`
				Properties struct {
					Color                    string `json:"color"`
					ColorMode                string `json:"color_mode"`
					ColorSecondPage          string `json:"color_second_page"`
					HeadBg                   string `json:"head_bg"`
					HeadMyselfMp4Play        string `json:"head_myself_mp4_play"`
					HeadMyselfSquaredBg      string `json:"head_myself_squared_bg"`
					HeadTabBg                string `json:"head_tab_bg"`
					ImageCover               string `json:"image_cover"`
					ImagePreview             string `json:"image_preview"`
					PackageMd5               string `json:"package_md5"`
					PackageUrl               string `json:"package_url"`
					RealnameAuth             string `json:"realname_auth"`
					SkinMode                 string `json:"skin_mode"`
					TailBg                   string `json:"tail_bg"`
					TailColor                string `json:"tail_color"`
					TailColorSelected        string `json:"tail_color_selected"`
					TailIconAni              string `json:"tail_icon_ani"`
					TailIconAniMode          string `json:"tail_icon_ani_mode"`
					TailIconChannel          string `json:"tail_icon_channel"`
					TailIconDynamic          string `json:"tail_icon_dynamic"`
					TailIconMain             string `json:"tail_icon_main"`
					TailIconMode             string `json:"tail_icon_mode"`
					TailIconMyself           string `json:"tail_icon_myself"`
					TailIconPubBtnBg         string `json:"tail_icon_pub_btn_bg"`
					TailIconSelectedChannel  string `json:"tail_icon_selected_channel"`
					TailIconSelectedDynamic  string `json:"tail_icon_selected_dynamic"`
					TailIconSelectedMain     string `json:"tail_icon_selected_main"`
					TailIconSelectedMyself   string `json:"tail_icon_selected_myself"`
					TailIconSelectedPubBtnBg string `json:"tail_icon_selected_pub_btn_bg"`
					TailIconSelectedShop     string `json:"tail_icon_selected_shop"`
					TailIconShop             string `json:"tail_icon_shop"`
					Ver                      string `json:"ver"`
				} `json:"properties"`
				CurrentActivity interface{} `json:"current_activity"`
				CurrentSources  interface{} `json:"current_sources"`
				FinishSources   interface{} `json:"finish_sources"`
				SaleLeftTime    int         `json:"sale_left_time"`
				SaleTimeEnd     int         `json:"sale_time_end"`
				SaleSurplus     int         `json:"sale_surplus"`
				Items           interface{} `json:"items"`
			} `json:"skin"`
			SpaceBg []struct {
				ItemId     int    `json:"item_id"`
				Name       string `json:"name"`
				State      string `json:"state"`
				TabId      int    `json:"tab_id"`
				SuitItemId int    `json:"suit_item_id"`
				Properties struct {
					FanNoColor      string `json:"fan_no_color"`
					FanNoImage      string `json:"fan_no_image"`
					Image1Landscape string `json:"image1_landscape"`
					Image1Portrait  string `json:"image1_portrait"`
					Image2Landscape string `json:"image2_landscape"`
					Image2Portrait  string `json:"image2_portrait"`
					Image3Landscape string `json:"image3_landscape"`
					Image3Portrait  string `json:"image3_portrait"`
					Image4Landscape string `json:"image4_landscape"`
					Image4Portrait  string `json:"image4_portrait"`
					Image5Landscape string `json:"image5_landscape"`
					Image5Portrait  string `json:"image5_portrait"`
					RealnameAuth    string `json:"realname_auth"`
				} `json:"properties"`
				CurrentActivity interface{} `json:"current_activity"`
				CurrentSources  interface{} `json:"current_sources"`
				FinishSources   interface{} `json:"finish_sources"`
				SaleLeftTime    int         `json:"sale_left_time"`
				SaleTimeEnd     int         `json:"sale_time_end"`
				SaleSurplus     int         `json:"sale_surplus"`
				Items           interface{} `json:"items"`
			} `json:"space_bg"`
			Thumbup []struct {
				ItemId     int    `json:"item_id"`
				Name       string `json:"name"`
				State      string `json:"state"`
				TabId      int    `json:"tab_id"`
				SuitItemId int    `json:"suit_item_id"`
				Properties struct {
					ImageAni     string `json:"image_ani"`
					ImageAniCut  string `json:"image_ani_cut"`
					ImagePreview string `json:"image_preview"`
					RealnameAuth string `json:"realname_auth"`
				} `json:"properties"`
				CurrentActivity interface{} `json:"current_activity"`
				CurrentSources  interface{} `json:"current_sources"`
				FinishSources   interface{} `json:"finish_sources"`
				SaleLeftTime    int         `json:"sale_left_time"`
				SaleTimeEnd     int         `json:"sale_time_end"`
				SaleSurplus     int         `json:"sale_surplus"`
				Items           interface{} `json:"items"`
			} `json:"thumbup"`
		} `json:"suit_items"`
		FanUser struct {
			Mid      int    `json:"mid"`
			Nickname string `json:"nickname"`
			Avatar   string `json:"avatar"`
		} `json:"fan_user"`
		UnlockItems      interface{} `json:"unlock_items"`
		ActivityEntrance struct {
			Id         int    `json:"id"`
			ItemId     int    `json:"item_id"`
			Title      string `json:"title"`
			ImageCover string `json:"image_cover"`
			JumpLink   string `json:"jump_link"`
		} `json:"activity_entrance"`
	} `json:"data"`
}
type orderResp struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Ttl     int    `json:"ttl"`
	Data    struct {
		OrderId string `json:"order_id"`
		PayData string `json:"pay_data"`
	} `json:"data"`
}
type personalInfo struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Ttl     int    `json:"ttl"`
	Data    struct {
		IsLogin       bool   `json:"isLogin"`
		EmailVerified int    `json:"email_verified"`
		Face          string `json:"face"`
		FaceNft       int    `json:"face_nft"`
		LevelInfo     struct {
			CurrentLevel int `json:"current_level"`
			CurrentMin   int `json:"current_min"`
			CurrentExp   int `json:"current_exp"`
			NextExp      int `json:"next_exp"`
		} `json:"level_info"`
		Mid            int     `json:"mid"`
		MobileVerified int     `json:"mobile_verified"`
		Money          float64 `json:"money"`
		Moral          int     `json:"moral"`
		Official       struct {
			Role  int    `json:"role"`
			Title string `json:"title"`
			Desc  string `json:"desc"`
			Type  int    `json:"type"`
		} `json:"official"`
		OfficialVerify struct {
			Type int    `json:"type"`
			Desc string `json:"desc"`
		} `json:"officialVerify"`
		Pendant struct {
			Pid               int    `json:"pid"`
			Name              string `json:"name"`
			Image             string `json:"image"`
			Expire            int    `json:"expire"`
			ImageEnhance      string `json:"image_enhance"`
			ImageEnhanceFrame string `json:"image_enhance_frame"`
		} `json:"pendant"`
		Scores       int    `json:"scores"`
		Uname        string `json:"uname"`
		VipDueDate   int64  `json:"vipDueDate"`
		VipStatus    int    `json:"vipStatus"`
		VipType      int    `json:"vipType"`
		VipPayType   int    `json:"vip   _pay_type"`
		VipThemeType int    `json:"vip_theme_type"`
		VipLabel     struct {
			Path        string `json:"path"`
			Text        string `json:"text"`
			LabelTheme  string `json:"label_theme"`
			TextColor   string `json:"text_color"`
			BgStyle     int    `json:"bg_style"`
			BgColor     string `json:"bg_color"`
			BorderColor string `json:"border_color"`
		} `json:"vip_label"`
		VipAvatarSubscript int    `json:"vip_avatar_subscript"`
		VipNicknameColor   string `json:"vip_nickname_color"`
		Vip                struct {
			Type       int   `json:"type"`
			Status     int   `json:"status"`
			DueDate    int64 `json:"due_date"`
			VipPayType int   `json:"vip_pay_type"`
			ThemeType  int   `json:"theme_type"`
			Label      struct {
				Path        string `json:"path"`
				Text        string `json:"text"`
				LabelTheme  string `json:"label_theme"`
				TextColor   string `json:"text_color"`
				BgStyle     int    `json:"bg_style"`
				BgColor     string `json:"bg_color"`
				BorderColor string `json:"border_color"`
			} `json:"label"`
			AvatarSubscript    int    `json:"avatar_subscript"`
			NicknameColor      string `json:"nickname_color"`
			Role               int    `json:"role"`
			AvatarSubscriptUrl string `json:"avatar_subscript_url"`
		} `json:"vip"`
		Wallet struct {
			Mid           int `json:"mid"`
			BcoinBalance  int `json:"bcoin_balance"`
			CouponBalance int `json:"coupon_balance"`
			CouponDueTime int `json:"coupon_due_time"`
		} `json:"wallet"`
		HasShop        bool   `json:"has_shop"`
		ShopUrl        string `json:"shop_url"`
		AllowanceCount int    `json:"allowance_count"`
		AnswerStatus   int    `json:"answer_status"`
		IsSeniorMember int    `json:"is_senior_member"`
	} `json:"data"`
}

type payParam struct {
	AccessKey       string `json:"accessKey"`
	AppName         string `json:"appName"`
	AppVersion      int    `json:"appVersion"`
	CustomerId      int    `json:"customerId"`
	Device          string `json:"device"`
	DeviceType      string `json:"deviceType"`
	Network         string `json:"network"`
	NotifyUrl       string `json:"notifyUrl"`
	OrderCreateTime string `json:"orderCreateTime"`
	OrderExpire     string `json:"orderExpire"`
	OrderId         string `json:"orderId"`
	OriginalAmount  string `json:"originalAmount"`
	PayAmount       string `json:"payAmount"`
	PayChannel      string `json:"payChannel"`
	PayChannelId    int    `json:"payChannelId"`
	ProductId       string `json:"productId"`
	RealChannel     string `json:"realChannel"`
	SdkVersion      string `json:"sdkVersion"`
	ServiceType     string `json:"serviceType"`
	ShowTitle       string `json:"showTitle"`
	Sign            string `json:"sign"`
	SignType        string `json:"signType"`
	Timestamp       string `json:"timestamp"`
	TraceId         string `json:"traceId"`
	Uid             string `json:"uid"`
	Version         string `json:"version"`
}
type Gen struct {
	DeviceType      string `json:"deviceType" gorm:"column:deviceType"`
	ServiceType     string `json:"serviceType" gorm:"column:serviceType"`
	TraceID         string `json:"traceId" gorm:"column:traceId"`
	ProductID       string `json:"productId" gorm:"column:productId"`
	OrderID         string `json:"orderId" gorm:"column:orderId"`
	OrderCreateTime string `json:"orderCreateTime" gorm:"column:orderCreateTime"`
	Sign            string `json:"sign" gorm:"column:sign"`
	OrderExpire     string `json:"orderExpire" gorm:"column:orderExpire"`
	Version         string `json:"version" gorm:"column:version"`
	Uid             string `json:"uid" gorm:"column:uid"`
	PayAmount       string `json:"payAmount" gorm:"column:payAmount"`
	OriginalAmount  string `json:"originalAmount" gorm:"column:originalAmount"`
	ShowTitle       string `json:"showTitle" gorm:"column:showTitle"`
	CustomerID      int    `json:"customerId" gorm:"column:customerId"`
	NotifyUrl       string `json:"notifyUrl" gorm:"column:notifyUrl"`
	SignType        string `json:"signType" gorm:"column:signType"`
	Timestamp       string `json:"timestamp" gorm:"column:timestamp"`
}
type payBpReq struct {
	Code    int    `json:"code"`
	Errno   int    `json:"errno"`
	Msg     string `json:"msg"`
	ShowMsg string `json:"showMsg"`
	Data    struct {
		WxId       string  `json:"wxId"`
		TxId       string  `json:"txId"`
		CustomerId int     `json:"customerId"`
		TotalPayBp float64 `json:"totalPayBp"`
		PayCounpon int     `json:"payCounpon"`
		BpRate     float64 `json:"bpRate"`
		FeeType    string  `json:"feeType"`
		PayAmount  int     `json:"payAmount"`
		PayTime    int64   `json:"payTime"`
		Status     string  `json:"status"`
		OrderId    string  `json:"orderId"`
	} `json:"data"`
	Success bool `json:"success"`
}
