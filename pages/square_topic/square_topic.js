import Api from '../../utils/api.js';
var api = new Api();
const innerAudioContext = wx.createInnerAudioContext();
innerAudioContext.obeyMuteSwitch = false;
var isStop = false;
Page({
  data: {
    scrollHeight: 0,
    moveAem: { "left": "2", "right": "2", "centen": "2" },
    showReport: false,
    reasonList: ['内容违法乱纪', '侮辱谩骂', '不是当前语类', '地域攻击'],
    currentIndex:0,
    account:null,
    showBind:false,
    timer:[],
    letterMap:{},
    loading:false
  },
  onLoad: function (options) {
    console.info("onLoad")

    api.getAppConfig().then(res => {
      this.setData({ letterMap: res })
    })

  
        this.setData({ showId: options.showId,loading:true }, () => {
          api.getShowById(options.showId).then(res => {
            if (res.code == 4001) {
              wx.showToast({
                icon: 'none',
                title: '找不到该配音秀',
              })
              wx.redirectTo({
                url: '/pages/square/square',
              })
              return;
            }
            this.setData(res.data);
            this.setData({ loading: false})
            if (res.data.topFollows.length > 0) {
              this.startAutoPlay(0)
            }
          })
        })
  
   
 
    api.getWrap().then(res => {
      this.setData(res, () => {
        this.setData({
          scrollHeight: this.data.wrapHeight * (750 / this.data.wrapWidth) - 150,
        })
      })
    })
    innerAudioContext.onPlay((res) => {
      var currentIndex = this.data.currentIndex;
      var follow = this.data.topFollows[currentIndex];
      console.info(follow)
      api.statPlay({
        playId: follow.id,
      type:'follow'}).then(res=>{

      })
    })
    innerAudioContext.onError((res) => {
      console.log(res.errMsg)
      console.log(res.errCode);
    })

    innerAudioContext.onEnded(() => {
      this.setData({isPlay: false })
      console.log('播放结束' + this.data.currentIndex);
      var currentIndex = this.data.currentIndex+1;
      if (this.data.topFollows[currentIndex] ) {
         var timer = setTimeout(()=>{
          if (!isStop) {
            this.startAutoPlay(currentIndex);
          }
        },1000)
        var timers = this.data.timer;
        timers.push(timer)
        this.setData({ timer: timers});
      } else {
        this.stopPlay();
      }
    });
  },
  onShow(){
  api.getInfo(true).then(res => {
    this.setData({ account: res });
  })
  isStop = false;
  },

  onShareAppMessage: function (res) {
    innerAudioContext.stop();

    var path = '/pages/square_topic/square_topic?showId=' + this.data.showId + "&inviterId=" + wx.getStorageSync("uid")+"&from=配音秀详情";

    if (res.from == 'button') {
      path = path + "&position=button"
    } else {
      path = path + "&position=common"
    }

    return {
      title: this.data.letterMap['showShare'].title.replace('{content}', this.data.show.content),
      path: path,
      // imageUrl: this.data.show.coverUrl,
      success: (res) => {
        api.recordShareLog(path)
      },
      complete: () => {

        if (this.data.currentIndex != 10000) {
          console.info("分享完后继续播放")
          this.startAutoPlay(this.data.currentIndex);
        }
      }
    }
  },
  startAutoPlay(index){
    innerAudioContext.stop();
    isStop=false;
    this.setData({ currentIndex: index, isPlay: true }, () => {
      innerAudioContext.src = this.data.topFollows[index].voiceUrl;
      innerAudioContext.play();
    })
  },
  stopPlay(){
    innerAudioContext.stop();
    this.setData({ currentIndex: 10000, isPlay: false })
  },
  bindPlay(e) {
    console.info(e)
    var index = api.getDataset(e)['index'];
    console.info(index)
    if (index == this.data.currentIndex) {
      console.info("stop")
      this.stopPlay();
      isStop=true;
    } else {
      isStop = false;
      this.startAutoPlay(index);
    }
   
  },
  onUnload() {
    console.info("onUnload")
    for (var i = 0; i < this.data.timer.length; i++) {
      console.info("销毁进程")
      clearTimeout(this.data.timer[i]);
    }
    innerAudioContext.stop();
    innerAudioContext.offEnded();
  },
  onHide(){
    console.info("onHide")
    // innerAudioContext.stop();

    this.stopPlay();
    isStop=true;
  },
  bindscroll: function () {
    this.setData({ ['moveAem.left']: 1, ['moveAem.center']: 1, ['moveAem.right']: 1 })
    clearTimeout(this.timeoutId);
    this.timeoutId = setTimeout(function () {
      this.setData({ ['moveAem.left']: 0, ['moveAem.center']: 0, ['moveAem.right']: 0 })
      delete this.timeoutId;
    }.bind(this), 500);
  },
  reportShow(e) {
    var id = api.getDataset(e)['id'];
    console.info(id)
    var type = api.getDataset(e)['type'];
    var username = api.getDataset(e)['username'];
    this.setData({
      showReport: true,
      reportMap: { reportId: id, type: type, reason: '', otherReason: '', username: username }
    })
  },
  selectReason(e) {
    var reason = api.getDataset(e)['reason'];
    this.setData({ 'reportMap.reason': reason });

  },
  inputReason(e) {
    var reason = e.detail.value.trim("");
    this.setData({ "reportMap.otherReason": reason })
  },
  postReport() {
    if (!this.data.reportMap.reason && !this.data.reportMap.otherReason) {
      wx.showToast({
        icon: 'none',
        title: '请选择一个选项或输入原因',
      })
      return;
    }
    api.postSquareReport(this.data.reportMap).then(res => {
      wx.showToast({
        icon: 'none',
        title: '举报成功',
      })
      this.setData({ showReport: false })
    })
  },
  closeReport() {
    this.setData({ showReport: false, reportMap: {} })
  },
  admireHandle(e) {
    var id = api.getDataset(e)['id'];
    var type = api.getDataset(e)['type'];
    var index = api.getDataset(e)['index'];
    var dialectId = api.getDataset(e)['dialectId'];
    if (!this.data.admireMap[id]) {
      api.postSquareAdmire({ admireId: id, type: type, dialectId: dialectId }).then(res => {
        wx.showToast({
          icon: "none",
          title: '点赞成功',
        })
        var temp = this.data.topFollows[index];
        temp.admire = temp.admire + 1;
        this.setData({ ['topFollows[' + index + ']']: temp, ["admireMap." + id]: true })
      })
    } else {
      wx.showToast({
        icon: "none",
        title: '您已点赞',
      })
    }
  },
  gotoLuyin(){
    console.info(this.data.account)
    if (!this.data.account.dialectId) {
      this.setData({ showBind: true });
    } else {

      wx.navigateTo({
        url: '/pages/square_more/square_more?showId=' + this.data.showId + "&dialectId=" + this.data.account.dialectId
        + "&dialect=" + this.data.account.dialect,
      })
    }
  },
  gotoBack() {
    this.setData({ showBind: false })
  },
  gotoBind() {
    this.setData({ showBind: false });
    innerAudioContext.stop();
    isStop=true;
    wx.navigateTo({
      url: '/pages/bind/bind',
    })
  },
  gotoPerson(e) {
    console.warn(22222)
    var accountId = api.getDataset(e)['accountId'];
    innerAudioContext.stop();
    isStop = true;
    wx.navigateTo({
      url: '/pages/person_other/person_other?accountId=' + accountId,
    })
  },
})