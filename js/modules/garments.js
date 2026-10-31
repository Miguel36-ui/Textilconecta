// Renderizado realista de playeras en canvas (340x400): silueta, cuello, costuras, luz, pliegues y textura.
const SHIRT_IDS = ['prod-1', 'prod-8'];
export const isShirt = (id) => SHIRT_IDS.includes(id);

function bodyPath(isFront, polo) {
    const dip = isFront ? (polo ? 78 : 92) : 62;
    const p = new Path2D();
    p.moveTo(128, 50);
    p.quadraticCurveTo(170, dip, 212, 50);
    p.bezierCurveTo(240, 56, 270, 66, 296, 82);
    p.lineTo(324, 146); p.lineTo(264, 168);
    p.bezierCurveTo(254, 150, 248, 135, 246, 124);
    p.bezierCurveTo(252, 220, 252, 300, 248, 366);
    p.quadraticCurveTo(170, 374, 92, 366);
    p.bezierCurveTo(88, 300, 88, 220, 94, 124);
    p.bezierCurveTo(92, 135, 86, 150, 76, 168);
    p.lineTo(16, 146); p.lineTo(44, 82);
    p.bezierCurveTo(70, 66, 100, 56, 128, 50);
    p.closePath();
    return p;
}

// Capa 1: color base, sombra proyectada, cuello y costuras. Devuelve la silueta para recortar el estampado.
export function drawShirtBase(ctx, { isFront, color, polo }) {
    const dip = isFront ? (polo ? 78 : 92) : 62;
    const path = bodyPath(isFront, polo);
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 6;
    ctx.fillStyle = color; ctx.fill(path);
    ctx.restore();

    // interior visible del cuello (parte trasera de la prenda)
    const inner = new Path2D();
    inner.moveTo(128, 50); inner.quadraticCurveTo(170, dip, 212, 50); inner.quadraticCurveTo(170, 38, 128, 50);
    ctx.fillStyle = color; ctx.fill(inner);
    ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fill(inner);

    // ribete del cuello
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(128, 50); ctx.quadraticCurveTo(170, dip, 212, 50);
    ctx.lineWidth = 9; ctx.strokeStyle = 'rgba(0,0,0,.22)'; ctx.stroke();
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.stroke();

    if (polo && isFront) {
        [[124, 46, 170, dip + 10, 142, 104], [216, 46, 170, dip + 10, 198, 104]].forEach(([x1, y1, x2, y2, x3, y3]) => {
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3);
            ctx.quadraticCurveTo(x1 + (x1 < 170 ? -4 : 4), 76, x1, y1); ctx.closePath();
            ctx.fillStyle = color; ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.10)'; ctx.fill();
            ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.stroke();
        });
        ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1.2;
        ctx.strokeRect(159, dip + 10, 22, 140 - dip - 10);
        ctx.fillStyle = 'rgba(255,255,255,.85)';
        [dip + 24, dip + 44].forEach((y) => { ctx.beginPath(); ctx.arc(170, y, 2.8, 0, Math.PI * 2); ctx.fill(); });
    }

    // dobladillos con pespunte
    ctx.setLineDash([3, 3]); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,.28)';
    ctx.beginPath(); ctx.moveTo(95, 356); ctx.quadraticCurveTo(170, 364, 247, 356); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(318, 141); ctx.lineTo(262, 162); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(22, 141); ctx.lineTo(78, 162); ctx.stroke();
    ctx.setLineDash([]);

    ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.stroke(path);
    return path;
}

let texture = null;
function fabricPattern(ctx) {
    if (!texture) {
        const c = document.createElement('canvas'); c.width = c.height = 4;
        const t = c.getContext('2d'); t.strokeStyle = '#000'; t.lineWidth = 1;
        t.beginPath(); t.moveTo(0, 4); t.lineTo(4, 0); t.stroke();
        texture = c;
    }
    return ctx.createPattern(texture, 'repeat');
}

const FOLDS_FRONT = [[100, 130, 122, 200, 106, 275], [240, 130, 218, 205, 238, 285], [145, 255, 168, 305, 150, 358], [30, 120, 55, 140, 70, 160]];
const FOLDS_BACK = [[98, 130, 120, 210, 104, 280], [242, 130, 222, 210, 240, 280], [170, 80, 176, 200, 168, 350]];

// Capa 2 (sobre el estampado): luz lateral, sombras, pliegues y textura de tela, para que el diseño "viva" en la prenda.
export function drawShirtShading(ctx, path, isFront) {
    ctx.save(); ctx.clip(path);
    const g = ctx.createLinearGradient(16, 0, 324, 0);
    g.addColorStop(0, 'rgba(0,0,0,.30)'); g.addColorStop(.35, 'rgba(255,255,255,.11)');
    g.addColorStop(.65, 'rgba(255,255,255,.04)'); g.addColorStop(1, 'rgba(0,0,0,.32)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 340, 400);
    const v = ctx.createLinearGradient(0, 40, 0, 380);
    v.addColorStop(0, 'rgba(255,255,255,.06)'); v.addColorStop(1, 'rgba(0,0,0,.22)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, 340, 400);

    ctx.lineCap = 'round';
    (isFront ? FOLDS_FRONT : FOLDS_BACK).forEach(([x1, y1, cx, cy, x2, y2]) => {
        [[10, .05], [4, .08], [1.5, .10]].forEach(([w, a]) => {
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(cx, cy, x2, y2);
            ctx.lineWidth = w; ctx.strokeStyle = `rgba(0,0,0,${a})`; ctx.stroke();
        });
    });
    ctx.globalAlpha = .08; ctx.fillStyle = fabricPattern(ctx); ctx.fillRect(0, 0, 340, 400);
    ctx.restore();
}
