class Common {
  /**
   * 获取当前页url
   */
  static getCurrentPageUrl() {
    var pages = getCurrentPages()    //获取加载的页面
    var currentPage = pages[pages.length - 1]    //获取当前页面的对象
    var url = currentPage.route    //当前页面url
    return url
  }

  /**
   * 获取当前页带参数的url
   */
  static getCurrentPageUrlWithArgs() {
    var pages = getCurrentPages()    
    var currentPage = pages[pages.length - 1]   
    var url = currentPage.route   
    var options = currentPage.options

    //拼接url的参数
    var urlWithArgs = url + '?'
    for (var key in options) {
      var value = options[key]
      urlWithArgs += key + '=' + value + '&'
    }

    urlWithArgs = urlWithArgs.substring(0, urlWithArgs.length - 1)

    return urlWithArgs
  }
}

export default Common;
