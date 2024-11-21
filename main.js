import './style.css'
import { io } from 'socket.io-client';
import  { Player,Players } from './Player.js';
import {Bullet,Bullets} from "./Bullet.js"
const allPlayers = new Players();
const allBullets = new Bullets();
import { BoxManager } from './BoxManager';
import { Box } from './Box';

const socket = io("http://localhost:3000",{
    transports: ['websocket'],
});

export const boxManager = new BoxManager();
// boxManager.addBox(new Box(100, 100, 50, 50));
// boxManager.addBox(new Box(300, 200, 80, 40));
// boxManager.addBox(new Box(150, 350, 60, 60));


class KillSounds{
    constructor(){
        this.sounds = {
            "1-kill":new Audio("public/sounds/1-kill.mp3"),
            "2-kill":new Audio("public/sounds/2-kill.mp3"),
            "3-kill":new Audio("public/sounds/3-kill.mp3"),
            "4-kill":new Audio("public/sounds/4-kill.mp3"),
            "5-kill":new Audio("public/sounds/5-kill.mp3"),
        }


    }
    playSound(soundnum){
        console.log(soundnum);
        
        if (!this.sounds[`${soundnum}-kill`]) {
            console.error(`No sound found for ${soundnum}-kill`);
            return;
        }
        this.sounds[`${soundnum}-kill`].currentTime = 0;
        this.sounds[`${soundnum}-kill`].play();
    }
}

class FadeTExts{
    constructor() {
        this.texts = [];
    }
    fadeText(soundnum) {
        const text = `${soundnum}-KILL!`;
        this.texts.push({
            text: text,
            opacity: 1,
            x: width / 2,
            y: (width / 2)+200,
            startTime: Date.now()
        });
        
        setTimeout(() => {
            this.texts = this.texts.filter(t => t.text !== text);
        }, 500);
    }
    draw(ctx) {
        this.texts.forEach(textObj => {
            const elapsed = Date.now() - textObj.startTime;
            textObj.opacity = Math.max(0, 1 - (elapsed / 2000));
            textObj.y += 2; 
            
            ctx.save();
            ctx.fillStyle = `rgba(255, 255, 255, ${textObj.opacity})`;
            ctx.font = '48px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(textObj.text, textObj.x, textObj.y);
            ctx.restore();
        });    }}

const killSounds = new KillSounds();
const fadeTexts = new FadeTExts();
let myPlayer;
socket.on("connect", ()=>{
    console.log("connected to server");
    myPlayer = new Player(socket.id,0,0,20,"#fa0",100,socket);
    allPlayers.addPlayer(myPlayer);
    socket.emit('joinGame');
    socket.on("loadPlayers", (data)=>{
        data.players.forEach(player => {
            if (player.id !== socket.id) {
                console.log(player);
                allPlayers.addPlayer(new Player(player.id, player.x, player.y, player.radius, player.color,player.health));
            }
        });
    });
    socket.on("playerUpdate", (data)=>{
        const player = allPlayers.getPlayer(data.id);
        if (player) {
            player.setPosition(data.x, data.y);
        }
    });
    socket.on("playerJoined", (data)=>{
        if(data.id !== socket.id){
            allPlayers.addPlayer(new Player(data.id, data.x, data.y, 20, "#fff",data.health));
        }
    });
    socket.on("playerDisconnected",data =>{
        allPlayers.removePlayer(data);
    });
    socket.on("shoot",data=>{
        if(data.player.id === socket.id)return;
        allBullets.handlePlayerShoot(data.player,data.mouseX,data.mouseY);
    })
    socket.on("playerHit",data =>{
        console.log(allPlayers.getPlayers());
        const player = allPlayers.getPlayer(data.id);
        console.log(player);
        if (player) {
            player.health = data.health;
        }
    })
    socket.on("initBoxes",data=>{
        data.forEach(box => {
            boxManager.addBox(new Box(box.x, box.y, box.width, box.height));
        });
    })
    socket.on("playerDeath",data=>{
        killSounds.playSound(data.kills);
        fadeTexts.fadeText(data.kills);
    })
})

/**
 * @type {HTMLCanvasElement}
 * */ 
const _canvas = document.getElementById("mycanvas");
const ctx = _canvas.getContext("2d");
const width = _canvas.width = 800;
const height = _canvas.height = 800;




// myPlayer.draw(ctx);

const keys = {};

document.onkeydown = (e)=>{
    console.log(e.key);
    
    keys[e.key] = true;
    
}
document.onkeyup = (e)=>{
    keys[e.key] = false;
}

document.onclick = (e)=>{
    const rect = _canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    allBullets.handlePlayerShoot(myPlayer,mouseX,mouseY,socket);
    console.log(allPlayers);
}

function mainLoop(){
    ctx.fillStyle = "#00000050"
    ctx.fillRect(0,0,width,height);
    myPlayer?.checkInput(keys);
    allBullets.update();
    allBullets.draw(ctx);
    fadeTexts.draw(ctx);
    allPlayers.getPlayers().forEach(player => {
        player.draw(ctx);
        if(player.id == socket.id){
            player.drawDashBar(ctx);
        }
    });
    boxManager.draw(ctx);

    requestAnimationFrame(mainLoop);
}

mainLoop();
