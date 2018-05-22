// pages/more/more.js
import Api from '../../utils/api.js';
var api = new Api();
Page({
  data: {
    apps: []
  },
  onLoad: function (options) {

  },
  onShow: function () {
    api.getMoreList().then(res => {
      this.setData(res)
    });
  },
  openMorePlay: function (e) {
    let item = e.currentTarget.dataset.item;
    api.postMorePlay(item.id).then(res => {
      console.log(res)
    });
    if (item.type == 'INSIDE') {
      wx.navigateToMiniProgram({
        appId: item.id,
        path: item.path,
        extraData: item.extra,
        success(res) {
        },
      })
    } else {
      wx.previewImage({
        urls: [item.image],
        fail(res) {
          wx.showToast({
            title: '好像出了点问题',
            icon: 'loading',
            duration: 2000
          })
        }
      })
    }

  },

})