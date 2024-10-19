"use strict";

let canvas;
let gl;
let program;

let cubeVerticesBuffer;
let cubeColorsBuffer;
let indexBuffer;

let modelMatrix = mat4.create(); // 模型矩阵
let projectionMatrix = mat4.create(); // 投影矩阵
let viewMatrix = mat4.create(); // 视图矩阵

let rotationAxis = vec3.fromValues(1.0, 1.0, 1.0); // 绕对角线旋转
let angle = 0.0; // 旋转角度

// 顶点着色器
const vertexShaderSource = `
    attribute vec4 aPosition;
    attribute vec4 aColor;
    uniform mat4 uModelMatrix;
    uniform mat4 uViewMatrix;
    uniform mat4 uProjectionMatrix;
    varying vec4 vColor;

    void main(void) {
        gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * aPosition;
        vColor = aColor;
    }
`;

// 片元着色器
const fragmentShaderSource = `
    precision mediump float;
    varying vec4 vColor;

    void main(void) {
        gl_FragColor = vColor;
    }
`;

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");
    gl = canvas.getContext("webgl2");
    if (!gl) {
        alert("WebGL 2.0 isn't available");
    }

    // 初始化着色器
    program = initShaders(gl, vertexShaderSource, fragmentShaderSource);
    gl.useProgram(program);

    // 初始化立方体顶点和颜色数据
    initBuffers();

    // 设置投影矩阵（透视投影）
    mat4.perspective(projectionMatrix, 45, canvas.width / canvas.height, 0.1, 100);

    // 设置视图矩阵（相机位置）
    mat4.lookAt(viewMatrix, [3, 3, 7], [0, 0, 0], [0, 1, 0]);

    // 开始动画
    render();
};

// 初始化着色器
function initShaders(gl, vsSource, fsSource) {
    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Unable to initialize the shader program.");
        return null;
    }
    return shaderProgram;
}

function compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

// 初始化立方体顶点和颜色数据
function initBuffers() {
    // 立方体顶点数据
    const vertices = [
        // 前面
        -1, -1,  1,   1, -1,  1,   1,  1,  1,  -1,  1,  1,
        // 后面
        -1, -1, -1,  -1,  1, -1,   1,  1, -1,   1, -1, -1,
        // 顶面
        -1,  1, -1,  -1,  1,  1,   1,  1,  1,   1,  1, -1,
        // 底面
        -1, -1, -1,   1, -1, -1,   1, -1,  1,  -1, -1,  1,
        // 右面
         1, -1, -1,   1,  1, -1,   1,  1,  1,   1, -1,  1,
        // 左面
        -1, -1, -1,  -1, -1,  1,  -1,  1,  1,  -1,  1, -1
    ];

    // 每个面的颜色
    const faceColors = [
        [1.0, 0.0, 0.0, 1.0], // 红色
        [0.0, 1.0, 0.0, 1.0], // 绿色
        [0.0, 0.0, 1.0, 1.0], // 蓝色
        [1.0, 1.0, 0.0, 1.0], // 黄色
        [1.0, 0.0, 1.0, 1.0], // 紫色
        [0.0, 1.0, 1.0, 1.0], // 青色
    ];

    let colors = [];
    faceColors.forEach(color => {
        colors = colors.concat(color, color, color, color);
    });

    // 创建顶点缓冲区
    cubeVerticesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    // 创建颜色缓冲区
    cubeColorsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeColorsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    // 创建索引缓冲区
    const cubeIndices = [
        0,  1,  2,      0,  2,  3,    // 前面
        4,  5,  6,      4,  6,  7,    // 后面
        8,  9,  10,     8,  10, 11,   // 顶面
        12, 13, 14,     12, 14, 15,   // 底面
        16, 17, 18,     16, 18, 19,   // 右面
        20, 21, 22,     20, 22, 23    // 左面
    ];

    indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeIndices), gl.STATIC_DRAW);
}

// 渲染循环
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clearColor(0.5, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    // 计算旋转矩阵
    mat4.identity(modelMatrix);
    angle += 0.01; // 旋转速度
    mat4.rotate(modelMatrix, modelMatrix, angle, rotationAxis);

    // 传递矩阵到着色器
    const uModelMatrix = gl.getUniformLocation(program, "uModelMatrix");
    gl.uniformMatrix4fv(uModelMatrix, false, modelMatrix);

    const uViewMatrix = gl.getUniformLocation(program, "uViewMatrix");
    gl.uniformMatrix4fv(uViewMatrix, false, viewMatrix);

    const uProjectionMatrix = gl.getUniformLocation(program, "uProjectionMatrix");
    gl.uniformMatrix4fv(uProjectionMatrix, false, projectionMatrix);

    // 绑定顶点缓冲区
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesBuffer);
    const aPosition = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aPosition);

    // 绑定颜色缓冲区
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeColorsBuffer);
    const aColor = gl.getAttribLocation(program, "aColor");
    gl.vertexAttribPointer(aColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aColor);

    // 绑定索引缓冲区
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    // 绘制立方体
    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);

    requestAnimationFrame(render);
}
