@group(0) @binding(0) var<storage, read> bodies_in: array<f32>;
@group(0) @binding(1) var<storage, read> bodies_out: array<f32>;
@group(0) @binding(2) var numBodies: u32;

struct Body {
    pos: vec2f,
    vel: vec2f,
    mass: f32,
}

const BODY_SIZE = 5;

fn readBody(index: i32, body: ptr<private, Body>) {
    let arrayIndex = index * BODY_SIZE;
    (*body).pos = vec2(
        bodies_in[arrayIndex],
        bodies_in[arrayIndex + 1]);
    (*body).vel = vec2(
        bodies_in[arrayIndex + 2],
        bodies_in[arrayIndex + 3]);
    (*body).mass = bodies_in[arrayIndex + 4];
}

fn writeBody(index: i32, body: ptr<private, Body>) {
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
    let acceleration = vec2(0, 0);
    for (var i = 0u; i < numBodies; i++) {
        readBody(i, &attractor);

        // instead of doing `if (i == index) { continue; }` just set
        // attrator.mass to 0 when `index == i` to force the current iteration
        // to be a noop
        attractor.mass *= select(1, 0, index == i);


    }
}