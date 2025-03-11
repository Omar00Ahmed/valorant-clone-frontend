
export default class Particle{
    constructor(x, y, radius, color, velocity,numberOfFrames){
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.alpha = 1;
        this.particles = [];
        for(let i = 0; i < 20; i++) {
            this.particles.push({
                x: this.x,
                y: this.y,
                radius: this.radius * Math.random(),
                velocity: {
                    x: (Math.random() - 0.5) * this.velocity.x,
                    y: (Math.random() - 0.5) * this.velocity.y
                },
                alpha: 1
            });
        }
        this.numberOfFrames = numberOfFrames;
    }

    update() {
        if(this.numberOfFrames <= 0) return;
        console.log("updated");
        
        this.particles.forEach(particle => {
            particle.x += particle.velocity.x;
            particle.y += particle.velocity.y;
            particle.alpha -= 1 / this.numberOfFrames;
        });
        this.particles = this.particles.filter(particle => particle.alpha > 0);
        this.numberOfFrames--;
    };

    draw(ctx,camera) {
        this.particles.forEach(particle => {
            ctx.beginPath();
            ctx.arc(particle.x - camera.x, particle.y - camera.y, particle.radius, 0, Math.PI * 2, false);
            console.log("here",(particle.x, particle.y));
            ctx.fillStyle = `rgba(255, 0, 0, ${particle.alpha})`;
            ctx.fill();
            ctx.closePath();
        });
    }
    
}

