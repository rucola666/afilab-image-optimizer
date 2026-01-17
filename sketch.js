// =====================================================
// CONFIG — MAIN CONTROLS
// =====================================================

// Canvas
const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 200; // Reduced height for banner

// Gear layout
const GEAR_COUNT = 15; // Slightly reduced for header
const MAX_ATTEMPTS = 500;
const OVERLAP_PAD = 1.1;

// Quantized radii (discrete sizes)
const BASE_RADIUS = 10;
const RADIUS_STEPS = [13, 8, 5].map(n => n * BASE_RADIUS);

// Optional weighting (same length as RADIUS_STEPS)
const USE_WEIGHTED_RADII = true;
const RADIUS_WEIGHTS = [1, 2, 3];

// Teeth mapping
const TEETH_MIN = 8;
const TEETH_MAX = 18;
const TEETH_R_MIN = 20;
const TEETH_R_MAX = 100;

// Geometry
const ROOT_RATIO = .8;

// Rotation
const SPEED_MIN = 0.01;
const SPEED_MAX = 0.02;

// Style
const BG_COLOR = 255;
const FILL_COLOR = [26, 140, 99];
const STROKE_COLOR = [26, 140, 99];
const STROKE_W = 4;

// Toggle styles
const USE_FILL = true;
const USE_STROKE = false;

// =====================================================
// GLOBALS
// =====================================================

let gears = [];

// =====================================================
// SETUP & DRAW
// =====================================================

function setup() {
    const canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('gears-container');
    generateGears();
    pixelDensity(2);
}

function draw() {
    clear(); // Use clear to be transparent if needed, or keeping background(BG_COLOR) is fine if opacity is handled in CSS.
    // Actually, user wants "background", let's keep white background but rely on CSS opacity.
    background(BG_COLOR);

    if (USE_FILL) fill(...FILL_COLOR);
    else noFill();

    if (USE_STROKE) {
        stroke(STROKE_COLOR);
        strokeWeight(STROKE_W);
    } else {
        noStroke();
    }

    for (let g of gears) {
        g.update();
        g.show();
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    generateGears();
}

// =====================================================
// GEAR GENERATION
// =====================================================

function generateGears() {
    gears = [];
    let attempts = 0;

    while (gears.length < GEAR_COUNT && attempts < MAX_ATTEMPTS) {
        const r = pickRadius();
        const x = random(r, width - r);
        const y = random(r, height - r);

        const teeth = floor(
            map(r, TEETH_R_MIN, TEETH_R_MAX, TEETH_MIN, TEETH_MAX)
        );

        const vel =
            random(SPEED_MIN, SPEED_MAX) *
            (random() < 0.5 ? -1 : 1);

        if (canPlace(x, y, r)) {
            gears.push(new Gear(x, y, r, teeth, vel));
        }

        attempts++;
    }
}

function canPlace(x, y, r) {
    for (let g of gears) {
        const d = dist(x, y, g.x, g.y);
        if (d < (r + g.r) * OVERLAP_PAD) return false;
    }
    return true;
}

// =====================================================
// RADIUS PICKING
// =====================================================

function pickRadius() {
    return USE_WEIGHTED_RADII
        ? weightedPick(RADIUS_STEPS, RADIUS_WEIGHTS)
        : random(RADIUS_STEPS);
}

function weightedPick(values, weights) {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = random(total);

    for (let i = 0; i < values.length; i++) {
        r -= weights[i];
        if (r <= 0) return values[i];
    }
}

// =====================================================
// GEAR CLASS
// =====================================================

class Gear {
    constructor(x, y, r, teeth, vel) {
        this.x = x;
        this.y = y;
        this.r = r;
        this.teeth = teeth;
        this.vel = vel;

        this.angle = random(TWO_PI);
        this.step = TWO_PI / teeth;
        this.root = r * ROOT_RATIO;
    }

    update() {
        this.angle += this.vel;
    }

    show() {
        push();
        translate(this.x, this.y);
        rotate(this.angle);

        beginShape();
        for (let i = 0; i < this.teeth; i++) {
            const a = i * this.step;

            vertex(cos(a) * this.root, sin(a) * this.root);
            vertex(cos(a + this.step * 0.25) * this.r, sin(a + this.step * 0.25) * this.r);
            vertex(cos(a + this.step * 0.5) * this.r, sin(a + this.step * 0.5) * this.r);
            vertex(cos(a + this.step * 0.75) * this.root, sin(a + this.step * 0.75) * this.root);
        }
        endShape(CLOSE);

        pop();
    }
}
