import './style.css'
import { io } from 'socket.io-client';
import  { Player,Players } from './Player.js';
import {Bullet,Bullets} from "./Bullet.js"
const allPlayers = new Players();
const allBullets = new Bullets();
import { BoxManager } from './BoxManager';
import { Box } from './Box';
import  Particle  from './utils/Particle';
// https://valorant-clone-backend-production.up.railway.app/
const socket = io("https://valorant-clone-backend-production.up.railway.app/",{
    transports: ['websocket'],
});

export const boxManager = new BoxManager();
const camera = {
    x: 0,
    y: 0,
    smoothSpeed: 0.2 ,
};
function updateCamera(player) {
    // Calculate target position (where we want the camera to be)
    const targetX = player.x - _canvas.width/2 + player.radius;
    const targetY = player.y - _canvas.height/2 + player.radius;
    
    // Smoothly interpolate current camera position to target position
    camera.x += (targetX - camera.x) * camera.smoothSpeed;
    camera.y += (targetY - camera.y) * camera.smoothSpeed;
}




const currentPlayerHeal = document.getElementById("currentPlayerHeal");
const currentPlayerAmmo = document.getElementById("currentAmmo");



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
            x: _canvas.width / 2,
            y: (_canvas.height / 1.5),
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
let particles = [];
let myPlayer;
let gradientColor = "rgba(0, 0, 0, 1)";
let gradientColor2 = "rgba(0, 0, 0, 0.3)";
socket.on("connect", ()=>{
    console.log("connected to server");
    myPlayer = new Player(socket.id,70,70,20,"#fa0",100,{
        currentAmmo:15,
        maxAmmo:15
    },socket);
    allPlayers.addPlayer(myPlayer);
    socket.emit('joinGame');
    socket.on("loadPlayers", (data)=>{
        data.players.forEach(player => {
            if (player.id !== socket.id) {
                console.log(player);
                allPlayers.addPlayer(new Player(player.id, player.x, player.y, player.radius, player.color,player.health,{
                    currentAmmo:15,
                    maxAmmo:15
                }));
            }
        });
    });
    socket.on("playerUpdate", (data)=>{
        const player = allPlayers.getPlayer(data.id);
        if (player) {
            player.handleServerUpdate(data)
        }
    });
    socket.on("playerJoined", (data)=>{
        if(data.id !== socket.id){
            allPlayers.addPlayer(new Player(data.id, data.x, data.y, 20, "#fff",data.health,data.ammo));
        }
    });
    socket.on("playerDisconnected",data =>{
        allPlayers.removePlayer(data);
    });
    socket.on("shoot",data=>{
        if(data.player.id === socket.id){
            camera.y +=10;
            gradientColor = "rgba(30, 50, 0, 1)";
            setTimeout(() => {
                gradientColor = "rgba(0, 0, 0, 1)";
            }, 300);
            const player = allPlayers.getPlayer(data.player.id);
            console.log(player);
            
            if (player) {
                player.ammo.currentAmmo--;
            }
            
            return
        };
        allBullets.handlePlayerShoot(data.player,data.mouseX,data.mouseY);
    })
    socket.on("playerHit",data =>{
        console.log(allPlayers.getPlayers());
        const player = allPlayers.getPlayer(data.id);
        if(player.id === socket.id){
            camera.y +=10;
            gradientColor = "rgba(30, 0, 0, 1)";
            setTimeout(() => {
                gradientColor = "rgba(0, 0, 0, 1)";
            }, 300);
        };
        particles.push(new Particle(data.x+20,data.y+20,2,"red",{
            x:12,
            y:12,
        },30));
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
        const player = allPlayers.getPlayer(data.killed);
        if(player){
            player.health = 100;
        }
        particles.push(new Particle(data.x,data.y,5,"red",{
            x:6,
            y:6,
        },30));
    })
    socket.on("raycast",data=>{
        ctx.beginPath();
        ctx.strokeStyle = "#fff";
        ctx.moveTo(data.rayStart.x -camera.x, data.rayStart.y - camera.y);
        ctx.lineTo(data.rayEnd.x -camera.x, data.rayEnd.y-camera.y);
        ctx.stroke();

    })
    socket.on("playerFlash",data=>{
        const flashSound = new Audio("public/sounds/flash.mp3");
        flashSound.currentTime = 0;
        flashSound.play();
        gradientColor = "rgba(100, 100, 0, 0.2)";
        gradientColor2 = "rgba(255, 255, 0, 0.8)";
        let opacity = 1;
        let opacity2 = 0.8;
        const fadeInterval = setInterval(() => {
            opacity -= 0.1;
            opacity2 -= 0.08;
            const color1 = Math.floor(100 * (opacity / 1));
            const color2 = Math.floor(255 * (opacity2 / 0.8));
            gradientColor = `rgba(${color1}, ${color1}, 0, ${opacity})`;
            gradientColor2 = `rgba(${color2}, ${color2}, 0, ${opacity2})`;
            if (opacity <= 0.3) {
                clearInterval(fadeInterval);
                gradientColor = "rgba(0, 0, 0, 1)";
                gradientColor2 = "rgba(0, 0, 0, 0.3)";
            }
        }, 100)
    })
    socket.on("playerReloaded",data=>{
        const player = allPlayers.getPlayer(data.playerId);
        if(player){
            player.ammo.currentAmmo = data.ammo;
        }
    })
    socket.on("noAmmo",data=>{
        const player = allPlayers.getPlayer(socket.id);
        player.noAmmodeSound.currentTime = 0;
        player.noAmmodeSound.play();
        
    })
})

/**
 * @type {HTMLCanvasElement}
 * */ 
const _canvas = document.getElementById("mycanvas");
const ctx = _canvas.getContext("2d");
const width = _canvas.width = window.innerWidth;
const height = _canvas.height = window.innerHeight;




// myPlayer.draw(ctx);

const keys = {};

document.onkeydown = (e)=>{
    console.log(e.key);
    
    keys[e.key] = true;
    
}
document.onkeyup = (e)=>{
    keys[e.key] = false;
}

document.onclick = (e) => {
    const rect = _canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left + camera.x;
    const mouseY = e.clientY - rect.top + camera.y;
    allBullets.handlePlayerShoot(myPlayer, mouseX, mouseY, socket);
}


function mainLoop(){
    const currentPlayer = allPlayers.getPlayer(socket.id);
    currentPlayerHeal.innerHTML = currentPlayer?.health;
    currentPlayerAmmo.innerHTML = `${currentPlayer?.ammo.currentAmmo} / ${currentPlayer?.ammo.maxAmmo}`;

    if(
        myPlayer
    ){
        // console.log(myPlayer);
        updateCamera(myPlayer);
        
    }
    
    myPlayer?.checkInput(keys);
    allBullets.update();
    allBullets.draw(ctx,camera);
    fadeTexts.draw(ctx);
    allPlayers.getPlayers().forEach(player => {
        player.draw(ctx,camera);
        if(player.id == socket.id){
            player.drawDashBar(ctx,camera);
        }
    });
    particles.forEach(particle => {
        particle.update();
        particle.draw(ctx,camera);
    });
    particles = particles.filter(particle => particle.numberOfFrames > 0);
    boxManager.draw(ctx,camera);
    
    const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) / 2);
    gradient.addColorStop(0, gradientColor2); // smoother white at the center
    gradient.addColorStop(1, gradientColor); // black at the edges

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
        
    
    

    requestAnimationFrame(mainLoop);
}

mainLoop();
