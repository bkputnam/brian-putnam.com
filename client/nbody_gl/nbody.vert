#version 300 es

uniform int num_bodies;
uniform vec2 min_xy;
uniform vec2 max_xy;
uniform float delta_t;
uniform ivec2 tex_size;

uniform sampler2D masses;

uniform sampler2D x_positions_in;
uniform sampler2D y_positions_in;
uniform sampler2D x_velocities_in;
uniform sampler2D y_velocities_in;

out float x;
out float y;
out float x_vel;
out float y_vel;

struct Body {
    vec2 pos;
    float mass;
    vec2 vel;
};

Body getBody(int index) {
    ivec2 indexVec = ivec2(index % tex_size.x, index / tex_size.x);
    float x = texelFetch(x_positions_in, indexVec, 0).r;
    float y = texelFetch(y_positions_in, indexVec, 0).r;
    float mass = texelFetch(masses, indexVec, 0).r;
    float x_vel = texelFetch(x_velocities_in, indexVec, 0).r;
    float y_vel = texelFetch(y_velocities_in, indexVec, 0).r;

    return Body(vec2(x, y), mass, vec2(x_vel, y_vel));
}

void main() {
    Body self = getBody(gl_VertexID);

    // Compute acceleration due to all N other bodies
    vec2 acc = vec2(0);
    for(int i = 0; i < num_bodies; i++) {
        if(i == gl_VertexID) {
            continue;
        }
        Body attractor = getBody(i);
        vec2 distVec = attractor.pos - self.pos;
        float distMagSquared = dot(distVec, distVec);
        vec2 distUnit = distVec / sqrt(distMagSquared);
        float softenedMag = max(distMagSquared, 1.f);

        acc += attractor.mass * distUnit / softenedMag;
    }

    // Update velocity and position based on acceleration
    vec2 new_vel = self.vel + acc * delta_t;
    vec2 new_pos = self.pos + new_vel * delta_t;

    // Populate out variables
    x_vel = new_vel.x;
    y_vel = new_vel.y;
    x = new_pos.x;
    y = new_pos.y;

    // Convert to clipspace so we can populate gl_Position
    const vec2 CLIP_MIN_XY = vec2(-1, -1);
    const vec2 CLIP_MAX_XY = vec2(1, 1);
    vec2 scale = (CLIP_MAX_XY - CLIP_MIN_XY) / (max_xy - min_xy);
    vec2 clip_xy = (new_pos - min_xy) * scale + CLIP_MIN_XY;
    gl_Position = vec4(clip_xy, 0, 1);

    // Arbitrary size
    gl_PointSize = 4.0f;
}
