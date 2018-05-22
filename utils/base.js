import Config from './config.js';

class Base {

  /**
   * 静态方法， 获取请求有的header
   */
  static getHeader() {
    return {
      'Content-Type': 'application/json',
      'TOKEN': wx.getStorageSync('token'),
      'APPID': Config.APP_ID,
      'VERSION': '2.0'
    };
  }

  /**
   * 发起请求
   */
  request(params, noLogin) {
    return new Promise((resolve, reject) => {
      let url = Config.API_HOST + params.url;
      wx.request({
        url: Config.API_HOST + params.url,
        data: params.data || {},
        method: params.method || 'GET',
        header: Base.getHeader(),
        success: (res) => {
          if (res.statusCode == 200) {
            let data = res.data;
            if (data.code == 302) {
              if (!noLogin) {
                this.login().then((res) => {
                  console.log('重新登录的请求的--->>', res);
                  this.request(params, true).then(resolve).catch(reject);
                });
              }
            } else {
              resolve(data);
            }
          } else {

            wx.showModal({
              title: '提示',
              content: "请求错误，请重试！！",
              showCancel: false,
              success: (res) => {
                this.request(params, noLogin).then(resolve).catch(reject);
              }
            });
          }
        },
        fail: (res) => {
          wx.showModal({
            title: '提示',
            content: "网络请求失败，请确保网络是否正常",
            showCancel: false,
            success: function (fail) {
              reject(res);
            }
          });
        }
      })
    })
  }

  /**
   * 发起get请求
   */
  get(url, data = {}) {
    return this.request({ url: url, data: data });
  }

  /**
   * 发起post请求
   */
  post(url, data = {}) {
    return this.request({ url: url, data: data, method: 'POST' });
  }

  /**
   * 登录
   */
  login() {
    let self = this;
    return new Promise((resolve, reject) => {
      wx.login({
        success: function (login) {
          wx.getUserInfo({
            withCredentials: true,
            lang: "zh_CN",
            success: function (info) {
              getApp().globalData.userInfo = info.userInfo;
              self.request({
                url: '/api/v1/account/init',
                data: {
                  code: login.code,
                  iv: info.iv,
                  encryptedData: info.encryptedData
                },
                method: 'POST'
              }).then((res) => {
                console.log('login -->>', res);
                wx.setStorageSync('token', res.data.token);
                wx.setStorageSync('uid', res.data.uid);
                if(res.data.isNew) {
                  getApp().globalData.isNew = res.data.isNew;
                }
                resolve(res);
              }).catch(reject);
            },
            fail: function (fail) {
              self.showAuthModal().then((res) => {
                console.log('login -- show', res);
                resolve(res);
              }).catch(reject);
            }
          });
        }
      })
    });
  }

  /**
   * 显示授权弹窗
   */
  showAuthModal() {
    let self = this;
    return new Promise((resolve, reject) => {
      wx.showModal({
        title: '小程序必须要授权才能继续使用',
        showCancel: false,
        success: (res) => {
          wx.openSetting({
            success: function (res) {
              if (res.authSetting['scope.userInfo']) {
                self.login().then(resolve).catch(reject);
              } else {
                self.showAuthModal().then(resolve).catch(reject);
              }
            }
          });
        }
      });
    })
  }

  /**
   * 获取账号信息
   */
  // getAccount() {
  //   return new Promise((resolve, reject) => {
  //     let account = getApp().globalData.account;
  //     if (account == undefined) {
  //       this.get('/api/v1/account/id').then(res => {
  //         getApp().globalData.account = res.data.account;
  //         resolve(res.data.account);
  //       }).catch(reject);
  //     }
  //   });
  // }

  navClick(self, url) {
    if (!self.data.hasClick) {
      self.setData({ hasClick: true });
      setTimeout(() => { self.setData({ hasClick: false }) }, 500);
      wx.navigateTo({
        url: url
      });
    }
  }

  /**
   * 获取绑定的参数
   */
  getDataset(event) {
    return event.currentTarget.dataset;
  }

  /**
   * uploadUrl: 上传的url
   * filePath： 文件地址
   * formData: 上传数据
   */
  uploadFile(uploadUrl, filePath, formData = {}) {
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: Config.API_HOST + uploadUrl,
        filePath: filePath,
        name: 'file',
        formData: formData,
        header: {
          'Content-Type': 'multipart/form-data',
          'TOKEN': wx.getStorageSync('token'),
          'APPID': Config.APP_ID,
          'VERSION': '2.0'
        },
        success: (res) => {
          resolve(res.data);
        },
        fail: (res) => {
          wx.showModal({
            title: '提示',
            content: "网络请求失败，请确保网络是否正常",
            showCancel: false,
            success: function (fail) {
              reject(res);
            }
          });
        }
      })
    })
  }


}

export default Base;