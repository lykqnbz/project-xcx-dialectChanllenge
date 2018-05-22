import Api from '../../utils/api.js';
var util = require("../../utils/util.js")
var api = new Api();
const mp3Recorder = wx.getRecorderManager();
const innerAudioContext = wx.createInnerAudioContext();
innerAudioContext.obeyMuteSwitch = false;
const mp3RecoderOptions = {
  duration: 600000,
  sampleRate: 16000,
  numberOfChannels: 1,
  encodeBitRate: 48000,
  format: 'mp3',
  //frameSize: 50
}
var isStop = false;
Page({
  data: {
    SHeight: 0,
    SInHeight: 0,
    SInInHeight: 0,
    currentTab: 6,
    currentInInTab2: 2,
    currentInInTab3: 2,
    checkOrpack: '查看',
    // 25个字后省略号
    title: '用方言说出，我爱你你、早安，这个多少钱 你吃饭、早安...',
    shareId: null,
    queryMap: {
      0: { createTime: -1, index: 1, size: 20 },
      1: { createTime: -1, index: 1, size: 20, dialectId: '', dialect: '全部', type: 1, page: 1 },
      2: { dialectId: '', dialect: '', gender: 0, area: '' },
      3: { createTime: -1, index: 1, size: 20, dialectId: '', dialect: '', up: false }
    },
    hasDataMap: { 0: true, 1: true, 2: true, 3: true },
    loadingMap: { 0: false, 1: false, 2: false, 3: false },
    showList: [],
    songList: [],
    talkList: [],
    nearList: [],
    showReport: false,
    reasonList: ['内容违法乱纪', '侮辱谩骂', '不是当前语类', '地域攻击'],
    showDetailQuery: { createTime: -1, index: 1, size: 20, hasData: true },
    showDetailList: [],
    admireMap: {},
    account: null,
    isSpeaking: false,
    songSpeaking: false,
    noteTryImg: '/asset/img/shitingyixia@2x.png',
    voiceList: [],
    voiceMap: { 0: [], 1: [], 2: [], 3: [] },// 10代表的是方言秀的更多
    palyIndexMap: { 0: 0, 1: 0, 2: 0, 3: 0 },
    scrollMap: { 0: 0, 1: 0, 3: 0 },
    playMap: { currentPlayId: '', playType: '', voiceUrl: '', isPlay: false },
    summaryList: [],
    currentType: 'follow',
    notedata: { showNote: false },
    sendData: { showMsg: false },
    reportMap: {},
    songMap: { showSong: false, descLen: 0, titleLen: 0 },
    talkMap: { showTalk: false },
    isClick: false,
    letterMap: null,
    showIf: { showBind: false, showRule: false },
    showSpeakImg: { BG: '/asset/img/newTalkBg.png' },
    timer: [],
    isHide: false,
    interal: null,
    startPlayMap: { 1: true, 3: false },
    curTar3Top: "inBottom",
    talkFormId: null,
    currentTime: 0,
    showLocationButton: false,
    nearSortMap: {
      sex: ['不限', '男', '女'],
      dialect: []
    },
    nearSortChoose: { "sex": "不限", "dialect": "不限","dialectId":"" },
    showFilter: false,
    nowSortChoose: { area: '南方方言', dialect: [] }

  },

  onLoad: function (options) {
    console.info("square onLoad");
    wx.setStorageSync("FROM_SQUARE_BIND_SUCCESS", true);
    if (!wx.getStorageSync("SHOW_SQUARE_NOTICE")) {
      this.setData({ ['showIf.showRule']: true });
      wx.setStorageSync("SHOW_SQUARE_NOTICE", true)
    } else {
      this.setData({ ['showIf.showRule']: false });
    }
    var readMap = wx.getStorageSync('readMap');
    if (!readMap) {
      readMap = {};
    }
    this.setData({ readMap: readMap })
    api.getWrap().then(res => {
      this.setData(res, () => {
        this.setData({
          SHeight: this.data.wrapHeight * (750 / this.data.wrapWidth) - 130,
          SInHeight: this.data.wrapHeight * (750 / this.data.wrapWidth) - 170,
          SInInHeight: this.data.wrapHeight * (750 / this.data.wrapWidth) - 320,
        })
      })
    })
    api.getDialectSummaries().then(res1 => {

      this.setData({ summaryList: res1.summaries }, () => {
        var dialectId1 = null;
        var dialect1 = null;
        var dialectId2 = null;
        var dialect2 = null;

        var currentTab = 0;
        if (options) {
          currentTab = options.currentTab ? parseInt(options.currentTab) : 0;
          // 点击分享进来的链接，则默认进来的方言
          if (currentTab == 1) {
            dialectId1 = options.dialectId;
            dialect1 = options.dialect;
          } else if (currentTab == 3 || currentTab == 2) {
            currentTab = 3;
            dialectId2 = options.dialectId;
            dialect2 = options.dialect;
          }

        }
        api.getInfo(true).then(res => {
          this.setData({ account: res });
          if (res.dialectId) {
            // 绑定了方言，是从首页进来的，则默认绑定的方言
            if (!dialect1) {
              dialectId1 = res.dialectId;
              dialect1 = res.dialect;
            }
            if (!dialectId2) {
              dialectId2 = res.dialectId;
              dialect2 = res.dialect;
            }
          } else {
            // 未绑定方言且从首页进来，，则默认全部
            if (!dialect1) {
              dialectId1 = '';
              dialect1 = '全部';
            }
            // 未绑定方言且从首页进来，，则默认取第一个方言
            if (!dialectId2) {
              dialectId2 = this.data.summaryList[0].id;
              dialect2 = this.data.summaryList[0].dialect;
            }
          }
          this.setData({
            currentTab: currentTab,
            ['hasDataMap.' + currentTab]: true,
            ["queryMap." + 1 + ".dialectId"]: dialectId1,
            ["queryMap." + 1 + ".dialect"]: dialect1,
            ["queryMap." + 3 + ".dialectId"]: dialectId2,
            ["queryMap." + 3 + ".dialect"]: dialect2,

          }, () => {
            this.getMasterData(currentTab);
          })
        })

      });
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

        if (!this.data.songMap.showSong) {
          isStop = false;
        }
        wx.showToast({
          title: '录音时间太短',
          icon: 'none',
          duration: 2000
        })
      } else if (this.data.currentType == 'talk' && res.duration > 30000) {
        wx.showToast({
          title: '录音时间不能超过30秒',
          icon: 'none',
          duration: 2000
        })
      } else {
        const { tempFilePath, duration } = res;

        if (this.data.currentType == 'follow') {
          this.setData({ "notedata.filePath": tempFilePath, "notedata.duration": duration });
        } else if (this.data.currentType == 'song') {
          this.setData({ "songMap.filePath": tempFilePath, "songMap.duration": duration });
        } else if (this.data.currentType == 'talk') {

          this.uploadTalkCreate(tempFilePath, duration);
          // this.setData({ "talkMap.filePath": tempFilePath, "talkMap.duration": duration });
        }

      }
    })
    innerAudioContext.onError((res) => {
      console.log(res.errMsg)
      console.log(res.errCode);
    })

    innerAudioContext.onPlay((res) => {
      if (this.data.playMap.playType == 'global') {
        api.statPlay({
          playId: this.data.voiceMap[this.data.currentTab][this.data.palyIndexMap[this.data.currentTab]].id,
          type: this.data.currentTab == 1 ? 'song' : 'talk'
        }).then(res => {

        })
      }

    })

    innerAudioContext.onEnded(() => {
      this.setData({ "playMap.isPlay": false, "playMap.currentPlayId": '' });
      if (this.data.playMap.playType == 'global') {
        var currentTab = this.data.currentTab;
        console.log('播放结束:', currentTab, this.data.palyIndexMap[currentTab]);

        var playIndex = this.data.palyIndexMap[currentTab] + 1;


        if (this.data.voiceMap[currentTab][playIndex]) {
          var timer = setTimeout(() => {
            if (!isStop) {
              this.startAutoPlay(playIndex, this.data.voiceMap[currentTab][playIndex].id, this.data.voiceMap[currentTab][playIndex].voiceUrl);
            }
          }, 1000)
          var timers = this.data.timer;
          timers.push(timer)
          this.setData({ timer: timers });
        } else {
          this.setData({ ["startPlayMap." + this.data.currentTab]: false })

          this.stopPlay(10000);
        }

      } else {
        console.info(this.data.playMap.playType + "试听结束")
      }
    });
    api.getAppConfig().then(res => {
      this.setData({ letterMap: res })
    })
  },
  startAutoPlay(index, id, voiceUrl) {
    innerAudioContext.stop();
    isStop = false;
    if (index != 10000) {
      this.setData({
        ["palyIndexMap." + this.data.currentTab]: index, "playMap.isPlay": true, "playMap.currentPlayId": id,
        "playMap.voiceUrl": voiceUrl, "playMap.playType": "global"
      }, () => {

        if (this.data.currentTab == 3) {
          var readMap = wx.getStorageSync('readMap');
          if (!readMap) {
            readMap = {};
          }
          readMap[id] = true;
          wx.setStorageSync('readMap', readMap);
          this.setData({ readMap: readMap })
        }
        innerAudioContext.src = voiceUrl;
        innerAudioContext.play();
      })
    }

  },
  stopPlay(index) {
    isStop = true;
    innerAudioContext.stop();
    this.setData({ ["palyIndexMap." + this.data.currentTab]: index, "playMap.isPlay": false, "playMap.currentPlayId": '' })
  },
  showMsg() {
    this.setData({ "sendData.showMsg": true });
  },
  inputMsg(e) {
    var title = e.detail.value.trim("");
    this.setData({ "sendData.content": title })
  },
  sendMsg() {

    if (!this.data.isClick) {
      if (!this.data.sendData.content) {
        wx.showToast({
          icon: 'none',
          title: '请输入话题',
        })
        return;
      }
      this.setData({ isClick: true });
      api.postSendMsg(this.data.sendData.content).then(res => {
        this.setData({ isClick: false })
        wx.showToast({
          icon: 'none',
          title: '发帖成功',
        })
        this.closeMsg();
      })
    } else {
      wx.showToast({
        icon: 'none',
        title: '不要重复点击~',
      })
    }

  },
  refreshLuyin(e) {
    var type = api.getDataset(e)['type'];
    console.info(type)
    if (this.data.playMap.playType == type && this.data.playMap.isPlay) {
      innerAudioContext.stop();
      this.setData({ "playMap.isPlay": false });
      // 继续播放
    }
    if (this.data.currentType == 'follow') {
      this.setData({ "notedata.filePath": null, "notedata.duration": null });
    } else if (this.data.currentType == 'song') {
      this.setData({ "songMap.filePath": null, "songMap.duration": null });
    } else if (this.data.currentType == 'talk') {
      this.setData({ "talkMap.filePath": null, "talkMap.duration": null });
    }

  },

  getMasterData(currentTab) {
    if (this.data.hasDataMap[currentTab]) {
      this.setData({ ['loadingMap.' + currentTab]: true });
      switch (currentTab) {
        case 0:
          this.getShowList();
          break;
        case 1:
          this.getSongList();
          break;
        case 2:
          // 查询附近的人
          console.info(this.data.account.location);
          if (!this.data.account.location || !wx.getStorageSync("LOCATION_" + util.getDateYMD(0))) {
            wx.getLocation({
              type: 'gcj02',
              success: (res) => {
                wx.setStorageSync("LOCATION_" + util.getDateYMD(0), true);
                console.info(res)
                var latitude = res.latitude;
                var longitude = res.longitude;
                api.postLocation(longitude, latitude).then(res => {
                  console.info(res);
                  this.setData({ account: res.account }, () => {
                    this.getNearList();
                  })
                })
                this.setData({ showLocationButton: false })
              },
              fail: res => {
                console.info(res);
                this.setData({ showLocationButton: true });
                this.getNearList();
                // if (this.data.account.location) {
                //   this.getNearList();
                // } else{
                //   this.setData({ showLocationButton: true });
                // }
              }
            })
          } else {

            this.getNearList();
          }
          break;
        case 3:
          this.getTalkList();

          break;
      }

    }

  },
  getNearList() {
    var currentTab = 2;
     this.setData({
      ['loadingMap.' + currentTab]: true
    });
    if (this.data.hasDataMap[currentTab]) {
      console.info("获取附近的人CHAXUN ")
      api.getNear(this.data.queryMap[currentTab]).then(res => {
        console.warn(res.nearList)
        this.setData({
          nearList: res.nearList,
          ['loadingMap.' + currentTab]: false
        });
      })
    }
  },
  getLocation() {
    wx.openSetting({
      success: res => {
        if (res.authSetting['scope.userLocation']) {
          this.getMasterData(2);
        } else {
          this.setData({ showLocationButton: true });
        }
      }
    })
  },
  getShowList() {
    var currentTab = 0;
    if (this.data.hasDataMap[currentTab]) {
      this.setData({ ['loadingMap.' + currentTab]: true });

      api.getShowHome(this.data.queryMap[currentTab]).then(res => {
        console.info(res)
        console.info("配音秀请求第" + this.data.queryMap[currentTab].index + "页数据")
        var contentList = res.shows;
        console.warn(res.shows)
        mergeMap(res.admireMap, this);
        var contentItems = this.data.showList;
        if (this.data.queryMap[currentTab].index == 1) {
          contentItems = [];
        }

        var createTime = this.data.queryMap[currentTab].createTime;
        if (contentList.length > 0) {
          createTime = contentList[contentList.length - 1].createTime;
        }
        if (contentList.length < this.data.queryMap[currentTab].size) {
          this.setData({
            ['loadingMap.' + currentTab]: false,
            ['hasDataMap.' + currentTab]: false,
            showList: contentItems.concat(contentList),
            ["queryMap." + currentTab + ".createTime"]: createTime
          })
        } else {
          this.setData({
            ['hasDataMap.' + currentTab]: true,
            ["queryMap." + currentTab + ".index"]: this.data.queryMap[currentTab].index + 1,
            ['loadingMap.' + currentTab]: false,
            showList: contentItems.concat(contentList),
            ["queryMap." + currentTab + ".createTime"]: createTime
          })
        }
      })
    }

  },
  getTalkList(scroll) {
    var currentTab = 3;

    if (this.data.hasDataMap[currentTab]) {
      this.setData({ ['loadingMap.' + currentTab]: true });
      api.getTalkHome(this.data.queryMap[currentTab]).then(res => {
        console.info(res)
        console.info("桐乡杂谈请求第" + this.data.queryMap[currentTab].index + "页数据")
        var contentList = res.talks;
        contentList.sort((a, b) => {
          return a.createTime - b.createTime;
        })
        var contentItems = this.data.talkList;

        if (this.data.palyIndexMap[this.data.currentTab] != 10000) {
          // 为上拉加载的话，需要处理palyIndexMap
          if (this.data.queryMap[currentTab].up) {

            this.setData({ ["palyIndexMap." + this.data.currentTab]: this.data.palyIndexMap[this.data.currentTab] + (contentList.length - 1) })
          }
        }

        if (this.data.queryMap[currentTab].up) {
          contentItems.unshift.apply(contentItems, contentList);
        } else {
          contentItems.push.apply(contentItems, contentList);
        }

        this.setData({ ["voiceMap." + currentTab]: contentItems, "playMap.playType": 'global' });

        var createTime = this.data.queryMap[currentTab].createTime;

        if (createTime == -1) {
          scroll = true;
        }
        if (contentList.length > 0) {
          createTime = contentList[contentList.length - 1].createTime;
        }


        mergeMap(res.admireMap, this);
        var currentTime = 0;
        this.setData({
          ['hasDataMap.' + currentTab]: true,
          ['loadingMap.' + currentTab]: false,
          talkList: contentItems.map((item) => {
            if (item.createTime > currentTime) {
              item.showTime = true;
              currentTime = item.createTime + 1000 * 60 * 30;
            } else {
              item.showTime = false;
            }
            return item;
          }),
          ["queryMap." + currentTab + ".createTime"]: createTime
        }, () => {
          if (scroll) {
            this.bindToDownForTalk();
          }

        })
      })
    }


  },
  getSongList() {
    var currentTab = 1;
    isStop = false;
    if (this.data.hasDataMap[currentTab]) {
      this.setData({ ['loadingMap.' + currentTab]: true });

      api.getSongHome(this.data.queryMap[currentTab]).then(res => {
        console.info("歌谣请求第" + this.data.queryMap[currentTab].index + "页数据")
        var contentList = res.songs;
        mergeMap(res.admireMap, this);
        var contentItems = this.data.songList;
        if (this.data.queryMap[currentTab].index == 1 && this.data.queryMap[currentTab].type == 1) {
          contentItems = [];
          this.setData({
            ["voiceMap." + currentTab]: contentList, "playMap.playType": 'global', ["palyIndexMap." + currentTab]: 0,
            ["scrollMap." + currentTab]: 0
          }, () => {
            this.startAutoPlay(0, contentList[0].id, contentList[0].voiceUrl)
          });
        } else {
          this.setData({ ["voiceMap." + currentTab]: contentItems.concat(contentList), "playMap.playType": 'global' }, () => {
            if (this.data.palyIndexMap[currentTab] == 10000) {
              if (contentList.length > 0) {
                this.startAutoPlay(contentItems.length, contentList[0].id, contentList[0].voiceUrl);
              }
            }
          });
        }

        var type = this.data.queryMap[currentTab].type;
        var page = this.data.queryMap[currentTab].page + 1;
        var index = this.data.queryMap[currentTab].index + 1;
        var hasMoreData = true;

        if (type == 2 && contentList.length < this.data.queryMap[currentTab].size) {
          hasMoreData = false;
        }

        if (contentList.length < this.data.queryMap[currentTab].size && type == 1) {
          type = 2;
          page = 1;
        }
        var createTime = this.data.queryMap[currentTab].createTime;
        if (contentList.length > 0) {
          createTime = contentList[contentList.length - 1].createTime;
        }
        mergeMap(res.admireMap, this);

        this.setData({
          ['hasDataMap.' + currentTab]: hasMoreData,
          ["queryMap." + currentTab + ".index"]: index,
          ["queryMap." + currentTab + ".page"]: page,
          ["queryMap." + currentTab + ".type"]: type,
          ['loadingMap.' + currentTab]: false,
          songList: contentItems.concat(contentList),
          ["queryMap." + currentTab + ".createTime"]: createTime
        }, () => {
          if (type == 2 && page == 1) {
            this.getSongList();
          }
        })
      })
    }

  },
  /**
   * 第一层滑块绑定事件
   */
  bindChange: function (e) {
    var currentTab = e.detail.current;
    this.setData({ currentTab: e.detail.current });

    if (currentTab == 0) {
      this.stopPlay(this.data.palyIndexMap[currentTab])
      if (this.data.showList.length == 0) {
        this.getMasterData(0);
      }
    } else if (currentTab == 1) {
      isStop = false;
      if (this.data.songList.length == 0) {
        this.getMasterData(1);
      } else {
        var playIndex = this.data.palyIndexMap[currentTab];
        if (playIndex != 10000) {

          this.startAutoPlay(playIndex, this.data.voiceMap[currentTab][playIndex].id,
            this.data.voiceMap[currentTab][playIndex].voiceUrl);
        }
      }

      if (!this.data.account.dialectId) {
        this.setData({ ['showIf.showBind']: true })
      }


    } else if (currentTab == 2) {
      this.stopPlay(this.data.palyIndexMap[currentTab])
      // 附近的人
      // 先获取经纬度
      if (this.data.nearList.length == 0) {
        console.info("开始查询附近的人")
        this.getMasterData(2);
      }
    } else if (currentTab == 3) {
      this.stopPlay(this.data.palyIndexMap[currentTab])
      if (this.data.talkList.length == 0) {
        this.getMasterData(currentTab);
      }
      this.bindToDownForTalk();

      if (!this.data.account.dialectId) {
        this.setData({ ['showIf.showBind']: true })
      }
    }
  },
  /**
   * 顶部按钮切换
   */
  swichNav: function (e) {
    if (this.data.currentTab === e.currentTarget.dataset.current) {
      return false;
    } else {
      this.setData({
        currentTab: e.currentTarget.dataset.current
      });
    }
  },
  onPullDownRefresh: function () {

    console.info("下拉刷新啦~")
    // 在方言秀的首页里面
    if (this.data.currentTab != 3) {
      this.setData({
        ['hasDataMap.' + this.data.currentTab]: true,
        ["queryMap." + this.data.currentTab + ".index"]: 1,
        ["queryMap." + this.data.currentTab + ".createTime"]: -1,
        ["queryMap." + this.data.currentTab + ".type"]: 1,
        ["queryMap." + this.data.currentTab + ".page"]: 1,
      }, () => {
        this.getMasterData(this.data.currentTab);
      })
    }

    wx.stopPullDownRefresh();
  },
  onReachBottom: function () {

  },
  onHide() {
    console.info("onHide")
    this.setData({ isHide: true, currentPlayId: '' });

    this.stopPlay(this.data.palyIndexMap[this.data.currentTab]);
    clearInterval(this.data.interal);
    clearTimeout(this.data.terminal);

  },
  onShow() {
    console.info("square onShow")
    isStop = false;
    this.setData({ isHide: false });
    this.setData({
      terminal: setTimeout(() => {
        api.getBizconfig('DIALECT_TALK_TIMER').then(res => {
          this.setData({
            interal: setInterval(() => {
              if (this.data.currentTab == 3 && !this.data.loadingMap[3]) {
                console.info("自动刷新同乡杂谈数据");
                this.showMoreForTalk();
              }
            }, 1000 * res.bizConfig.value)
          })
        })
      }, 5000)
    })

    var bindSuccess = wx.getStorageSync("FROM_SQUARE_BIND_SUCCESS");
    if (!bindSuccess) {
      console.info("从绑定方言点击后退")
      wx.setStorageSync("FROM_SQUARE_BIND_SUCCESS", true)
      innerAudioContext.onEnded(() => {
        this.setData({ "playMap.isPlay": false, "playMap.currentPlayId": '' });
        if (this.data.playMap.playType == 'global') {
          var currentTab = this.data.currentTab;
          console.log('播放结束:', currentTab, this.data.palyIndexMap[currentTab]);

          var playIndex = this.data.palyIndexMap[currentTab] + 1;


          if (this.data.voiceMap[currentTab][playIndex]) {
            var timer = setTimeout(() => {
              if (!isStop) {
                this.startAutoPlay(playIndex, this.data.voiceMap[currentTab][playIndex].id, this.data.voiceMap[currentTab][playIndex].voiceUrl);
              }
            }, 1000)
            var timers = this.data.timer;
            timers.push(timer)
            this.setData({ timer: timers });
          } else {
            this.setData({ ["startPlayMap." + this.data.currentTab]: false })

            this.stopPlay(10000);
          }

        } else {
          console.info(this.data.playMap.playType + "试听结束")
        }
      });
    }

  },
  onShareAppMessage: function (res) {
    var type = '';
    var title = "";
    var imgurl = '';
    if (res.currentTarget) {
      type = api.getDataset(res)['type'];
    }
    var path = "/pages/square/square?currentTab=" + this.data.currentTab + "&inviterId=" + wx.getStorageSync("uid");
    if (type == 'follow' || this.data.currentTab == 0) {
      path = path + "&from=配音秀";
      title = "[有人@我]没有乡音，何处遣乡愁？快来挑战方言听乡音吧！"
    } else if (type == 'song' || this.data.currentTab == 1) {
      path = path + "&dialectId=" + this.data.queryMap[1].dialectId + "&dialect=" + this.data.queryMap[1].dialect + "&from=谚语歌谣";

      title = this.data.letterMap['songShare'].title.replace('{dialect}', this.data.queryMap[1].dialect);

      if (this.data.letterMap['songShare'].imageUrl) {
        imgurl = this.data.letterMap['songShare'].imageUrl;
      }
    } else if (type == 'talk' || this.data.currentTab == 3) {
      path = path + "&dialectId=" + this.data.queryMap[3].dialectId + "&dialect=" + this.data.queryMap[3].dialect +"&from=老乡群";
      title = this.data.letterMap['talkShare'].title.replace('{dialect}', this.data.queryMap[3].dialect);

      if (this.data.letterMap['talkInvite'].imageUrl) {
        imgurl = this.data.letterMap['talkInvite'].imageUrl;
      }
    } else {
     path = "/pages/index/index" + "?from=附近的人&inviterId=" + wx.getStorageSync("uid");
      title = '这是谁家的方言？也太难了吧！！';
      imgurl = '/asset/img/share.png';
    }

    if(res.from=='button') {
      path = path +"&position=button"
    } else {
      path = path + "&position=common"
    }

    return {
      title: title,
      path: path,
      imageUrl: imgurl,
      success: (res) => {
        api.recordShareLog(path)
      },
      complete: () => {

        if (this.data.currentTab == 1 || this.data.currentTab == 3) {
          var playIndex = this.data.palyIndexMap[this.data.currentTab];
          if (this.data.currentTab != 0 && playIndex != 10000 && this.data.startPlayMap[this.data.currentTab]) {
            this.startAutoPlay(playIndex, this.data.voiceMap[this.data.currentTab][playIndex].id, this.data.voiceMap[this.data.currentTab][playIndex].voiceUrl);
          }
        }

      }
    }
  },
  // 触底事件
  showMoreForShowDetail: function () {
    this.getShowDetail();
    console.log("触底了")
  },
  showMoreForSong: function () {
    this.getSongList();
  },
  showMoreForTalk: function (scroll) {

    this.setData({
      ["queryMap." + this.data.currentTab + ".up"]: false,
      ['hasDataMap.' + this.data.currentTab]: true,
      ["queryMap." + this.data.currentTab + ".createTime"]: this.data.talkList[this.data.talkList.length - 1].createTime
    }, () => {
      this.getTalkList(scroll);
    })
  },
  getEarlyTalk() {
    this.setData({
      ["queryMap." + this.data.currentTab + ".up"]: true,
      ['hasDataMap.' + this.data.currentTab]: true,
      ["queryMap." + this.data.currentTab + ".createTime"]: this.data.talkList[0].createTime
    }, () => {
      this.getTalkList();
    })
  },
  showMoreForShow: function () {
    this.getShowList();
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
        if (type == 'song') {

          var temp = this.data.songList[index];
          temp.admire = temp.admire + 1;

          this.setData({ ['songList[' + index + ']']: temp, })
        } else if (type == 'talk') {

          var temp = this.data.talkList[index];
          temp.admire = temp.admire + 1;
          this.setData({ ['talkList[' + index + ']']: temp, })
        }
        this.setData({ ["admireMap." + id]: true });

        // 处理页面上加1，

      })
    } else {
      wx.showToast({
        icon: "none",
        title: '您已点赞',
      })
    }
  },
  // end report

  touchdown: function (e) {

    if (!this.data.account.dialectId) {
      this.setData({ ['showIf.showBind']: true })
    } else {
      innerAudioContext.stop();
      isStop = true;
      var type = api.getDataset(e)['type'];
      if (type == 'talk') {
        this.setData({ "playMap.currentPlayId": '', currentType: type, isSpeaking: true });
      } else {
        this.setData({ "playMap.currentPlayId": '', songSpeaking: true });
      }
      mp3Recorder.start(mp3RecoderOptions);
    }

  },
  touchup: function (e) {
    console.log("mp3Recorder.stop")
    this.setData({
      isSpeaking: false,
      songSpeaking: false,
    })
    mp3Recorder.stop();

  },
  formSubmit(e) {
    this.setData({ talkFormId: e.detail.formId })
  },
  gotoPlay(e) {
    var id = api.getDataset(e)['id'];
    var index = api.getDataset(e)['index'];
    var voiceUrl = api.getDataset(e)['voiceUrl'];
    if (this.data.playMap.currentPlayId == id && this.data.playMap.isPlay) {

      this.stopPlay(10000);
      this.setData({ ["startPlayMap." + this.data.currentTab]: false })

    } else {
      this.setData({ ["startPlayMap." + this.data.currentTab]: true })
      this.setData({
        "playMap.playType": "global"
      }, () => {
        this.startAutoPlay(index, id, voiceUrl);


      })
    }


  },
  showLuyin(e) {

    if (!this.data.account.dialectId) {
      this.setData({ ['showIf.showBind']: true })
    } else {
      this.stopPlay(this.data.palyIndexMap[this.data.currentTab])
      var type = api.getDataset(e)['type'];
      if (type == 'song') {
        this.setData({ "songMap.showSong": true, "playMap.currentPlayId": '', currentType: type });

      } else if (type == 'talk') {
        this.setData({ "talkMap.showTalk": true, "playMap.currentPlayId": '', currentType: type });

      }
    }

  },

  bindPlay(e) {
    var type = api.getDataset(e)['type'];
    var voiceUrl = '';
    if (type == 'song') {
      voiceUrl = this.data.songMap.filePath;
      this.setData({ "playMap.playType": type, "playMap.voiceUrl": voiceUrl, "playMap.isPlay": true }, () => {
        innerAudioContext.src = voiceUrl;
        innerAudioContext.play();
      })
    } else if (type == 'talk') {
      if (!this.data.talkMap.filePath) {
        wx.showToast({
          icon: 'none',
          title: '未录入成功，请重新录音~',
        })
        return;
      } else {
        voiceUrl = this.data.talkMap.filePath;
        this.setData({ "playMap.playType": type, "playMap.voiceUrl": voiceUrl, "playMap.isPlay": true }, () => {
          innerAudioContext.src = voiceUrl;
          innerAudioContext.play();
        })
      }
    }

  },

  uploadSongCreate() {

    if (!this.data.isClick) {
      if (!this.data.songMap.title) {
        wx.showToast({
          icon: 'none',
          title: '请输入歌谣名称~',
        })
        return;
      }
      if (!this.data.songMap.description) {
        wx.showToast({
          icon: 'none',
          title: '请输入歌谣描述~',
        })
        return;
      }
      if (!this.data.songMap.filePath) {
        wx.showToast({
          icon: 'none',
          title: '请录入歌谣~',
        })
        return;
      }
      this.setData({ isClick: true })
      api.uploadSongCreate(this.data.songMap.filePath, this.data.songMap.title, this.data.songMap.description, this.data.songMap.duration).then(res => {
        this.setData({ isClick: false })
        wx.showToast({
          icon: 'none',
          title: '歌谣录入成功~',
        })
        this.closeSong();
        this.refreshList(1);
        // 录入成功后，要重新刷新


      })
    } else {
      wx.showToast({
        icon: 'none',
        title: '不要重复点击~',
      })
    }
  },
  refreshList(currentTab) {
    this.setData({
      ['hasDataMap.' + currentTab]: true,
      ["queryMap." + currentTab]: {
        createTime: -1, index: 1, dialectId: this.data.queryMap[currentTab].dialectId, dialect: this.data.queryMap[currentTab].dialect,
        page: 1, type: 1
      },
    }, () => {
      this.getMasterData(currentTab);
    })
  },
  uploadTalkCreate(filePath, duration) {

    if (!this.data.isClick) {
      this.setData({ isClick: true });
      api.uploadTalkCreate(filePath, duration,
        this.data.queryMap[3].dialectId, this.data.queryMap[3].dialect, this.data.talkFormId).then(res => {
          this.setData({ isClick: false })
          // wx.showToast({
          //   icon: 'none',
          //   title: '杂谈录入成功~',
          // })

          this.closeTalk();

          // todo 成功后要如何处理
          this.showMoreForTalk(true);

        })
    } else {
      wx.showToast({
        icon: 'none',
        title: '不要重复点击~',
      })
    }
  },
  inputSongtitle(e) {
    var title = e.detail.value.trim("");

    if (title.length > 10) {
      wx.showToast({
        icon: 'none',
        title: '歌谣标题不能超过10个字~',
      })
      title = title.substring(0, 10);
    }
    this.setData({ "songMap.title": title, "songMap.titleLen": title.length })
  },
  inputSongDesc(e) {
    var title = e.detail.value.trim("");
    if (title.length > 64) {
      wx.showToast({
        icon: 'none',
        title: '歌谣描述不能超过64个字~',
      })
      title = title.substring(0, 64);
    }
    this.setData({ "songMap.description": title, "songMap.descLen": title.length })
  },
  // end talk
  moreLanguage: function (e) {
    if (e.currentTarget.dataset.type == "2") {
      if (this.data.currentInInTab2 == 1) {
        this.setData({ currentInInTab2: 0 });

        var playIndex = this.data.palyIndexMap[this.data.currentTab];
        if (playIndex != 10000) {

          this.startAutoPlay(playIndex, this.data.voiceMap[this.data.currentTab][playIndex].id,
            this.data.voiceMap[this.data.currentTab][playIndex].voiceUrl);
        }
      } else {
        this.stopPlay(this.data.palyIndexMap[this.data.currentTab])
        this.setData({ currentInInTab2: 1 });
      }
    } else if (e.currentTarget.dataset.type == "3") {
      if (this.data.currentInInTab3 == 1) {
        this.setData({ currentInInTab3: 0 });
      } else {
        this.stopPlay(this.data.palyIndexMap[this.data.currentTab])
        this.setData({ currentInInTab3: 1 });
      }
    }
  },
  selectDialect(e) {

    var id = api.getDataset(e)['id'];
    var dialect = api.getDataset(e)['dialect'];
    var type = api.getDataset(e)['type'];

    if (type == "2") {
      var currentTab = 1;
      if (this.data.queryMap[1].dialectId != id) {
        this.setData({
          ["queryMap." + currentTab + ".dialectId"]: id,
          ["queryMap." + currentTab + ".dialect"]: dialect,
          ["queryMap." + currentTab + ".index"]: 1,
          ["queryMap." + currentTab + ".createTime"]: -1,
          ["queryMap." + currentTab + ".page"]: 1,
          ["queryMap." + currentTab + ".type"]: 1,
          ['hasDataMap.' + currentTab]: true,
        }, () => {
          this.getSongList();
        })
        this.setData({ currentInInTab2: 0 });
      } else {
        this.setData({ currentInInTab2: 0 });
      }
    } else if (type == "3") {
      var currentTab = 3;
      if (this.data.queryMap[3].dialectId != id) {
        this.setData({
          ["queryMap." + currentTab + ".dialectId"]: id,
          ["queryMap." + currentTab + ".dialect"]: dialect,
          ["queryMap." + currentTab + ".index"]: 1,
          ["queryMap." + currentTab + ".createTime"]: -1,
          ["queryMap." + currentTab + ".up"]: false,
          talkList: [],
          ["voiceMap." + currentTab]: [],
          ["palyIndexMap." + currentTab]: 0,
          ['hasDataMap.' + currentTab]: true,
          ['startPlayMap.' + currentTab]: false,
        }, () => {
          console.info("同乡杂谈 change 方言");
          this.getTalkList();
        })
        this.setData({ currentInInTab3: 0 });
      } else {
        this.setData({ currentInInTab3: 0 });
      }
    }

  },
  onUnload() {
    // innerAudioContext.onEnded(() => {});
    console.info("onUnload")
    this.setData({ isHide: true });

    for (var i = 0; i < this.data.timer.length; i++) {
      console.info("销毁进程")
      clearTimeout(this.data.timer[i]);
    }
    innerAudioContext.offEnded();
    innerAudioContext.stop();
    clearInterval(this.data.interal);
    clearTimeout(this.data.terminal);
  },
  gotoBack() {
    this.setData({ ['showIf.showBind']: false })
  },
  gotoHome() {
    innerAudioContext.stop();
    innerAudioContext.offEnded();
    this.setData({ ['showIf.showBind']: false })
    wx.reLaunch({
      url: '/pages/index/index',
    })
  },
  gotoBind() {
    this.setData({ ['showIf.showBind']: false });
    innerAudioContext.stop();
    isStop = true;
    innerAudioContext.offEnded();
    wx.setStorageSync("FROM_SQUARE_CURRENT", this.data.currentTab)
    wx.navigateTo({
      url: '/pages/bind/bind',
    })
  },
  closeSong() {
    isStop = false;
    this.setData({ songMap: { showSong: false, descLen: 0, titleLen: 0 } });
    var playIndex = this.data.palyIndexMap[this.data.currentTab];
    if (playIndex != 10000) {

      this.startAutoPlay(playIndex, this.data.voiceMap[this.data.currentTab][playIndex].id, this.data.voiceMap[this.data.currentTab][playIndex].voiceUrl);
    }
  },

  closeTalk() {
    this.setData({ talkMap: { showTalk: false } });
  },
  closeReport() {
    this.setData({ showReport: false, reportMap: {} })
  },
  closeMsg() {
    this.setData({ sendData: { showMsg: false } })
  },
  closeRule() {
    this.setData({ ['showIf.showRule']: false })
  },
  gotoPerson(e) {
    var accountId = api.getDataset(e)['accountId'];
    wx.navigateTo({
      url: '/pages/person_other/person_other?accountId=' + accountId,
    })
  },
  // 老乡群下滑底部
  bindToDownForTalk() {
    console.log("下拉了")
    this.setData({ curTar3Top: "inBottom" })
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
            if (type == 'talk') {
              var currentIndex = 0;

              for (var i = 0; i < this.data.talkList.length; i++) {
                if (id == this.data.talkList[i].id) {
                  currentIndex = i;
                  break;
                }
              }
              console.info("删除老乡：", index, currentIndex)
              var talkList = this.data.talkList;
              talkList.splice(currentIndex, 1);
              this.setData({ talkList: talkList })
            } else if (type == 'song') {
              var songList = this.data.songList;
              songList.splice(index, 1);
              this.setData({ songList: songList });
            }
          })
        } else {

        }
      }
    })
  },
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
        var item = { "dialect": res.areaMap.南方地区方言[i].dialect, "dialectId": res.areaMap.南方地区方言[i].id}
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
      ["queryMap." + 2 + ".dialectId"]: this.data.nearSortChoose.dialectId,
      ["queryMap." + 2 + ".dialect"]: this.data.nearSortChoose.dialect,
      ["queryMap." + 2 + ".gender"]: gender,
      showFilter: false
    }, () => {
      this.getNearList()
    });
  },
  
})

function mergeMap(currentMap, _this) {
  var resultMap = _this.data.admireMap;
  for (var key in currentMap) {
    resultMap[key] = currentMap[key];
  }
  _this.setData({ admireMap: resultMap });

}


