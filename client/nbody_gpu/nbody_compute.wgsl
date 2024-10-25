@group(0) @binding(0) var<storage, read> bodiesIn: array<f32>;
@group(0) @binding(1) var<storage, read_write> bodiesOut: array<f32>;
@group(0) @binding(2) var<uniform> computeUniforms: ComputeUniforms;
@group(0) @binding(3) var<uniform> renderUniforms: RenderUniforms;

const BODY_SIZE: u32 = 5;
const WORKGROUP_SIZE = 64;

const CLIP_MIN_XY = vec2f(-1, -1);
const CLIP_MAX_XY = vec2f(1, 1);

struct ComputeUniforms {
    numBodies: u32,
    deltaT: f32,
}

struct RenderUniforms {
    viewportMinXy: vec2f,
    viewportMaxXy: vec2f,
}

struct Body {
    pos: vec2f,
    vel: vec2f,
    mass: f32,
}

fn readBody(index: u32, body: ptr<function, Body>) {
    let arrayIndex = index * BODY_SIZE;
    (*body).pos = vec2(
        bodiesIn[arrayIndex],
        bodiesIn[arrayIndex + 1]);
    (*body).vel = vec2(
        bodiesIn[arrayIndex + 2],
        bodiesIn[arrayIndex + 3]);
    (*body).mass = bodiesIn[arrayIndex + 4];
}

fn writeBody(index: u32, body: ptr<function, Body>) {
    let arrayIndex = index * BODY_SIZE;
    bodiesOut[arrayIndex] = (*body).pos.x;
    bodiesOut[arrayIndex + 1] = (*body).pos.y;
    bodiesOut[arrayIndex + 2] = (*body).vel.x;
    bodiesOut[arrayIndex + 3] = (*body).vel.y;

    // Skip writing out mass - it doesn't change
    // bodiesOut[arrayIndex + 4] = (*body).mass;
}

@compute
@workgroup_size(WORKGROUP_SIZE)
fn computeShader(
    @builtin(global_invocation_id) id: vec3u
) {
    let index = id.x;

    var selfBody: Body;
    readBody(index, &selfBody);

    var attractor: Body;
    var acceleration = vec2f(0, 0);
    for (var i = 0u; i < computeUniforms.numBodies; i++) {
        readBody(i, &attractor);

        let distVec = attractor.pos - selfBody.pos;
        let distMagSquared = dot(distVec, distVec);
        let distUnit = distVec / sqrt(distMagSquared);
        let softenedMag = max(distMagSquared, 1.0f);

        // Incremental acceleration towards bodies[i]
        let acc = attractor.mass * distUnit / softenedMag;

        // If i == index, then we're computing the force on
        // selfBody from selfBody, which doesn't make sense
        // and so we should just throw out the value (it will
        // be infinity or NaN anyway)
        acceleration += select(acc, vec2f(), i == index);
    }
    selfBody.vel += acceleration * computeUniforms.deltaT;
    selfBody.pos += selfBody.vel * computeUniforms.deltaT;
    writeBody(index, &selfBody);
}

fn toClipSpace(worldCoord: vec2f) -> vec2f {
    let minXy = renderUniforms.viewportMinXy;
    let maxXy = renderUniforms.viewportMaxXy;
    let scale = (CLIP_MAX_XY - CLIP_MIN_XY) / (maxXy - minXy);
    return (worldCoord - minXy) * scale + CLIP_MIN_XY;
}

@vertex
fn vertexShader(@builtin(vertex_index) id: u32)
    -> @builtin(position) vec4f
{
    // Note: don't call bodies(...) because it reads more values than we need
    let arrayIndex = id * BODY_SIZE;
    let x = bodiesIn[arrayIndex + 0];
    let y = bodiesIn[arrayIndex + 1];

    let worldCoord = vec2f(x, y);
    return vec4f(toClipSpace(worldCoord), 0, 1);
}

@fragment
fn fragmentShader() -> @location(0) vec4f {
    return vec4f(1, 1, 1, 0.5);
}