const PALETTE = [
  { fill: '#1B5E20', vein: '#0a3d0a' },
  { fill: '#2E7D32', vein: '#1B5E20' },
  { fill: '#388E3C', vein: '#1B5E20' },
  { fill: '#43A047', vein: '#2E7D32' },
  { fill: '#4CAF50', vein: '#2E7D32' },
  { fill: '#66BB6A', vein: '#388E3C' },
  { fill: '#81C784', vein: '#4CAF50' },
  { fill: '#8BC34A', vein: '#558B2F' },
  { fill: '#9CCC65', vein: '#558B2F' },
  { fill: '#A5D6A7', vein: '#4CAF50' },
];

export class Leaf {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotSpd: number;
  windPhase: number;
  windFreq: number;
  windAmp: number;
  size: number;
  shape: 0 | 1 | 2;
  fillColor: string;
  veinColor: string;
  life: number;
  maxLife: number;
  alpha: number;

  constructor(clickX: number, clickY: number) {
    this.x = clickX;
    this.y = clickY;

    const angle = Math.random() * Math.PI * 2;
    const speed = 1.8 + Math.random() * 5.2;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed - (1.5 + Math.random() * 3.5);

    this.rotation = Math.random() * Math.PI * 2;
    this.rotSpd = (Math.random() - 0.5) * 0.12;

    this.windPhase = Math.random() * Math.PI * 2;
    this.windFreq = 0.04 + Math.random() * 0.04;
    this.windAmp = 0.25 + Math.random() * 0.45;

    this.size = 6 + Math.random() * 10;
    this.shape = Math.floor(Math.random() * 3) as 0 | 1 | 2;

    const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    this.fillColor = color.fill;
    this.veinColor = color.vein;

    this.life = 0;
    this.maxLife = 60 + Math.random() * 50;
    this.alpha = 0;
  }

  update() {
    this.life++;
    this.vy += 0.16;
    this.vx *= 0.988;
    this.vy *= 0.993;
    this.vx += Math.sin(this.life * this.windFreq + this.windPhase) * this.windAmp * 0.04;
    this.x += this.vx;
    this.y += this.vy;
    this.rotation += this.rotSpd + Math.sin(this.life * 0.07) * 0.015;

    const fadeIn = 8;
    const fadeOut = 22;
    if (this.life < fadeIn) {
      this.alpha = this.life / fadeIn;
    } else if (this.life > this.maxLife - fadeOut) {
      this.alpha = (this.maxLife - this.life) / fadeOut;
    } else {
      this.alpha = 1;
    }
    this.alpha = Math.max(0, Math.min(1, this.alpha));
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    const size = this.size;
    ctx.fillStyle = this.fillColor;
    ctx.beginPath();

    if (this.shape === 0) {
      ctx.moveTo(0, -size * 0.58);
      ctx.bezierCurveTo(size * 0.42, -size * 0.28, size * 0.42, size * 0.28, 0, size * 0.58);
      ctx.bezierCurveTo(-size * 0.42, size * 0.28, -size * 0.42, -size * 0.28, 0, -size * 0.58);
    } else if (this.shape === 1) {
      ctx.moveTo(0, -size * 0.68);
      ctx.bezierCurveTo(size * 0.26, -size * 0.32, size * 0.26, size * 0.32, 0, size * 0.68);
      ctx.bezierCurveTo(-size * 0.26, size * 0.32, -size * 0.26, -size * 0.32, 0, -size * 0.68);
    } else {
      ctx.ellipse(0, size * 0.05, size * 0.36, size * 0.5, 0, 0, Math.PI * 2);
    }

    ctx.fill();

    ctx.strokeStyle = this.veinColor;
    ctx.lineWidth = 0.9;
    ctx.globalAlpha = this.alpha * 0.65;
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.52);
    ctx.lineTo(0, size * 0.52);
    ctx.stroke();

    ctx.lineWidth = 0.45;
    ctx.globalAlpha = this.alpha * 0.35;
    const veins: [number, number, number][] = [
      [0.28, -0.18, -0.12],
      [0.26, 0.06, 0.22],
      [-0.28, -0.18, -0.12],
      [-0.26, 0.06, 0.22],
    ];
    veins.forEach(([tx, sy, ey]) => {
      ctx.beginPath();
      ctx.moveTo(0, sy * size);
      ctx.lineTo(tx * size, ey * size);
      ctx.stroke();
    });

    ctx.restore();
  }

  isDead() {
    return this.life >= this.maxLife;
  }
}
