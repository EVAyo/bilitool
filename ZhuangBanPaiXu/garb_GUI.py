import requests
import json
import time
import os,sys
from tkinter import *
from tkinter import ttk
from tkinter.filedialog import (askopenfilename,asksaveasfilename)#askopenfilenames,
import tkinter.messagebox
import threading
import base64
try:
    from iconwin import img
except:
    pass
def cookie_to_json(cookies_str):
    cookies_dict={}
    for cookie in cookies_str.split(';'):
        cookies_dict[cookie.split('=')[0]]=cookie.split('=')[-1]
    return cookies_dict
def setIcon(win):
    #释放icon.py所保存的图标，打包exe时要用
    tmp=open('tmp.ico','wb+')
    tmp.write(base64.b64decode(img))#写入到临时文件中
    tmp.close()
    win.iconbitmap("tmp.ico") #设置图标
    os.remove("tmp.ico")           #删除临时图标

#2021年5月16日13:12

version='1.1'
window = Tk()
window.title('装扮顺序排列 版本'+version+' B站：派蒙月饼')
#window.geometry("400x600")
width=390
heigh=600
screenwidth = window.winfo_screenwidth()
screenheight = window.winfo_screenheight()-50
window.geometry('%dx%d+%d+%d'%(width, heigh, (screenwidth-width)/2, (screenheight-heigh)/2))
window.resizable(0,0)
try:
    window.iconbitmap('icon.ico')
except:
    try:
        setIcon(window)
    except:
        pass
lbl = Label(window, text="装扮列表")
listbox = Listbox(window,width=45,height=10,relief='solid',borderwidth=1,selectmode='extended')#,justify='center'
# 向上移动
def list_Up(filter_list):
    selec=listbox.curselection()
    if len(selec)>1:
        #tkinter.messagebox.showwarning('提示','请只选中一个项目！')
        multiple_Up(filter_list,selec)
        return False
    a = listbox.get(ANCHOR)  # 获取选择的列表值
    p = filter_list.index(a) - 1  # 获取选择值在列表中的位置
    if p>=0:
        if p == -1:
            listbox.delete(0, END)  # 清空列表框
        elif p != -1:  # 如果位置不等于-1
            filter_list.insert(p, a)  # 列表中插入位置p，值为选择的值
            del filter_list[p + 2]  # 删除掉原位置的值

            listbox.delete(0, END)  # 清空列表框
        for item in filter_list:  # 循环列表
            listbox.insert(END, item)  # 列表框最后插入值
        #tkinter.messagebox.showinfo("","向上移动了一个位置")
        listbox.activate(p)
        listbox.selection_anchor(p)
        listbox.selection_set(p)
        listbox.see(p)
    return filter_list


# 向下移动
def list_Down(filter_list):
    selec=listbox.curselection()
    if len(selec)>1:
        #tkinter.messagebox.showwarning('提示','请只选中一个项目！')
        multiple_Down(filter_list,selec)
        return False
    a = listbox.get(ANCHOR)
    p = filter_list.index(a) + 2
    if p<=len(m):
        filter_list.insert(p, a)
        del filter_list[p - 2]
        listbox.delete(0, END)
        for item in filter_list:
            listbox.insert(END, item)
        listbox.activate(p-1)
        listbox.selection_anchor(p-1)
        listbox.selection_set(p-1)
        listbox.see(p-1)
    return filter_list

def ApplyChange():
    #if in_glist==None:
    lboxlist=listbox.get('0', END)
    garb_id_list=[]
    for i in lboxlist:
        garb_id_list.append(gt_dict[i])
    '''else:
        garb_id_list=in_glist'''
    print(garb_id_list)
    global chkupdwindow,chklbl1
    chkupdwindow = Toplevel(window)
    chkupdwindow.title('保存修改')
    chkupdwindow.configure(bg='white')
    chkupdwindow.transient(window)
    try:
        chkupdwindow.iconbitmap('icon.ico')
    except:
        try:
            setIcon(chkupdwindow)
        except:
            pass
    width = 300
    heigh = 100
    screenwidth = chkupdwindow.winfo_screenwidth()
    screenheight = chkupdwindow.winfo_screenheight()
    chkupdwindow.geometry('%dx%d+%d+%d'%(width, heigh, (screenwidth-width)/2, (screenheight-heigh)/2))
    chkupdwindow.resizable(0,0)
    chklbl1 = Label(chkupdwindow, text="正在应用排序… (/ω＼*)", justify="center")
    chklbl1.configure(bg='white')
    chklbl1.place(relx = 0.5, rely = 0.4, anchor = "center")
    chkupdthread=threading.Thread(target=do_garb_sort,args=(garb_id_list,))
    chkupdthread.start()
    chkupdwindow.lift()
    chkupdwindow.grab_set()
    chkupdwindow.mainloop()

def do_garb_sort(g_id_list):
    delay=1
    g_id_list=list(reversed(g_id_list))
    print('由于B站后端问题，需额外等待 '+str(delay*len(g_id_list)+1)+' 秒')
    for i in range(len(g_id_list)):
        try:
            cookie_dict=cookie_to_json(cookie)
            csrf_token=cookie_dict.get('bili_jct')
            data={
            "csrf":csrf_token,
            "ids":g_id_list[i],
            }
            res = requests.post(url='http://api.bilibili.com/x/garb/user/suit/asset/list/sort',data=data,headers=header)
            message=json.loads(res.text)
            if not message['code'] == 0:
                chkupdwindow.destroy()
                tkinter.messagebox.showwarning('提示','装扮排序保存失败，可能会导致顺序错乱！\n返回信息为：'+message['message'])
                return False
            chklbl1.configure(text='正在应用修改… (/ω＼*)\n('+str(i+1)+'/'+str(len(g_id_list))+')')
            time.sleep(delay)
        except Exception as e:
            chkupdwindow.destroy()
            tkinter.messagebox.showwarning('提示','保存进程意外中止，可能会导致顺序错乱！\n详细错误信息：'+str(repr(e)))
            return False
    chkupdwindow.destroy()
    tkinter.messagebox.showinfo('提示','装扮排序保存成功！')

def getgarblist():
    global glist,glist_id,gtext,gt_dict
    print('正在获取装扮列表……')
    header={
    "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/88.0.4324.182 Safari/537.36",
    "Cookie":cookie,
    }
    r=requests.get('http://api.bilibili.com/x/garb/user/suit/asset/list?is_fans=true&part=suit&pn=1&ps=999&state=active',headers=header).text
    jdata=json.loads(r)['data']
    garblist=jdata['list']
    glist_id=[]
    glist=[]
    gtext=[]
    gt_dict={}
    #print('>>总共有 '+str(jdata['page']['total'])+' 套装扮<<')
    #print('----------------------------------------')
    for i in range(len(garblist)):
        garba=garblist[i]
        now_id=garba['item']['item_id']
        glist_id.append(now_id)
        glist.append((garba['item']['item_id'],garba['fan']['name'],garba['fan']['number'],))
        now_t='NO.'+str(garba['fan']['number']).rjust(6,'0')+' | '+garba['fan']['name']+' | '+garba['fan']['date']+' | ID:'+str(garba['item']['item_id'])
        gtext.append(now_t)
        gt_dict[now_t]=now_id
        #print(str(i+1)+' '+garba['fan']['name']+'(ID:'+str(garba['item']['item_id'])+') 当前展示：NO.'+str(garba['fan']['number']).rjust(6,'0')+' '+garba['fan']['date'])
        #print(str(i+1)+' NO.'+str(garba['fan']['number']).rjust(6,'0')+' '+garba['fan']['name']+'(ID:'+str(garba['item']['item_id'])+') '+garba['fan']['date'])
    #print('----------------------------------------')
    lbl.configure(text=name+' 装扮列表 总数：'+str(len(glist)))

def Refresh():
    global m
    getgarblist()
    listbox.delete('0',END)
    m=gtext
    for x in m:
        listbox.insert(END, x)
    listbox.selection_anchor(0)
    tkinter.messagebox.showinfo('提示','更新完成！')

def multiple_Up(l,a):
    #print(l,a)
    global m
    for i in range(len(a)):
        if not i==len(a)-1:
            #print(a,i)
            x=a[i+1]
            y=a[i]
            z = x - y
            #print(x,y,z)
            if z != 1:
                tkinter.messagebox.showwarning('提示','请选择单个项目或连续的项目组合！')
                return False
    pos=a[0]
    if pos==0:
        return False
    selec_list=[]
    for i in a:
        selec_list.append(l[i])
    for i in selec_list:
        l.remove(i)
    for i in range(len(a)):
        l.insert(pos+i-1,selec_list[i])
    #print(l)
    m=l
    listbox.delete('0',END)
    for x in m:
        listbox.insert(END, x)
    for i in a:
        listbox.selection_set(i-1)

def multiple_Down(l,a):
    global m
    pos=a[0]
    for i in range(len(a)):
        if not i==len(a)-1:
            #print(a,i)
            x=a[i+1]
            y=a[i]
            z = x - y
            #print(x,y,z)
            if z != 1:
                tkinter.messagebox.showwarning('提示','请选择单个项目或连续的项目组合！')
                return False
    if pos+len(a)>=len(l):
        return False
    selec_list=[]
    for i in a:
        selec_list.append(l[i])
    for i in selec_list:
        l.remove(i)
    for i in range(len(a)):
        l.insert(pos+i+1,selec_list[i])
    #print(l)
    m=l
    listbox.delete('0',END)
    for x in m:
        listbox.insert(END, x)
    for i in a:
        listbox.selection_set(i+1)

def multi_switch_pos(l,a):
    global m
    pos=a[0]
    pos2=0
    posl=0
    pos2l=0
    for i in range(len(a)):
        if not i==len(a)-1:
            #print(a,i)
            x=a[i+1]
            y=a[i]
            z = x - y
            #print(x,y,z)
            if z != 1:
                pos2=pos+i+z
                for j in range(len(a)-posl):
                    pos2l+=1
                    #print(j,len(a)-posl-2)
                    if not j==len(a)-posl-2:
                        #print(a,i+j+2)
                        x=a[i+j+2]
                        y=a[i+j+1]
                        z = x - y
                        #print(x,y,z)
                        if z != 1:
                            tkinter.messagebox.showwarning('提示','请选择两个连续且互相之间不连续的项目组合！')
                            return False
                    else:
                        break
                break
            else:
                posl+=1
    posl+=1
    if pos2==0:
        tkinter.messagebox.showwarning('提示','请选择两个连续且互相之间不连续的项目组合！')
        return False
    posm=pos2-pos-posl
    n=0
    #print(pos,pos2,posm,posl,pos2l)
    l1=[]
    l2=[]
    for i in range(posl):
        l1.append(l[pos+i])
    for i in range(pos2l):
        l2.append(l[pos2+i])
    for i in l1:
        l.remove(i)
    for i in l2:
        l.remove(i)
    pos2=pos+pos2l+posm
    for i in range(len(l2)):
        l.insert(pos+i,l2[i])
    for i in range(len(l1)):
        l.insert(pos2+i,l1[i])
    m=l
    listbox.delete('0',END)
    for x in m:
        listbox.insert(END, x)
    for i in range(posl):
        listbox.selection_set(pos2+i)
    for i in range(pos2l):
        listbox.selection_set(pos+i)

def swapPositions(list, pos1, pos2):
    list[pos1], list[pos2] = list[pos2], list[pos1]
    return list

def switch_pos(filter_list):
    global m
    #print(listbox.curselection())
    selec=listbox.curselection()
    if len(selec)!=2:
        if len(selec)<2:
            tkinter.messagebox.showwarning('提示','对调需要在按住 Ctrl 键的同时选择两个或两组项目！')
            return False
        multi_switch_pos(filter_list,selec)
        return False
    m=swapPositions(m,selec[0],selec[1])
    listbox.delete('0',END)
    for x in m:
        listbox.insert(END, x)
    listbox.selection_set(selec[0])
    listbox.selection_set(selec[1])

def ReadSavFile():
    try:
        savpath=askopenfilename(title='选择装扮列表文件',initialdir=os.path.dirname(os.path.realpath(sys.argv[0])),initialfile='', filetypes=[('装扮列表','*.txt')])
        savf=open(savpath,'r')
    except:
        return False
    try:
        g_list=eval(json.loads(savf.readline().replace('$&',' ')))
        #print(g_list)
        savf.close()
    except Exception as e:
        print(e)
        tkinter.messagebox.showwarning('提示','文件内容有误！')
        return False
    global glist,glist_id,gtext,gt_dict
    glist=[]
    glist_id=[]
    gtext=[]
    gt_dict=g_list
    for i in g_list.keys():
        now_garb=i.strip(' | ')
        #print(g_list[i],now_garb)
        glist_id.append(g_list[i])
        glist.append((g_list[i],now_garb[1],now_garb[0],))
        gtext.append(i)
    lbl.configure(text=name+' 装扮列表 总数：'+str(len(glist)))
    listbox.delete('0',END)
    m=gtext
    for x in m:
        listbox.insert(END, x)
    listbox.selection_anchor(0)
    tkinter.messagebox.showinfo('提示','读取完成！')

def WriteSavFile():
    lboxlist=listbox.get('0', END)
    garb_key_list=[]
    garb_id_list=[]
    for i in lboxlist:
        garb_key_list.append(i.replace(' ','$&'))
        garb_id_list.append(i[-4:])
    g_dict={}
    for i in range(len(lboxlist)):
        g_dict[garb_key_list[i]]=int(garb_id_list[i])
    try:
        savpath=asksaveasfilename(title='选择装扮列表文件保存路径',initialdir=os.path.dirname(os.path.realpath(sys.argv[0])),initialfile='garb_'+time.strftime("%Y%m%d-%H%M",time.localtime(time.time()))+'.txt', filetypes=[('装扮列表','*.txt')])
        savf=open(savpath,'w')
    except:
        return False
    savf.write(json.dumps(str(g_dict),ensure_ascii=False).replace(' ',''))#.replace('[','').replace(']','')
    savf.close()
    tkinter.messagebox.showinfo('提示','保存完成！文件位于：'+savpath)

try:
    cook=open('cookie.txt','r')
except:
    tkinter.messagebox.showwarning('提示','请先在目录下放入格式正确的cookie.txt！')
    sys.exit()
cookie=cook.read()
cook.close()
print('尝试使用预设的cookie进行模拟登录……')
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
    cookie_dict=cookie_to_json(cookie)
    csrf_token=cookie_dict.get('bili_jct')
    print('模拟登录成功，UID：'+str(myuid)+'，用户名：'+name+'，等级 '+str(level)+'，拥有 '+str(coins)+' 枚硬币')
except:
    tkinter.messagebox.showwarning('提示','模拟登录失败，可能是cookie过期或未登录，请重新获取cookie！')
    sys.exit()

#m = [0,1,2,3,4,5,6,7,8,9,10,11]
getgarblist()
m=gtext
for x in m:
    listbox.insert(END, x)
btn = ttk.Button(window, text="向上移动", command=lambda:list_Up(m))
btn2 = ttk.Button(window, text="向下移动", command=lambda:list_Down(m))
btn5 = ttk.Button(window, text="位置对调", command=lambda:switch_pos(m))
btn6 = ttk.Button(window, text="从文件读取", command=ReadSavFile)
btn7 = ttk.Button(window, text="保存至文件", command=WriteSavFile)
btn4 = ttk.Button(window, text="更新列表", command=Refresh)
btn3 = ttk.Button(window, text="保存修改", command=ApplyChange)
lbl.pack()
listbox.pack(fill=BOTH, expand=True)
btn.pack()
btn2.pack()
btn5.pack()
#btn4.pack()
#btn3.pack()
#btn3.place(x=10, y=560)
btn3.place(x=270, y=561)
btn4.place(x=270, y=531)
btn6.place(x=30, y=531)
btn7.place(x=30, y=561)
listbox.selection_anchor(0)
window.mainloop()
