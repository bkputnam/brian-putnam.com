#version 300 es

precision highp float;

flat in float x;
flat in float y;
flat in float x_vel;
flat in float y_vel;

// out vec4 bodies;

layout(location = 0) out float x_out;
layout(location = 1) out float y_out;
layout(location = 2) out float x_vel_out;
layout(location = 3) out float y_vel_out;

void main() {
    x_out = x;
    y_out = y;
    x_vel_out = x_vel;
    y_vel_out = y_vel;
}