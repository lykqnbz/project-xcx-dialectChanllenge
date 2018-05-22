//app.js
import Api from 'utils/api.js';

var api = new Api();

App({
  onLaunch: function () {
  },
  onHide: function () {
    if (!this.globalData.reportFlag) {
      this.globalData.reportFlag = true;
      var pages = getCurrentPages()
      var launch_page = pages[0].route + "?shareSource=" + this.globalData.shareSource + "&isNew=" + this.globalData.isNew
      console.log("launch_page:" + launch_page)
      wx.reportAnalytics('real_launch_page', {
        launch_page: launch_page,
      });
    }
  },
  onShow: function (options) {
    console.info(options)
    if (options.scene == 1044) {

      if (options.shareTicket != this.globalData.shareTicket) {
        console.info(options.shareTicket)
        this.globalData.shareTicket = options.shareTicket;
        this.globalData.groupId = null;
      }
    
      // 移到群内排行榜用
      // this.getGroupInfo();
    } else {
      this.globalData.groupId = null;
      this.globalData.shareTicket = null;
    }

    if (options.query && options.query.inviterId) {
      api.recordInviteRecord(options)
    }
  },
  getGroupInfo: function () {

    return new Promise((resolve, reject) => {
      if (this.globalData.shareTicket) {
        // 如果存在群ID,上报群ID
        wx.getShareInfo({
          shareTicket: this.globalData.shareTicket,
          complete: (res) => {
            console.info(res)
            api.postGroup(res.encryptedData, res.iv, "share").then(res => {
              this.globalData.groupId = res.groupId;
              console.warn("groupId:"+res.groupId)
              resolve(res.groupId);
            })
          }
        })
      }
    })

   
  },
  globalData: {
    account: null,
    shareTicket:null,
    groupId:'',
    letterMap:null,
    reportFlag:false,
    isNew:false,
  }
})