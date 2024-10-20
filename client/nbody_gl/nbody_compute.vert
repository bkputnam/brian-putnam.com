#version 300 es

uniform int num_bodies;
uniform float delta_t;
uniform ivec2 tex_size;

uniform sampler2D masses;

uniform sampler2D bodies_in;

out float x;
out float y;
out float x_vel;
out float y_vel;

ivec2 textureCoordinate(int index) {
    return ivec2(index % tex_size.x, index / tex_size.x);
}

struct Body {
    vec2 pos;
    vec2 vel;
    float mass;
};

Body getBody(ivec2 tc) {
    vec4 body = texelFetch(bodies_in, tc, 0);
    float mass = texelFetch(masses, tc, 0).r;

    return Body(body.xy, body.zw, mass);
}

const vec2 CLIP_MIN_XY = vec2(-1, -1);
const vec2 CLIP_MAX_XY = vec2(1, 1);

vec4 texCoordToClipSpace(ivec2 texCoord) {
    vec2 scale = (CLIP_MAX_XY - CLIP_MIN_XY) / vec2(tex_size);
    return vec4(vec2(texCoord) * scale + CLIP_MIN_XY, 0, 1);
}

void main() {
    ivec2 texCoord = textureCoordinate(gl_VertexID);
    Body self = getBody(texCoord);

    // Compute acceleration due to all N other bodies
    vec2 acc = vec2(0);
    for(int i = 0; i < num_bodies; i++) {
        if(i == gl_VertexID) {
            continue;
        }
        Body attractor = getBody(textureCoordinate(i));
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
    gl_Position = texCoordToClipSpace(texCoord);
}
