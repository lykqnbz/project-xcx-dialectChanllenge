// pages/bank/bank.js
import Api from '../../utils/api.js';
var api = new Api();

const mp3Recorder = wx.getRecorderManager();
const innerAudioContext = wx.createInnerAudioContext();
const mp3RecoderOptions = {
  duration: 600000,
  sampleRate: 16000,
  numberOfChannels: 1,
  encodeBitRate: 48000,
  format: 'mp3',
  //frameSize: 50
}
Page({

  /**
   * 页面的初始数据
   */
  data: {
    filePath: null,
    formData: { answer: '', options: ['', '', ''], formId:''},
    isSpeaking: false,
    bankTapeImg: '/asset/img/changanluzhi@2x.png',
    bankFinishTapeImg: '/asset/img/shiting1@2x.png',
    showBind: false,
    showNotice: false,
    showSuccess: false,
    showZhengshu: false,
    voiceTime: 0,
    account: null,

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {


    mp3Recorder.onStart(() => {
      console.log('mp3Recorder.onStart()...')
    })
    mp3Recorder.onError((res) => {
      console.info(res);
      if (res.errMsg == "operateRecorder:fail auth deny") {
        wx.openSetting({
          success: res => {

          }
        })
      }
    })
    mp3Recorder.onStop((res) => {
      console.log('mp3Recorder.onStop() ' + res)
      if (res.duration < 1000) {
        wx.showToast({
          title: '录音时间太短',
          icon: 'none',
          // image: '../../asset/img/failure.png',
          duration: 2000
        })
      } else {
        console.log(res)
        const { tempFilePath, duration } = res;
        this.setData({ filePath: tempFilePath, voiceTime: duration });
      }
    })
  },
  onShow: function (options) {
    var that = this;
    api.getInfo(true).then(res => {
      console.info(res)
      this.setData({ account: res });
      var dialectId = res.dialectId;
      that.setData({ dialect: res.dialect});

      api.getLecList().then(res1 => {
        this.setData(res1,() => {

          if (dialectId) {
            // 需判断是否已经有弹过说明了
            console.log(res.certData)
            console.log(res.dialect)
            console.log(that.data.summaryMap[that.data.dialect].passNo)
            if (!res.certData[res.dialect] && that.data.summaryMap[that.data.dialect].passNo >= 25) {
              // quyanwanyouxi 
              that.setData({ showZhengshu: true });
            } else {
              if (!wx.getStorageSync("SHOW_BANK_NOTICE")) {
                that.setData({ showNotice: true });
                wx.setStorageSync("SHOW_BANK_NOTICE", true)
              } else {
                that.setData({ showNotice: false });
              }
            }

          } else {
            // 需要弹出未绑定方言， 需弹框提醒
            that.setData({ showBind: true })
          }
        })
      });
    })
  },
  onUnload() {
    innerAudioContext.stop(() => {
      console.log('手动停止播放')
    });
  },
  touchdown: function () {
    //touchdown_mp3: function () {
    console.log("mp3Recorder.start with" + mp3RecoderOptions)
    var _this = this;
    this.setData({
      isSpeaking: true,
      bankTapeImg: '/asset/img/changanluzhi.gif'
    })
    mp3Recorder.start(mp3RecoderOptions);
  },
  touchup: function () {
    console.log("mp3Recorder.stop")
    this.setData({
      isSpeaking: false,
      bankTapeImg: '/asset/img/changanluzhi@2x.png'
    })
    mp3Recorder.stop();
  },
  checkAnswer(e) {
    var answer = e.detail.value.trim("");
    this.setData({ "formData.answer": answer })
  },
  checkOption(e) {

    var index = api.getDataset(e)['index'];
    var option = e.detail.value.trim("");
    var options = this.data.formData.options;
    options[index] = option;
    this.setData({ "formData.options": options })
  },

  /**
   * 提交出题
   */
  submitBank(e) {
    console.info(e)
    if (!this.data.filePath) {
      wx.showToast({
        icon: 'none',
        title: '请录入语音~',
      })
      return;
    }
    if (!this.data.formData.answer) {
      wx.showToast({
        icon: 'none',
        title: '请输入正确答案~',
      })
      return;
    }
    var error = false;
    for (var i = 0; i < this.data.formData.options.length; i++) {
      if (!this.data.formData.options[i]) {
        wx.showToast({
          icon: 'none',
          title: '请输入三个错误选项~',
        })
        error = true;
        break;
      }
    }
    if (error) {
      return;
    }

    var formId = e.detail.formId;
    if (formId == "the formId is a mock one") {
      formId = null;
    }

    this.setData({["formData.formId"]:formId});
    api.uploadBank(this.data.filePath, this.data.formData).then(res => {
      console.warn("fildP:" + this.data.filePath)
      console.warn("formId:" + e.detail.formId)
      console.warn("formData:" + this.data.formData)
      console.warn("res:" + res)
      console.warn("resJ:" + JSON.parse(res))
      res = JSON.parse(res)
      if (res.success == true) {
        this.setData({ showSuccess: true, filePath: null, formData: { answer: '', options: ['', '', ''], formId:''} })
      }
    })
  },

  // 上报formId
  formSubmit: function (e) {
    var self = this;
    console.log(e.detail.formId)
    api.formSubmit(e.detail.formId).then(res => {
    })
  },

  refreshLuzhi() {
    this.setData({ filePath: null, bankFinishTapeImg: '/asset/img/shiting1@2x.png' });
    innerAudioContext.stop(() => {
    });
  },
  bindPlay() {

    innerAudioContext.stop(() => {
      console.log('手动停止播放')
    });
    innerAudioContext.src = this.data.filePath;

    this.setData({
      bankFinishTapeImg: '/asset/img/listts.gif'
    });

    innerAudioContext.play(() => {

      console.log('开始播放')

    });

    innerAudioContext.onError((res) => {

      console.log(res.errMsg)
    });

    innerAudioContext.onEnded(() => {

      console.log('播放结束')
      this.setData({
        bankFinishTapeImg: '/asset/img/shiting1@2x.png'
      })

    });
  },
  gotoTrail() {
    this.setData({ showSuccess: false, showNotice: false, showBind: false })
    wx.navigateTo({
      url: '/pages/trail/trail',
    })
  },
  gotoBack() {
    this.setData({ showSuccess: false, showNotice: false, showBind: false, showZhengshu: false})
    wx.reLaunch({
      url: '/pages/index/index',
    })
  },
  gotoBind() {
    this.setData({ showBind: false, showZhengshu: false });
    wx.navigateTo({
      url: '/pages/bind/bind',
    })
  },
  goGetZh() {
    this.setData({ showZhengshu: false });
    var pass = parseInt(this.data.passData[this.data.dialect]) + 1;
    wx.navigateTo({
      url: '/pages/play/play?dialect=' + this.data.dialect+ '&pass=' + pass
    })
    console.log("pass=" + pass + "  ddd:" + this.data.dialect)
  },
  closeNotice() {
    this.setData({ showNotice: false })
  },
  closeSuccess() {
    this.setData({ showSuccess: false })
  }
})