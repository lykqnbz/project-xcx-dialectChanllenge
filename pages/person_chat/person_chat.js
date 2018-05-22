import Api from '../../utils/api.js';
var api = new Api();
const innerAudioContext = wx.createInnerAudioContext();
innerAudioContext.obeyMuteSwitch = false;

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
    senderId: null,
    hasData: true,
    loading: false,
    talkList: [],
    senderId: null,
    curTar3Top: "inBottom",
    reasonList: ['内容违法乱纪', '侮辱谩骂', '不是当前语类', '地域攻击'],
    reportMap: {},
    showReport: false,
    selfAccount: null,
    otherAccount: null,
    playMap: { isPlay: false, currentIndex: 10000 },
    queryMap: { createTime: -1, up: false, size: 20, senderId: '' },
    notEarlyData: false,
    talkFormId: '',
  },
  onLoad: function (options) {


    api.getWrap().then((res) => {
      this.setData(res)
    })
    if (!options.senderId) {
      wx.redirectTo({
        url: '/pages/person/person',
      })
      return;
    }
    wx.setNavigationBarTitle({
      title: `${options.username}`,
    })
    this.setData({
      "queryMap.senderId": options.senderId,
      senderId: options.senderId
    }, () => {
      this.getList();
    })

    api.getAccountInfo(options.senderId).then(res => {
      console.info(res)
      wx.setNavigationBarTitle({
        title: res.account.nickname
      })
      this.setData({ otherAccount: res.account })
    })
    api.getInfo().then(res => {
      this.setData({ selfAccount: res })
    })

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
        this.setData({ isRecord: false })
      } else if (res.duration > 30000) {
        wx.showToast({
          title: '录音时间不能超过30秒',
          icon: 'none',
          duration: 2000
        })
      } else {
        const { tempFilePath, duration } = res;
        this.postLetter(tempFilePath, duration);
      }
    })

    innerAudioContext.onPlay((res) => {

      if (this.data.playMap.currentIndex != 10000) {
        var currentIndex = this.data.playMap.currentIndex;
        api.statPlay({
          playId: this.data.talkList[currentIndex].id,
          type: 'letter'
        }).then(res => {
        })
      }
    })

    innerAudioContext.onError((res) => {
      console.log(res.errMsg)
      console.log(res.errCode);
    })

    innerAudioContext.onEnded(() => {
      this.stopPlay();
      console.log('播放结束' + this.data.playMap.currentIndex);
      // var currentIndex = this.data.currentIndex + 1;
      // if (this.data.isRecord) {
      //   this.setData({ playing: false });
      // } else {
      //   if (this.data.follows[currentIndex]) {
      //     var timer = setTimeout(() => {
      //       if (!isStop) {
      //         this.startAutoPlay(currentIndex);
      //       }
      //     }, 1000)
      //     var timers = this.data.timer;
      //     timers.push(timer)
      //     this.setData({ timer: timers });
      //   } else {
      //     this.stopPlay();
      //   }
      // }

    });
  },
  onShow(){
    this.setData({terminal:setTimeout(()=>{
      api.getBizconfig('DIALECT_TALK_TIMER').then(res => {
        this.setData({
          interal: setInterval(() => {
            console.info("自动刷新数据");
            this.showMoreForTalk();
          }, 1000 * res.bizConfig.value)
        })
      })
    },5000)}) 
  },
  touchdown: function (e) {

    this.stopPlay();
    this.setData({ isSpeaking: true }, () => {
      mp3Recorder.start(mp3RecoderOptions);
    })
  },
  touchup: function (e) {
    if (this.data.isSpeaking) {
      console.log("mp3Recorder.stop")
      this.setData({
        isSpeaking: false
      })
      mp3Recorder.stop();
    }
  },
  postLetter(pathFile, duration) {
    api.uploadAccountLetter(pathFile, duration, this.data.senderId, this.data.talkFormId).then(res => {
      wx.showToast({
        icon: 'none',
        title: '私信成功~',
      });
      this.showMoreForTalk(true);
    })
  },
  getList(scroll) {

    if (this.data.hasData) {
      this.setData({ loading: true });
      api.getLetterList(this.data.queryMap).then(res => {
        console.info(res)
        var contentList = res.letters || [];
        contentList.sort((a, b) => {
          return a.createTime - b.createTime;
        })
        var contentItems = this.data.talkList;

        if (this.data.queryMap.up) {
          contentItems.unshift.apply(contentItems, contentList);

          if (contentList.length == 0) {
            this.setData({ notEarlyData: true })
          }
        } else {
          contentItems.push.apply(contentItems, contentList);
        }

        console.info(123)
        var createTime = this.data.queryMap.createTime;
        console.info(createTime)
        if (createTime == -1) {
          scroll = true;
        }
        if (contentList.length > 0) {
          console.info(455666)
          createTime = contentList[contentList.length - 1].createTime;
        }
        var currentTime = 0;
        this.setData({
          hasData: true,
          loading: false,
          talkList: (contentItems || []).map((item) => {
            if (item.createTime > currentTime) {
              item.showTime = true;
              currentTime = item.createTime + 1000 * 60 * 30;
            } else {
              item.showTime = false;
            }
            return item;
          }),
          ["queryMap.createTime"]: createTime
        }, () => {
          if (scroll) {
            this.bindToDownForTalk();
          }

        })
      })
    }


  },

  showMoreForTalk: function (scroll) {

    this.setData({
      ["queryMap.up"]: false,
      hasData: true,
      ["queryMap.createTime"]: this.data.talkList.length > 0 ? this.data.talkList[this.data.talkList.length - 1].createTime : -1
    }, () => {
      this.getList(scroll);
    })
  },
  getEarlyTalk() {
    this.setData({
      ["queryMap.up"]: true,
      hasData: true,
      ["queryMap.createTime"]: this.data.talkList[0].createTime
    }, () => {
      this.getList();
    })
  },
  onHide: function () {
    innerAudioContext.stop();
    clearInterval(this.data.interal);
    clearTimeout(this.data.terminal);
  },
  onUnload: function () {
    innerAudioContext.stop();
    innerAudioContext.offEnded();
    clearInterval(this.data.interal);
    clearTimeout(this.data.terminal);
  },

  bindPlay(e) {
    var index = api.getDataset(e)['index'];
    if (this.data.playMap.currentIndex == index) {
      this.stopPlay();
    } else {

      var talkList = this.data.talkList;
      talkList[index].read = true;
      this.setData({
        talkList: talkList
      })
      this.startAutoPlay(index);
    }

  },
  stopPlay() {
    innerAudioContext.stop();
    this.setData({ playMap: { currentIndex: 10000, isPlay: false } })
  },
  startAutoPlay(index) {
    innerAudioContext.stop();
    this.setData({ playMap: { currentIndex: index, isPlay: true } }, () => {
      innerAudioContext.src = this.data.talkList[index].voiceUrl;
      innerAudioContext.play();


    })
  },

  // 下滑底部
  bindToDownForTalk() {
    console.log("下拉了")
    this.setData({ curTar3Top: "inBottom" })
  },

  // start 举报
  reportShow(e) {
    var id = api.getDataset(e)['id'];
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
  deleteRecord(e) {
    var id = api.getDataset(e)['id'];
    var index = api.getDataset(e)['index'];
    var type = api.getDataset(e)['type'];
    wx.showModal({
      title: '提示',
      content: '确定删除吗',
      success: res => {
        if (res.confirm) {
          api.deleteSquare({ deleteId: id, type: type }).then(res => {
            var talkList = this.data.talkList;
            talkList.splice(index, 1);
            this.setData({ talkList: talkList })

          })
        } else {

        }
      }
    })
  },

  formSubmit(e) {
    this.setData({ talkFormId: e.detail.formId })
  },
})