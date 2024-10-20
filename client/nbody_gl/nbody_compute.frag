#version 300 es

precision highp float;

in float x;
in float y;
in float x_vel;
in float y_vel;

out vec4 bodies;

void main() {
    bodies = vec4(x, y, x_vel, y_vel);
}