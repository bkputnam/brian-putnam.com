// @group(0) @binding(0) var<storage, read> canvasDims: vec2;

const MAX_ITERATIONS = 1500;

struct Complex {
    vals: vec2f,
}

fn cxAdd(a: Complex, b: Complex) -> Complex {
    return Complex(a.vals + b.vals);
}

fn cxSquare(a: Complex) -> Complex {
    let r = a.vals.x;
    let i = a.vals.y;
    return Complex(r * r - i * i, 2.0 * r * i);
}

fn cxMagnitudeSquared(a: Complex) -> f32 {
    return a.vals.x * a.vals.x + a.vals.y * a.vals.y;
}

struct VertexShaderOutput {
    @builtin(position) position: vec4f,
    @location(0) clipPosition: vec2f,
};

fn toClipCoord(vertexIndex: u32) -> vec4f {
    switch (vertexIndex) {
        case 0u: {
            return vec4f(-1.0, 1.0, 0.0, 1.0);
        }
        case 1u: {
            return vec4f(-1.0, -3.0, 0.0, 1.0);
        }
        case 2u: {
            return vec4f(3.0, 1.0, 0.0, 1.0);
        }
        default: {
            return vec4f(1.0, 2.0, 3.0, 4.0);
        }
    }
}

@vertex
fn vertexShader(
    @builtin(vertex_index) vertexIndex : u32
)-> VertexShaderOutput {
    let clipCoord = toClipCoord(vertexIndex);
    return VertexShaderOutput(clipCoord, clipCoord.xy);
}

fn convergenceSpeed(c: Complex) -> int32 {
    let numSteps: int32 = 0;
    let z = Complex(vec2f(0.0, 0.0));
    for (let i = 0; i < MAX_ITERATIONS; i++) {
        z = cxSquare(z) + c;
        if (cxMagnitudeSquared(z) > 4.0) {
            return i;
        }
    }
    return -1;
}

@fragment fn fs(
    vertexOutput: VertexShaderOutput,
) -> @location(0) vec4f {
    // return vec4f(vertexOutput.clipPosition, 0.0, 1.0);
    const complex = Complex(vertexOutput.clipCoord * 2);
}
