import Api from '../../utils/api.js';
var api = new Api();
const innerAudioContext = wx.createInnerAudioContext();
innerAudioContext.obeyMuteSwitch = false;
Page({
  data: {
    senderId: null,
    hasData: true,
    loading: false,
    talkList: [],
    accountId: null,
    playMap: { isPlay: false, currentIndex: 10000 },
    queryMap: { followTime: -1, songTime:-1, accountId:null,size:20  }
  },
  onLoad: function (options) {
    api.getWrap().then((res) => {
      this.setData(res)
    })
    if (!options.accountId) {
     wx.navigateBack({ })
      return;
    }
    // wx.setNavigationBarTitle({
    //   title: `${options.username}`,
    // })
    this.setData({
      "queryMap.accountId": options.accountId,
      accountId: options.accountId
    }, () => {
      this.getList();
    })

    innerAudioContext.onError((res) => {
      console.log(res.errMsg)
      console.log(res.errCode);
    })

    innerAudioContext.onEnded(() => {
      this.stopPlay();
      console.log('播放结束');
    });
  },

  getList(scroll) {

    if (this.data.hasData) {
      this.setData({ loading: true });
      api.getSpeakOther(this.data.queryMap).then(res => {
        console.info(res)
        var contentList = res.speaks;
        var hasdata = true;
        if (contentList.length ==0) {
          hasdata=false;
        }
        var contentItems = this.data.talkList;
        contentItems.push.apply(contentItems, contentList);
        this.setData({
          hasData: hasdata,
          loading: false,
          talkList: contentItems,
          ["queryMap.followTime"]: res.followTime,
          ["queryMap.songTime"]: res.songTime
        })
      })
    }
  },

  showMoreForTalk: function () {
      this.getList();
  },
  onHide: function () {
    innerAudioContext.stop();
  },
  onUnload: function () {
    innerAudioContext.stop();
    innerAudioContext.offEnded();
  },

  bindPlay(e) {
    var index = api.getDataset(e)['index'];
    if (this.data.playMap.currentIndex == index) {
      this.stopPlay();
    } else {
      this.startAutoPlay(index);
    }

  },
  stopPlay() {
    innerAudioContext.stop();
    this.setData({ playMap: { currentIndex: 10000, isPlay: false } })
  },
  startAutoPlay(index) {
    innerAudioContext.stop();
    this.setData({ playMap: { currentIndex: index, isPlay: true } }, () => {
      innerAudioContext.src = this.data.talkList[index].voiceUrl;
      innerAudioContext.play();
    })
  },
  admireHandle(e) {
    var id = api.getDataset(e)['id'];
    var type = api.getDataset(e)['type'];
    var index = api.getDataset(e)['index'];
    var dialectId = api.getDataset(e)['dialectId'];
    var item = this.data.talkList[index];
    if (!item.hasAdmire) {
      api.postSquareAdmire({ admireId: id, type: type, dialectId: dialectId }).then(res => {
        wx.showToast({
          icon: "none",
          title: '点赞成功',
        })
       
        item.admire = item.admire + 1;
        item.hasAdmire =true;
        this.setData({ ['talkList[' + index + ']']: item })
      })
    } else {
      wx.showToast({
        icon: "none",
        title: '您已点赞',
      })
    }
  },
})