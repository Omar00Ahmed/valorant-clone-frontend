export class Box {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    draw(ctx,camera) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(
            this.x - camera.x, 
            this.y - camera.y, 
            this.width, 
            this.height
        );
    }
}
