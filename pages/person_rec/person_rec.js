import Api from '../../utils/api.js';
var api = new Api();
const innerAudioContext = wx.createInnerAudioContext();
innerAudioContext.obeyMuteSwitch = false;

const mp3Recorder = wx.getRecorderManager();
const mp3RecoderOptions = {
  duration: 600000,
  sampleRate: 16000,
  numberOfChannels: 1,
  encodeBitRate: 48000,
  format: 'mp3',
  //frameSize: 50
}

Page({

  data: {
    isSpeaking:false,
    isPlay:false,
    isClick:false
  },
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
          duration: 2000
        })
        this.setData({ isRecord: false })
      } else if (res.duration > 30000) {
        wx.showToast({
          title: '录音时间不能超过30秒',
          icon: 'none',
          duration: 2000
        })
      } else {
        const { tempFilePath, duration } = res;
        this.setData({ formData:{filePath:tempFilePath, duration:duration}});
      }
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
  onUnload:function(){
    innerAudioContext.stop();
    innerAudioContext.offEnded();
  },

  touchdown: function (e) {
    this.setData({ isSpeaking: true }, () => {
      mp3Recorder.start(mp3RecoderOptions);
    })
  },
  touchup: function (e) {
    console.log("mp3Recorder.stop")
    this.setData({
      isSpeaking: false
    })
    mp3Recorder.stop();
  },
  bindPlay(){

    this.setData({isPlay:true});
    innerAudioContext.src = this.data.formData.filePath;
    innerAudioContext.play();
  },
  refreshLuzhi(){

    innerAudioContext.stop();
    this.setData({
       isPlay:false,
       formData:{}
    })
  },
  uploadData(){

   if (!this.data.isClick) {
     this.setData({ isClick: true });
     if (!this.data.formData.filePath) {
       wx.showToast({
         icon: 'none',
         title: '请录入语音~',
       })
       return;
     }

     api.uploadAccountInfo(this.data.formData.filePath, this.data.formData.duration).then(res => {
       this.setData({ isClick: false });
       wx.showToast({
         title: '录制成功',
         icon: 'none',
         duration: 2000
       })
       wx.redirectTo({
         url: '/pages/person/person',
       })
     })
   }
   
  }

})