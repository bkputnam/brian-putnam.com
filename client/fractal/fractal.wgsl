// @group(0) @binding(0) var<storage, read> 

struct Complex {
    vals: vec2f,
}

fn cxAdd(a: Complex, b: Complex) -> Complex {
    return Complex(a.vals + b.vals);
}

@vertex
fn vertexShader(
    @builtin(vertex_index) vertexIndex : u32
)-> @builtin(position) vec4f {
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

@fragment fn fs() -> @location(0) vec4f {
    return vec4f(1.0, 0.0, 0.0, 1.0);
}