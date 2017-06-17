//variables
var express = require('express')
var app     = express();
var server  = require('http').createServer(app);
var io      = require('socket.io').listen(server);


server.listen(3000,function(){
	console.log('Listening on 3000...');
}); 

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
})

app.get('/health', function(req, res) {
       res.writeHead(200);
    res.end();
})



//functions
function getKeys(obj){
   	for(var key in obj){
      	if (obj.hasOwnProperty(key)) {
      	console.log(key + " = " + obj[key]);
      		if (typeof(obj[key]) === 'object') {
      			for(var key2 in obj[key]){
      				if (obj.hasOwnProperty(key2)) {
      					console.log("         SUB-object of: "+key+" is "+key2 + " = " + obj[key][key2]);
      				}
      			}
      		}
        }
   	}
}

let sTimer = function(){
  //simple timer
    
    this.reset = function(){
        this.date = new Date();
        this.startTime = this.date.getTime();
        this.elapsedTime = 0;    
    } // end reset
    
    
    this.getCurrentTime = function(){
        this.date = new Date();
        return this.date.getTime();
    } // end getCurrentTime
    
    this.getElapsedTime = function(){
        current = this.getCurrentTime();
        return (current - this.startTime) / 1000;
    } // end getElapsedTime
    
    this.reset();
} // end Timer def


let roomChk = ()=>{console.log('rooms available: '+Object.keys(io.sockets.adapter.rooms))};

io.on('connection', function(socket){


	console.log(socket.id+' has connected,');
	socket.emit('message', {message: "Waiting for another player...",uid:socket.id});
	
	socket.on('create', function (data) {
			socket.playerName = data.name != 'anon' ? data.name : 'Plyr--'+socket.id;
			console.log('Player name: '+socket.playerName);

			var rooms = io.sockets.adapter.rooms; 
			var clients = function (rm) {
		        return io.of('/').adapter.rooms[rm];
		    };   



            // if any of the current rooms have only one
            // player, join that room.
            if (Object.keys(rooms).length > 0) {
            	console.log('There are rooms!!');
	            for (room in rooms) {
	            	console.log('room name: '+room+' has '+Object.keys(clients(room)).length+' player(s) in it : '+Object.keys(clients(room)));
	            	if (room !== socket.id) {
		                console.log('Different room than client. Checking population...');
		                if (Object.keys(clients(room)).length < 2) {
		                	console.log('Room '+room+' has an open spot. '+socket.id+' '+socket.playerName+' will join room.');
		                	socket.join(room,function(){
		                		console.log('room name: '+room+' NOW has '+Object.keys(clients(room)).length+' player(s) in it.');
		                	});    
		                    
							 socket.leave(socket.id,function(){
							 	console.log(socket.playerName+' is in the following room(s): '+socket.rooms);
							 	io.sockets.in(socket.rooms).emit('upd',['init']);
							 });
							
							
					

							function start_cnt(){
								let stimer = new sTimer();
								stimer.reset();
								function update(){
							        var currentTime = stimer.getElapsedTime();
							        io.sockets.in(socket.rooms).emit('upd',['timer',currentTime]);
							        //console.log(currentTime);
							} 
								intID = setInterval(update, 50);
								io.sockets.in(socket.rooms).emit('upd',['draw_rdy','its about to go down']);
							}


							let st_count = (Math.random()*5)+5;
							let st_timer = setInterval(function() {
								st_count -= Math.floor(Math.random()*2);
								console.log('timer: '+st_count);
								if( st_count <= 0) {
									st_count = 0;
									clearInterval(st_timer);
									console.log('timer done.');


									start_cnt();
								}
							},200);
		                    //io.sockets.in(room).emit('random-join');

		            	} else {
		            		socket.join(socket.id)
		                	console.log('All rooms full.  Room '+socket.id+' created. Waiting for opponent.');
		                	socket.emit('roomCreated',{room:socket.id});
		            	}

	        		}
	        	
	        	}
	        }
	        else {
	        	console.log('No rooms...');
	        	socket.join(socket.id)
	        	console.log('Room '+socket.id+' created. Waiting for opponent.');
	        	socket.emit('roomCreated',{room:socket.id});
	    	}		
    });



	socket.on('shot', function(req) {
		if (intID) {clearInterval(intID);}
    	//console.log('shot fired by '+socket.id+'in '+stimer.getElapsedTime().toString().substr(0,3) + ' seconds!');
    	console.log('shot fired by '+socket.playerName);
    	socket.emit('shot first', socket.playerName);
    	socket.broadcast.to(socket.rooms).emit('got shot',socket.playerName);
	})



    socket.on('disconnect',function(){

    	for (rm in socket.rooms) {
    		socket.leave(socket.rooms[rm]);
    	}
		console.log('disconnect event from socket '+socket.id);

		roomChk();
	});


	socket.on('reset',function(){

		for (rm in socket.rooms) {
    		socket.leave(socket.rooms[rm]);
    		console.log(socket.rooms[rm]+' room left by socket '+socket.id);
    	}
		
		console.log('rooms available: '+Object.keys(io.sockets.adapter.rooms))
	});


	socket.on('join',function(data){
    	console.log(data.room);
    	socket.join(data.room,function(){
    		console.log('socket '+socket.id+' in '+socket.rooms);
    		console.log('rooms available: '+Object.keys(io.sockets.adapter.rooms))
    		socket.emit('roomlist',io.sockets.adapter.rooms)
    	});
	});
});	
