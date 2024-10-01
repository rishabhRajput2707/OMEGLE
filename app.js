const express = require("express");
const app = express();
const indexRouter = require("./routes/index");
const path = require("path");

const http = require("http")
const socketIO = require("socket.io");
const { log } = require("console");
const server = http.createServer(app);
const io = socketIO(server)

let waitinguser = []
    let room = {}

io.on("connection" ,  function(socket){
    

    socket.on("joinroom" , function(){
    if(waitinguser.length > 0){

        let partner = waitinguser.shift()
        const roomname = `${socket.id}-${partner.id}`

        socket.join(roomname)
        partner.join(roomname)

        io.to(roomname).emit("joined" , roomname)
    }
    else{
        waitinguser.push(socket);
        console.log("User added to waiting list:", socket.id);
    }
    })  
    
   socket.on("signalingMessage" , function(data){
    socket.broadcast.to(data.room).emit("signalingMessage" , data.message)    
   })

    socket.on("message", function(data){
        socket.broadcast.to(data.room).emit("message" , data.message)
    })

    socket.on("startVideoCall" , ({room})=>{
        socket.broadcast.to(room).emit("incomingCall")
    })
    socket.on("acceptCall" , function(){
        socket.broadcast.to(room).emit("callAccepted")
    })

    socket.on("rejectCall", ({room}) => {
        socket.broadcast.to(room).emit("callREjected", { caller: socket.id });
    });

    socket.on("disconnect", function(){
        let index = waitinguser.findIndex(waitinguser => waitinguser.id === socket.id)
        waitinguser.splice(index , 1)
        console.log("user will discoonect" )
    })
})


app.set("view engine" , 'ejs');
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname , "public")))

app.use('/' , indexRouter);

server.listen(3000);