#version 300 es

in int index;

uniform int num_bodies;
uniform vec2 min_xy;
uniform vec2 max_xy;

uniform sampler2D x_positions;
uniform sampler2D y_positions;
uniform sampler2D masses;
uniform sampler2D x_velocities;
uniform sampler2D y_velocities;

flat out float x;
out float y;
out float x_vel;
out float y_vel;

void main() {
    ivec2 indexVec = ivec2(index, 0);
    x = texelFetch(x_positions, indexVec, 0).r;
    y = texelFetch(y_positions, indexVec, 0).r;
    vec2 pos = vec2(x, y);
    float mass = texelFetch(masses, indexVec, 0).r;
    x_vel = texelFetch(x_velocities, indexVec, 0).r;
    y_vel = texelFetch(y_velocities, indexVec, 0).r;
    vec2 vel = vec2(x_vel, y_vel);

    const vec2 CLIP_MIN_XY = vec2(-1, -1);
    const vec2 CLIP_MAX_XY = vec2(1, 1);
    vec2 scale = (CLIP_MAX_XY - CLIP_MIN_XY) / (max_xy - min_xy);

    vec2 clip_xy = (pos - min_xy) * scale + CLIP_MIN_XY;
    gl_Position = vec4(clip_xy, 0, 1);
    gl_PointSize = 2.0f;
}