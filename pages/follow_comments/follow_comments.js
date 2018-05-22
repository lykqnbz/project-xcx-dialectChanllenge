import Api from '../../utils/api.js'
var api = new Api();

const innerAudioContext = wx.createInnerAudioContext();
innerAudioContext.obeyMuteSwitch = false;
Page({
  data: {
    percentage: 40,
    // 举报
    showReport: false,
    reportMap: {},
    jokeId: '',
    page: 1,
    size: 20,
    hasMoreData: true,
    loading: false,
    reasonList: ['内容违法乱纪', '侮辱谩骂', '不是当前语类', '地域攻击'],
    admireMap: {}
  },
  onLoad: function (options) {
    api.getWrap().then((res) => { this.setData(res) });

    if (options.jokeId) {
      this.setData({ jokeId: options.jokeId }, () => {
        this.getList();
      })
    } else {
      // wx.reLaunch({
      //   url: '/pages/index/index',
      // })
    }

    innerAudioContext.onEnded(() => {
      console.info("停止播放");
      var joke = this.data.joke;
      joke.isPlay = false;
      joke.curTimeVal = 0;

      this.setData({
        joke: joke
      })
    });

    api.getAppConfig().then(res => {
      this.setData({ letterMap: res })
    })
  },
  updateTime(that) {
    innerAudioContext.onTimeUpdate((res) => {

      if (!innerAudioContext.paused) {
        var duration = parseInt(innerAudioContext.duration * 1000);
        var currentTime = parseInt(innerAudioContext.currentTime * 1000);
        that.setData({
          "joke.curTimeVal": (currentTime / duration).toFixed(2) * 100,
          "joke.currentTime": innerAudioContext.currentTime
        })

        if (innerAudioContext.duration.toFixed(2) - innerAudioContext.currentTime.toFixed(2)
          <= 0) {
          that.setData({
            "joke.curTimeVal": 0,
            "joke.currentTime": 0
          })

        }
      }
    })

  },

  startPlay() {
    var joke = this.data.joke;
    if (this.data.joke.isPlay) {
      joke.isPlay = false;
      this.setData({
        joke: joke
      })
      innerAudioContext.pause();
    } else {
      innerAudioContext.src = this.data.joke.voiceUrl;
      innerAudioContext.startTime = this.data.joke.currentTime || 0;
      innerAudioContext.play();
      joke.isPlay = true;

      this.setData({
        joke: joke
      })
      innerAudioContext.onPlay((res) => {

        api.statPlay({
          playId: this.data.jokeId,
          type: 'joke'
        }).then(res => {
          this.setData({
            hasRead: true
          })
        })
        this.updateTime(this);
      })

    }
  },
  getList() {
    if (this.data.hasMoreData) {
      api.getJokeComment({ jokeId: this.data.jokeId, page: this.data.page, size: this.data.size }).then(res => {
        console.info(res)
        let admireMap = this.data.admireMap;
        Object.assign(admireMap, res.admireMap);

        var contentList = res.newCommentList;
        var contentItems = this.data.newCommentList;

        var hasDataMap = true;

        if (contentList.length < this.data.size) {
          hasDataMap = false;
        }
        if (this.data.page == 1) {
          this.setData(res);
          this.setData({
            page: this.data.page + 1,
            hasMoreData: hasDataMap,
            ifDouble: true,
          })
        } else {


          this.setData({
            newCommentList: contentItems.concat(contentList),
            admireMap: admireMap,
            ifDouble: true,
            page: this.data.page + 1,
            hasMoreData: hasDataMap
          })
        }

      })
    }
  },
  onReady: function () {

  },
  onShow: function () {

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
    var jokeId = this.data.jokeId;
    if (res.from == 'button') {

      title = this.data.letterMap['jokeShare'].title;
      imgurl = this.data.letterMap['jokeShare'].imageUrl;
      path = "/pages/follow_comments/follow_comments?jokeId=" + jokeId + "&from=配音秀评论&position=button&inviterId=" + wx.getStorageSync("uid");
    } else {
      title = this.data.letterMap['jokeShare'].title;
      imgurl = this.data.letterMap['jokeShare'].imageUrl;
      path = "/pages/follow_comments/follow_comments?jokeId=" + jokeId + "&from=配音秀评论&position=common&inviterId=" + wx.getStorageSync("uid");
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

  despiseHandle(e) {
    var id = api.getDataset(e)['id'];
    var type = api.getDataset(e)['type'];
    var index = api.getDataset(e)['index'];
    var item = this.data.joke;
    if (!this.data.hasDespise && !this.data.hasAdmire) {
      api.postDespise(id, type).then(res => {
        wx.showToast({
          icon: "none",
          title: '轻踩成功',
        })
        item.despise = item.despise + 1;
        this.setData({
          joke: item,
          hasDespise: true
        })

      })
    } else {

    }
  },

  admireHandle(e) {
    var id = api.getDataset(e)['id'];
    var type = api.getDataset(e)['type'];
    var index = api.getDataset(e)['index'];

    if (type == 'joke') {
      var item = this.data.joke;
      if (!this.data.hasAdmire && !this.data.hasDespise) {
        api.postSquareAdmire({ admireId: id, type: type }).then(res => {
          wx.showToast({
            icon: "none",
            title: '点赞成功',
          })
          item.admire = item.admire + 1;
          this.setData({
            joke: item,
            hasAdmire: true
          })

        })
      } else {

      }
    } else {
      if (!this.data.admireMap[id]) {
        api.postSquareAdmire({ admireId: id, type: type }).then(res => {
          wx.showToast({
            icon: "none",
            title: '点赞成功',
          })
          for (var i = 0; i < this.data.hotCommentList.length; i++) {
            var item = this.data.hotCommentList[i];
            if (item.id == id) {
              item.admire = item.admire + 1;
              this.setData({
                ['hotCommentList[' + i + ']']: item,
                ["admireMap." + id]: true
              })
              break;
            }
          }
          for (var i = 0; i < this.data.newCommentList.length; i++) {
            var item = this.data.newCommentList[i];
            if (item.id == id) {
              item.admire = item.admire + 1;
              this.setData({
                ['newCommentList[' + i + ']']: item,
                ["admireMap." + id]: true
              })
              break;
            }
          }


        })
      } else {
        wx.showToast({
          icon: "none",
          title: '您已点赞',
        })
      }
    }
  },
  inputComment(e) {
    var reason = e.detail.value.trim("");
    this.setData({ comment: reason })
  },
  postComment() {
    if (!this.data.comment) {
      wx.showToast({
        icon: "none",
        title: '请输入评论',
      })
    } else {

      if (!this.data.isClick) {
        this.setData({ isClick: true })
        api.postJokeComment(this.data.jokeId, this.data.comment).then(res => {
          this.setData({ isClick: false })
          console.info(res);
          if (res.code == 87014) {
            wx.showToast({
              icon: "none",
              title: '存在敏感字眼，请重新输入',
            })
          } else {
            this.setData({ comment: '' })
            wx.showToast({
              icon: "none",
              title: '评论成功',
            })
            this.setData({ page: 1, hasMoreData: true }, () => {
              this.getList();
            })
          }

        })
      }

    }
  },

  gotoIndex() {
    wx.reLaunch({
      url: '/pages/index/index',
    })
  },
})