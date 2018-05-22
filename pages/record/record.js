import Api from '../../utils/api.js';
var api = new Api();
const innerAudioContext = wx.createInnerAudioContext();

const swiperMap = { 0: 'follow', 1: 'song' }
Page({

  data: {
    currentTab:0,
    SHeight: 0,
    playMap:{},
    showList:[],
    songList:[],
    pageSize:10,
    ifDouble:true,
    listMap: { 0: [], 1: [] },
    hasDataMap: { 0: true, 1: true },
    loadingMap: { 0: false, 1: false },
    pageMap: { 0: 1, 1: 1 },
  },
  onLoad: function (options) {
    api.getWrap().then(res => {
      this.setData(res, () => {
        this.setData({
          SHeight: this.data.wrapHeight * (750 / this.data.wrapWidth) - 130,
        })
      })
    })

    innerAudioContext.onEnded(() => {
     console.info("停止播放");
     this.setData({playMap:{}})
    });
  },



  onShow: function () {
    this.setData({
      pageMap: { 0: 1, 1: 1},
      hasDataMap: { 0: true, 1: true },
      listMap: { 0: [], 1: []},
      loadingMap: { 0: false, 1: false },
    }, () => {
      this.getList(this.data.currentTab)
    })
  },

  onHide: function () {
    innerAudioContext.stop();
  },
  onUnload: function () {
    innerAudioContext.stop();
    innerAudioContext.offEnded();
  },
  getList(currentTab){
    if (this.data.hasDataMap[currentTab]) {
      api.getSelfRecord(swiperMap[currentTab], this.data.pageMap[currentTab], this.data.pageSize).then(res=>{
        console.info(res);

        var contentList = res.list;
        var contentItems = this.data.listMap[currentTab];

        if (this.data.pageMap[currentTab] == 1) {
          contentItems = [];
        }
        if (contentList.length < this.data.pageSize) {
          this.setData({
            ['listMap.' + currentTab]: contentItems.concat(contentList),
            ['hasDataMap.' + currentTab]: false,
            ['loadingMap.' + currentTab]: false,
            ifDouble: true
          })
        } else {

          this.setData({
            ['listMap.' + currentTab]: contentItems.concat(contentList),
            ['hasDataMap.' + currentTab]: true,
            ['pageMap.' + currentTab]: this.data.pageMap[currentTab] + 1,
            ['loadingMap.' + currentTab]: false,
            ifDouble: true
          })
        }
      })

    }
  },
  showMore: function (e) {
    console.info("下一页")
    console.info(this.data.ifDouble)
    var ifDouble = this.data.ifDouble;
    if (ifDouble) {

      this.setData({ ifDouble: false })
      this.getList(this.data.currentTab);
    }
  },
  bindPlay(e) {
    var voiceUrl = api.getDataset(e)['voiceUrl'];
    var index = api.getDataset(e)['index'];
    var id = api.getDataset(e)['id'];
    var type = api.getDataset(e)['type'];

    if (this.data.playMap.currentId == id) {
      innerAudioContext.stop();
    } else {
      innerAudioContext.stop();
      this.setData({ playMap:{currentIndex:index, currentId:id, type:type}}, ()=>{
        innerAudioContext.src = voiceUrl;
        innerAudioContext.play();
      })
    }
  },
  deleteRecord(e) {
    var id = api.getDataset(e)['id'];
    var index = api.getDataset(e)['index'];
    var type = api.getDataset(e)['type'];
    wx.showModal({
      title: '提示',
      content: '确定删除吗',
      success: res => {
        if (res.confirm) {
          api.deleteSquare({ deleteId: id, type: type }).then(res => {
              var showList = this.data.listMap[this.data.currentTab];
              showList.splice(index, 1);
              this.setData({ ['listMap.' + this.data.currentTab]: showList })
          
        
          })
        } else {

        }
      }
    })
  },

  /**
  *滑块绑定事件
  */
  bindChange: function (e) {
    var currentTab = e.detail.current;
    this.setData({ currentTab: e.detail.current });

    if (this.data.listMap[currentTab].length == 0) {
       this.getList(currentTab);
    }
  },

  /**
   * 顶部按钮切换
   */
  swichNav: function (e) {
    if (this.data.currentTab === e.currentTarget.dataset.current) {
      return false;
    } else {
      this.setData({
        currentTab: e.currentTarget.dataset.current
      });
    }
  },
})