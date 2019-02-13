	var loading = null;
	
	function showToast(message,delay){
		weui.toast(message,delay||3000);
	}
	function showLoading(message,delay){
		if(loading) return;
		
		loading = weui.loading(message, {
		    className: 'custom-classname'
		});
		if(delay){
			setTimeout(function () {
			    hideLoading();
			}, delay||3000);
		}
	}
	function hideLoading(){
	    if(loading) loading.hide();
	    loading = null;
	}
	function showAlert(message,title, onClick, retry){
		if($('.weui-dialog').length > 0){
			retry = retry || 0;
			if(retry && retry > 30){
				weui.topTips('不能同时显示多个对话框');
				return;
			}
			setTimeout(function(){
				showAlert(message,title, onClick, ++retry);
			},100);
		}else{
			weui.alert(message, onClick, { title: title, isAndroid: false });
		}
	}
	function showConfirm(message,title,callback){
		weui.confirm(message, function (){
			if(callback && callback instanceof Function)
				callback(true);
		},function(){
			if(callback && callback instanceof Function)
				callback(false);
		},{ title: title, isAndroid: false });
	}
	function onConfirm(res){
		if(res)
			alert('click yes');
		else
			alert('click no');
	}
	function showCustom1(message,title){
		promptVC({
			text: message,
			title: title,
			onOK: function(val){
				//val格式： {verifyCode: 'xxxxxx'}
				console.log(val)
				alert(JSON.stringify(val))
			},
			onSend: function(){
				showToast("验证码已发送")
			},
			isAndroid: false 	
		});
	}
	function showCustom2(message,title){
		promptVC({
			text: message,
			title: title,
			inputPhone: true,
			onOK: function(val){
				//val格式： {phone: '13xxxxxxxx', verifyCode: 'xxxxxx'}
				console.log(val)
//				if(!/1[3-8]\d{9}/.test(val.phone)){
//					weui.topTips('手机号无效');
//					return false;
//				}
				alert(JSON.stringify(val))
			},
			onSend: function(val){
				if(/1[3-8]\d{9}/.test(val))
					showToast("验证码已发送")
				else{
					weui.topTips('手机号无效');
					return false;
				}
			}
		});
	}
	function promptOrder(message, pkgName, pkgCode, okText, cancelText, onSubmit, onCancel){
		var imgUrl = 'verifyImage?timestamp=' + new Date().getTime();
		promptVC({
			text: message,
			title: pkgName,
			inputPhone: true,
			okText: okText || "办理",
			cancelText: cancelText || "关闭",
			verifyImg: imgUrl,
			isAndroid: false,
			onOK: function(val){
				//val格式： {phone: '13xxxxxxxx', verifyCode: 'xxxxxx', verifyImg: 'xxxx'}
				console.log(val)
				if(onSubmit)
					onSubmit(val.phone, val.verifyCode, val.verifyImg, pkgCode, pkgName);
			},
			onCancel: onCancel,
			onSend: function(phone){
				requestVerify(phone);
			}
		});
		$('img.weui-prompt-button').click(function(){
			$(this).attr('src','verifyImage?timestamp=' + new Date().getTime());
		});
	}

	function promptAction(message, title, okText, cancelText, onSubmit){
		var imgUrl = 'verifyImage?timestamp=' + new Date().getTime();
		var opts = {};
		if(message instanceof Object){
			opts = message;
		}else{
			opts.message = message;
			opts.title = title;
			opts.okText = okText;
			opts.cancelText = cancelText;
			opts.onSubmit = onSubmit;
		}
		if(opts.imgUrl == undefined)
			opts.imgUrl = imgUrl;
		promptVC({
			text: opts.message,
			title: opts.title,
			inputPhone: opts.phoneNo || true,
			okText: opts.okText || "办理",
			cancelText: opts.cancelText || "关闭",
			verifyImg: opts.imgUrl,
			isAndroid: false,
			onOK: function(val){
				//val格式： {phone: '13xxxxxxxx', verifyCode: 'xxxxxx', verifyImg: 'xxxx'}
				console.log(val)
				if(opts.onSubmit && opts.onSubmit instanceof Function){
					opts.onSubmit(val.phone, val.verifyCode, val.verifyImg);
				}
			},
			onCancel: function() {
				if(opts.closable === false)
					return false;
			},
			onSend: function(phone){
				requestVerify(phone, opts.verifyCode);
			}
		});
		$('img.weui-prompt-button').click(function(){
			$(this).attr('src','verifyImage?timestamp=' + new Date().getTime());
		});
	}



	function requestVerify(phone, opts) {
		showLoading("请求发送中");
		opts = opts || {};
		var params = {};
		params[opts.param || 'phoneNo'] = phone;
		$.ajax({
			type : "post",
			url : opts.url || 'verifyCode',
			data : params,
			dataType : 'json',
			success : function(result) {
				hideLoading();
				if (result.status == 0) {
					showToast("验证码已发送，请查收短信", 3000);
				} else {
					console.log(result);
					weui.topTips(result.message);
				}
			}
		}).always(function() {
			hideLoading();
		});
	}

	//输入验证码
	// options = {
	//   message: String,
	//   title: String,
	//   phoneNo: String 或  true
	//   okText: String,
	//   cancelText: String,
	//   onResult: Function,
	//   verifyImg: Boolean,
	//   closable: Boolean,
	// }
	function showLogin(message, title, okText, cancelText, onResult){
		var opts = {};
		if(message instanceof Object){
			opts = message;
		}else{
			opts.message = message;
			opts.title = title;
			opts.okText = okText;
			opts.cancelText = cancelText;
			opts.onResult = onResult;
		}

		if(!opts.onResult || !(opts.onResult instanceof Function)){
			showAlert("调用错误：必须指定onResult回调参数");
			return;
		}
		var imgUrl = 'verifyImage?timestamp=' + new Date().getTime();
		if(opts.verifyImg)
			opts.imgUrl = imgUrl;
		promptVC({
			text: opts.message,
			title: opts.title,
			inputPhone: opts.phoneNo || true,
			okText: opts.okText || "登录",
			cancelText: opts.cancelText || "关闭",
			verifyImg: opts.imgUrl,
			isAndroid: false,
			onOK: function(val){
				//val格式： {phone: '13xxxxxxxx', verifyCode: 'xxxxxx', verifyImg: 'xxxx'}
				console.log(val)
                var param = {
	              phoneNo : val.phone,
	              verifyCode : val.verifyCode,
	              verifyImg : val.verifyImg
	            };
				showLoading();
                $.post('login', param)
                .then(function(result) {
                    opts.onResult(result);
                }).fail(function( jqXHR, textStatus, errorThrown ) {
                    var msg = "请求发送失败";
                    if(typeof jqXHR == "string")
                        msg = jqXHR;
                    weui.topTips(msg);
                }).always(function(){
                    hideLoading();
                });
			},
			onCancel: function() {
				if(opts.closable === false)
					return false;
			},
			onSend: function(phone){
				requestVerify(phone, opts.verifyCode);
			}
		});
		$('img.weui-prompt-button').click(function(){
			$(this).attr('src','verifyImage?timestamp=' + new Date().getTime());
		});
	}

