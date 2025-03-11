export class BoxManager {
    constructor() {
        this.boxes = [];
    }

    addBox(box) {
        this.boxes.push(box);
    }

    checkCollision(player) {
        for (let box of this.boxes) {
            if (this.isColliding(player, box)) {
                return true;
            }
        }
        return false;
    }


    isColliding(player, box) {
        return player.x < box.x + box.width &&
        player.x + player.radius * 2 > box.x &&
        player.y < box.y + box.height &&
        player.y + player.radius * 2 > box.y;
    }


    resolveCollision(player, box) {
        // Right collision
        if (player.x < box.x + box.width && player.x > box.x) {
            player.x = box.x + box.width;
        }
        // Left collision
        if (player.x + player.radius * 2 > box.x && player.x < box.x) {
            player.x = box.x - player.radius * 2;
        }
        // Bottom collision
        if (player.y < box.y + box.height && player.y > box.y) {
            player.y = box.y + box.height;
        }
        // Top collision
        if (player.y + player.radius * 2 > box.y && player.y < box.y) {
            player.y = box.y - player.radius * 2;
        }
    }

    draw(ctx,camera) {
        this.boxes.forEach(box => box.draw(ctx,camera));
    }

}
