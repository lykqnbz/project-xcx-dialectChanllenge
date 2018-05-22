import Api from '../../utils/api.js';
var api = new Api();

const innerAudioContext = wx.createInnerAudioContext();
innerAudioContext.obeyMuteSwitch = false;
// innerAudioContext.autoplay = true;

Page({
  data: {
    showOfficialAdvert: false,
    scrollHeight: 600,
    account: null,
    photoList: []
  },
  onLoad: function (options) {
    api.getWrap().then((res) => {
      this.setData(res, () => {
        api.getAdShow().then((res) => {
          this.setData(res, () => {
            if (this.data.showOfficialAdvert) {
              this.setData({
                scrollHeight: this.data.wrapHeight * (750 / this.data.wrapWidth) - 700,
              })
            } else {
              this.setData({
                scrollHeight: this.data.wrapHeight * (750 / this.data.wrapWidth) - 480,
              })
            }
          })
        })
      })
    })

    innerAudioContext.onEnded(() => {
      console.info("播放结束")
      this.setData({ isPlay: false })
    })

  },
  onUnload() {
    innerAudioContext.stop();
    innerAudioContext.offEnded();
  },
  onHide() {
    innerAudioContext.stop();
  },
  onShow: function () {
    var self=this;
    api.getAccountInfo().then(res => {
      this.setData(res, () => {
        wx.setNavigationBarTitle({
          title: this.data.account.nickname
        })

        var photo = [];
        for (var i = 0; i < self.data.photos.length; i++) {
          photo.push(self.data.photos[i].photoUrl)
        }
        self.setData({
          photoList: photo
        })
      })
    })
  },
  bindDialect() {
    wx.navigateTo({
      url: '/pages/bind/bind',
    })
  },
  bindLeaderboard() {
    wx.navigateTo({
      url: '/pages/leaderboard/leaderboard',
    })
  },
  bindPlay() {
    if (this.data.isPlay) {
      this.setData({ isPlay: false });
      innerAudioContext.stop();
    } else {
      this.setData({ isPlay: true });
      innerAudioContext.src = this.data.account.introUrl;
      innerAudioContext.play();
    }
  },
  // 预览图片
  previewImage(e) {
    wx.previewImage({
      current: e.currentTarget.dataset.url,
      urls: this.data.photoList
    })
  }
})