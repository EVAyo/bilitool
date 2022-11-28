package tool

import (
	"fmt"
	"net/url"
	"path"
	"strings"
	"time"
)

func ResolveURL(u *url.URL, p string) string {
	if strings.HasPrefix(p, "https://") || strings.HasPrefix(p, "http://") {
		return p
	}
	var baseURL string
	if strings.Index(p, "/") == 0 {
		baseURL = u.Scheme + "://" + u.Host
	} else {
		tU := u.String()
		baseURL = tU[0:strings.LastIndex(tU, "/")]
	}
	return baseURL + path.Join("/", p)
}

func FmtDuration(d time.Duration) string {
	h := int(d.Hours())
	m := int(d.Minutes()) - h*60
	s := int(d.Seconds()) - h*3600 - m*60
	return fmt.Sprintf("%02d:%02d:%02d", h, m, s)
}
