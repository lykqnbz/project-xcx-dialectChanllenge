import Api from '../../utils/api.js';
var api = new Api();
Page({

  data: {
    imageList: []
  },
  onLoad: function (options) {
    this.getList();
  },
  onShow: function () {

  },
  getList() {
    api.getAccountPhoto().then(res => {
      console.info(res)
      this.setData({
        imageList: (res.photos || []).map((item) => {
          item.check = false;
          return item;
        })
      })
    })

  },
  onHide: function () {

  },
  addImg() {
    wx.chooseImage({
      count: 8 - this.data.imageList.length,
      sizeType: ['compressed'], // 可以指定是原图还是压缩图，默认二者都有
      sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
      success: (res) => {
        // 返回选定照片的本地文件路径列表，tempFilePath可以作为img标签的src属性显示图片
        var tempFilePaths = res.tempFilePaths;


        for (var i = 0; i < tempFilePaths.length; i++) {

          api.uploadAccountPhoto(tempFilePaths[i]).then(res => {
            console.info(res)
            this.setData({
              imageList: (res.photos || []).map((item) => {
                item.check = false;
                return item;
              })
            })
          })
        }
      }
    })
  },
  selectImg(e) {
    var index = api.getDataset(e)['index'];

    var imageList = this.data.imageList;
    imageList[index].check = !imageList[index].check;

    this.setData({ imageList: imageList })
  },
  deletePhoto() {
    var deleteList = [];

    for (var i = 0; i < this.data.imageList.length; i++) {
      var item = this.data.imageList[i];
      if (item.check == true) {
        deleteList.push(item.id);
      }
    }

    if (deleteList.length == 0) {
      wx.showToast({
        title: '请至少选中一张图片',
        icon: 'none',
        duration: 2000
      })
      return;
    }

    wx.showModal({
      title: '提示',
      content: '确认删除选中的照片吗',
      success: res => {
        if (res.confirm) {
          api.deleteAccountPhoto(deleteList).then(res => {
            console.info(res);
            this.setData({
              imageList: (res.photos || []).map((item) => {
                item.check = false;
                return item;
              })
            })
          })
        }
      }
    })
  }
})