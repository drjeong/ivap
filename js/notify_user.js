//;(function(window, document) {
//  window.sweetAlert = window.swal = function() {
//    if (arguments[0] === undefined) {
//      window.console.error('sweetAlert expects at least 1 attribute!');
//      return false;
//    }
//
//  window.sweetAlertInitialize = function() {
//    var sweetHTML = '<div class="sweet-overlay" tabIndex="-1"></div><div class="sweet-alert" tabIndex="-1"><div class="icon error"><span class="x-mark"><span class="line left"></span><span class="line right"></span></span></div><div class="icon warning"> <span class="body"></span> <span class="dot"></span> </div> <div class="icon info"></div> <div class="icon success"> <span class="line tip"></span> <span class="line long"></span> <div class="placeholder"></div> <div class="fix"></div> </div> <div class="icon custom"></div> <h2>Title</h2><p>Text</p><button class="cancel" tabIndex="2">Cancel</button><button class="confirm" tabIndex="1">OK</button></div>',
//        sweetWrap = document.createElement('div');
//
//    sweetWrap.innerHTML = sweetHTML;
//
//    // For readability: check sweet-alert.html
//    document.body.appendChild(sweetWrap);
//  };
//
//  (function () {
//		window.sweetAlertInitialize();
//  }
//
//})(window, document);

function Notify_User_Success(title, message, returnaddress) {
	window.sweetAlertInitialize = function() {
		var sweetHTML = '<!DOCTYPE html> <html> <head> <style> .alert{background-color: white; font-family: "Open Sans", sans-serif; width: 478px; padding: 17px; border-radius: 5px; text-align: center; position: fixed; left: 50%; top: 50%; margin-left: -256px; margin-top: -200px; overflow: hidden;} h2{color:#575757;font-size:30px;text-align:center;font-weight:600;text-transform:none;position:relative;margin:25px 0;padding:0;line-height:25px;display:block; } p{color:#797979;font-size:16px;text-align:center;font-weight:300;position:relative;margin:0;padding:0;line-height:normal; } button { background-color:#AEDEF4; color:white; border:none; box-shadow:none; font-size:17px; font-weight:500; border-radius:5px; padding:10px 32px; margin:26px 5px 0 5px; cursor:pointer; } button:focus { outline:none; box-shadow:0 0 2px rgba(128, 179, 235, 0.5), inset 0 0 0 1px rgba(0, 0, 0, 0.05); } button:hover { background-color:#a1d9f2; } button:active { background-color:#81ccee; } </style> </head> <body style="background-color:gray"> <div class="alert"> <br/><br/> <img src="./images/msg_success.jpg" width="100"><br/> <h2>'+title+'</h2> <p>'+message+'</p> <button class="cancel" onclick="window.location.assign("'+returnaddress+'");">OK</button> </div> </body> </html>',sweetWrap = document.createElement('div');
		sweetWrap.innerHTML = sweetHTML;
		document.body.appendChild(sweetWrap);
	};
	(function () {
		window.sweetAlertInitialize();
	}
}

