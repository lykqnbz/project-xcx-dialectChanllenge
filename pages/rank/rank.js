import Api from '../../utils/api.js';
var api = new Api();
Page({
  data: {
    loveImg:'/asset/img/aixin1.png',
    showDonghuaMap:{},
    backMap:{},
    championMap:{}
  },
  onLoad: function (options) {
  
  },
  onShow: function () {
    api.getSummaryAdmir().then(res => {
      this.setData(res);
      var backMap ={};
      var championMap={}
      for (var i=0; i<res.admires.length; i++) {
        backMap[res.admires[i].id] = false;
        championMap[res.admires[i].id] =null;
      } 
      this.setData({ backMap:backMap, showDonghuaMap: backMap, championMap: championMap });
    });
  },
  onShareAppMessage: function (res) {
    var path = "/pages/index/index" + "?from=方言排行&position=button&inviterId=" + wx.getStorageSync("uid");
    return {
      title: '这是谁家的方言？也太难了吧！！',
      path: path,
      imageUrl: '/asset/img/share.png',
      success: function (res) {
      },
    }
  },
  zanMethod(e){

    // 未点赞
    if (!this.data.hasAdmire) {
      var dialectId = api.getDataset(e)['id'];
      var dialect = api.getDataset(e)['dialect'];
      var index = api.getDataset(e)['index'];
      api.postSummaryAdmir(dialectId).then(res=>{

        wx.showToast({
          icon:'none',
          title: res.msg,
        })
        if (res.success == true) {
           
          var admire = this.data.admires[index];
          admire.admire = admire.admire +1;
           this.setData({
             ['admires[' + index + ']']: admire,
             hasAdmire :true,
             admireDialect: dialect
           })
        }
      })

    }else{
      wx.showToast({
        icon:"none",
        title: '今天已点赞，请明天再来',
      })
    }
  },
  showDongHua(e){

    var dialectId = api.getDataset(e)['id'];
    var showDonghua = this.data.showDonghuaMap[dialectId];
    if (!showDonghua ) {
      console.info(showDonghua)
      if (!this.data.championMap[dialectId]) {
        api.getSummaryChampion(dialectId).then(res => {
          console.info(res);
          this.setData({ ["championMap." + dialectId]: res.champion });
        })
      }
      var champMap = this.data.showDonghuaMap;
      var tempMap ={}
      for (var key in champMap) {
        console.info(key)
        if (key== dialectId) {
          tempMap[key] = true;

        } else {
          tempMap[key] = false;
        }
      }
      this.setData({
        showDonghuaMap: tempMap
      })
     
    }  else {
      this.setData({ showDonghuaMap: this.data.backMap });
    }
   
  }
})