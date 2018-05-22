// pages/play/play.js
import Api from '../../utils/api.js';
import Config from '../../utils/config.js';

var api = new Api();

Page({
  data: {
    // 题目
    question: {},
    // 答题卡数量
    answerNo: null,
    // 求助者
    helpers: [],
    // 下一题id
    nextQuestionId: '',
    // 记录被选择的选项
    optionList: [],
    animationData: {},
    // 弹窗的控制：showTrue：回答正确；showNone：没有答题卡；showPass：答案已传递
    showMap: { 'showTrue': false, 'showNone': false, 'showPass': false, 'showEnd': false },
    // 标记是否是求助者
    forHelp: false,
    // 标记音频的播放状态
    isPlay: true,
    // 小人图片路径
    gifImg: '/asset/img/bb2.png',
    // 求助滚动的答案
    friendAnswer: {},
    // 用户头像
    avatarUrl: '',
    // 证书封面
    imagePro: '',
    bannerImg: {
      '客家话': '/asset/img/kejia.png', '四川话': '/asset/img/sichuan.png', '粤语': '/asset/img/yueyu.png',
      '东北话': '/asset/img/dongbei.png', '湖南话': '/asset/img/hunan.png', '浙江话': '/asset/img/zhejiang.png',
      '上海话': '/asset/img/shanghai.png', '闽南话': '/asset/img/minnan.png', '潮汕话': '/asset/img/chaoshan.png'
    },
    currentTop: 74,
    caller: '',
    // 是否有弹幕播放
    isMove: false,
    moveNum: null,
    timeTask: null,
    isClick: false,
    continueClick: false,
    showReport: false,
    reportReason: '',
    account: null,
    summary: null,
    reportItems: ['违法乱纪', '存在脏话', '无正确选项', '选项中有多个答案', '不属于该分类方言'],
    showOfficialAdvert: false,
    letterMap: {},
    showNoCard:false

  },
  onLoad: function (options) {
    //记录shareSource用户跟踪用户进来的来源
    getApp().globalData.shareSource = options.shareSource

    // 初始化动画
    var animation = wx.createAnimation({
      duration: 500,
      timingFunction: 'linear',
    })
    this.animation = animation
    api.getWrapHeight().then((res) => { this.setData({ wrapHeight: res }); })
    console.log('play页面的参数', options);

    if (options.pass != undefined && options.dialect != undefined) {

      // 标记是否是求助者
      var caller = '';
      // var id = getApp().globalData.account.id;
      console.info('======', getApp().globalData.account)

      if (options.caller != undefined && options.type != undefined) {
        caller = options.caller;
        api.getInfo().then(res => {
          if (caller != getApp().globalData.account.id) {
            this.setData({ forHelp: true, caller: caller })
          }
        })

      }
      console.info('caller：' + caller)

      // 获取单个关卡信息
      this.getPass(options.dialect, options.pass, caller);
    } else {
      wx.reLaunch({
        url: '/pages/index/index',
      });
    }
    wx.showShareMenu({
      withShareTicket: true
    })

    api.getAdShow().then((res) => {
      this.setData(res)
    })

    api.getAppConfig().then(res => {
      this.setData({ letterMap: res })
    })
  },

  onShow: function () {

    api.getInfo().then(res => {
      this.setData({ account: res });

      if (res.nickname.indexOf('test_') > -1) {
        api.getBizconfig('BUTTON_SHARE_CHECK_MESSAGE').then(res => {
          this.setData({
            shareTitle: res.bizConfig.value
          })
          console.info('按钮的话术：', res.bizConfig.value)
        })
      } else {
        api.getBizconfig('BUTTON_SHARE_MESSAGE').then(res => {
          this.setData({
            shareTitle: res.bizConfig.value
          })
          console.info('按钮的话术：', res.bizConfig.value)
        })
      }
    })


  },

  onUnload: function () {
    wx.stopBackgroundAudio();
    clearInterval(this.data.timeTask);
  },
  /**
   * 获取单个关卡信息
   */
  getPass(dialect, pass, caller) {

    api.getPass(dialect, pass, caller).then((res) => {
      console.log('关卡信息', res);
      var options = res.question.options;
      var optionList = [];
      for (let i = 0; i < options.length; i++) {
        let optionMap = {};
        optionMap['answer'] = options[i];
        optionMap['enable'] = false;// 是否显示
        optionMap['isTrue'] = false;// 是否正确
        optionList.push(optionMap);
      }
      console.log('选项信息', optionList);
      // 求助者没有下个关卡的id，需要做判断
      var nextQuestionId = '';
      if (res.nextQuestionId != undefined) {
        nextQuestionId = res.nextQuestionId;
      }

      this.setData({
        optionList: optionList,
        question: res.question,
        answerNo: res.answerNo,
        helpers: res.helpers || [],
        nextQuestionId: nextQuestionId,
        isMove: false,
        friendAnswer: {},
        reportReason: '',
        // 下一关卡时重置数据
        showMap: { 'showTrue': false, 'showNone': false, 'showPass': false, 'showEnd': false }
      }, () => {
        // 自动播放音频
        this.playVoice();
        wx.setNavigationBarTitle({
          title: `${res.question.dialect}-${res.question.pass}/${res.passNo}`,
        })

        // 弹幕的动画
        this.getTimeTask(res.question.id);
      });

    });
  },

  /**
   * 查询弹幕的定时器
   */
  getTimeTask(questionId) {
    console.info('--请求弹幕信息--')
    api.getFriendAnswer(questionId).then(res => {
      // 如果有弹幕的话
      if (res.helpers && res.helpers.length > 0 && !this.data.isMove) {
        // 调用动画效果
        this.getFriendAnswer(res.helpers, this.data.question);
      }
    })
  },

  // getTimeTask() {
  //   if (this.data.timeTask == null) {
  //     var timeTask = setInterval(() => {
  //       console.info('--请求弹幕信息--')
  //       api.getFriendAnswer(this.data.question.id).then(res => {
  //         // 如果有弹幕的话
  //         if (res.helpers && res.helpers.length > 0 && !this.data.isMove) {
  //           // 调用动画效果
  //           this.getFriendAnswer(res.helpers, this.data.question);
  //           clearInterval(timeTask)
  //         }
  //       })

  //     }, 3000);
  //     this.setData({ timeTask: timeTask })
  //   }
  // },

  /**
   * 获得求助的弹幕
   */
  getFriendAnswer(helpers, question) {
    return new Promise((resolve, reject) => {
      if (helpers && helpers.length > 0) {
        let helper = helpers[helpers.length - 1];
        var friendAnswer = {
          nickname: helper.helperNickname,
          avatarUrl: helper.helperAvatarUrl
        };
        switch (helper.answer) {
          case question.options[0]: friendAnswer['answer'] = 'A'; break;
          case question.options[1]: friendAnswer['answer'] = 'B'; break;
          case question.options[2]: friendAnswer['answer'] = 'C'; break;
          case question.options[3]: friendAnswer['answer'] = 'D'; break;
        }
        this.setData({ friendAnswer: friendAnswer, isMove: true }, () => {
          this.animatMove();
          var moveNum = setInterval(() => {
            this.animatMove();
          }, 10000)
          this.setData({ moveNum: moveNum });
        })
      }

    })
  },

  /**
   * 判断选项是否正确
   */
  getOption: function (event) {
    wx.reportAnalytics('click_one_answer', {
    });
    if (!this.data.isClick) {
      this.setData({ isClick: true });
      setTimeout(() => { this.setData({ isClick: false }) }, 500);

      var answer = api.getDataset(event)['answer'];
      // 先判断是否是求助者
      if (this.data.forHelp) {
        // 求助者的id
        var caller = this.data.caller;
        console.info('---caller---', caller)
        // 如果是求助者,只提交答案，不进行判断
        api.postAnswer(this.data.question.id, answer, caller).then(res => {
          this.setData({ showMap: { 'showTrue': false, 'showNone': false, 'showPass': true, 'showEnd': false } })

        })

      } else {

        // 判断答题卡数量
        if (this.data.answerNo > 0) {

          // 判断是否已经点击过
          var flag = false;
          for (var i = 0; i < this.data.optionList.length; i++) {
            if (answer == this.data.optionList[i].answer && this.data.optionList[i].enable) {
              flag = true;
              break;
            }
          }

          if (!flag) {
            api.postAnswer(this.data.question.id, answer).then(res => {
              console.info(res)
              if (res.result) {

                // 显示图标
                var optionList = this.data.optionList;
                for (let i = 0; i < optionList.length; i++) {
                  if (optionList[i].answer == answer) {
                    optionList[i].enable = true;
                    optionList[i].isTrue = true;
                    break;
                  }
                }

                this.setData({
                  optionList: optionList,
                  passOver: res.passOver,
                  endOver: res.endOver,
                  summary: res.summary
                })
                // 成功音效
                wx.playBackgroundAudio({
                  dataUrl: Config.SUCCESS_BGM
                })


                setTimeout(() => {
                  clearInterval(this.data.moveNum);
                  if (!res.passOver && res.endOver) {
                    this.setData({ "showMap.showPro": true });
                  } else if (res.passOver && res.endOver) {
                    this.setData({ "showMap.showEnd": true });
                  } else {
                    this.bindToNext();
                    // this.setData({ "showMap.showTrue": true});
                  }
                }, 1000)
              } else {
                // 答案错误
                // 显示图标
                var optionList = this.data.optionList;
                for (let i = 0; i < optionList.length; i++) {
                  if (optionList[i].answer == answer) {
                    optionList[i].enable = true;
                    optionList[i].isTrue = false;
                    break;
                  }
                }
                this.setData({
                  answerNo: res.answerNo,
                  optionList: optionList
                });

                // 失败音效
                wx.playBackgroundAudio({
                  dataUrl: Config.FAIL_BGM
                })
              }
            })
          }
        } else {
          // 数量不够，弹窗提示
          this.setData({
            showMap: { 'showTrue': false, 'showNone': true, 'showPass': false, 'showEnd': false }
          })
        }
      }
    }

  },

  /**
   * 跳转至下一题
   */
  bindToNext() {
    this.getPass(this.data.question.dialect, this.data.question.pass + 1, '');
  },
  /**
   * 重新玩当前的关卡
   */
  reStartCurr() {
    this.getPass(this.data.question.dialect, this.data.question.pass, '');
  },
  // 获得证书后，还能继续答题。
  continuePlay() {
    if (!this.data.continueClick) {
      this.setData({ continueClick: true });
      setTimeout(() => { this.setData({ continueClick: false }) }, 500);
      this.setData({ "showMap.showPro": false });

      //开始下一题
      this.getPass(this.data.question.dialect, this.data.question.pass + 1, '');
    }
  },
  // 挑战其他的方言
  playOther() {
    this.setData({ "showMap.showEnd": false, "showMap.showPass": false });
    wx.navigateTo({
      url: '/pages/summary/summary',
    })


  },

  /**
   * 设置分享页面
   */
  onShareAppMessage: function (res) {
    wx.reportAnalytics('click_play_share', {
    });
    var shareType = "";
    console.info(shareType)
    var that = this;
    var path = '/pages/index/index?shareSource=play_share';
    var title = this.data.letterMap['play_share'].title.replace('{nickname}', this.data.account.nickname).replace('{方言}', this.data.question.dialect);
    var showTitle = '分享成功！';

    var imageUrl = this.data.letterMap['play_share'].imageUrl;
    if (res.from == 'button') {
      shareType = res.target.dataset.type;
      if ('求助' == res.target.dataset.type) {
        path = '/pages/play/play?type=help&dialect=' + this.data.question.dialect + '&pass=' + this.data.question.pass + '&caller='
          + wx.getStorageSync('uid') + '&shareSource=help_share';
        title = this.data.letterMap['play_share_help'].title.replace('{nickname}', this.data.account.nickname).replace('{方言}', this.data.question.dialect);
        console.info('分享种类', this.data.question.dialect)
        console.info('分享关卡', this.data.question.pass)
        console.info('分享id', wx.getStorageSync('uid'))
        console.log(path)
        imageUrl = this.data.letterMap['play_share_help'].imageUrl;
        showTitle = '求助成功！';
      } else if ('炫耀' == res.target.dataset.type) {
        path = '/pages/index/index?shareSource=cert_share';
        title = '不就是' + this.data.question.dialect + '嘛？简单~';
        imageUrl = '';
        this.setData({ currentTop: -50 });
      }

      path = path + "&from=答题&position=" + shareType + "&inviterId=" + wx.getStorageSync("uid");
    } else {
      path = path + "&from=答题&position=common&inviterId=" + wx.getStorageSync("uid");
    }

    return {
      title: title,
      path: path,
      imageUrl: imageUrl,
      success: function (res) {
        // 判断是否是分享到群
        that.setData({ currentTop: 74 })
        console.warn(res.shareTickets)
        if (res.shareTickets) {
          // 转发成功,上报ID
          wx.getShareInfo({
            shareTicket: res.shareTickets[0],
            success(res) {
              api.postGroup(res.encryptedData, res.iv, "share").then(res => {
                console.info('是否分享过', res.earn)
                if (res.earn) {
                  var answerNo = that.data.answerNo + res.earn;
                  that.setData({
                    answerNo: answerNo
                  })
                  console.warn(res)
                  if (res.shareMsg != undefined) {
                    wx.showToast({
                      icon: "none",
                      title: res.shareMsg,
                    })
                  } else {
                    wx.showToast({
                      title: showTitle,
                    })
                  }
                } else {
                  that.setData({ showNoCard: true })
                }

              })
            }
          })
        } else {
          if (shareType == '没答题卡') {
            console.info(shareType)
            api.postGroup('', '', "share").then(res => {
              if (res.earn) {
                var answerNo = that.data.answerNo + res.earn;
                that.setData({
                  answerNo: answerNo
                })
                if (res.shareMsg != undefined) {
                  wx.showToast({
                    title: res.shareMsg,
                  })
                } else {
                  wx.showToast({
                    title: showTitle,
                  })
                }
              } else {
                that.setData({ showNoCard: true })
              }
            })
          }
        }
        api.recordShareLog(path)

      },
      fail: function (res) {
        that.setData({ currentTop: 74 })
      }
    }
  },

  /**
   * 跳转至首页--答案已传递弹窗
   */
  bindToIndex() {
    wx.reLaunch({
      url: '/pages/index/index',
    })
  },

  /**
   * 播放音频
   */
  playVoice() {

    wx.playBackgroundAudio({
      dataUrl: this.data.question.question,
    })
    this.setData({ backgroundPlay: true }, () => {
      wx.onBackgroundAudioPlay(() => {
        // 区分音效和背景音乐
        if (this.data.backgroundPlay) {
          this.setData({
            isPlay: false,
            gifImg: '/asset/img/bb1.gif'
          });
        }
      });
      wx.onBackgroundAudioStop(() => {
        this.setData({
          isPlay: true,
          backgroundPlay: false,
          gifImg: '/asset/img/bb2.png'
        })
      })
    })
  },

  onHide: function () {
    // 停止音乐
    wx.stopBackgroundAudio();

  },

  /**
   * 跳转到证书页面
   */
  bindToList() {
    wx.redirectTo({
      url: '/pages/list/list',
    })
  },

  // 关闭证书窗口
  close: function (e) {
    switch (e.currentTarget.dataset.sort) {
      case "none": this.setData({ showMap: { showNone: false } }); break;
      case "pass": this.setData({ showMap: { showPass: false } }); break;
    }
  },

  /**
   *  动画组
   */
  animatMove: function () {
    this.animation.translateX(-800).step({ duration: 8000, });
    this.setData({
      animationData: this.animation.export()
    })

    setTimeout(function () {
      this.animation.opacity(0).step({ duration: 500, });
      this.setData({
        animationData: this.animation.export()
      })
      setTimeout(function () {
        this.animation.translateX(0).step({ duration: 500, });
        this.setData({
          animationData: this.animation.export()
        })
        setTimeout(function () {
          this.animation.opacity(1).step({ duration: 500, });
          this.setData({
            animationData: this.animation.export()
          })
        }.bind(this), 500)
      }.bind(this), 500)
    }.bind(this), 8000)
  },
  gotoBank() {
    this.setData({ "showMap.showEnd": false, "showMap.showPro": false });
    wx.redirectTo({
      url: '/pages/bank/bank',
    })
  },
  gotoSquare() {
    this.setData({ "showMap.showEnd": false, "showMap.showPro": false, showNoCard:false});
    wx.redirectTo({
      url: '/pages/square/square',
    })
  },
  showReport() {
    this.setData({ showReport: true })
  },
  reportCancel() {
    this.setData({ showReport: false })
  },
  selectReason(e) {
    this.setData({ reportReason: api.getDataset(e)['reason'] })
  },
  trailReport() {
    if (!this.data.isClick) {
      this.setData({ isClick: true });
      setTimeout(() => { this.setData({ isClick: false }) }, 500);

      if (!this.data.reportReason) {
        wx.showToast({
          "icon": 'none',
          title: '请选择一个举报原因',
        })
        return;
      }
      this.setData({ showReport: false })
      api.postBankReport('question', this.data.question.id, this.data.reportReason).then(res => {
        wx.showToast({
          icon: 'none',
          title: '举报成功!',
        })
      })
    }
  },
  cloneGetNoCard(){
    this.setData({ showNoCard: false })
  }
})

