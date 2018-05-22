// Api请求
import Base from './base.js';
import Config from './config.js';
class Api extends Base {

  /**
   * 获得用户账号信息
   */
  getInfo(refresh) {

    return new Promise((resolve, reject) => {

      if (!refresh && getApp().globalData.account) {
        resolve(getApp().globalData.account);
      } else {
        this.get('/api/v1/dialect/account').then((res) => {
          getApp().globalData.account = res.data.account;
          resolve(res.data.account);
          console.info('用户信息', res.data)
        });
      }

    });
  }

  getAppConfig() {
    return new Promise((resolve, reject) => {
      if (getApp().globalData.letterMap) {
        resolve(getApp().globalData.letterMap);
      } else {
        this.get('/api/v1/app/config', {}).then(res => {
          getApp().globalData.letterMap = res.data.appConfig.letterMap;
          resolve(res.data.appConfig.letterMap)
        })
      }
    });
  }

  /**
   * 判断新老用户
   */
  getIfNewPlayer() {
    return new Promise((resolve, reject) => {
      this.post('/api/v1/account/init').then(res => {
        resolve(res.data);
      });
    })
  }

  /**
   * 获取首页banner
   */
  getBannerList() {
    return new Promise((resolve, reject) => {
      this.get('/api/v1/app/banner').then(res => {
        resolve(res.data);
      });
    })
  }
  /**
   * 旧·获得方言种类
   */
  getDialectSummaries() {
    return new Promise((resolve, reject) => {
      this.get('/api/v1/dialect/summaries').then((res) => {
        resolve(res.data);
      });
    });
  }

  /**
   * 新·获得方言种类
   */
  getDialectSummariesNew() {
    return new Promise((resolve, reject) => {
      this.get('/api/v1/dialect/summary/area').then((res) => {
        resolve(res.data);
      });
    });
  }

  /**
   * 获取单个关卡信息
   */
  getPass(dialect, pass, caller = '') {
    return new Promise((resolve, reject) => {
      this.get('/api/v1/dialect/question', { pass: pass, dialect: dialect, caller: caller }).then(res => {
        resolve(res.data);
      });
    });
  }

  /**
   * 单个方言详情
   */
  getSummary(id) {
    return new Promise((resolve, reject) => {
      this.get('/api/v1/dialect/summary/' + id).then(res => {
        resolve(res.data);
      });
    });
  }

  /**
   * 获取更多好玩列表
   */
  getMoreList() {
    return new Promise((resolve, reject) => {
      this.get('/api/v1/apps').then(res => {
        resolve(res.data);
      });
    });
  }

  /**
   * 获取排行列表
   */
  getRankList() {
    return new Promise((resolve, reject) => {
      this.get('/api/v1/dialect/rank').then(res => {
        resolve(res.data);
      });
    });
  }

  /**
   * 获取证书列表
   */
  getLecList() {
    return new Promise((resolve, reject) => {
      this.get('/api/v1/dialect/certs').then(res => {
        resolve(res.data);
      });
    });
  }
  /**
   * 回答问题
   */
  postAnswer(questionId, answer, caller = '') {
    console.info('---回答问题id---' + questionId)
    console.info('---回答问题answer---' + answer)
    console.info('---回答问题caller---' + caller)

    return new Promise((resolve, reject) => {
      this.post('/api/v1/dialect/question/answer', { questionId: questionId, answer: answer, caller: caller }).then(res => {
        resolve(res.data);
        console.info('---回答问题---', res.data)
      })
    })

  }

  /**
   * 获取设备高度
   */
  getWrapHeight() {
    return new Promise((resolve, reject) => {
      wx.getSystemInfo({
        success: function (res) {
          resolve(res.windowHeight);
        }
      })
    });
  }
  getWrapWidth() {
    return new Promise((resolve, reject) => {
      wx.getSystemInfo({
        success: function (res) {
          resolve(res.windowWidth);
        }
      })
    });
  }

  /**
   * 分享群
   */
  postGroup(encryptedData, iv, type = '') {
    return new Promise((resolve, reject) => {
      this.post('/api/v1/account/group/add', { encryptedData: encryptedData, iv: iv, type: type }).then(res => {
        resolve(res.data);
      })
    })
  }

  /**
   * 获得帮助者的答案
   */
  getFriendAnswer(questionId) {
    return new Promise((resolve, reject) => {
      this.get('/api/v1/dialect/helpers/' + questionId).then(res => {
        resolve(res.data);
      })
    })

  }

  /**
   * 用户签到接口
   */
  getSign() {
    return new Promise((resolve, reject) => {
      this.get('/api/v1/dialect/sign').then(res => {
        resolve(res.data);
      })
    })

  }

  /**
   * 获得全局配置里面的值
   */
  getBizconfig(name) {
    return new Promise((resolve, reject) => {
      this.get('/api/v1/biz/config?name=' + name).then(res => {
        resolve(res.data);
      })
    })

  }
  // 出题上报
  uploadBank(filePath, formData) {
    console.info(filePath)
    formData.options = JSON.stringify(formData.options);
    console.info(formData)
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: Config.API_HOST + '/api/v1/dialect/bank/create',
        filePath: filePath,
        name: 'file',
        formData: formData,
        header: {
          'content-type': 'multipart/form-data', 'TOKEN': wx.getStorageSync('token'), 'APPID': Config.APP_ID,
          'VERSION': '2.0'
        },
        success: res => {
          resolve(res.data);
        },
        fail: res => {
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


  // 玩家排行版
  getBoardForAccount(page) {
    return new Promise((resolve, reject) => {
      this.get('/api/v1/dialect/account/rank/account', { index: page }).then(res => {
        resolve(res.data);
      })
    })
  }

  // 贡献排行版
  getBoardForContribution(page) {
    return new Promise((resolve, reject) => {
      this.get('/api/v1/dialect/account/rank/contribution', { index: page }).then(res => {
        resolve(res.data);
      })
    })
  }

  getBoardForGroup(page, groupId) {
    return new Promise((resolve, reject) => {
      this.get('/api/v1/dialect/account/rank/group', { index: page, group: groupId }).then(res => {
        resolve(res.data);
      })
    })
  }

  getBoard(type, page, size, groupId) {
    return new Promise((resolve, reject) => {
      this.get('/api/v1/dialect/account/rank/' + type, { index: page, size: size, group: groupId }).then(res => {
        resolve(res.data);
      })
    })
  }

  // 浮标广告获取
  getFubiao() {
    return new Promise((resolve, reject) => {
      this.get('/api/v1/advert/one').then(res => {
        resolve(res.data);
      })
    })
  }

  // 点击浮标广告
  clickFubiao(advertId) {
    return new Promise((resolve, reject) => {
      this.post('/api/v1/advert/click/stat', { advertId: advertId }).then(res => {
        resolve(res);
      })
    })
  }

  // 上报formID
  formSubmit(formId) {
    return new Promise((resolve, reject) => {
      this.post('/api/v1/account/form', { formId: formId }).then(res => {
        resolve(res);
      })
    })
  }
  // 上报formID
  formSubmitForShow(formId) {
    return new Promise((resolve, reject) => {
      this.post('/api/v1/dialect/show/form', { formId: formId }).then(res => {
        resolve(res);
      })
    })
  }

  // 获取审核的题目
  getBankOne(lastId) {
    return new Promise((resolve, reject) => {
      this.get('/api/v1/dialect/bank/one', { lastId: lastId }).then(res => {
        resolve(res.data);
      })
    })
  }

  // 审核题目 参数为 题目Id及审核结果
  postBankTrail(bankId, answer) {
    return new Promise((resolve, reject) => {
      this.post('/api/v1/dialect/bank/trial', { bankId: bankId, answer: answer }).then(res => {
        resolve(res.data)
      })
    })
  }

  // 举报题目， type区分出题和题库， questionIdmongoid
  postBankReport(type, questionId, reason) {
    return new Promise((resolve, reject) => {
      this.post('/api/v1/dialect/bank/report', { type: type, questionId: questionId, reason: reason }).then(res => {
        resolve(res.data)
      })
    })
  }
  // 题目报错， 问题id 及错误原因
  postDialectError(questionId, reason) {
    return new Promise((resolve, reject) => {
      this.post('/api/v1/dialect/question/error', { questionId: questionId, reason: reason }).then(res => {
        resolve(res.data)
      })
    })
  }

  bindDialect(dialectId) {
    return new Promise((resolve, reject) => {
      this.post('/api/v1/dialect/account/bind/dialect', { dialectId: dialectId }).then(res => {
        console.info(res.data)
        resolve(res.data)
      })
    })
  }

  getWrap() {
    return new Promise((resolve, reject) => {
      wx.getSystemInfo({
        success: function (res) {
          var wrap = { wrapHeight: res.windowHeight, wrapWidth: res.windowWidth }
          resolve(wrap);
        }
      })
    });
  }

  getSummaryAdmir() {
    return new Promise((resolve, reject) => {
      this.get('/api/v1/dialect/summary/admire').then(res => {
        resolve(res.data)
      })
    })
  }

  postSummaryAdmir(dialectId) {
    return new Promise((resolve, reject) => {
      this.post('/api/v1/dialect/summary/admire', { dialectId: dialectId }).then(res => {
        resolve(res)
      })
    })
  }

  getSummaryChampion(dialectId) {
    return new Promise((resolve, reject) => {
      this.get('/api/v1/dialect/summary/champion', { dialectId: dialectId }).then(res => {
        resolve(res.data)
      })
    })
  }


  // 获取广告开光
  getAdShow() {
    return new Promise((resolve, reject) => {
      this.get('/api/v1/app/official/advert', {}).then(res => {
        resolve(res.data)
      })
    })
  }

  // -----------------------------------
  // ----------- v3 版本新的api ---------
  // -----------------------------------


  /**
   * 获取一个广场秀
   * createTime： 最后一条的创建时间， 默认-1
   * index： 第几条，默认1
   * showId： 广场秀的ID， 用户分享进来用的，后续要一直带上，防止api给重复的数据
   */
  getShowOne(formData) {
    return this.get('/api/v1/dialect/show/one', formData).then(res => {
      console.info(res)
      return Promise.resolve(res.data);
    });
  }

  /**
   * 获取一个广场秀的某一个方言的数据
   * showId: 广场秀的ID，
   * dialectId： 方言ID，
   * createTime： 最后一条的创建时间， 默认-1
   * index： 第几页， 默认1
   * size： 页大小，默认20
   */
  getShowDetail(formdata) {
    return this.get('/api/v1/dialect/show/detail', formdata).then(res => {
      return Promise.resolve(res.data);
    });
  }

  /**
   * 上传广场秀的跟帖，
   * filePath： 音频文件的地址，
   * showId： 广场秀的ID
   * duration: 时长
   */
  uploadShowFollow(filePath, showId, duration = 0) {
    let uploadUrl = '/api/v1/dialect/show/follow';
    let formData = {
      showId: showId,
      duration: duration
    }
    return super.uploadFile(uploadUrl, filePath, formData).then(res => {
      return Promise.resolve(res.data);
    });
  }

  getShowHome(formData) {
    return this.get('/api/v1/dialect/show/home', formData).then(res => {
      return Promise.resolve(res.data);
    });
  }

  getShowById(showId) {
    return this.get('/api/v1/dialect/show/top/follow', { showId: showId }).then(res => {
      return Promise.resolve(res);
    });
  }

  /**
   * 获取一个童谣歌曲的数据
   * createTime： 最后一条的创建时间， 默认-1
   * index： 第几页， 默认1
   * size： 页大小，默认20
   */
  getSongHome(formData) {
    return this.get('/api/v1/dialect/song/home', formData).then(res => {
      return Promise.resolve(res.data);
    });
  }

  postSendMsg(content) {
    return this.post('/api/v1/dialect/show/create', { content: content }).then(res => {
      return Promise.resolve(res);
    });
  }

  /**
   * 上传童谣歌曲的数据
   * filePath： 音频文件的地址，
   * title: 标题
   */
  uploadSongCreate(filePath, title, description, duration = 0) {
    let uploadUrl = '/api/v1/dialect/song/create';
    let formData = {
      title: title,
      description: description,
      duration: duration
    }
    return super.uploadFile(uploadUrl, filePath, formData).then(res => {
      return Promise.resolve(res.data);
    });
  }

  uploadTalkCreate(filePath, duration = 0, dialectId, dialect, formId) {
    let uploadUrl = '/api/v1/dialect/talk/create';
    let formData = {
      duration: duration,
      dialectId: dialectId,
      dialect: dialect,
      formId: formId
    }
    return super.uploadFile(uploadUrl, filePath, formData).then(res => {
      return Promise.resolve(res.data);
    });
  }

  /**
   * 获取一个同乡杂谈首页的数据
   * createTime： 最后一条的创建时间， 默认-1
   * index： 第几页， 默认1
   * size： 页大小，默认20
   */
  getTalkHome(formdata) {
    return this.get('/api/v1/dialect/talk/home', formdata).then(res => {
      return Promise.resolve(res.data);
    });
  }

  /**
   * 广场里的所有举报
   * reportId: 举报的id，
   * type： 类型， 包含 follow， song， talk
   * reason： 举报的原因
   */
  postSquareReport(formData) {
    return super.post('/api/v1/dialect/square/report', formData).then(res => {
      return Promise.resolve(res.data);
    })
  }

  /**
   * 广场里的所有点赞
   * admireId: 举报的id，
   * type： 类型， 包含 follow， song， talk, 
   */
  postSquareAdmire(formData) {
    return super.post('/api/v1/dialect/square/admire', formData).then(res => {
      return Promise.resolve(res.data);
    })
  }

  // 上报更多好玩id
  postMorePlay(appId) {
    return super.post('/api/v1/app/more/click', { appId: appId }).then(res => {
      return Promise.resolve(res);
    })
  }

  // 获取方言秀跟帖详情的
  getShowFollowDetail(data) {
    return super.get('/api/v1/dialect/show/follow/detail', data);
  }

  statPlay(data) {
    return super.post('/api/v1/dialect/square/play/stat', data);
  }

  deleteSquare(formdata) {
    return super.post('/api/v1/dialect/square/delete', formdata).then(res => {
      return Promise.resolve(res);
    })
  }

  getSelfRecord(type, index, size) {
    return this.get('/api/v1/dialect/account/speak/record', { type: type, index: index, size: size }).then(res => {
      return Promise.resolve(res.data);
    })
  }

  uploadAccountInfo(filePath, duration = 0) {
    let uploadUrl = '/api/v1/dialect/account/intro';
    let formData = {
      duration: duration
    }
    return super.uploadFile(uploadUrl, filePath, formData).then(res => {
      res = JSON.parse(res);
      return Promise.resolve(res.data);
    });
  }

  getAccountPhoto(accountId){
    return new Promise((resolve, reject) => {

      var formData = {};
      if (accountId) {
        formData['accountId'] = accountId;
      }
      this.get('/api/v1/dialect/account/photos', formData).then(res => {
        resolve(res.data);
      })
    })
  }

  deleteAccountPhoto(photos) {
    return new Promise((resolve, reject) => {
      this.post('/api/v1/dialect/account/photo/delete', { photoIds: photos}).then(res => {
        resolve(res.data);
      })
    })
  }

  uploadAccountPhoto(filePath) {
    let uploadUrl = '/api/v1/dialect/account/photo';
  
    return super.uploadFile(uploadUrl, filePath).then(res => {
      res = JSON.parse(res);
      console.info(res)
      return Promise.resolve(res.data);
    });
  }

  getAccountInfo(accountId){
  return new Promise((resolve, reject) => {

    var formData = {};
    if (accountId) {
      formData['accountId'] = accountId;
    }
    this.get('/api/v1/dialect/account/info', formData).then(res => {
      resolve(res.data);
    })
  })
  }
  // 私信给别人
  uploadAccountLetter(filePath, duration = 0, receiverId) {
    let uploadUrl = '/api/v1/dialect/account/letter';
    let formData = {
      duration: duration,
      receiverId: receiverId
    }
    return super.uploadFile(uploadUrl, filePath, formData).then(res => {
      res = JSON.parse(res);
      return Promise.resolve(res.data);
    });
  }

// 获取我的消息列表
  getLetterSummary(){
    return this.get('/api/v1/dialect/account/letter/summary', {}).then(res => {
      return Promise.resolve(res.data);
    });
  }
  // 获取与某个人的私信
  getLetterList(formdata) {
    return this.get('/api/v1/dialect/account/letters', formdata).then(res => {
      return Promise.resolve(res.data);
    });
  }

  getSpeakOther(formdata){
    return this.get('/api/v1/dialect/account/speak/other', formdata).then(res => {
      return Promise.resolve(res.data);
    });
  }

  postLocation(longitude, latitude) {
    return this.post('/api/v1/dialect/account/location', { longitude: longitude, latitude: latitude }).then(res => {
      if (res.data.account) {
        getApp().globalData.account = res.data.account;
      }
  
      return Promise.resolve(res.data);
    });
  }

  getNear(formData){
    return this.get('/api/v1/dialect/square/near', formData).then(res => {
      return Promise.resolve(res.data);
    });
  }

  getJokeList(formData) {
    return this.get('/api/v2/dialect/joke/home', formData).then(res => {
      return Promise.resolve(res.data);
    });
  }

  postJoke(filePath, duration=0){
    let uploadUrl = '/api/v2/dialect/joke/create';
    let formData = {
      duration: duration
    }
    return super.uploadFile(uploadUrl, filePath, formData).then(res => {
      res = JSON.parse(res);
      return Promise.resolve(res.data);
    });
  }

  getJokeComment(formData) {
    return this.get('/api/v2/dialect/joke/comments', formData).then(res => {
      return Promise.resolve(res.data);
    });
  }

  postJokeComment(jokeId, comment){

    let formData = {
      jokeId: jokeId,
      comment: comment
    }
    return this.post('/api/v2/dialect/joke/comment', formData).then(res => {
      return Promise.resolve(res);
    });
  }
 //  type： 类型， 包含 follow， song， talk,  joke 笑话， comment评论，photo照片
  postDespise(despiseId, type) {
    let formData = {
      despiseId: despiseId,
      type: type
    }
    return super.post('/api/v2/dialect/despise', formData).then(res => {
      return Promise.resolve(res.data);
    })
  }

  // 群分布获得好群位置
  getGroupList(groupId='') {
    return this.get('/api/v2/dialect/group/distribution', {groupId:groupId}).then(res => {
      return Promise.resolve(res.data);
    });
  }

  recordShareLog(path){
    var formData ={};
    path = path.substring(path.indexOf('?')+1, path.length);
    var params = path.split("&");
    for (var i=0; i<params.length; i++) {
      console.info(params[i]);
      var item = params[i].split('=');
      formData[item[0]] = item[1];
    }
    console.info(formData)
    return this.post('/api/v1/share/log', formData).then(res => {
      return Promise.resolve();
    });
  }

  recordInviteRecord(options){

    var formData = options.query;
    formData['to'] = options.path;

    console.info(formData)
    return this.post('/api/v1/invite/log', formData).then(res => {
      return Promise.resolve();
    });
  }
}

export default Api;

