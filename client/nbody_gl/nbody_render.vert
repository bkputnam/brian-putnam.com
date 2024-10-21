#version 300 es

uniform ivec2 tex_size;
uniform vec2 min_xy;
uniform vec2 max_xy;

uniform sampler2D x_positions_in;
uniform sampler2D y_positions_in;

const vec2 CLIP_MIN_XY = vec2(-1, -1);
const vec2 CLIP_MAX_XY = vec2(1, 1);

vec4 toClipSpace(vec2 worldCoord) {
    vec2 scale = (CLIP_MAX_XY - CLIP_MIN_XY) / (max_xy - min_xy);
    vec2 clip_xy = (worldCoord - min_xy) * scale + CLIP_MIN_XY;
    return vec4(clip_xy, 0, 1);
}

void main() {
    ivec2 indexVec = ivec2(gl_VertexID % tex_size.x, gl_VertexID / tex_size.x);
    float x = texelFetch(x_positions_in, indexVec, 0).r;
    float y = texelFetch(y_positions_in, indexVec, 0).r;
    vec2 worldCoord = vec2(x, y);
    gl_Position = toClipSpace(worldCoord);
}