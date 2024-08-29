@group(0) @binding(0) var<uniform> u_modelProj : mat4x4<f32>;

@vertex
fn vs_main(
  @builtin(vertex_index) VertexIndex : u32
) -> @builtin(position) vec4f {
  var pos = array<vec2f, 3>(
    vec2(0.0, 0.5),
    vec2(-0.5, -0.5),
    vec2(0.5, -0.5)
  );

  return u_modelProj * vec4f(pos[VertexIndex], 0.0, 1.0);
}
@fragment
fn fs_main() -> @location(0) vec4f {
  return vec4(1.0, 0.0, 0.0, 1.0);
}