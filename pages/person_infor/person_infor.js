import Api from '../../utils/api.js';
var api = new Api();

Page({
  data: {
        
  },
  onLoad: function (options) {
  
  },
  onReady: function () {
  
  },
  onShow: function () {
    api.getLetterSummary().then(res=>{
      this.setData(res)
    })
  },
  onUnload: function () {
  
  },
  gotoDetail(e){
    var senderId = api.getDataset(e)['senderId'];
    var username = api.getDataset(e)['username'];
    wx.navigateTo({
      url: '/pages/person_chat/person_chat?senderId=' + senderId + "&username=" + username,
    })
  }
})