import { boxManager } from "./main";
export class Bullet {
    constructor(startX, startY, targetX, targetY, angle, color) {
        this.startX = startX;
        this.startY = startY;
        this.targetX = targetX;
        this.targetY = targetY;
        this.angle = angle;
        this.color = color;
        this.speed = 30;
        this.maxDistance = 600;
        this.x = startX;
        this.y = startY;
        this.distance = 0;
        this.shootSound = new Audio("public/sounds/shoot.mp3");
        this.shootSound.preload = 'auto';

        this.shootSound.currentTime = 0;
        this.shootSound.play();

    }  
}

export class Bullets {
    constructor(){
        this.bullets = [];
    }
    addBullet(bullet){
        this.bullets.push(bullet);
    }
    removeBullet(bullet){
        this.bullets = this.bullets.filter(b => b !== bullet);
    }
    getBullets(){
        return this.bullets;
    }
    update() {
        const bulletsToRemove = [];
        
        this.bullets.forEach(bullet => {
            const nextX = bullet.x + Math.cos(bullet.angle) * bullet.speed;
            const nextY = bullet.y + Math.sin(bullet.angle) * bullet.speed;
            
            // Check collision with boxes
            let hitBox = false;
            boxManager.boxes.forEach(box => {
                if (this.isBulletCollidingWithBox(nextX, nextY, box)) {
                    hitBox = true;
                    bulletsToRemove.push(bullet);
                }
            });
            
            if (!hitBox) {
                bullet.x = nextX;
                bullet.y = nextY;
                
                // Calculate distance traveled
                bullet.distance = Math.sqrt(
                    Math.pow(bullet.x - bullet.startX, 2) + 
                    Math.pow(bullet.y - bullet.startY, 2)
                );
                
                // Check if bullet exceeded max distance
                if (bullet.distance >= bullet.maxDistance) {
                    bulletsToRemove.push(bullet);
                }
            }
        });
        
        // Remove bullets that hit boxes or exceeded max distance
        bulletsToRemove.forEach(bullet => {
            this.removeBullet(bullet);
        });
    }
    


    handlePlayerShoot(player, mouseX, mouseY,socket) {
        // Calculate angle between player and mouse position
        const angle = Math.atan2(mouseY - player.y, mouseX - player.x);
        
        // Create new bullet
        const bullet = new Bullet(
            player.x,           
            player.y,           
            mouseX,            
            mouseY,           
            angle,             
            player.color       
        );
        
        // Add bullet to manager
        this.addBullet(bullet);
        // Emit bullet data to server
        if(socket){
            socket?.emit('playerShoot', {
                id:socket.id,
                mouseX:mouseX,
                mouseY:mouseY,
                distance:bullet.maxDistance,
                angle:angle
            })
        }
    }
    
    isBulletCollidingWithBox(bulletX, bulletY, box) {
        return bulletX >= box.x && 
            bulletX <= box.x + box.width &&
            bulletY >= box.y && 
            bulletY <= box.y + box.height;
    }
    
    

    draw(ctx){
        this.bullets.forEach(bullet => {
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, 5, 0, 2 * Math.PI);
            ctx.fillStyle = bullet.color;
            ctx.fill();
            ctx.closePath();
        });
    }
}


