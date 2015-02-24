window.onload = function(){
	var hichat = new HiChat();
	hichat.init();
}

function HiChat(){
	this.socket = null;
}

HiChat.prototype = {
	init: function(){
		var that = this;
		//建立到服务器的socket的链接
		this.socket = io.connect();
		//监听connect事件
		this.socket.on('connect',function(){
			document.getElementById('info').textContent = "请输入你的昵称";
			document.getElementById('nickWrapper').style.display = 'block';
			document.getElementById('nicknameInput').focus();
		});

		//登录
		document.getElementById('loginBtn').addEventListener('click',function(){
			var nickName = document.getElementById('nicknameInput').value;

			if(nickName.trim().length != 0){
				//匿名不为空
				that.socket.emit('login',nickName);
			}else{
				document.getElementById('nicknameInput').focus();
			}

		},false);
		//用户已经存在
		this.socket.on('nickExited',function(){
			document.getElementById('info').textContent="用户名已经存在";
		});
		//登录成功
		this.socket.on('loginSuccess',function(){
			document.title = '欢迎你  '+document.getElementById('nicknameInput').value;
			document.getElementById('loginWrapper').style.display = 'none';
			document.getElementById('messageInput').focus(); //消息输入框获得焦点
		});

		this.socket.on('system',function(nickName,userCount,type){
			var msg = nickName + (type == 'login'? "加入了聊天室" : "离开了");
			
			// var p = document.createElement("p");
			// p.textContent  = msg;
			// document.getElementById('historyMsg').appendChild(p);

			that.displayMsg('系统',msg,'red');
			document.getElementById('status').textContent = "当前有"+userCount+"人在线";
		});

		document.getElementById('sendBtn').addEventListener('click',function(){
			var msgInput = document.getElementById('messageInput'),
				msg = msgInput.value,
				color = document.getElementById('colorStyle').value;

			msgInput.value = '';
			msgInput.focus();

			if(msg.trim().length != 0){
				that.socket.emit('postMsg',msg,color);  //将我的消息发送至服务器
				that.displayMsg('我',msg,color);   //显示我自己的	
			}

		},false);

		this.socket.on('newMsg',function(user,msg,color){
			that.displayMsg(user,msg,color);
		});

		//发送图片
		document.getElementById('sendImage').addEventListener('change',function(){

			console.log(this); //<input id="sendImage" type="file" value="image"/>
			if(this.files.length!=0){


				var file = this.files[0],
					render = new FileReader();

				if(!render){
					that.displayMsg('system','您的浏览器不支持FileRender');
					this.value = '';
					return;
				}

				render.onload = function(e){
					this.value = '';
					that.socket.emit('img',e.target.result); //base 64
					console.log(e);  //ProgressEvent
					console.log(e.target);  //FileReader
					console.log(e.target.result); //data:.......
					that.displayImg('me',e.target.result);
				};
				render.readAsDataURL(file);  
				
			};

		},false);

		this.socket.on('newImg',function(user,img){
			that.displayImg(user,img);
		});
		this.initEmoji();
		document.getElementById('emoji').addEventListener('click',function(e){

			document.getElementById('emojiWrapper').style.display = 'block';
			e.stopPropagation(); //阻止事件冒泡

		},false);
		document.body.addEventListener('click',function(e){
			var emojiwrapper = document.getElementById('emojiWrapper');
			if(e.target != emojiwrapper){
				emojiwrapper.style.display = 'none';
			}

		},false);
		document.getElementById('emojiWrapper').addEventListener('click',function(e){

			var target = e.target;

			if(target.nodeName.toLowerCase()=='img'){
				var messageInput = document.getElementById('messageInput');
				messageInput.focus();
				messageInput.value +='[emoji:'+target.title+']';
			};	

		},false);

		//键盘事件
		document.getElementById('nicknameInput').addEventListener('keyup',function(e){
			if(e.keyCode == 13){  //回车
				var nickName = document.getElementById('nicknameInput').value;
				if(nickName.trim().length!=0){
					that.socket.emit('login',nickName);
				}else{
					document.getElementById('nicknameInput').focus();
				}
			}
		},false);

		document.getElementById('messageInput').addEventListener('keyup',function(e){
			var messageInput = document.getElementById('messageInput'),
				msg = messageInput.value;
				color = document.getElementById('colorStyle').value;

			if(e.keyCode == 13 && msg.trim().length!=0){
				messageInput.value='';
				that.socket.emit('postMsg',msg,color);
				that.displayMsg('我',msg,color);
			}

		},false);
	},

	displayMsg: function(user,msg,color){
		var container = document.getElementById('historyMsg'),
			p = document.createElement('p'),
			date = new Date().toTimeString().substr(0,8);
			console.log(new Date()); //Mon Feb 23 2015 20:39:34 GMT+0800 (CST)
			console.log(new Date().toTimeString()); //20:39:34 GMT+0800 (CST)

		msg = this.showEmoji(msg);  //替换所有的emoji

		p.style.color = color || '#000';
		p.innerHTML = user +'<span class="timespan">('+date+'):</span>' + msg;
		container.appendChild(p);
		container.scrollTop = container.scrollHeight;
	},

	displayImg: function(user,imgData,color){
		var container = document.getElementById('historyMsg'),
			p = document.createElement('p'),
			date = new Date().toTimeString().substr(0,8);	

			p.style.color = color || '#000';
			p.innerHTML = user+'<span class="timespan">('+date+'):</span><br/>'
						+'<a href="'+imgData+'" target="_blank"><img src="'+imgData+'"/></a>';

			container.appendChild(p);
			container.scrollTop = container.scrollHeight;
	},
	initEmoji: function(){
		var emojiContainer = document.getElementById('emojiWrapper'),
			docFragment = document.createDocumentFragment(); //适合成装碎片化的东西
		for(var i = 69; i > 0; i--){
			var emojiItem = document.createElement('img');
			emojiItem.src = '../content/emoji/'+i+'.gif';
			emojiItem.title = i;
			docFragment.appendChild(emojiItem);
		};
		emojiContainer.appendChild(docFragment);
	},
	showEmoji: function(msg){
		var match,result = msg,
			reg=/\[emoji:\d+\]/g,
			emojiIndex,
			emojiCount = document.getElementById('emojiWrapper').children.length;

		while(match = reg.exec(msg)){
			console.log('hello');
			emojiIndex = match[0].slice(7,-1);  //取第七位到最后倒数一位  即emoji的数值
			
			if(emojiIndex > emojiCount){
				//表情库中不存在该表情
				result = result.replace(match[0],'[X]');
			}else{
				//存在该表情
				result = result.replace(match[0],'<img class="emoji" src="../content/emoji/'+emojiIndex+'.gif"/>');
			};
		};
		return result;
	}
};