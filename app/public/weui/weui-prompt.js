//输入验证码
// options = {
//   text: String,
//   title: String,
//   inputPhone: String 或  true
//   placeholder: String 或者 {phone: String, verifycode: String}
//   okText: String,
//   cancelText: String,
//   btnText: String,
//   delay: Number,
//   onOK: Function(text),
//   onCancel: Function,
//   onSend: Function,
//   verifyImg: String //图片验证码url
// }
function promptVC(options) {
	var countdown = options.delay || 60;
	var settime = function (obj) {
		if (countdown == 0) {
			$(obj).removeAttr("disabled");
			$(obj).removeClass('weui-btn_disabled')
			$(obj).text("获取");
			countdown = options.delay || 60;
			return;
		} else {
			console.log("剩余(" + countdown + "秒)");
			$(obj).attr("disabled", "disabled");
			$(obj).addClass('weui-btn_disabled')
			$(obj).text("(" + countdown + "秒)");
			countdown--;
			setTimeout(function () {
				settime(obj)
			}, 1000)
		}
	}

	if (options.placeholder && options.placeholder instanceof String) {
		options.placeholder = {
			verifycode: options.placeholder
		}
	}

	var content = '<p>' + options.text + '</p>'
	if (options.inputPhone === true) {
		content += '<div class="weui-prompt-box"><input placeholder="' + ((options.placeholder && options.placeholder.phone) || '请输入手机号') + '" class="weui-prompt-input weui-input" id="weui-prompt-phone"/></div>'
	} else if (options.inputPhone && typeof options.inputPhone == "string") {
		content += '<div class="weui-prompt-box"><input value="' + options.inputPhone + '" class="weui-prompt-input weui-input" id="weui-prompt-phone" readonly="readonly"/></div>'
	}
	content += '<div class="weui-prompt-box"><input placeholder="' + ((options.placeholder && options.placeholder.verifycode) || '请输入验证码') + '" class="weui-prompt-input weui-input hasbtn" id="weui-prompt-verifycode"/>' +
		'<button class="weui-prompt-button weui-btn weui-btn_mini weui-btn_default" id="weui-prompt-button">' + (options.btnText || '获取') + '</button></div>'
	if (options.verifyImg) {
		content += '<div class="weui-prompt-box"><input placeholder="' + ((options.placeholder && options.placeholder.verifyimg) || '图片验证码') + '" class="weui-prompt-input weui-input hasbtn" id="weui-prompt-verifyimg"/>' +
			'<img class="weui-prompt-button weui-btn weui-btn_mini weui-btn_default" src="' + options.verifyImg + '"></img></div>'
	}

	var checkInput = function (input, message, regexp) {
		if (input.val() === "" || input.val() === null) {
			input.focus()[0].select();
			weui.topTips(message || '请填写正确的字段');
			return false;
		}
		if (regexp && regexp instanceof RegExp && !regexp.test(input.val())) {
			input.focus()[0].select();
			weui.topTips(message || '请填写正确的字段');
			return false;
		}
		return true;
	}

	var dlgOpts = {
		title: options.title,
		content: content,
		buttons: [{
			label: options.cancelText || '取消',
			type: 'default',
			onClick: function () {
				if (options.onCancel && (options.onCancel.call(dlg) == false))
					return false;

				countdown = 0;
			}
		}, {
			label: options.okText || '确定',
			type: 'primary',
			onClick: function () {
				var val = {};
				var input;
				//TODO: 检查手机号
				//134,135,136,137,138,139,147,150,151,152,157,158,159,178,182,183,184,187,188
				var regex = /^(13[4-9]|147|15[0-27-9]|178|198|18[23478])\d{8}$/;  /*/^1[3-8]\d{9}$/*/
				if (options.inputPhone == true) {
					if (!checkInput(input = $(dlg).find("#weui-prompt-phone"), '请输入有效的手机号', regex))
						return false;
					else
						val.phone = input.val();
				} else if (typeof options.inputPhone == "string" && regex.test(options.inputPhone)) {
					val.phone = options.inputPhone;
				}
				//TODO: 检查验证码
				if (!checkInput(input = $(dlg).find("#weui-prompt-verifycode"), '请输入有效的短信验证码', /^\d{6}$/)) {
					return false;
				} else
					val.verifyCode = input.val();

				//TODO: 检查图片验证码
				if (options.verifyImg) {
					if (!checkInput(input = $(dlg).find("#weui-prompt-verifyimg"), '请输入有效的图片验证码', /^[A-z0-9]{4}$/))
						return false;
					else
						val.verifyImg = input.val();
				}
				if (options.onOK && (options.onOK.call(dlg, val) == false))
					return false;
				countdown = 0;
			}
		}]
	};

	if (options.cancelText == 'disabled') {
		dlgOpts.buttons.shift();
	}

	if (options.isAndroid != undefined)
		dlgOpts.isAndroid = options.isAndroid;
	var dlg = weui.dialog(dlgOpts);

	var btn = $(dlg).find('#weui-prompt-button');
	btn.click(function () {
		var phone, input;
		//TODO: 检查手机号
		var regex = /^(13[4-9]|147|15[0-27-9]|178|198|18[23478])\d{8}$/;  /*/^1[3-8]\d{9}$/*/
		if (options.inputPhone == true) {
			if (!checkInput(input = $(dlg).find("#weui-prompt-phone"), '请输入有效的手机号', regex)) {
				return false;
			} else
				phone = input.val()
		} else if (typeof options.inputPhone == "string" && regex.test(options.inputPhone)) {
			phone = options.inputPhone;
		}

		if (options.onSend && (options.onSend.call(dlg, phone) != false))
			settime(this);
	});

}