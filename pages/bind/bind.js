
import Api from '../../utils/api.js';
var api = new Api();
Page({
  data: {
    summaryList: null,
    showNotice: false,
    isClick: false,
    resummaryList: [],
    letter: [],
    sayListId: ""
  },
  onLoad: function (options) {
    wx.setStorageSync("FROM_SQUARE_BIND_SUCCESS", false)
    if (!wx.getStorageSync("SHOW_BIND_NOTICE")) {
      this.setData({ showNotice: true });
      wx.setStorageSync("SHOW_BIND_NOTICE", true)
    }
    api.getWrap().then(res => {
      this.setData(res)
    })

  },
  onShow: function () {
    wx.setStorageSync("FROM_SQUARE_BIND_SUCCESS", false)

    api.getInfo(true).then(res => {
      this.setData({ account: res }, () => {


        api.getInfo().then(res => {

          var dialectId = res.dialectId;

          api.getDialectSummaries().then(res => {
            this.setData({
              summaryList: res.summaries,
              resummaryList: res.summaries
            }, () => {
              var testArr = this.data.resummaryList;
              var letter = [];
              var ifSave = false;
              testArr.sort(function (x, y) {
                return (x["initial"] > y["initial"]) ? 1 : -1
              });
              this.setData({
                resummaryList: testArr
              })
              for (var i = 0; i < testArr.length; i++) {
                for (var k = 0; k < letter.length; k++) {
                  if (letter[k] == testArr[i].initial) {
                    ifSave = true
                  }
                }
                if (!ifSave) {
                  letter.push(testArr[i].initial)
                }
                ifSave = false;
              }
              this.setData({
                letter: letter
              })
            });
          })
          // }
        })
      })
    })
  },
  bindDialect(e) {

    if (!this.data.isClick) {
      this.setData({ isClick: true });
      setTimeout(() => { this.setData({ isClick: false }) }, 500);

      var dialectId = api.getDataset(e)['dialectId'];
      var index = api.getDataset(e)['index'];
      var currentDialect = this.data.summaryList[index];

      // 超过25题未获取证书的需要先获取才可以选定方言
      // if (currentDialect.passNo >= 25 && !this.data.certData[index]) {
      //   wx.showModal({
      //     title: '提示',
      //     content: '您需要获得' + currentDialect.dialect+"高级证书才可以选定",
      //     confirmText:'获取证书',
      //     success: res => {
      //       if (res.confirm) {
      //         var pass = parseInt(this.data.passData[index]) + 1;
      //         wx.navigateTo({
      //           url: '/pages/play/play?dialect=' + index + '&pass=' + pass
      //         })
      //       } else if (res.cancel) {
      //         console.log('用户点击取消')
      //       }
      //     }
      //   })
      // } else {
      wx.showModal({
        title: '确认选定',
        content: '您确定选定[' + currentDialect.dialect + ']为您的方言吗？选定后您可为' + currentDialect.dialect + '出题或审题',
        success: res => {
          if (res.confirm) {
            api.bindDialect(dialectId).then(res => {
              console.info(res)
              getApp().globalData.account = res.account;
              wx.showToast({
                icon: 'none',
                title: '方言选定成功',
              })
              var pages = getCurrentPages();
              var beforePage = pages[pages.length - 2];
              // 从广场进来

              wx.setStorageSync("FROM_SQUARE_BIND_SUCCESS", true);
              if (beforePage.route.indexOf("square/square") > -1) {
                console.info("从广场秀进来的绑定");
                wx.redirectTo({
                  url: '/pages/square/square?currentTab=' + wx.getStorageSync("FROM_SQUARE_CURRENT"),
                })

              } else {
                // 从方言秀的详情进来
                wx.navigateBack({
                  success: function () {
                  }
                })
              }


            })
          } else if (res.cancel) {
            console.log('用户点击取消')
          }
        }
      })
      // }

    }

  },
  closeNotice() {
    this.setData({ showNotice: false });
  },

  letterTap(e) {
    const Item = e.currentTarget.dataset.item;
    this.setData({
      sayListId: Item
    });
  },
  onHide() {
    console.info("onHide")
  },
  onUnload() {
    console.info("onUnload");


    var bindSuccess = wx.getStorageSync("FROM_SQUARE_BIND_SUCCESS");
    console.info(bindSuccess);

    var pages = getCurrentPages();
    var beforePage = pages[pages.length - 2];
    // 从广场进来

      if (!bindSuccess && beforePage.route.indexOf("square/square") > -1) {
      wx.setStorageSync("FROM_SQUARE_BIND_SUCCESS", false);
    } else {
        wx.setStorageSync("FROM_SQUARE_BIND_SUCCESS", true);
    }
  }

})