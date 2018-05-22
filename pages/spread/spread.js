import Api from '../../utils/api.js'
var util = require("../../utils/util.js")
var api = new Api();
var ctx = wx.createCanvasContext('myCanvas');
Page({
  data: {
    markers: [],
    distributionList: [{
      "dialect": "闽南话",
      "num": 11,
      "cityLocation": {
        "x": 118.183655,
        "y": 24.484
      },
      "dataList": [
        { "avatarUrl": "https://wx.qlogo.cn/mmopen/vi_32/niaml14K5fwGCwC4ibMOvH6Y5Asnd67792f0JsP10LD1xicy8iaibDFZc4bKcWwRkjb2IjFK85Gj3GJ9iaeXwLFSwiagg/0" },
        { "avatarUrl": "https://wx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTIfOiaascAt5BicJLSicybbuk0JnicqdquNJNfpakD133j40unxvexIpoARFCdv9dDZps9oGS9B32Ls4Q/0" },
        { "avatarUrl": "https://wx.qlogo.cn/mmopen/vi_32/PiajxSqBRaELw4FMj0lcPWWqm4ZDSJvGhsICavbncd3gs4mbViaNibh6zAw3SsAiaZAe0qRkAc6QiaeWTv7cMXqgsJQ/0" },
        { "avatarUrl": "https://wx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTIPPqfOs0MJpOdExCrHK7FDelJBMrD5ATGib2MulZcEhYy9gur6TmjwADNZe0RuWZ5GsAqJsfJpnicQ/132" }]
    }],
    countNum: { "listNum": 0, "userNum": 0, "userLength": 0 },
    ifLoadding: false,
    groupId: '',
    listShowMap: { "ifShow": false, "currentTap": "" },
    letterMap: null,
    account: []
  },
  onLoad: function (options) {
    var self = this;
    api.getWrap().then((res) => {
      this.setData(res)
    })
    api.getInfo().then(res => {
      this.setData({ account: res })
    })
    api.getAppConfig().then((res) => { this.setData({ letterMap: res }) })

    wx.showShareMenu({
      withShareTicket: true
    })
  },
  markertap(e) {
    this.setData({
      ['listShowMap.currentTap']: e.markerId,
      ['listShowMap.ifShow']: true
    })
  },
  onShow(){
    console.warn("onShow!!!!!!")
    this.setData({
      ['countNum.listNum']: 0,
      ['countNum.userNum']: 0,
      ['countNum.userLength']: 0,
    })
    if (getApp().globalData.shareTicket) {
      if (getApp().globalData.groupId) {
        this.setData({ groupId: getApp().globalData.groupId }, () => {
          this.getGroupList();
        })
      } else {
        getApp().getGroupInfo().then(res => {
          this.setData({ groupId: res }, () => {
            this.getGroupList();
          })
        })
      }

    } else {
      this.getGroupList();
    }
  },
  getGroupList() {
    var self = this;
    console.warn("ddddd")
    api.getGroupList(this.data.groupId).then((res) => {
      console.info(res)
      this.setData(res, () => {
        if (self.data.distributionList[self.data.countNum.listNum].dataList.length > 3) {
          self.setData({ ['countNum.userLength']: 3 })
        } else {
          self.setData({ ['countNum.userLength']: self.data.distributionList[self.data.countNum.listNum].dataList.length })
        }
        this.getGroupImg();
      })
    })
  },
  getGroupImg() {
    var self = this;
    self.setData({ ifLoadding: true })
    if (self.data.countNum.userNum < self.data.countNum.userLength) {
      if (self.data.countNum.userNum == 0) {
        ctx.drawImage('/asset/img/qipao.png', 0, 0, 218 * self.data.wrapWidth / 750, 157 * self.data.wrapWidth / 750);
      }
      wx.downloadFile({
        url: self.data.distributionList[self.data.countNum.listNum].dataList[self.data.countNum.userNum].avatarUrl,
        success: function (res) {
          ctx.drawImage(res.tempFilePath, (30 + (50 * self.data.countNum.userNum)) * self.data.wrapWidth / 750, 15 * self.data.wrapWidth / 750, 40 * self.data.wrapWidth / 750, 40 * self.data.wrapWidth / 750);
          ctx.drawImage('/asset/img/miaobian.png', (30 + (50 * self.data.countNum.userNum)) * self.data.wrapWidth / 750, 15 * self.data.wrapWidth / 750, 40 * self.data.wrapWidth / 750, 40 * self.data.wrapWidth / 750);
          self.setData({ ['countNum.userNum']: self.data.countNum.userNum + 1 }, () => {
            self.getGroupImg();
          })
        }
      })
    } else {
      ctx.drawImage('/asset/img/jiantou.png', 184 * self.data.wrapWidth / 750, 24 * self.data.wrapWidth / 750, 12 * self.data.wrapWidth / 750, 24 * self.data.wrapWidth / 750);
      ctx.setFillStyle("#ffffff");
      ctx.setFontSize(24 * self.data.wrapWidth / 750)
      ctx.setTextAlign('center')
      ctx.fillText(self.data.distributionList[self.data.countNum.listNum].dialect, 70 * self.data.wrapWidth / 750, 100 * self.data.wrapWidth / 750)
      ctx.setTextAlign('left')
      ctx.fillText(self.data.distributionList[self.data.countNum.listNum].num + "人", 140 * self.data.wrapWidth / 750, 100 * self.data.wrapWidth / 750)
      ctx.setFillStyle("#aaaaaa");
      ctx.fillText("|", 120 * self.data.wrapWidth / 750, 98 * self.data.wrapWidth / 750)
      ctx.draw(false, function (e) {
        wx.canvasToTempFilePath({
          x: 0,
          y: 0,
          width: 218 * self.data.wrapWidth / 750,
          height: 157 * self.data.wrapWidth / 750,
          canvasId: 'myCanvas',
          success: function (res1) {
            wx.getImageInfo({
              src: res1.tempFilePath,
              success: function (res2) {
                console.log("countNum.listNum:" + self.data.countNum.listNum)
                var arr = self.data.distributionList[self.data.countNum.listNum];
                arr.saveImg = res2.path
                self.setData({ ['distributionList[' + self.data.countNum.listNum + ']']: arr }, () => {
                  if (self.data.countNum.listNum < self.data.distributionList.length - 1) {
                    self.setData({
                      ['countNum.listNum']: self.data.countNum.listNum + 1,
                      ['countNum.userNum']: 0,
                    }, () => {
                      if (self.data.distributionList[self.data.countNum.listNum].dataList.length > 3) {
                        self.setData({ ['countNum.userLength']: 3 })
                      } else {
                        self.setData({ ['countNum.userLength']: self.data.distributionList[self.data.countNum.listNum].dataList.length })
                      }
                      self.getGroupImg();
                    })
                  } else {
                    console.warn("over")
                    self.setData({ ifLoadding: false })
                    self.showGroupMsg();
                  }
                })

              }
            })

          },
          fail: function () {
            wx.showToast({
              icon: "none",
              title: '网络不见啦',
            })
            self.setData({ ifLoadding: false })
          }
        })
      })
    }
  },
  showGroupMsg() {
    var markers = [];
    var markersItem = {};
    var self = this;

    for (var i = 0; i < self.data.distributionList.length; i++) {
      markersItem = {
        "id": i,
        "iconPath": self.data.distributionList[i].saveImg,
        "latitude": self.data.distributionList[i].cityLocation.y,
        "longitude": self.data.distributionList[i].cityLocation.x,
        "width": 218 * self.data.wrapWidth / 750,
        "height": 157 * self.data.wrapWidth / 750,
      }
      markers.push(markersItem)
    }
    self.setData({
      markers: markers,
    })
  },
  gotoPerson(e) {
    var accountId = api.getDataset(e)['id'];
    if (accountId == this.data.account.id) {
      wx.navigateTo({
        url: '/pages/person/person'
      })
    } else {
      wx.navigateTo({
        url: '/pages/person_other/person_other?accountId=' + accountId,
      })
    }
  },
  preventBubbling() {
  },
  cloneShow() {
    this.setData({
      ['listShowMap.ifShow']: false
    })
  },
  gotoIndex() {
    wx.reLaunch({
      url: '/pages/index/index',
    })
  },

  onShareAppMessage: function (res) {
    var self = this;
    var title = this.data.letterMap['distributionShare'].title;
    var imageUrl = this.data.letterMap['distributionShare'].imageUrl;

    var path = "/pages/spread/spread?inviterId=" + wx.getStorageSync("uid") + "&from=群友方言分布";

    if (res.from == 'button') {
      path = path + "&position=button"
    } else {
      path = path + "&position=common"
    }
    return {
      title: title,
      path: path,
      imageUrl: imageUrl,
      success: function (res) {
        if (res.shareTickets) {
          wx.getShareInfo({
            shareTicket: res.shareTickets,
            success(res1) {
              api.postGroup(res1.encryptedData, res1.iv, "share").then(res => {
                wx.showToast({
                  icon: 'none',
                  title: '分享成功！',
                })
              })
            }
          })
        } else {
          wx.showToast({
            icon: 'none',
            title: '要分享到群里才能看到哟',
          })
        }
        api.recordShareLog(path)
      },
      fail: function () {
      }
    }
  },


})