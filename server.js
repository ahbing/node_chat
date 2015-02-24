var express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server),   //引入socket.io 模块  并绑定到服务器上
	users = [];  

app.use('/',express.static(__dirname + '/www'));
server.listen(3000);

io.on('connection',function(socket){

	//登录
	socket.on('login',function(nickName){
		//用户名存在
		if(users.indexOf(nickName) > -1){
			socket.emit('nickExited');
		}else{
			socket.usersIndex = users.length;  //记住登录时在数组中的位置
			socket.nickName = nickName;
			users.push(nickName);
			socket.emit('loginSuccess');
			io.sockets.emit('system',nickName,users.length,'login');  //向所有的连接服务器客户端发送当前用户登录
			//socket.broadcast.emit();  //表示向除自己之外的人放送消息
		}
	});

	//有人离开聊天室出发socket的disconnect事件
	socket.on('disconnect',function(){
		users.splice(socket.usersIndex,1); //从socket.usersIndex开始删除一个  即删除退出的那位

		//通知除自己外的其他所有人
		socket.broadcast.emit('system',socket.nickName,users.length,'logout');

	});

	socket.on('postMsg',function(msg,color){ //服务器接受到我的消息
		//分发出去
		socket.broadcast.emit('newMsg',socket.nickName,msg,color);

	});
	//接受用户发来的图片
	socket.on('img',function(imgData){
		//分发
		socket.broadcast.emit('newImg',socket.nickName,imgData);
	});

});

console.log('端口3000已经工作');




