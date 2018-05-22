
import Api from '../../utils/api.js';
var api = new Api();

Page({
  data: {
    bank: null,
    // 标记音频的播放状态
    isPlay: true,
    gifImg: '/asset/img/bb2.png',
    isClick: false,
    showReport: false,
    reportReason: '',
    reportItems: ['违法乱纪', '存在脏话', '无正确选项', '选项中有多个答案', '不属于该分类方言'],
    showNotice: false,
    showNone: false,
    showBind: false,
    showZhengshu: false
  },
  onLoad: function (options) {
    // 获取我的方言
  },
  onShow: function () {
    var that = this;
    api.getInfo().then(res => {
      var dialectId = res.dialect;
      this.setData({ dialect: res.dialect });

      api.getLecList().then(res1 => {
        this.setData(res1, () => {

          if (dialectId) {
              // 需判断是否已经有弹过说明了
            if (!res.certData[res.dialect] && this.data.summaryMap[this.data.dialect].passNo >= 25) {
              // quyanwanyouxi 
              this.setData({ showZhengshu: true });
            } else {
              if (!wx.getStorageSync("SHOW_TRAIL_NOTICE")) {
                this.setData({ showNotice: true });
                wx.setStorageSync("SHOW_TRAIL_NOTICE", true)
              } else {
                this.setData({ showNotice: false })
                this.getBank();
              }
            }

          } else {
            // 需要弹出未绑定方言， 需弹框提醒
            this.setData({ showBind: true })
          }
        })
      })
    })


  },
  onUnload: function () {
    wx.stopBackgroundAudio();
  },
  getBank(lastId) {
    api.getBankOne(lastId).then(res => {
      console.info(res)
      if (res.bank) {
        // 需要判断无审题题目时

        this.setData({ bank: res.bank });
        this.playVoice();
      } else {
        this.setData({ bank: null });
        this.setData({ showNone: true })
      }
    })
  },
  playVoice() {
    wx.playBackgroundAudio({
      dataUrl: this.data.bank.question,
    })
    wx.onBackgroundAudioPlay(() => {
      this.setData({
        isPlay: false,
        gifImg: '/asset/img/bb1.gif'
      });
    });
    wx.onBackgroundAudioStop(() => {
      this.setData({
        isPlay: true,
        backgroundPlay: false,
        gifImg: '/asset/img/bb2.png'
      })
    })
  },

  // 对与错
  trailBank(e) {
    if (!this.data.isClick) {
      this.setData({ isClick: true });
      setTimeout(() => { this.setData({ isClick: false }) }, 500);

      var answer = api.getDataset(e)['answer'];
      api.postBankTrail(this.data.bank.id, answer).then(res => {
        console.info(res)
        wx.showToast({
          "icon": 'none',
          title: '审题成功',
        })
        this.getBank(this.data.bank.id);
      })
    }

  },
  // 举报
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
      api.postBankReport('bank', this.data.bank.id, this.data.reportReason).then(res => {
        wx.showToast({
          icon: 'none',
          title: '举报成功!',
        })
        this.getBank(this.data.bank.id);
      })
    }
  },
  skipCurrent() {
    if (!this.data.isClick) {
      this.setData({ isClick: true });
      setTimeout(() => { this.setData({ isClick: false }) }, 500);
      console.info(this.data.bank.id)
      this.getBank(this.data.bank.id);
    }
  },
  gotoBank() {
    this.setData({ showNone: false })
    wx.redirectTo({
      url: '/pages/bank/bank',
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
  closeNotice() {
    this.setData({ showNotice: false });
    this.getBank();
  },
  gotoBack() {
    this.setData({ showSuccess: false, showNotice: false, showBind: false, showZhengshu: false })
    wx.reLaunch({
      url: '/pages/index/index',
    })
  },

  goGetZh() {
    this.setData({ showZhengshu: false });
    var pass = parseInt(this.data.passData[this.data.dialect]) + 1;
    wx.navigateTo({
      url: '/pages/play/play?dialect=' + this.data.dialect + '&pass=' + pass
    })
    console.log("pass=" + pass + "  ddd:" + this.data.dialect)
  },
  gotoBind() {
    this.setData({ showBind: false, showZhengshu: false });
    wx.navigateTo({
      url: '/pages/bind/bind',
    })
  },
})