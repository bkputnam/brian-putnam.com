#version 300 es

uniform ivec2 tex_size;
uniform vec2 min_xy;
uniform vec2 max_xy;

uniform sampler2D x_positions_in;
uniform sampler2D y_positions_in;

const vec2 CLIP_MIN_XY = vec2(-1, -1);
const vec2 CLIP_MAX_XY = vec2(1, 1);

ivec2 textureCoordinate(int index) {
    return ivec2(index % tex_size.x, index / tex_size.x);
}

vec2 toClipSpace(vec2 coord) {
    vec2 scale = (CLIP_MAX_XY - CLIP_MIN_XY) / (max_xy - min_xy);
    return (coord - min_xy) * scale + CLIP_MIN_XY;
}

void main() {
    ivec2 texCoord = textureCoordinate(gl_VertexID);
    float x = texelFetch(x_positions_in, texCoord, 0).r;
    float y = texelFetch(y_positions_in, texCoord, 0).r;
    vec2 clipPos = toClipSpace(vec2(x, y));
    gl_Position = vec4(clipPos, 0, 1);

    // Arbitrary size
    gl_PointSize = 4.0f;
}