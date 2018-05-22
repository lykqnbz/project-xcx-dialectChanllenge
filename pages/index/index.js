import Api from '../../utils/api.js'
var util = require("../../utils/util.js")
var api = new Api();
Page({
  data: {
    hifi_ed: false,
    isNew: false,
    advert: { 'coverImg': '/asset/img/pretermit.png', 'width': 100, 'height': 50, 'top': 200, 'right': 0 },
    ifDouble: true,
    showTry: false,
    letterMap: null,
    showOfficialAdvert: false,
  },
  onLoad: function (options) {
    //记录shareSource用户跟踪用户进来的来源
    getApp().globalData.shareSource = options.shareSource
    api.getInfo().then(res => {
    })

    api.getSign().then(res => {
      if (!res.signed) {
        api.getIfNewPlayer().then(res => {
          this.setData({
            hifi_ed: true,
            isNew: res.isNew
          })
        })
      }
    })

    api.getAppConfig().then(res => {
      this.setData({ letterMap: res })
    })

    api.getWrap().then((res) => {
      this.setData(res, () => {
        api.getAdShow().then((res) => {
          this.setData(res)
        })
      })
    })
  },
  onShow: function () {
    api.getBannerList().then(res => { this.setData(res) });
    api.getFubiao().then(res => { this.setData(res) });

    api.getAccountInfo().then(res => {
      console.info()
      this.setData({ unReadLetter: res.unReadLetter })
    })
  },

  startTap: function () {
    api.navClick(this, '/pages/summary/summary');
    this.setData({ hifi_ed: false })
  },
  moreTap: function () {
    api.navClick(this, '/pages/more/more');
  },
  rankTap: function () {
    api.navClick(this, '/pages/rank/rank');
  },
  jokeTap: function () {
    api.navClick(this, '/pages/joke/joke');
  }, 
  leaderBTap: function () {
    api.navClick(this, '/pages/leaderboard/leaderboard');
  },
  indexTap: function () {
    api.navClick(this, '/pages/person/person');
  },
  squareTap: function () {
    api.navClick(this, '/pages/square/square');
  },
  groupTap: function() {
    api.navClick(this, '/pages/spread/spread');
  },

  // 打开首页底部广告小程序
  openBanner: function (e) {
    wx.navigateToMiniProgram({
      appId: e.currentTarget.dataset.appid,
      path: e.currentTarget.dataset.path,
      extraData: e.currentTarget.dataset.extra
    })
  },

  onShareAppMessage: function (res) {
    var path = "/pages/index/index" + "?from=首页&position=common&inviterId=" + wx.getStorageSync("uid");
    return {
     
      title: '这是谁家的方言？也太难了吧！！',
      path: path,
      imageUrl: '/asset/img/share.png',
      success: function (res) {
      
        api.recordShareLog(path)
      },
    }
  },

  everyDay: function () {
    this.setData({
      hifi_ed: false
    })
    // wx.setStorageSync('overdue_' + util.getDateYMD(0), '1.1');
  },


  //  打开浮标广告
  openAd: function (e) {
    let item = e.currentTarget.dataset.item;
    var self = this;
    if (this.data.ifDouble) {
      self.setData({ ifDouble: false }, () => {
        api.clickFubiao(item.id).then(res => {
          this.setData({
            ifDouble: true
          })
          wx.navigateToMiniProgram({
            appId: item.appId,
            path: item.path,
            extraData: item.extra,
          });
        })
      })
    }
  },

  // 上报formId
  formSubmit: function (e) {
    console.warn(e)
    wx.reportAnalytics('api_click_start', {
    });
    var self = this;
    api.formSubmit(e.detail.formId).then(res => {
      console.log(e.detail.formId)
    })
    self.startTap();
  },
  formSubmitForFy: function (e) {
    var self = this;
    api.formSubmitForShow(e.detail.formId).then(res => {
      console.log(e.detail.formId)
    })
    self.squareTap();
  },
  showTry(e) {

    var status = api.getDataset(e)['status'];
    console.info(status)
    this.setData({ showTry: true })
  },
  closeTry(e) {

    var status = api.getDataset(e)['status'];
    console.info(status)
    this.setData({ showTry: false })
  }
})