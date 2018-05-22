// pages/summary/summary.js
import Api from '../../utils/api.js'

var api = new Api();
Page({
  data: {
    // 方言种类
    summaries: [],
    // 通关数据
    passData: {},
    showOfficialAdvert: false,
    scrollHeight: 600,
  },

  onLoad: function () {
    api.getWrap().then((res) => {
      this.setData(res, () => {
        api.getAdShow().then((res) => {
          this.setData(res, () => {
            if (this.data.showOfficialAdvert) {
              this.setData({
                scrollHeight: this.data.wrapHeight * (750 / this.data.wrapWidth) - 230,
              })
            } else {
              this.setData({
                scrollHeight: this.data.wrapHeight * (750 / this.data.wrapWidth) -20,
              })
            }
          })
        })
      })
    })
  },
  onShow: function () {
    //获得方言种类和通关数据
    api.getDialectSummariesNew().then(res => {
      this.setData(res);
      console.warn(res)
    });
  },

  /**
   * 跳转至关卡选择--暂时不用
   */
  startTap: function (event) {
    let id = api.getDataset(event)['id'];
    api.navClick(this, '/pages/select/select?id=' + id);
  },

  /**
   * 直接跳转至游戏页面
   */
  startPlay: function (event) {
    wx.reportAnalytics('click_one_dialect', {
    });

    let dialect = api.getDataset(event)['dialect'];
    let pass = api.getDataset(event)['pass'];
    var passno = api.getDataset(event)['passno'];
    let id = api.getDataset(event)['id'];

    if (passno==0){
      wx.showModal({
        icon:"none",
        title: '暂无题库，请先去出题',
        duration: 2000,
        showCancel:false,
        complete:(res)=>{
          if (res.confirm) {
             api.navClick(this, '/pages/person/person');
          } 
        }
      })
      return
    }
    if (pass == passno) {
      api.navClick(this, '/pages/select/select?id=' + id);
    } else {
      if (pass == undefined) {
        pass = 1;
      } else if (pass < passno) {
        pass++;
      }

      api.navClick(this, '/pages/play/play?dialect=' + dialect + '&pass=' + pass);
    }

  },
  gotoBank() {

    wx.redirectTo({
      url: '/pages/bank/bank',
    })
  },
  gotoList() {

    wx.redirectTo({
      url: '/pages/list/list',
    })
  },

})