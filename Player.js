import { Socket } from "socket.io-client";
import {boxManager} from "./main.js"
export class Player{
    /** @param {Socket} socket */
    constructor(id,x, y, radius, color,health,socket){
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
    }

    drawDashBar(ctx){
        ctx.fillStyle = "#00a";
        ctx.fillRect(this.x, this.y - 20, 40, 5);
        ctx.fillStyle = "#000";
        ctx.fillRect(this.x , this.y - 20, (this.dashCallDown / 3) * 40, 5);
    }

    checkBoundingCollision(width,height){
        if(this.x <= 0) this.x = 0;
        if(this.x + this.radius * 2 >= width) this.x = width - this.radius * 2;
        if(this.y <= 0) this.y = 0;
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
        
        this.checkBoundingCollision(800, 800);
        this.socket.emit("playerUpdate", {
            x: this.x,
            y: this.y
        });
    }
    
    moveY(direction) {
        const previousY = this.y;
        this.y += this.speed * direction;
        
        if (boxManager.checkCollision(this)) {
            this.y = previousY;
        }
        
        this.checkBoundingCollision(800, 800);
        this.socket.emit("playerUpdate", {
            x: this.x,
            y: this.y
        });
    }
    
    

    setPosition(x,y){
        this.x = x;
        this.y = y;
    }

    shoot(angle){
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

    draw(ctx){
        ctx.beginPath();
        ctx.arc(this.x +this.radius, this.y + this.radius, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();

        // Draw health bar
        const healthBarWidth = this.radius * 2;
        const healthBarHeight = 5;
        const healthBarY = this.y - 10;
        
        // Background (red)
        ctx.fillStyle = "#ff0000";
        ctx.fillRect(this.x, healthBarY, healthBarWidth, healthBarHeight);
        
        // Foreground (green) - represents current health
        ctx.fillStyle = "#00ff00";
        const currentHealthWidth = (this.health / 100) * healthBarWidth;
        ctx.fillRect(this.x, healthBarY, currentHealthWidth, healthBarHeight);

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

