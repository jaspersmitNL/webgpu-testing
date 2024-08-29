import { mat4, vec3 } from "wgpu-matrix";
import shaderSource from "./shader.wgsl?raw";
const canvas = document.createElement("canvas");
canvas.width = 800;
canvas.height = 600;
document.body.appendChild(canvas);
async function main() {
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    throw new Error("WebGPU not supported");
  }

  const ctx = canvas.getContext("webgpu") as GPUCanvasContext;

  const device = await adapter.requestDevice();

  if (!ctx) {
    throw new Error("No device");
  }

  const format = navigator.gpu.getPreferredCanvasFormat();

  ctx.configure({
    device,
    format,
    alphaMode: "premultiplied",
  });

  const shaderModule = device.createShaderModule({
    code: shaderSource,
  });
  const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module: shaderModule,
      entryPoint: "vs_main",
    },
    fragment: {
      module: shaderModule,
      entryPoint: "fs_main",
      targets: [
        {
          format,
        },
      ],
    },
    primitive: {
      topology: "triangle-list",
    },
  });
  const draw = () => {
    const commandEncoder = device.createCommandEncoder();
    const textureView = ctx.getCurrentTexture().createView();

    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          view: textureView,
          clearValue: [0, 0, 0, 1],
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    };

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);

    let buffers: GPUBuffer[] = [];

    const drawObj = (x: number, y: number) => {
      const aspect = canvas.width / canvas.height;
      const projectionMatrix = mat4.perspective(
        (2 * Math.PI) / 5,
        aspect,
        1,
        100.0
      );

      const viewMatrix = mat4.identity();

      mat4.translate(viewMatrix, vec3.fromValues(x, y, -4), viewMatrix);
      const modelViewProjectionMatrix = mat4.create();

      mat4.multiply(projectionMatrix, viewMatrix, modelViewProjectionMatrix);

      passEncoder.setPipeline(pipeline);

      const uniformBufferSize = 4 * 16; // 4x4 matrix
      const uniformBuffer = device.createBuffer({
        size: uniformBufferSize,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });
      const uniformBindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
          {
            binding: 0,
            resource: {
              buffer: uniformBuffer,
            },
          },
        ],
      });
      device.queue.writeBuffer(
        uniformBuffer,
        0,
        modelViewProjectionMatrix.buffer,
        modelViewProjectionMatrix.byteOffset,
        modelViewProjectionMatrix.byteLength
      );

      passEncoder.setBindGroup(0, uniformBindGroup);
      passEncoder.draw(3);

      buffers.push(uniformBuffer);
    };

    let size = 3;
    let padding = 1.5;
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        drawObj(-2 + x * padding, -2 + y * padding);
      }
    }

    passEncoder.end();

    device.queue.submit([commandEncoder.finish()]);

    for (const buffer of buffers) {
      console.log("destroying buffer");
      buffer.destroy();
    }
    requestAnimationFrame(draw);
  };

  draw();
}

main().catch((err) => {
  console.error(err);
  alert(err);
});
