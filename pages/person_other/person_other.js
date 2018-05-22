import Api from '../../utils/api.js';
var api = new Api();

const innerAudioContext = wx.createInnerAudioContext();
innerAudioContext.obeyMuteSwitch = false;
Page({
  data: {
    showOfficialAdvert: false,
    accountId: null,
    photoList: []
  },
  onLoad: function (options) {
    var self=this;
    if (!options.accountId) {
      wx.navigateBack({

      })
      return;
    }
    this.setData({ accountId: options.accountId }, () => {
      api.getAccountInfo(options.accountId).then(res => {
        console.info(res)
        wx.setNavigationBarTitle({
          title: res.account.nickname
        })
        self.setData(res, () => {
          var photo = [];
          for (var i = 0; i < self.data.photos.length; i++) {
            photo.push(self.data.photos[i].photoUrl)
          }
          self.setData({
            photoList: photo
          })
        })
      })
    })
    api.getWrap().then((res) => {
      this.setData(res)
    })
    api.getAdShow().then((res) => {
      this.setData(res)
    })

    innerAudioContext.onEnded(() => {
      console.info("播放结束")
      this.setData({ isPlay: false })
    })
  },
  onShow: function () {

  },
  onHide: function () {
    innerAudioContext.stop();
  },
  onUnload: function () {
    innerAudioContext.stop();
    innerAudioContext.offEnded();
  },
  admireHandleImg(e) {
    var id = api.getDataset(e)['id'];
    var type = api.getDataset(e)['type'];
    if (!this.data.admire) {
      api.postSquareAdmire({ admireId: id, type: type }).then(res => {
        wx.showToast({
          icon: "none",
          title: '点赞成功',
        })
        var account = this.data.account;
        account.photoAdmire = account.photoAdmire + 1;
        this.setData({ admire: true, account: account })
      })
    } else {
      wx.showToast({
        icon: "none",
        title: '您已点赞',
      })
    }
  },
  bindPlay(e) {
    var type = api.getDataset(e)['type'];
    if (this.data.isPlay && this.data.type == 'type') {
      this.setData({ isPlay: false, type: null });
      innerAudioContext.stop();
    } else {
      this.setData({ isPlay: true, type: type });
      if (type == "speak") {
        innerAudioContext.src = this.data.speak.voiceUrl;
      } else {
        innerAudioContext.src = this.data.account.introUrl;
      }

      innerAudioContext.play();
    }
  },

  // 预览图片
  previewImage(e) {
    wx.previewImage({
      current: e.currentTarget.dataset.url,
      urls: this.data.photoList
    })
  },
  admireHandle(e) {
    var item = this.data.speak;
    if (!this.data.speak.hasAdmire) {
      api.postSquareAdmire({ admireId: this.data.speak.id, type: this.data.speak.type, dialectId: this.data.speak.dialectId }).then(res => {
        wx.showToast({
          icon: "none",
          title: '点赞成功',
        })

        item.admire = item.admire + 1;
        item.hasAdmire = true;
        this.setData({ speak: item })
      })
    } else {
      wx.showToast({
        icon: "none",
        title: '您已点赞',
      })
    }
  },
})