@group(0) @binding(0) var<storage, read> bodies_in: array<f32>;
@group(0) @binding(1) var<storage, read_write> bodies_out: array<f32>;
@group(0) @binding(2) var<uniform> uniforms: Uniforms;

struct Uniforms {
    numBodies: u32,
    deltaT: f32,
}

struct Body {
    pos: vec2f,
    vel: vec2f,
    mass: f32,
}

const BODY_SIZE = 5;

fn readBody(index: u32, body: ptr<function, Body>) {
    let arrayIndex = index * BODY_SIZE;
    (*body).pos = vec2(
        bodies_in[arrayIndex],
        bodies_in[arrayIndex + 1]);
    (*body).vel = vec2(
        bodies_in[arrayIndex + 2],
        bodies_in[arrayIndex + 3]);
    (*body).mass = bodies_in[arrayIndex + 4];
}

fn writeBody(index: u32, body: ptr<function, Body>) {
    let arrayIndex = index * BODY_SIZE;
    bodies_out[arrayIndex] = (*body).pos.x;
    bodies_out[arrayIndex + 1] = (*body).pos.y;
    bodies_out[arrayIndex + 2] = (*body).vel.x;
    bodies_out[arrayIndex + 3] = (*body).vel.y;

    // Skip writing out mass - it doesn't change
    // bodies_out[arrayIndex + 4] = (*body).mass;
}

@compute
@workgroup_size(64)
fn computeSomething(
    @builtin(global_invocation_id) id: vec3u
) {
    let index = id.x;

    var selfBody: Body;
    readBody(index, &selfBody);

    var attractor: Body;
    var acceleration = vec2f(0, 0);
    for (var i = 0u; i < uniforms.numBodies; i++) {
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
    selfBody.vel += acceleration * uniforms.deltaT;
    selfBody.pos += selfBody.vel * uniforms.deltaT;
    writeBody(index, &selfBody);
}