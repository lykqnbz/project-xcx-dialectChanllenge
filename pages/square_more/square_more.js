import Api from '../../utils/api.js';
var api = new Api();
const innerAudioContext = wx.createInnerAudioContext();
innerAudioContext.obeyMuteSwitch = false;
var isStop=false;

const mp3Recorder = wx.getRecorderManager();
const mp3RecoderOptions = {
  duration: 600000,
  sampleRate: 16000,
  numberOfChannels: 1,
  encodeBitRate: 48000,
  format: 'mp3',
  //frameSize: 50
}
Page({
  data: {
    scrollHeight: 0,
    showId: '5adb110d54122a21209614b0',
    dialectId: '5ab87392bb2b94441999dfcb',
    dialect: '闽南话',
    type: 1, // 当type == 1 表示获取的12小时内。 type == 2 表示获取12小时后的 
    page: 1, // 当前type下的，第几页
    index: 1, // 总的第几页
    size: 20, // 页大小，
    show: {}, // 帖子
    follows: [], // 跟帖的
    admireMap: {}, // 是否点赞了,
    hasMoreData:true,
    loading:false,
    timer:[],
    currentIndex:0,
    isPlay:false,
    // 是否正在录音
    isRecord:false,
    reasonList: ['内容违法乱纪', '侮辱谩骂', '不是当前语类', '地域攻击'],
    luyinTimer:null,
    showBind:false,
    account:{}
  },

  setWrapHeightAndWidth() {
    api.getWrap().then(res => {
      this.setData(res, () => {
        this.setData({
          scrollHeight: this.data.wrapHeight * (750 / this.data.wrapWidth) - 150,
        })
      })
    })
  },

  onLoad: function (options) {
    console.log(options);

    api.getInfo().then(res => {
      this.setData({account:res})
    })
    this.setWrapHeightAndWidth();
    let showId = options.showId;
    let dialectId = options.dialectId;
    let dialect = options.dialect;
    // 校验一下参数
    if (showId == undefined || dialectId == undefined || dialect == undefined) {
      wx.showModal({
        title: '提示',
        content: '参数错误',
        showCancel: false,
        complete: () => {
          wx.reLaunch({
            url: '/pages/index/index',
          });
        }
      });
      return;
    } else {

      wx.setNavigationBarTitle({
        title: `${dialect}`,
      })

      this.setData({
        showId: showId,
        dialectId: dialectId,
        dialect: dialect,
        type: 1,
        page: 1,
        index: 1
      }, () => { this.getShowFollowDetail() });
    }

    mp3Recorder.onStart(() => {
      console.log('mp3Recorder.onStart()...')
    })
    mp3Recorder.onError((res) => {
      console.info(res);
      if (res.errMsg == "operateRecorder:fail auth deny") {
        wx.openSetting({
          success: res => {

          }
        })
      }
    })

    mp3Recorder.onStop((res) => {
      console.log('mp3Recorder.onStop() ' + res)
      if (res.duration < 1000) {
        wx.showToast({
          title: '录音时间太短',
          icon: 'none',
          duration: 2000
        })
        this.setData({ isRecord: false})
      } else if (res.duration>30000){
        wx.showToast({
          title: '录音时间不能超过30秒',
          icon: 'none',
          duration: 2000
        })
      } else {
          const { tempFilePath, duration } = res;
          this.setData({ "notedata.filePath": tempFilePath, "notedata.duration": duration });
      }
    })
    innerAudioContext.onPlay((res) => {
      api.statPlay({
        playId: this.data.follows[this.data.currentIndex].id,
        type: 'follow'
      }).then(res => {

      })
    })

    innerAudioContext.onError((res) => {
      console.log(res.errMsg)
      console.log(res.errCode);
    })

    innerAudioContext.onEnded(() => {
      this.setData({ isPlay: false })
      console.log('播放结束' + this.data.currentIndex);
      var currentIndex = this.data.currentIndex + 1;

      if (this.data.isRecord) {
        this.setData({ playing: false });
      } else {
        if (this.data.follows[currentIndex]) {
          var timer = setTimeout(() => {
            if (!isStop) {
              this.startAutoPlay(currentIndex);
            }
          }, 1000)
          var timers = this.data.timer;
          timers.push(timer)
          this.setData({ timer: timers });
        } else {
          this.stopPlay();
        }
      }
      
    });
  },
  touchdown: function (e) {

    if (!this.data.account.dialectId) {
      this.setData({ showBind: true });
    } else {
      isStop = true;
      innerAudioContext.stop();
      this.setData({ "notedata.showId": this.data.showId, isRecord: true, isPlay: false, });

      var luyinTimer = setTimeout(() => {
        this.setData({ isSpeaking: true }, () => {
          mp3Recorder.start(mp3RecoderOptions);
        })

      }, 1000);
      this.setData({ luyinTimer: luyinTimer })
    }
    
  },
  touchup: function (e) {

    clearTimeout(this.data.luyinTimer);

    if (this.data.isSpeaking){
      console.log("mp3Recorder.stop")
      this.setData({
        isSpeaking: false
      })
      mp3Recorder.stop();
    } else {
      wx.showToast({
        icon:"none",
        title: '请长按录音',
      })
    }

  },
  uploadShowFollow() {
    if (!this.data.isClick) {
      if (!this.data.notedata.filePath) {
        wx.showToast({
          icon: 'none',
          title: '请录入语音~',
        })
        return;
      }
      this.setData({ isClick: true });
      api.uploadShowFollow(this.data.notedata.filePath, this.data.notedata.showId, this.data.notedata.duration).then(res => {
        this.setData({ isClick: false });
        console.info("录音成功")
        console.info(res)
        wx.showToast({
          icon: 'none',
          title: '录音成功~',
        })


        this.setData({
          type: 1,
          page: 1,
          index: 1
        }, () => { this.getShowFollowDetail() });
        this.refreshRecord();
      })
    } else {
      wx.showToast({
        icon: 'none',
        title: '不要重复点击~',
      })
    }
  },
  tryPlay() {
    innerAudioContext.src = this.data.notedata.filePath;
    this.setData({playing:true});
    innerAudioContext.play();
  },
  refreshRecord(){
    this.setData({ playing:false, notedata: {}, isRecord: false }, () => {
      if (this.data.currentIndex != 10000) {
        this.startAutoPlay(this.data.currentIndex);
      }
    })
  },

  // 获取数据的
  getShowFollowDetail() {
  
    if (!this.data.hasMoreData) {
      return ;
    }
    this.setData({ loading: true });

    api.getShowFollowDetail({
      showId: this.data.showId,
      dialectId: this.data.dialectId,
      dialect: this.data.dialect,
      type: this.data.type,
      index: this.data.index,
      page: this.data.page,
      size: this.data.size
    }).then(res => {
      let resData = res.data;
      let type = this.data.type;
      let admireMap = this.data.admireMap;
      Object.assign(admireMap, res.data.admireMap);
      let page = this.data.page + 1;
      let index = this.data.index + 1;

      var currentList = this.data.follows;

      if (this.data.index == 1 && this.data.type ==1) {
        currentList =[];
      }
      let follows = currentList.concat(resData.follows);
      let hasMoreData= true;
      // 当type == 1 表示获取的12小时内。 type == 2 表示获取12小时后的 

      if (type == 2 && resData.follows.length < this.data.size) {
        hasMoreData= false
      }

      if (resData.follows.length < this.data.size && this.data.type == 1) {
        type = 2;
        page = 1;
      }

      if (this.data.index ==1){
        this.startAutoPlay(0);
      } else {
        // 执行完成了则加载新的后从新的开始播放
        if(this.data.currentIndex == 10000) {
          if (resData.follows.length >0) {
            this.startAutoPlay(this.data.follows.length);
          }
        }
      }
      this.setData({
        follows: follows,
        admireMap: admireMap,
        type: type,
        page: page,
        index: index,
        hasMoreData: hasMoreData,
        loading:false,
        show: resData.show
      }, () => {
        if (type == 2 && page == 1) {
          this.getShowFollowDetail();
        }
      });
    });
  },
  loadMore(){
    this.getShowFollowDetail();
  },
  startAutoPlay(index) {
    innerAudioContext.stop();
    isStop=false;
    this.setData({ currentIndex: index, isPlay: true }, () => {
      innerAudioContext.src = this.data.follows[this.data.currentIndex].voiceUrl;
      innerAudioContext.play();
    })
  },
  stopPlay() {
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
      isStop = true;
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
  onHide() {
    console.info("onHide");
    this.stopPlay();
    isStop = true;
  },
  onShow() {
    api.getInfo(true).then(res => {
      this.setData({ account: res });
    })
    isStop = false;
  },
  deleteShow(e){
    var id = api.getDataset(e)['id'];
    var index = api.getDataset(e)['index'];
    wx.showModal({
      title: '提示',
      content: '确定删除吗',
      success: res => {
        if (res.confirm) {
          api.deleteSquare({ deleteId:id, type:'follow'}).then(res=>{
            var follows = this.data.follows;
            follows.splice(index, 1);
            this.setData({ follows: follows})
          })
        } else {

        }
        }
    })
  },
  reportShow(e) {
    var id = api.getDataset(e)['id'];
    console.info(id)
    var type = api.getDataset(e)['type'];
    var username = api.getDataset(e)['name'];
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
        var temp = this.data.follows[index];
        temp.admire = temp.admire + 1;
        this.setData({ ['follows[' + index + ']']: temp, ["admireMap." + id]: true })
      })
    } else {
      wx.showToast({
        icon: "none",
        title: '您已点赞',
      })
    }
  },
  gotoBack() {
    this.setData({ showBind: false })
  },
  gotoBind() {
    this.setData({ showBind: false });
    innerAudioContext.stop();
    isStop = true;
    wx.navigateTo({
      url: '/pages/bind/bind',
    })
  },
  gotoPerson(e) {
    var accountId = api.getDataset(e)['accountId'];
    innerAudioContext.stop();
    isStop = true;
    wx.navigateTo({
      url: '/pages/person_other/person_other?accountId=' + accountId,
    })
  },
})