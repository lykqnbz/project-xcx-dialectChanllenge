import Api from '../../utils/api.js'
var api = new Api();
var util = require("../../utils/util.js")
const innerAudioContext = wx.createInnerAudioContext();
innerAudioContext.obeyMuteSwitch = false;
var interval;
const mp3Recorder = wx.getRecorderManager();
const mp3RecoderOptions = {
  duration: 600000,
  sampleRate: 16000,
  numberOfChannels: 1,
  encodeBitRate: 48000,
  format: 'mp3',
  //frameSize: 50,
  count:20,
}

Page({
  data: {
    currentTab: 0,
    percentage: 40,
    queryMap: {
      0: { type: 'recommend', dialectId: '', dialect: '', gender: 0, area: '', page: 1, size: 20 },
      1: { type: 'hot', dialectId: '', dialect: '', gender: 0, area: '', page: 1, size: 20 },
      2: { type: 'new', dialectId: '', dialect: '', gender: 0, area: '', page: 1, size: 20 },
    },
    listMap: { 0: [], 1: [], 2: [] },
    hasDataMap: { 0: true, 1: true, 2: true },
    loadingMap: { 0: false, 1: false, 2: false },
    // 举报
    showReport: false,
    reportMap: {},
    reasonList: ['内容违法乱纪', '侮辱谩骂', '不是当前语类', '地域攻击'],
    // 筛选
    nearSortMap: {
      sex: ['不限', '男', '女'],
      dialect: []
    },
    nearSortChoose: { "sex": "不限", "dialect": "不限", "dialectId": "" },
    showFilter: false,
    nowSortChoose: { area: '南方方言', dialect: [] },
    admireMap: {},
    despiseMap: {},
    playMap: { playIndex: 10000, playId: '', duration: 0, curTimeVal: 0 },
    showJoke: false,
    joke: {},
    readMap:{}
  },
  onLoad: function (options) {

  
    api.getWrap().then((res) => { this.setData(res) });

    api.getAppConfig().then(res => {
      this.setData({ letterMap: res })
    })

    this.getList(this.data.currentTab);
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
      if (res.duration < 5000) {
        wx.showToast({
          title: '录音时间至少5秒',
          icon: 'none',
          duration: 2000
        })
      } else if (res.duration > 60000) {
        wx.showToast({
          title: '录音时间不能超过60秒',
          icon: 'none',
          duration: 2000
        })

        }else {
        console.log(res)
        const { tempFilePath, duration } = res;
        this.setData({ joke: { filePath: tempFilePath, duration: duration } });
      }
    })

    innerAudioContext.onEnded(() => {
      console.info("停止播放");
      this.stopPlay()
    });

  
    
  },
  updateTime(that) {
    innerAudioContext.onTimeUpdate((res) => {
      console.info("onTimeUpdate", innerAudioContext.currentTime)
      if (!innerAudioContext.paused) {
     
        var duration = parseInt(innerAudioContext.duration * 1000);
        var currentTime = parseInt(innerAudioContext.currentTime * 1000);
        this.setData({
          "playMap.curTimeVal": (currentTime / duration).toFixed(2) * 100,
          "playMap.currentTime": innerAudioContext.currentTime
        })

        if (innerAudioContext.duration.toFixed(2) - innerAudioContext.currentTime.toFixed(2)
          <= 0) {
          this.setData({
            "playMap.curTimeVal": 0
          })

        }

      }
    
     
    })
    
  },
  startPlay(e) {
    innerAudioContext.stop();
    var index = api.getDataset(e)['index'];

    if (index == this.data.playMap.playIndex) {
      innerAudioContext.pause();
      console.info("展厅播放")
      this.setData({ "playMap.playIndex": 10000 })
    } else {
      var item = this.data.listMap[this.data.currentTab][index];
      var duration = util.numberToRound(item.duration / 1000);
      if (item.id == this.data.playMap.playId) {
        this.setData({ "playMap.playIndex": index });
        innerAudioContext.startTime = this.data.playMap.currentTime || 0;
        innerAudioContext.play();
        innerAudioContext.onPlay((res) => {
          console.info("onPlay")
          this.updateTime(this);
        })
      } else {
        innerAudioContext.src = item.voiceUrl;
        this.setData({ playMap: { tab:this.data.currentTab,
        playIndex: index, playId: item.id, duration: duration, curTimeVal: 0, currentTime: 0 } })
        innerAudioContext.startTime = 0;
        innerAudioContext.play();
        innerAudioContext.onPlay((res) => {
          if (!this.data.trying) {
            api.statPlay({
              playId: this.data.playMap.playId,
              type: 'joke'
            }).then(res => {
              this.setData({
                ["readMap." + this.data.playMap.playId]: true
              })
            })
            this.updateTime(this);
          }
        })
      }


    }
  },

  getList(currentTab) {
    if (this.data.hasDataMap[currentTab]) {
      api.getJokeList(this.data.queryMap[currentTab]).then(res => {
        console.info(res)
        let admireMap = this.data.admireMap;
        Object.assign(admireMap, res.admireMap);

        let readMap = this.data.readMap;
        Object.assign(readMap, res.readMap);


        let despiseMap = this.data.despiseMap;
        Object.assign(despiseMap, res.despiseMap);

        var contentList = res.jokeList;
        var contentItems = this.data.listMap[currentTab];

        if (this.data.queryMap[currentTab].page == 1) {
          contentItems = [];
        }
        var hasDataMap = true;

        if (contentList.length < this.data.queryMap.size) {
          hasDataMap = false;
        }

        this.setData({
          ['listMap.' + currentTab]: contentItems.concat(contentList),
          ['hasDataMap.' + currentTab]: hasDataMap,
          ["queryMap." + currentTab + ".page"]: this.data.queryMap[currentTab].page + 1,
          ['loadingMap.' + currentTab]: false,
          despiseMap: despiseMap,
          admireMap: admireMap,
          readMap: readMap,
          ifDouble: true
        })
      })
    }
  },
  showMore: function (e) {
    var ifDouble = this.data.ifDouble;
    if (ifDouble) {
      this.setData({ ifDouble: false })
      this.getList(this.data.currentTab);
    }
  },

  stopPlay() {
    innerAudioContext.stop();
    this.setData({ playMap: { playIndex: 10000, playId: '', duration: 0, curTimeVal: 0 } })
  },

  onShow: function () {
    api.getInfo(true).then(res => {
      this.setData({ account: res })
    })
  },
  onHide: function () {
    innerAudioContext.stop();
  },
  onUnload: function () {
    innerAudioContext.stop();
    innerAudioContext.offEnded();
  },
  onShareAppMessage: function (res) {
    console.info(res);
    var path = '';
    var title = '';
    var imgurl = '';
    if (res.from == 'button') {
      var jokeId = res.target.dataset.id;
      title = this.data.letterMap['jokeShare'].title;
      imgurl = this.data.letterMap['jokeShare'].imageUrl;
      path = "/pages/joke_comments/joke_comments?jokeId=" + jokeId +"&from=方言笑话&position=button&inviterId="+wx.getStorageSync("uid");
    } else {
      title = this.data.letterMap['jokeShare'].title;
      imgurl = this.data.letterMap['jokeShare'].imageUrl;
      path = "/pages/joke/joke" + "?from=方言笑话&position=common&inviterId=" + wx.getStorageSync("uid");
    }

  
    return {
      title: title,
      path: path,
      imageUrl: imgurl,
      success: (res) => {
        api.recordShareLog(path)

      },
      complete: () => {

      }
    }
  },


  bindChange: function (e) {
    var currentTab = e.detail.current
    this.setData({ currentTab: e.detail.current });

    if (this.data.listMap[currentTab].length == 0) {
      this.getList(currentTab);
    }
    this.stopPlay();
  },
  swichNav: function (e) {
    if (this.data.currentTab === e.currentTarget.dataset.current) {
      return false;
    } else {
      this.setData({
        currentTab: e.currentTarget.dataset.current
      });
    }
  },
  // 举报
  reportShow: function (e) {
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

  // 筛选
  openFilter() {
    this.getSummaryList();
    this.setData({ showFilter: true })
  },
  preventBubbling() {
  },
  cloneFilter() {
    this.setData({ showFilter: false })
  },
  selectFilter(e) {
    var sex = api.getDataset(e)['sex'];
    var dialect = api.getDataset(e)['dialect'];
    var dialectId = api.getDataset(e)['dialectid'];
    if (sex != undefined) {
      this.setData({
        ["nearSortChoose.sex"]: sex,
      });
    } else if (dialect != undefined) {
      this.setData({
        ["nearSortChoose.dialect"]: dialect,
        ["nearSortChoose.dialectId"]: dialectId,
      });
    }


  },
  getSummaryList() {
    api.getDialectSummariesNew().then(res => {
      console.warn(res)
      var summary = { "南方方言": [{ "dialect": "不限", "dialectId": "", }], "北方方言": [{ "dialect": "不限", "dialectId": "", }], "西北方言": [{ "dialect": "不限", "dialectId": "", }] };
      console.warn(summary)
      for (var i = 0; i < res.areaMap.南方地区方言.length; i++) {
        var item = { "dialect": res.areaMap.南方地区方言[i].dialect, "dialectId": res.areaMap.南方地区方言[i].id }
        summary.南方方言.push(item)
      }
      for (var i = 0; i < res.areaMap.北方地区方言.length; i++) {
        var item = { "dialect": res.areaMap.北方地区方言[i].dialect, "dialectId": res.areaMap.北方地区方言[i].id }
        summary.北方方言.push(item)
      }
      for (var i = 0; i < res.areaMap.西北地区方言.length; i++) {
        var item = { "dialect": res.areaMap.西北地区方言[i].dialect, "dialectId": res.areaMap.西北地区方言[i].id }
        summary.西北方言.push(item)
      }
      this.setData({
        ['nearSortMap.dialect']: summary
      }, () => {
        this.setData({
          ['nowSortChoose.dialect']: this.data.nearSortMap.dialect.南方方言
        })
      })
    })
  },
  changeDialectArea(e) {
    var area = api.getDataset(e)['area'];
    this.setData({
      ['nowSortChoose.area']: area,
      ['nowSortChoose.dialect']: this.data.nearSortMap.dialect[area]
    })
  },
  filterFinish() {
    var gender = 0;
    switch (this.data.nearSortChoose.sex) {
      case "男": gender = 1; break;
      case "女": gender = 2; break;
    }
    this.setData({
      ["queryMap." + this.data.currentTab + ".dialectId"]: this.data.nearSortChoose.dialectId,
      ["queryMap." + this.data.currentTab + ".dialect"]: this.data.nearSortChoose.dialect,
      ["queryMap." + this.data.currentTab + ".page"]: 1,
      ["queryMap." + this.data.currentTab + ".gender"]: gender,
      showFilter: false
    }, () => {
      // 获取列表;
      this.getList(this.data.currentTab);
    });
  },


  despiseHandle(e) {
    var id = api.getDataset(e)['id'];
    var type = api.getDataset(e)['type'];
    var index = api.getDataset(e)['index'];
    var item = this.data.listMap[this.data.currentTab][index];
    if (!this.data.despiseMap[id] && !this.data.admireMap[id]) {
      api.postDespise(id, type).then(res => {
        wx.showToast({
          icon: "none",
          title: '轻踩成功',
        })
        for (var i = 0; i < 3; i++) {
          var list = this.data.listMap[i];

          for (var j = 0; j < list.length; j++) {
            if (list[j].id == id) {
              list[j].despise = list[j].despise + 1;
              break;
            }
          }
          this.setData({
            ['listMap.' + i]: list,
            ["despiseMap." + id]: true
          })

        }

      })
    } else {
   
    }
  },

  admireHandle(e) {
    var id = api.getDataset(e)['id'];
    var type = api.getDataset(e)['type'];
    var index = api.getDataset(e)['index'];
    if (!this.data.admireMap[id] && !this.data.despiseMap[id]) {
      api.postSquareAdmire({ admireId: id, type: type }).then(res => {
        wx.showToast({
          icon: "none",
          title: '点赞成功',
        })

        for (var i = 0; i < 3; i++) {
          var list = this.data.listMap[i];

          for (var j = 0; j < list.length; j++) {
            if (list[j].id == id) {
              list[j].admire = list[j].admire + 1;
              break;
            }
          }
          this.setData({
            ['listMap.' + i]: list,
            ["admireMap." + id]: true
          })

        }
      })
    } else {
    
    }
  },
  showJoke() {
    if (!this.data.account.dialect) {
      this.setData({ showBind: true })
    } else {
      this.stopPlay();
      this.setData({ showJoke: true });
    }
  },
  closeJoke() {
    innerAudioContext.stop();
    this.setData({ joke: {}, trying: false, showJoke: false })
  },
  // 绑定方言
  gotoBack() {
    this.setData({ showBind: false })
  },
  gotoBind() {
    this.setData({ showBind: false });
    this.stopPlay();
    wx.navigateTo({
      url: '/pages/bind/bind',
    })
  },
  touchdown: function () {

    //touchdown_mp3: function () {
    console.log("mp3Recorder.start with" + mp3RecoderOptions)
    var _this = this;
    this.setData({
      isSpeaking: true,
      touchdown:20,
    })
    
    mp3Recorder.start(mp3RecoderOptions);
  },
  touchup: function () {
    console.log("mp3Recorder.stop")
    this.setData({
      isSpeaking: false,
      touchdown: 20,
    })
    mp3Recorder.stop();
  },
  bindPlay() {
    this.setData({ trying: true });
    innerAudioContext.src = this.data.joke.filePath;
    innerAudioContext.startTime = 0;
    innerAudioContext.play();
  },
  refreshLuyin() {
    innerAudioContext.stop();
    this.setData({ joke: {}, trying: false })
  },
  uploadCreate() {

    innerAudioContext.stop();
    if (!this.data.joke.filePath) {
      wx.showToast({
        icon: "none",
        title: '请录入语音',
      })
      return;
    }

    if (!this.data.isClick){
      this.setData({ isClick:true})
      api.postJoke(this.data.joke.filePath, this.data.joke.duration).then(res => {
        wx.showToast({
          icon: "none",
          title: '录入成功',
        })
        this.setData({ joke: {}, trying: false, showJoke: false,isClick:false });

        if (this.data.currentTab != 2) {
          this.setData({
            currentTab: 2,
            ["queryMap." + 2]: { type: 'new', dialectId: '', dialect: '', gender: 0, area: '', page: 1, size: 20 }
          }, () => {
            this.getList(2);
          })
        } else {
          this.setData({
            ['hasDataMap.' + 2]: true,
            ["queryMap." + 2]: { type: 'new', dialectId: '', dialect: '', gender: 0, area: '', page: 1, size: 20 }
          }, () => {
            console.info("refresh")
            this.getList(2);
          })
        }

      })
    }
  
  },
  onPullDownRefresh: function () {

    console.info("下拉刷新啦~")

    this.setData({
      queryMap: {
        0: { type: 'recommend', dialectId: '', dialect: '', gender: 0, area: '', page: 1, size: 20 },
        1: { type: 'hot', dialectId: '', dialect: '', gender: 0, area: '', page: 1, size: 20 },
        2: { type: 'new', dialectId: '', dialect: '', gender: 0, area: '', page: 1, size: 20 },
      },
      listMap: { 0: [], 1: [], 2: [] },
      hasDataMap: { 0: true, 1: true, 2: true },
      loadingMap: { 0: false, 1: false, 2: false },
    }, () => {
      this.getList(this.data.currentTab);
    })

    wx.stopPullDownRefresh();
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
              for (var i = 0; i < 3; i++) {
                var list = this.data.listMap[i];
                for (var j = 0; j < list.length; j++) {
                  if (list[j].id == id) {
                    list.splice(j, 1);
                    break;
                  }
                }
                this.setData({
                  ['listMap.' + i]: list
                })

              }
          })


        } else {

        }
      }
    })
  },
})