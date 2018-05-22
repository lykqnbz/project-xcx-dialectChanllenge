import Api from '../../utils/api.js';
var api = new Api();
const app = getApp()
var ctx = wx.createCanvasContext('myCanvas');
Page({
  data: {
    isShowForOwn: false,
    isShowForUnown: false,
    listImg: {
      '客家话': '/asset/img/kejia@2x.png', '四川话': '/asset/img/sichuan@2x.png', '粤语': '/asset/img/yueyu@2x.png',
      '东北话': '/asset/img/dongbei@2x.png', '湖南话': '/asset/img/hunan@2x.png', '浙江话': '/asset/img/zhejiang@2x.png',
      '上海话': '/asset/img/shanghai@2x.png', '闽南话': '/asset/img/minnan@2x.png', '潮汕话': '/asset/img/chaoshan@2x.png'
    },
    bannerImg: {
      '客家话': '/asset/img/kejia.png', '四川话': '/asset/img/sichuan.png', '粤语': '/asset/img/yueyu.png',
      '东北话': '/asset/img/dongbei.png', '湖南话': '/asset/img/hunan.png', '浙江话': '/asset/img/zhejiang.png',
      '上海话': '/asset/img/shanghai.png', '闽南话': '/asset/img/minnan.png', '潮汕话': '/asset/img/chaoshan.png'
    },
    showBanner: '',
    showSort: '',
    account: null,
    ifDoubleClick: true,
    dialect: '',
    passData: {},
    currentTop: 74,
    currentSummary: null,
    showOfficialAdvert: false,
    scrollHeight: 600,
  },
  onLoad: function (options) {
    api.getInfo(true).then(res => {
      this.setData({ account: res })
    })

    api.getWrap().then((res) => {
      this.setData(res, () => {
        api.getAdShow().then((res) => {
          this.setData(res, () => {
            if (this.data.showOfficialAdvert) {
              this.setData({
                scrollHeight: this.data.wrapHeight * (750 / this.data.wrapWidth) - 240,
              })
            } else {
              this.setData({
                scrollHeight: this.data.wrapHeight * (750 / this.data.wrapWidth) - 30,
              })
            }
          })
        })
      })
    })
  },
  onShow: function () {
    api.getWrapHeight().then((res) => { this.setData({ wrapHeight: res }); })
    api.getWrapWidth().then((res) => { this.setData({ wrapWidth: res }); })
    api.getLecList().then(res => {
      console.info(res)
      this.setData(res)
    });

  },
  // 立刻去闯关获取
  playtap: function (e) {
    var pass = parseInt(this.data.passData[this.data.currentSummary.dialect]) + 1;
    wx.navigateTo({
      url: '/pages/play/play?dialect=' + this.data.currentSummary.dialect + '&pass=' + pass
    })
  },
  // 关闭证书窗口
  close: function (e) {
    switch (e.currentTarget.dataset.sort) {
      case "ownHif": setTimeout(() => {
        this.setData({ isShowForOwn: false })
      }, 200); break;
      case "unownHif": this.setData({ isShowForUnown: false }); break;
    }
  },

  openHifi: function (e) {

    var sort = e.currentTarget.dataset.sort;
    if (this.data.certData[sort]) {
      this.setData({
        currentSummary: this.data.summaryMap[sort],
        dialect: sort,
        isShowForOwn: true,
      })
    } else {
      this.setData({
        currentSummary: this.data.summaryMap[sort],
        dialect: sort,
        isShowForUnown: true,
      })
    }

  },

  /**
   * 设置分享页面
   */
  onShareAppMessage: function (res) {
    var that = this;
    var title = '这是谁家的方言？也太难了吧！！';
    var path = "/pages/index/index" + "?from=我的证书&inviterId=" + wx.getStorageSync("uid");
    var imageUrl = '/asset/img/share.png';
    if (res.from == 'button') {
     path=path+"&position=button"
      this.setData({ currentTop: -40 })

      imageUrl = '';
      title = '不就是' + this.data.dialect + '嘛？简单~';
    } else {
      path = path + "&position=common"
    }

    return {
      title: title,
      path: path,
      imageUrl: imageUrl,
      success: function (res) {
        that.setData({ currentTop: 74 })
        wx.showToast({
          title: '分享成功！',
        })
        api.recordShareLog(path)
      },
      fail: function () {
        that.setData({ currentTop: 74 })
      }
    }
  },



  shareToCircle: function () {
    var self = this;
    if (!self.data.ifDoubleClick) {
      return;
    };
    self.setData({
      ifDoubleClick: false
    });
    wx.showToast({
      title: '保存中',
      icon: 'loading',
      duration: 2000
    })


    wx.downloadFile({
      url: this.data.account.avatarUrl,
      success: function (res) {
        ctx.drawImage('/asset/img/BJ2.png', 0, 0, self.data.wrapWidth, self.data.wrapHeight);
        ctx.drawImage('/asset/img/Group13@2x.png', self.data.wrapWidth * 0.11333, self.data.wrapWidth * 0.169333, self.data.wrapWidth * 0.77333, self.data.wrapWidth * 1.16533);
        ctx.drawImage(self.data.currentSummary.rankCover, self.data.wrapWidth * 0.126666, self.data.wrapWidth * 0.182666, self.data.wrapWidth * 0.74666, self.data.wrapWidth * 0.34666);
        ctx.drawImage('/asset/img/ewmm.jpg', self.data.wrapWidth * 0.381333, self.data.wrapWidth * 1.0666, self.data.wrapWidth * 0.24, self.data.wrapWidth * 0.24);
        ctx.setFillStyle("#5ECED2");
        ctx.setFontSize(32)
        ctx.setTextAlign('center')
        ctx.fillText(self.data.currentSummary.dialect + '高级证书', self.data.wrapWidth * 0.5, self.data.wrapWidth * 1.0)
        ctx.setFillStyle("#5E9AD2");
        ctx.setFontSize(19)
        ctx.fillText(self.data.account.nickname, self.data.wrapWidth * 0.5, self.data.wrapWidth * 0.87)
        ctx.drawImage(res.tempFilePath, self.data.wrapWidth * 0.4146666, self.data.wrapWidth * 0.575333, self.data.wrapWidth * 0.1706666, self.data.wrapWidth * 0.1706666);
        ctx.drawImage('/asset/img/loukong.png', self.data.wrapWidth * 0.4146666, self.data.wrapWidth * 0.575333, self.data.wrapWidth * 0.1706666, self.data.wrapWidth * 0.1706666);
        ctx.drawImage('/asset/img/zhengshu@2x.png', self.data.wrapWidth * 0.356, self.data.wrapWidth * 0.7, self.data.wrapWidth * 0.288, self.data.wrapWidth * 0.0746666);

        wx.downloadFile({
          url: self.data.currentSummary.rankCover,
          success: function (res) {
            ctx.drawImage(res.tempFilePath, self.data.wrapWidth * 0.126666, self.data.wrapWidth * 0.182666, self.data.wrapWidth * 0.74666, self.data.wrapWidth * 0.34666);

            ctx.draw(false, function (e) {
              wx.canvasToTempFilePath({
                x: 0,
                y: 0,
                width: self.data.wrapWidth,
                height: self.data.wrapHeight,
                canvasId: 'myCanvas',
                success: function (res1) {
                  console.log(res1.tempFilePath)
                  wx.saveImageToPhotosAlbum({
                    filePath: res1.tempFilePath,
                    success(res3) {

                      self.setData({
                        ifDoubleClick: true,
                      });
                      wx.showModal({
                        title: '保存成功',
                        content: '将图片分享到朋友圈，邀请更多好友玩',
                        showCancel: false,
                        success: function (res3) {
                          if (res3.confirm) {
                          } else if (res3.cancel) {
                          }
                        }
                      })
                    },
                    fail(res3) {
                      wx.showToast({
                        icon: 'none',
                        title: '没有授予权限，保存失败，请10分钟后重试',
                        duration: 2000
                      })
                    },
                  })
                }
              })
            })
          }
        })

      }
    })

  }


})