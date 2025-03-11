import { Socket } from "socket.io-client";
import {boxManager} from "./main.js"
export class Player{
    /** @param {Socket} socket */
    constructor(id,x, y, radius, color,health,ammo,socket){
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.speed = 5;
        this.socket = socket;
        this.id = id;
        this.health = health;
        this.dashCallDown = 0;
        this.dashSound = new Audio("public/sounds/dash.mp3");
        this.dashSound.preload = 'auto';
        this.ammo = ammo;
        this.reloadSound = new Audio("public/sounds/reload.mp3");
        this.reloadSound.preload = 'auto';
        this.noAmmodeSound = new Audio("public/sounds/outOfAmmo.mp3");
        this.noAmmodeSound.preload = 'auto';


        this.serverPosition = { x, y };
        this.pendingInputs = [];
        this.lastProcessedInputTime = Date.now();
        this.inputSequence = 0;

    }

    checkInput(keys){
        if(keys["w"]){
            this.moveY(-1);
        }
        if(keys["s"]){
            this.moveY(1);
        }
        if(keys["a"]){
            this.moveX(-1);
        }
        if(keys["d"]){
            this.moveX(1);
        }
        if(keys["k"]){
            this.color = this.color === "#000" ? "#f00" : "#000";
            keys["k"] = false;
        }
        if(keys["e"]){
            if(this.dashCallDown > 0) return;
            this.dash();
            keys["e"] = false;
            this.canDash = false;
            this.dashCallDown = 3;
            const dashCallDown = setInterval(() => {
                this.dashCallDown--;
                if(this.dashCallDown <= 0){
                    clearInterval(dashCallDown);
                }
            }, 1000);
        }
        if(keys["q"]){
            this.flash();
            keys["q"] = false;
        }
        if(keys["r"]){
            this.reload();
            keys["r"] = false;
        }
    }

    flash(){
        this.socket.emit("playerFlash",{
            id:this.id,
            x:this.x,
            y:this.y
        });
    }

    reload(){
        this.socket.emit("reload");
        this.reloadSound.currentTime = 0;
        this.reloadSound.play();
    }

    drawDashBar(ctx,camera) {
        ctx.fillStyle = "#00a";
        ctx.fillRect(this.x - camera.x, this.y - 20 - camera.y, 40, 5);
        ctx.fillStyle = "#000";
        ctx.fillRect(this.x - camera.x, this.y - 20 - camera.y, (this.dashCallDown / 3) * 40, 5);
    }

    checkBoundingCollision(width,height){
        if(this.x <= -1000) this.x = -1000;
        if(this.x + this.radius * 2 >= width) this.x = width - this.radius * 2;
        if(this.y <= -1000) this.y = -1000;
        if(this.y + this.radius * 2 >= height) this.y = height - this.radius * 2;
        
    }

    dash(){
        this.dashSound.currentTime = 0;
        this.dashSound.play();
        this.speed = 20;
        setTimeout(() => {
            this.speed = 5;
        }, 130);
    }

    moveX(direction) {
        const previousX = this.x;
        this.x += this.speed * direction;
        
        if (boxManager.checkCollision(this)) {
            this.x = previousX;
        }
        
        this.checkBoundingCollision(1000, 1000);
        this.sendPositionUpdate();
    }
    
    moveY(direction) {
        const previousY = this.y;
        this.y += this.speed * direction;
        
        if (boxManager.checkCollision(this)) {
            this.y = previousY;
        }
        
        this.checkBoundingCollision(1000, 1000);
        this.sendPositionUpdate();
    }

    sendPositionUpdate() {
        const input = {
            sequence: this.inputSequence++,
            x: this.x,
            y: this.y,
            timestamp: Date.now()
        };
        
        this.pendingInputs.push(input);
        
        this.socket.emit("playerUpdate", input);
    }

    handleServerUpdate(data) {
        this.serverPosition = { x: data.x, y: data.y };
        
        // Remove processed inputs
        this.pendingInputs = this.pendingInputs.filter(input => 
            input.timestamp > data.timestamp
        );
        
        // Reapply pending inputs
        this.x = this.serverPosition.x;
        this.y = this.serverPosition.y;
        
        this.pendingInputs.forEach(input => {
            this.x = input.x;
            this.y = input.y;
        });
    }

    
    

    setPosition(x,y){
        this.x = x;
        this.y = y;
    }

    shoot(angle){
        if(this.ammo.currentAmmo <= 0) return;
        const bulletX = this.x + this.radius;
        const bulletY = this.y + this.radius;
        const targetX = bulletX + Math.cos(angle) * 800;
        const targetY = bulletY + Math.sin(angle) * 800;
        
        this.socket.emit("shoot", {
            startX: bulletX,
            startY: bulletY,
            targetX: targetX,
            targetY: targetY,
            angle: angle
        });
    }

    draw(ctx,camera) {
        ctx.beginPath();
        ctx.arc(
            this.x + this.radius - camera.x, 
            this.y + this.radius - camera.y, 
            this.radius, 
            0, 
            Math.PI * 2, 
            false
        );
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    
        // Draw health bar with camera offset
        const healthBarWidth = this.radius * 2;
        const healthBarHeight = 5;
        const healthBarY = this.y - 10 - camera.y;
        
        // Background (red)
        ctx.fillStyle = "#ff0000";
        ctx.fillRect(this.x - camera.x, healthBarY, healthBarWidth, healthBarHeight);
        
        // Foreground (green) - represents current health
        ctx.fillStyle = "#00ff00";
        const currentHealthWidth = (this.health / 100) * healthBarWidth;
        ctx.fillRect(this.x - camera.x, healthBarY, currentHealthWidth, healthBarHeight);
    }
    
    
    
    

}


export class Players{
    constructor(){
        this.players = new Map();
    }
    addPlayer(player){
        this.players.set(player.id, player);
    }
    removePlayer(playerId){
        this.players.delete(playerId);
    }
    getPlayer(playerId){
        return this.players.get(playerId);
    }
    getPlayers(){
        return [...this.players.values()];
    }
}

