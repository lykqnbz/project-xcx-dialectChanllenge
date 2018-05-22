import Api from '../../utils/api.js';
var api = new Api();
const app = getApp();

const swiperMap = { 0: 'account', 1: 'contribution',2:'group'}
const swiperNameMap = { 0: '玩家排行', 1: '贡献排行', 2: '群内排行' }
Page({

  data: {
    currentTab: 0,
    // 用来判断是否已经到最后一页和是否多次下拉开关
    ifDouble: true,
    pageSize:20,
    pageMap: { 0: 1, 1: 1, 2: 1},
    hasDataMap: { 0: true, 1: true, 2: true },
    listMap: { 0: [], 1: [], 2: [] },
    loadingMap: { 0: false, 1: false, 2: false },
    slefMap:{0:0,1:0,2:0},
    account:null
  },
  onLoad: function (options) {
    console.info("onLoadoptions:" , options)
    if (options && options.currentTab) {
      this.setData({ currentTab: parseInt(options.currentTab)})
    }
    wx.showShareMenu({ withShareTicket: true })
    api.getWrapHeight().then((res) => { this.setData({ wrapHeight: res }); })

    api.getInfo().then(res=>{
      this.setData({ account:res})
    })
  },
  onShow: function (options) {
   
      if (this.data.currentTab == 0) {
        this.setData({
          pageMap: { 0: 1, 1: 1, 2: 1 },
          hasDataMap: { 0: true, 1: true, 2: true },
          listMap: { 0: [], 1: [], 2: [] },
          loadingMap: { 0: false, 1: false, 2: false },
        }, () => {
          this.getList(this.data.currentTab)
        })
      }
// 有存在shareTicket，但群ID未解析的
    
    
  },

  getList(currentTab, groupId){
   
    if (this.data.hasDataMap[currentTab]) {
      this.setData({
        ['loadingMap.' + currentTab]: true
      })
      console.info("exist group1 " + groupId)
      if (!groupId) {
        groupId = getApp().globalData.groupId;
      } else {
        console.info("exist group2 "+groupId)
      }
      api.getBoard(swiperMap[currentTab], this.data.pageMap[currentTab], this.data.pageSize, groupId).then(res => {
        var contentList = res.ranks;
        var contentItems = this.data.listMap[currentTab];

        if (this.data.pageMap[currentTab] == 1 ) {

          if ( res.selfRank) {
            this.setData({ ['slefMap.' + currentTab]: res.selfRank })
          }
          contentItems = [];
        }
        if (contentList.length < this.data.pageSize) {
          this.setData({
            ['listMap.'+currentTab]: contentItems.concat(contentList) ,
            ['hasDataMap.' + currentTab] : false ,
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
  onShareAppMessage: function (res) {

    if (res.from == 'button') {
      var path = '/pages/leaderboard/leaderboard?currentTab=' + this.data.currentTab + "&from=" + swiperNameMap[this.data.currentTab] + "&position=button&inviterId=" + wx.getStorageSync("uid");
      return {
        title: '[有人@我]快来看看我的排名',
        path: path,
        success: function (res) {
          api.recordShareLog(path)
        },
      }
    } else {
      var path = '/pages/leaderboard/leaderboard?currentTab=' + this.data.currentTab + "&from=" + swiperNameMap[this.data.currentTab] + "&position=common&inviterId=" + wx.getStorageSync("uid");
      return {
        title: '[有人@我]快来看看我的排名',
        path: path,
        success: function (res) {
          api.recordShareLog(path)
        },
      }
    }
   
  },

  /**
   * 滑块绑定事件
   */
  bindChange: function (e) {
    console.info("bindChange");
    var currentTab = e.detail.current
    this.setData({ currentTab: e.detail.current });

    if (this.data.listMap[currentTab].length == 0) {
      // this.getList(currentTab);
      if (getApp().globalData.shareTicket && !getApp().globalData.groupId) {
        getApp().getGroupInfo().then(res => {
          console.info("group List " + res)
          this.getList(this.data.currentTab, res);
        })
      } else {
        this.getList(this.data.currentTab);
      }

    }
  },

  /**
   * 顶部按钮切换
   */
  swichNav: function (e) {
    console.info("swichNav")
    if (this.data.currentTab === e.currentTarget.dataset.current) {
      return false;
    } else {
      this.setData({
        currentTab: e.currentTarget.dataset.current
      });
      var currentTab = e.currentTarget.dataset.current;

    
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

  goToIndex:function(){
    console.log(22)
    wx.reLaunch({
      url: '/pages/index/index',
    })
  }
})