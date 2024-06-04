import express from 'express';
import { Server } from 'socket.io';
import {createServer} from 'http';
import cors from 'cors';
import { userJoin, gtRoomUsers, userLeave, formatMessage, botName, gtUser } from './utils.js';

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

io.on('connection', (socket) => {
    socket.on('joinRoom', (payload) => {
        const user = userJoin({...payload, id: socket.id});
        socket.join(user.room);
        console.log(user + ' has joined the chat');

        //Broadcast when a user connects
        socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has joined the chat`));

        //Send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: gtRoomUsers(user.room)
        });
    });

    //Listen for chatMessage
    socket.on('chatMessage', (msg) => {
        const user = gtUser(socket.id);
        if(user){
            io.to(user.room).emit('message', formatMessage(user.username, msg));
        }
    });

    //Runs when client disconnects
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);
        if(user){
            socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat`));

            //Send users and room info
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: gtRoomUsers(user.room)
            });
        }
    });
});

const PORT = 3001 || process.env.PORT;

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
