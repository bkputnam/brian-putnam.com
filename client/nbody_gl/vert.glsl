#version 300 es

in int index;
in float a;
in float b;

// uniform sampler2D fooTex;

out float sum;
out float difference;
out float product;
flat out int foo;

void main() {
    sum = a + b;
    difference = a - b;
    product = a * b;
    // foo = int(texelFetch(fooTex, ivec2(index, 0), 0)[0]);
    // foo = index;
    foo = 5;
}