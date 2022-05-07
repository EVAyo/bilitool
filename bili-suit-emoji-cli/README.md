
bili-suit-emoji-cli是一款用来下载b站套装图片的软件

基于bili-suit-emoji-core开发的命令行程序

## 用法

```
usage: bili套装表情下载器
 -a,--all               爬取所有套装
 -d,--directory <arg>   指定放置生成的类文件的位置
 -f,--find <arg>        搜索套装id
 -h,--help              将此帮助消息输出到输出流
 -i,--id <arg>          待爬取的主题item_id（即分享链接后的item_id的值）
 -l,--list              获取套装列表
```

例如

```
#获取套装名包含"七海"的装扮id
./bili-suit-emoji-tool -f 七海
#下载id为4756的套装到save文件夹下
./bili-suit-emoji-tool -i 4756 -d save
```

