from tkinter import *
from tkinter.ttk import Progressbar
from tkinter import ttk
from tkinter import scrolledtext
from tkinter.filedialog import (askopenfilename, 
                                    askopenfilenames, 
                                    askdirectory, 
                                    asksaveasfilename)
import requests
import json
import sys,os
import time
import math
import re
import random
import tkinter.messagebox
from datetime import datetime,timedelta
import secrets
#from random import choice
#from random import sample
#上方代码导入所有需要的库

import base64
from iconwin import img
#打包成exe所需的库

version='1.0.0'
updatetime='2021-03-22'

def setIcon():
    #释放icon.py所保存的图标，打包exe时要用
    tmp=open('tmp.ico','wb+')
    tmp.write(base64.b64decode(img))#写入到临时文件中
    tmp.close()
    window.iconbitmap("tmp.ico") #设置图标
    os.remove("tmp.ico")           #删除临时图标

def nowtm():
    #记录列表输出当前时间
    if not notime:
        now = datetime.now()
        nowtime=now.strftime("%H:%M:%S")
        return '['+nowtime+']'
    else:
        return ''

def printp(text):
    #输出记录到文本框
    #print(text)
    output['state']='normal'
    output.insert('end',nowtm()+text+'\n')
    output['state']='disabled'
    output.see(END)
    window.update()
    if EnaRZ:
        RZtxt = open(rzpath,'a',encoding='utf-8')
        RZtxt.write(text)
        RZtxt.write('\n')
        RZtxt.close()

#下面两条def在获取数据时会用到，定义链接
def gzlisturl(page):
    return 'http://api.bilibili.com/x/relation/followers?vmid='+str(myuid)+'&pn='+str(page)

def likelisturl(page):
    return 'http://api.vc.bilibili.com/dynamic_like/v1/dynamic_like/spec_item_likes?dynamic_id='+str(dyid)+'&pn='+str(page)

#替换布尔值（true和false）
def repBool(value):
    if value:
        val=str(value).replace('True','√')#✔
    else:
        val=str(value).replace('False','X')#❌
    return val

#传入链接，使用requests获取内容，允许超时3次
def gethtml(url, header):
    i = 0
    while i < 3:
        try:
            html = requests.get(url, headers=header, timeout=5)
            html.encoding = "utf-8"
            return html.text
        except requests.exceptions.RequestException:
            printp('警告：超时'+str(i+1)+'次，位于'+str(errortime)+'页')
            i += 1

#===============================================================================================#
#部分实现方法源自项目：https://github.com/LeoChen98/BiliRaffle，点赞判定为芍芋原创（反正很简单）#
#===============================================================================================#

def now_time():
    #输出当前时间
    t = time.strftime("%Y%m%d%H%M%S", time.localtime())
    return t

def _get_offset(data_json):
    #获取转发列表用
    if 'offset' in data_json['data']:
        return data_json['data']['offset']
    else:
        return None

def getZF(dyn_id):
    printp('尝试获取完整转发列表……')
    dynamic_api = "http://api.vc.bilibili.com/dynamic_repost/v1/dynamic_repost/repost_detail"
    info = {
        "time": now_time(),
        "dyn_id": dyn_id
    }
    header={
    "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/88.0.4324.182 Safari/537.36",
    }
    # 首次数据获取
    offset = "1:0"
    param = {'dynamic_id': dyn_id, 'offset': offset}
    data = requests.get(dynamic_api, headers=header, params=param, timeout=10)
    data_json = json.loads(data.text)
    total_num = data_json['data']['total']
    info['total'] = total_num

    # 获取全部数据
    uidall=[]
    now_num = 0
    count = 0
    users = []
    while now_num < total_num:  # 循环获取页面
        param = {'dynamic_id': dyn_id, 'offset': offset}
        data = requests.get(dynamic_api, headers=header, params=param, timeout=10)
        data_json = json.loads(data.text)
        for i in range(0, 20):  # 获取单页的所有用户（最多20条）
            if count < total_num:
                count += 1
                try:
                    uid = data_json['data']['items'][i]['desc']['uid']
                    uidall.append(uid)
                except:
                    pass
            else:  # 最后一页数量少于20时
                break
        offset = _get_offset(data_json)
        if offset is None:
            break
        now_num += 20
        time.sleep(0.2)
    uidall.sort()
    try:
        uidall.remove(myuid)
    except:
        pass
    printp('完成，共有 '+str(len(uidall))+' 位，已存至数组中')
    return uidall

def getPL(Dynamic_id):
    printp('尝试获取完整评论列表……')
    current_page = 1
    header={
    "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/86.0.4324.182 Safari/537.36",
    }
    '''
    DynamicAPI = "https://api.live.bilibili.com/dynamic_repost/v1/dynamic_repost/view_repost?dynamic_id=" + Dynamic_id + "&offset=0"
    r = gethtml(DynamicAPI,header)
    json_data = json.loads(r)
    href = json_data['data']['comments'][0]'''
    rid = dyinfo['card']['desc']['rid']
    link1 = 'http://api.bilibili.com/x/v2/reply?&jsonp=jsonp&pn='
    link2 = '&type=11&oid='
    link3 = '&sort=2&_=1570498003332'
    comment_list = []
    userlist_1=[]
    pool = {}
    r = gethtml(link1 + str(current_page) + link2 + str(rid) + link3, header)
    json_data = json.loads(r)
    if json_data['code']==-404:
        printp('获取评论失败，可能因为此动态没有除UP主自己的评论以外的评论!')
        return False
    if json_data['code']==-412:
        printp('获取评论失败，调取间隔过短，请稍后重试!')
        return False
    comments_num = json_data['data']['page']['count']
    pages_num = comments_num // 20 + 1

    while True:
        r = gethtml(link1 + str(current_page) + link2 + str(rid) + link3, header)
        json_data1 = json.loads(r)

        if json_data1['data']['replies']:
            for reply in json_data1['data']['replies']:
                userlist_1.append(int(reply['member']['mid']))
        current_page += 1
        if current_page > pages_num:
            break
    userlist_1.sort()
    try:
        userlist_1.remove(myuid)
    except:
        pass
    printp('完成，共有 '+str(len(userlist_1))+' 位，已存至数组中')
    return userlist_1

def getDZ(dyid):
    global errortime
    printp('尝试获取完整点赞列表……')
    header={
    "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/88.0.4324.182 Safari/537.36",
    }
    r=gethtml(likelisturl(1),header)
    errortime=1
    userlist_dict=json.loads(r)
    jdata=userlist_dict['data']
    jlist=jdata['item_likes']
    totalfans=jdata.get('total_count')
    math2=math.ceil(jdata.get('total_count')/20)*20-totalfans
    pages=math.ceil(totalfans/20)
    times=1
    errortime=1
    userlist_1=[]
    while times < pages+1:
        errortime=times
        r=gethtml(likelisturl(times), header)
        userlist_dict=json.loads(r)
        jdata=userlist_dict['data']
        jlist=jdata['item_likes']
        times2=0
        if times != pages:
            while times2<20:
                userlist_1.append(jlist[times2].get('uid'))
                times2=times2+1
        else:
            while times2<20-math2:
                userlist_1.append(jlist[times2].get('uid'))
                times2=times2+1
        times=times+1
        time.sleep(0.3)
    userlist_1.sort()
    try:
        userlist_1.remove(myuid)
    except:
        pass
    printp('完成，共有 '+str(len(userlist_1))+' 位，已存至数组中')
    return list(userlist_1)

def getname(users):
    #获取用户名
    times=0
    while times<len(users):
        url='http://api.bilibili.com/x/space/acc/info?mid='+str(users[times])
        header={
        "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/75.0.4324.182 Safari/537.36",
        }
        res = requests.get(url=url,headers=header)
        resback=json.loads(res.text)
        usrinfo=resback.get('data')
        try:
            mid=usrinfo.get('mid')
            uname=usrinfo.get('name')
        except:
            #print(res.text)
            mid=(users[times])
            uname='[获取失败]'
        printp(str(times+1)+' '+uname+' (UID:'+str(mid)+')')
        times=times+1

def checkGZ(mid):
    if TGZ:
        url='http://api.bilibili.com/x/space/acc/relation?mid='+str(mid)
        header={
        "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/88.0.4324.182 Safari/537.36",
        "Cookie":cookie,
        }
        res = requests.get(url=url,headers=header)
        resback=json.loads(res.text)
        rinfo=resback.get('data')
        be_relation=rinfo['be_relation']['attribute']
        if not be_relation==2 and not be_relation==6:
            printp('[ UID:'+str(mid)+' 未关注('+str(be_relation)+')，无效 ]')
            return False
        else:
            return True
    else:
        return True

def checkCJH(mid,condition):
    if GLCJH:
        #false为不通过
        raffle_count=0
        url='http://api.vc.bilibili.com/dynamic_svr/v1/dynamic_svr/space_history?visitor_uid=0&host_uid='+str(mid)+'&offset_dynamic_id=0'
        header={
        "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/88.0.4324.182 Safari/537.36",
        }
        res = requests.get(url=url,headers=header)
        res.encoding='utf-8'
        resback=json.loads(res.text)
        if resback['code']==0:
            rinfo=resback.get('data')
            if resback['code']!=0:
                printp('检测抽奖号'+str(mid)+'时出错，返回值为:'+str(resback['code']))
                return True
            try:
                check_count=len(rinfo['cards'])
            except:
                printp('检测抽奖号'+str(mid)+'时出错，无法获取到动态信息')
                return True
            if check_count>10:
                check_count=10
            times=0
            while times<check_count:
                #print(rinfo['cards'][times]['card'])
                if '抽奖' in rinfo['cards'][times]['card']:
                    raffle_count=raffle_count+1
                times=times+1
        if raffle_count > condition:
            printp('[ UID:'+str(mid)+' 判定为抽奖号('+str(raffle_count)+'/'+str(condition)+')，无效 ]')
            return False
        else:
            return True
    else:
        return True

def linktodyid(dyid):
    #转换t.bilibili.com格式链接为动态id
    if "t.bilibili.com/" in dyid:
        dyid, sep, tail = dyid.partition('?')
        dyid=dyid[dyid.rfind('/'):]
        head, sep, dyid = dyid.partition('/')
        return dyid
    else:
        return dyid

def clicked():
    #程序开始运行
    bar['value']=0
    global notime
    global dyid
    global dyinfo
    global myuid
    global cookie
    global TGZ
    global RZtxt
    global EnaRZ
    global rzpath
    global GLCJH
    #print()
    TZF=bool(chk1_state.get())
    TPL=bool(chk2_state.get())
    TDZ=bool(chk3_state.get())
    TGZ=bool(chk4_state.get())
    TRZ=bool(chk5_state.get())
    output['state']='normal'
    output.delete(1.0, END)
    output['state']='disabled'
    if txt.get()=='':
        tkinter.messagebox.showwarning("提示", '请输入动态链接/ID！')
        return False
    try:
        dyid=linktodyid(txt.get())
        dyid=int(dyid)
    except:
        tkinter.messagebox.showwarning("提示", '输入的动态ID/链接不正确！')
        #printp('')
        return False
    if len(str(dyid))<18:
        tkinter.messagebox.showwarning("提示", '输入的动态ID长度不够 ('+str(len(str(dyid)))+'/'+'18) ！')
        return False
    LBGZ=[]
    LBZF=[]
    LBPL=[]
    LBDZ=[]
    errortime=1
    notime=False
    isLogin=False
    EnaRZ=False
    notime=True
    if not TGZ and not TZF and not TPL and not TDZ:
        tkinter.messagebox.showwarning("提示", '请至少选中一个获奖条件！')
        #printp()
        return False
    if TGZ and not TZF and not TPL and not TDZ:
        tkinter.messagebox.showwarning("提示", '还需要选择除了关注以外的任一获奖条件！')
        #printp()
        return False
    try:
        HJNUM=int(spin.get())
    except:
        tkinter.messagebox.showwarning("提示",'输入的获奖者数量无效！')
        return False
    if HJNUM<1:
        tkinter.messagebox.showwarning("提示",'输入的获奖者数量小于1！')
        return False
    try:
        CJHnum=int(spin2.get())
    except:
        tkinter.messagebox.showwarning("提示",'输入的过滤抽奖号的值无效！')
        return False
    if CJHnum<0 or CJHnum>10:
        tkinter.messagebox.showwarning("提示",'输入的过滤抽奖号的值小于0或大于10！')
        return False

    if TRZ:
        TimeSt=time.strftime("%Y-%m-%d-%H-%M-%S",time.localtime())
        rzpath='抽奖记录'+TimeSt+'.txt'
        RZtxt = open(rzpath,'a')
        printp('记录文件将保存在:'+rzpath)
        EnaRZ=True
    else:
        EnaRZ=False
    bar['value']=10
    TZF2=repBool(TZF)
    TPL2=repBool(TPL)
    TDZ2=repBool(TDZ)
    TGZ2=repBool(TGZ)
    printp('转发：'+str(TZF2)+' 评论：'+str(TPL2)+' 点赞：'+str(TDZ2)+' 关注：'+str(TGZ2))
    if CJHnum!=0:
        GLCJH=True
        printp('抽奖号过滤阈值设置为：'+str(CJHnum))
    else:
        GLCJH=False
    notime=False
    if TGZ:
        try:
            cookiepath=askopenfilename(title='选择一个包含cookie的文本文件',initialdir=os.path.dirname(os.path.realpath(sys.argv[0])), filetypes=[('Cookie File','*.txt')])
            cook=open(cookiepath,'r')
            cookie=cook.read()
        except:
            notime=True
            printp('检测关注需要登录，请在刚才的文件选择窗口里选择包含cookie的文件!')
            printp('提示：可以运行同一目录下的 getcookie.exe 或在浏览器打开 t.bili.fan 快速获取到自己的cookie')
            return False
        notime=True
        bar['value']=20
        printp('尝试使用预设的cookie进行模拟登录……')
        header={
        "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/88.0.4324.182 Safari/537.36",
        "Cookie":cookie,
        }
        r=requests.get('http://api.bilibili.com/x/space/myinfo',headers=header).text
        userinfo_dict=json.loads(r)
        try:
            jdata=userinfo_dict['data']
            myuid=jdata.get('mid')
            name=jdata.get('name')
            level=jdata.get('level')
            coins=jdata.get('coins')
            printp('模拟登录成功，UID:'+str(myuid)+'，详情如下\n用户名：'+name+'，等级 '+str(level)+'，拥有 '+str(coins)+' 枚硬币')
            isLogin=True
        except:
            printp('模拟登录失败，可能是cookie过期或未登录，请重新获取cookie!')
            return False

    #dyid=input('输入动态ID：')
    bar['value']=30
    '''if TGZ and not TZF and not TPL and not TDZ:
        printp('当前选择的是直接从粉丝列表里抽，将不会使用任何动态数据')
        dyid=0
        notime=True
        printp('')
    else:'''
    dyid=str(dyid)
    notime=False
    printp('正在获取动态详情……')
    try:
        header={
        "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/88.0.4324.182 Safari/537.36",
        }
        url='https://api.vc.bilibili.com/dynamic_svr/v1/dynamic_svr/get_dynamic_detail?dynamic_id='+dyid
        res = requests.get(url=url,headers=header)
        resback=json.loads(res.text)
        dyinfo=resback.get('data')
        if TGZ and dyinfo.get('card').get('desc').get('user_profile').get('info').get('uid')!=myuid:
            notime=True
            printp('动态发送者（'+dyinfo.get('card').get('desc').get('user_profile').get('info').get('uname')+'）和当前已登录用户不一致!')
            return False
        tmstmp=time.localtime(dyinfo.get('card').get('desc').get('timestamp'))
        notime=True
        printp('-------------------------------------------')
        printp('动态发送者：'+str(dyinfo.get('card').get('desc').get('user_profile').get('info').get('uname'))+'\n浏览：'+str(dyinfo.get('card').get('desc').get('view'))+'，转发：'+str(dyinfo.get('card').get('desc').get('repost'))+'，评论：'+str(dyinfo.get('card').get('desc').get('comment'))+'，点赞：'+str(dyinfo.get('card').get('desc').get('like')))
        printp('发送时间：'+time.strftime("%Y-%m-%d %H:%M:%S", tmstmp))
        printp('-------------------------------------------')
        notime=False
    except:
        SHEXIT=False
        try:
            if TGZ and dyinfo.get('card').get('desc').get('user_profile').get('info').get('uid')!=myuid:
                SHEXIT=True
        except:
            pass
        if SHEXIT:
                return False
        notime=True
        printp('获取出错，可能是动态链接/ID输入有误，请检查')
        return False
    if not isLogin:
        myuid=dyinfo.get('card').get('desc').get('user_profile').get('info').get('uid')
    printp('准备开始抽取……\n(抽取时将自动过滤UP主自己和重复转发/评论的用户)')
    bar['value']=40
    notime=True
    if TZF and dyinfo['card']['desc']['repost']>575:
        printp('警告：转发数量超过575的部分无法被统计!')
    printp('')
    Error=False
    bar['value']=40
    if TZF:
        if dyinfo['card']['desc']['repost']==0:
            printp('这条动态没有任何用户转发!')
            Error=True
        if dyinfo['card']['desc']['repost']>600:
            printp('转发限制在600次以内!')
            Error=True
        if HJNUM>dyinfo['card']['desc']['repost']:
            printp('设置的获奖者总数大于这条动态的转发数!')
            Error=True
    if TPL:
        if dyinfo['card']['desc']['comment']==0:
            printp('这条动态没有任何用户评论!')
            Error=True
        if dyinfo['card']['desc']['comment']>1000:
            printp('评论限制在1000条以内!')
            Error=True
        if HJNUM>dyinfo['card']['desc']['comment']:
            printp('设置的获奖者总数大于这条动态的评论数!')
            Error=True
    if TDZ:
        if dyinfo['card']['desc']['like']==0:
            printp('这条动态没有任何用户点赞!')
            Error=True
        if dyinfo['card']['desc']['like']>2000:
            printp('点赞限制在2000个以内!')
            Error=True
        if HJNUM>dyinfo['card']['desc']['like']:
            printp('设置的获奖者总数大于这条动态的点赞数!')
            Error=True
    if Error:
        return False
    LBALL=[]
    notime=False
    if TZF:
        LBZF=getZF(dyid)
        if len(LBALL)!=0:
            LBALL=set(LBALL)&set(LBZF)
        else:
            LBALL=set(LBZF)
    bar['value']=50
    if TPL:
        LBPL=getPL(dyid)
        if len(LBALL)!=0:
            LBALL=set(LBALL)&set(LBPL)
        else:
            LBALL=set(LBPL)
    bar['value']=60
    if TDZ:
        LBDZ=getDZ(dyid)
        if len(LBALL)!=0:
            LBALL=set(LBALL)&set(LBDZ)
        else:
            LBALL=set(LBDZ)
    bar['value']=70
    notime=True
    printp('')
    notime=False
    printp('已获取到符合要求的参与者数量为：'+str(len(list(LBALL))))
    notime=True
    if HJNUM>len(list(LBALL)) or HJNUM<1:
        printp('输入的获奖者数量（'+str(HJNUM)+'）超出范围!')
        return False
    HJMD=[]
    times=1
    while True:
        while True:
            if not len(LBALL) < HJNUM:
                HJuser=secrets.choice(list(LBALL))#这句是核心功能之一，随机从参与者数组里抽一位
                if not HJuser in HJMD:
                    if checkGZ(HJuser) and checkCJH(HJuser,CJHnum):
                        HJMD.append(HJuser)
                        times=times+1
                    else:
                        LBALL.remove(HJuser)
                        #print(len(LBALL))
                break
            else:
                printp('')
                printp('警告：参与者列表人数已小于设定的获奖者数量!\n建议：增加或取消抽奖号判定值，取消部分获奖条件')
                return False
        if times>HJNUM:
            break
    bar['value']=90
    HJMD.sort()
    random.shuffle(HJMD)
    notime=False
    printp('抽取完成！\n获奖名单：')
    notime=True
    printp('-------------------------------------------')
    getname(HJMD)
    printp('-------------------------------------------')
    notime=False
    #printp('程序即将退出……')
    bar['value']=100
    return False

def clicked2():
    #关于窗口
    tkinter.messagebox.showinfo("关于", 'B站动态抽奖工具 Python GUI版 '+version+'\n更新日期: '+updatetime+'\nBy: 芍芋\nWebsite: https://shoyu.top')

window = Tk()#初始化一个窗口
window.title('B站动态抽奖工具 Python GUI版 '+version+' '+updatetime+' By: 芍芋')#标题
window.configure(bg='white')#背景颜色
#window.geometry("820x300")

#窗口居中实现
width = 690 #720 Linux
heigh = 300 #380 Linux
screenwidth = window.winfo_screenwidth()
screenheight = window.winfo_screenheight()-50
window.geometry('%dx%d+%d+%d'%(width, heigh, (screenwidth-width)/2, (screenheight-heigh)/2))
window.resizable(0,0)#设置禁止调整窗口大小
#定义图标
try:
    window.iconbitmap('icon.ico')
except:
    try:
        setIcon()
    except:
        pass
#定义文本
lbl1 = Label(window, text="动态链接/ID")
lbl1.place(x=10, y=10)
lbl1.configure(bg='white')
txt = Entry(window, width=40, relief="solid")
txt.place(x=10, y=35)
#txt.focus()
lbl2 = Label(window, text="抽奖条件")
lbl2.place(x=10, y=70)
lbl2.configure(bg='white')
#定义复选框
chk1_state = BooleanVar()
chk1_state.set(False) # Set check state
chk1 = Checkbutton(window, text="转发", var=chk1_state)
chk1.place(x=10, y=90)
chk1.configure(bg='white')
chk2_state = BooleanVar()
chk2_state.set(False) # Set check state
chk2 = Checkbutton(window, text="评论", var=chk2_state)
chk2.place(x=90, y=90)
chk2.configure(bg='white')
chk3_state = BooleanVar()
chk3_state.set(False) # Set check state
chk3 = Checkbutton(window, text="点赞", var=chk3_state)
chk3.place(x=170, y=90)
chk3.configure(bg='white')
chk4_state = BooleanVar()
chk4_state.set(False) # Set check state
chk4 = Checkbutton(window, text="关注", var=chk4_state)
chk4.place(x=250, y=90)
chk4.configure(bg='white')
chk5_state = BooleanVar()
chk5_state.set(False) # Set check state
chk5 = Checkbutton(window, text="保存抽奖记录", var=chk5_state)
chk5.place(x=10, y=210)
chk5.configure(bg='white')
btn = Button(window, text="开始抽奖", command=clicked)
btn.place(x=240, y=210)
btn.configure(bg='deepskyblue')
btn = Button(window, text="关于本程序", command=clicked2)
btn.place(x=150, y=210)
btn.configure(bg='white')
lbl3 = Label(window, text="获奖人数")
lbl3.place(x=10, y=160)
lbl3.configure(bg='white')
lbl4 = Label(window, text="过滤抽奖号(0~10)\n值越小越严格,0=无")
lbl4.place(x=137, y=152)
lbl4.configure(bg='white')
lbl5 = Label(window, text="注: 评论暂未支持楼中楼\n抽取时如果数据过多可能会出现无响应，耐心等待即可")
lbl5.place(x=9, y=113)
lbl5.configure(bg='white')
spin = Spinbox(window, from_=1, to=999, width=5)
spin.place(x=70, y=162)
spin.configure(bg='white')
var = StringVar(window)
var.set("5")
spin2 = Spinbox(window, from_=0, to=10, width=5, textvariable=var)
spin2.place(x=245, y=162)
spin2.configure(bg='white')
output = scrolledtext.ScrolledText(window, width=48, height=20, relief="solid")
output.place(x=320, y=17)
output['state']='disabled'
bar = Progressbar(window, length=290)
bar.place(x=10, y=258)
bar['value']=0
chk1.select()

#显示窗口
window.mainloop()
