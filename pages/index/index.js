//index.js
var COS = require('../../lib/cos-wx-sdk-v5')
var config = require('./config')

var cos = new COS({
    getAuthorization: function (params, callback) {//获取签名 必填参数

        // 方法一（推荐）服务器提供计算签名的接口
        /*
        wx.request({
            url: 'SIGN_SERVER_URL',
            data: {
                Method: params.Method,
                Key: params.Key
            },
            dataType: 'text',
            success: function (result) {
                callback(result.data);
            }
        });
        */

        // 方法二（适用于前端调试）
        var authorization = COS.getAuthorization({
            SecretId: config.SecretId,
            SecretKey: config.SecretKey,
            Method: params.Method,
            Key: params.Key
        });
        callback(authorization);
    }
});

var requestCallback =function (err, data) {
    console.log(err || data);
    if (err && err.error) {
        wx.showModal({title: '返回错误', content: '请求失败：' + err.error.Message + '；状态码：' + err.statusCode, showCancel: false});
    } else if (err) {
        wx.showModal({title: '请求出错', content: '请求出错：' + err + '；状态码：' + err.statusCode, showCancel: false});
    } else {
        wx.showToast({title: '请求成功', icon: 'success', duration: 3000});
    }
};


var option = {
  data: {
    imgs: [],
    keys: [],
    list: [],
    // list: ["https://huihua123-1257828036.cos.ap-shanghai.myqcloud.com/wxbe12c6edd1caca19.o6zAJsyceeNCzCtfcs-1dhbrZ3DM.Mq3jJ6dEFN3Hb83b29f895d670a09d0d6233e6ba4b8c.jpg", "https://huihua123-1257828036.cos.ap-shanghai.myqcloud.com/wxbe12c6edd1caca19.o6zAJsyceeNCzCtfcs-1dhbrZ3DM.Mq3jJ6dEFN3Hb83b29f895d670a09d0d6233e6ba4b8c.jpg"],
    stars: [0, 1, 2, 3, 4],
    normalSrc: '../../images/1.png',
    selectedSrc: '../../images/3.png',
    halfSrc: '../../images/2.png',
    scores: [0,0,0,0,0,0,0,0,0,0],
    playStarts: [[0, 1, 2, 3, 4], [0, 1, 2, 3, 4], [0, 1, 2, 3, 4], [0, 1, 2, 3, 4], [0, 1, 2, 3, 4], [0, 1, 2, 3, 4], [0, 1, 2, 3, 4], [0, 1, 2, 3, 4], [0, 1, 2, 3, 4]]
  },
};

  //上传图片
  option.uploadFile = function (e) {
    var that = this;
    var imgs = this.data.imgs; 
    
    if (imgs.length >= 9) {
      this.setData({
        lenMore: 1
      });
      setTimeout(function () {
        that.setData({
          lenMore: 0
        });
      }, 2500);
      return false;
    }
    wx.chooseImage({
      // count: 1, // 默认9
      sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
      sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
      success: function (res) {
        // 返回选定照片的本地文件路径列表，tempFilePath可以作为img标签的src属性显示图片
        var tempFilePaths = res.tempFilePaths;
        var imgs = that.data.imgs;
        var keys = that.data.keys;

        for (var i = 0; i < tempFilePaths.length; i++) {
          if (imgs.length >= 9) {
            that.setData({
              imgs: imgs
            });
            return false;
          } else {
            imgs.push(tempFilePaths[i]);
          }

          var filePath = tempFilePaths[i]
          var Key = filePath.substr(filePath.lastIndexOf('/') + 1);
          keys.push(Key);
        
          cos.postObject({
            Bucket: config.Bucket,
            Region: config.Region,
            Key: Key,
            FilePath: filePath,
            onProgress: function (info) {
              console.log(JSON.stringify(info));
            }
          }, requestCallback);
        }

        that.setData({
          imgs: imgs,
          keys: keys
        });
      }
    });
  };

  // 删除图片
option.deleteImg = function (e) {
    var that = this;
    var list = that.data.list;
    var index = e.currentTarget.dataset.index;//获取当前长按图片下标
    wx.showModal({
      title: '提示',
      content: '确定要删除此图片吗？',
      success: function (res) {
        if (res.confirm) {
          console.log('点击确定了');
          list.splice(index, 1);
        } else if (res.cancel) {
          console.log('点击取消了');
          return false;
        }
        that.setData({
          list: list
        });
      }
    })
  };

  // 预览图片
option.previewImg = function (e) {
    //获取当前图片的下标
    var index = e.currentTarget.dataset.index;
    //所有图片
    var list = this.data.list;

    wx.previewImage({
      //当前显示图片
      current: list[index],
      //所有图片
      urls: list
    })
  },

  // 查看图片
  option.viewImg = function(e){
    var that = this;
    that.setData({
      list: []
    });
    var keys = this.data.keys;
    var list = that.data.list;

    for(var i = 0; i < keys.length; i++){
      var Key = keys[i];
      var url = cos.getObjectUrl({
        Bucket: config.Bucket,
        Region: config.Region,
        Key: Key,
        Sign: false
      });
      list.push(url);
      console.log(url);
    }
    
    that.setData({
      list: list
    });
  };


option.onLoad = function () {

  };

  //点击右边,半颗星
option.selectLeft = function (e) {
    var that = this;
    var scores = that.data.scores;
    var key = e.currentTarget.dataset.key;
    var index = e.currentTarget.dataset.index;

    var id = e.currentTarget.id;
    if (e.currentTarget.dataset.key == 0.5) {
      //只有一颗星的时候,再次点击,变为0颗
      key = 0;
    }

  scores[index] = key;
    this.setData({
      scores: scores
    })
  },

  //点击左边,整颗星
option.selectRight = function (e) {
    var that = this;
    var scores = that.data.scores;
    var key = e.currentTarget.dataset.key;
    var index = e.currentTarget.dataset.index;
   
    var id = e.currentTarget.id;
    scores[index] = key;
    this.setData({
      scores: scores
    })
  };

option.tijiao = function () {
    wx.navigateBack({
    })
  };



//获取应用实例
Page(option);