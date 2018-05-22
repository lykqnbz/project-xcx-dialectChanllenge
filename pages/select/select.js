// pages/select/select.js

import Api from '../../utils/api.js';

var api = new Api();

Page({
  data: {
    summary: {},
    questions: [],
    pass: 0,
    showOfficialAdvert: false,
    scrollHeight: 600,

  },

  onLoad: function (options) {
    api.getSummary(options.id).then(res => {
      console.log('方言关卡数', res);
      this.setData(res);
      wx.setNavigationBarTitle({
        title: res.summary.dialect,
      })
    });

    api.getWrap().then((res) => {
      this.setData(res, () => {
        api.getAdShow().then((res) => {
          this.setData(res, () => {
            if (this.data.showOfficialAdvert) {
              this.setData({
                scrollHeight: this.data.wrapHeight * (750 / this.data.wrapWidth) - 250,
              })
            } else {
              this.setData({
                scrollHeight: this.data.wrapHeight * (750 / this.data.wrapWidth),
              })
            }
          })
        })
      })
    })
  },

  /**
   * 已激活关卡进行跳转
   */
  playTap: function (event) {
    let item = api.getDataset(event)['item'];
    api.navClick(this, '../play/play?dialect=' + this.data.summary.dialect + '&pass=' + item);
  },

  /**
   * 未激活关卡的提示
   */
  showNotice: function () {
    wx.showToast({
      title: '请先激活关卡',
    })
  }


})