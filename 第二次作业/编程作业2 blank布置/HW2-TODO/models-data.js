var points = []; //顶点的属性：坐标数组
var colors = []; //顶点的属性：颜色数组
var flag = 0;
const VertexColors = [
    vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
    vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
    vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
    vec4( 0.0, 0.5, 0.0, 1.0 ),  // light-green        
    vec4( 0.0, 0.0, 0.5, 1.0 ),  // light-blue
    vec4( 0.5, 0.0, 0.0, 1.0 ),  // light-red
    vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
    vec4( 0.5, 0.5, 0.5, 1.0 )   // grey
];// 常量颜色

/****************************************************
 * 坐标轴模型：X轴，Y轴，Z轴的顶点位置和颜色,(-1,1)范围内定义 
 ****************************************************/
function vertextsXYZ()
{
    const len = 0.9;
    var XYZaxis = [
        vec4(-len,  0.0,  0.0, 1.0), // X
        vec4( len,  0.0,  0.0, 1.0),
        vec4( len, 0.0, 0.0, 1.0),
        vec4(len-0.01, 0.01, 0.0, 1.0),
        vec4(len, 0.0, 0.0, 1.0),
        vec4(len-0.01, -0.01, 0.0, 1.0),
        
        vec4( 0.0, -len,  0.0, 1.0), // Y
        vec4( 0.0,  len,  0.0, 1.0),
        vec4( 0.0, len,0.0, 1.0),
        vec4(0.01, len-0.01, 0.0, 1.0),
        vec4(0.0, len, 0.0, 1.0),
        vec4(-0.01, len-0.01, 0.0, 1.0),
        
        vec4( 0.0,  0.0, -len, 1.0), // Z
        vec4( 0.0,  0.0,  len, 1.0),
        vec4( 0.0, 0.0, len, 1.0),
        vec4( 0.01, 0.0,  len-0.01, 1.0),
        vec4( 0.0, 0.0, len, 1.0),
        vec4( -0.01,0.0,  len-0.01, 1.0)
    ];
    
    var XYZColors = [
        vec4(1.0, 0.0, 0.0, 1.0),  // red
        vec4(0.0, 1.0, 0.0, 1.0),  // green
        vec4(0.0, 0.0, 1.0, 1.0),  // blue
    ];
    
    for (var i = 0; i < XYZaxis.length; i++){    
        points.push(XYZaxis[i]);
        var j = Math.trunc(i/6); // JS取整运算Math.trunc//每个方向轴用6个顶点
        colors.push(XYZColors[j]);
    }
}

/****************************************************
 * 立方体模型生成
 ****************************************************/
function generateCube()
{
    quad( 1, 0, 3, 2 ); //Z正-前
    quad( 4, 5, 6, 7 ); //Z负-后
    
    quad( 2, 3, 7, 6 ); //X正-右
    quad( 5, 4, 0, 1 ); //X负-左
    
    quad( 6, 5, 1, 2 ); //Y正-上
    quad( 3, 0, 4, 7 ); //Y负-下
} 

function quad(a, b, c, d) 
{
	const vertexMC = 0.5; // 顶点分量X,Y,Z到原点距离
    var vertices = [
        vec4( -vertexMC, -vertexMC,  vertexMC, 1.0 ), //Z正前面左下角点V0，顺时针四点0~3
        vec4( -vertexMC,  vertexMC,  vertexMC, 1.0 ),
        vec4(  vertexMC,  vertexMC,  vertexMC, 1.0 ),
        vec4(  vertexMC, -vertexMC,  vertexMC, 1.0 ),
        vec4( -vertexMC, -vertexMC, -vertexMC, 1.0 ),   //Z负后面左下角点V4，顺时针四点4~7
        vec4( -vertexMC,  vertexMC, -vertexMC, 1.0 ),
        vec4(  vertexMC,  vertexMC, -vertexMC, 1.0 ),
        vec4(  vertexMC, -vertexMC, -vertexMC, 1.0 )
    ];

    var indices = [ a, b, c, a, c, d ];
    for ( var i = 0; i < indices.length; ++i ) {
        points.push(vertices[indices[i]]);  // 保存一个顶点坐标到定点给数组vertices中        
        colors.push(VertexColors[a]); // 立方体每面为单色
    }
}

/****************************************************
 * 球体模型生成：由四面体递归生成
 ****************************************************/
function generateSphere(){
    // 细分次数和顶点
    const numTimesToSubdivide = 5; // 球体细分次数
    var va = vec4(0.0, 0.0, -1.0, 1.0);
    var vb = vec4(0.0, 0.942809, 0.333333, 1.0);
    var vc = vec4(-0.816497, -0.471405, 0.333333, 1.0);
    var vd = vec4(0.816497, -0.471405, 0.333333, 1.0);
    
    function triangle(a, b, c) {
        points.push(a);
        points.push(b);
        points.push(c);
        
        colors.push(vec4(0.0, 1.0, 1.0, 1.0));
        colors.push(vec4(1.0, 0.0, 1.0, 1.0));
        colors.push(vec4(0.0, 1.0, 0.0, 1.0));
    };

    function divideTriangle(a, b, c, count) {
        if ( count > 0 ) {
            var ab = mix( a, b, 0.5);
            var ac = mix( a, c, 0.5);
            var bc = mix( b, c, 0.5);

            ab = normalize(ab, true);
            ac = normalize(ac, true);
            bc = normalize(bc, true);

            divideTriangle(  a, ab, ac, count - 1 );
            divideTriangle( ab,  b, bc, count - 1 );
            divideTriangle( bc,  c, ac, count - 1 );
            divideTriangle( ab, bc, ac, count - 1 );
        }
        else {
            triangle( a, b, c );
        }
    }

    function tetrahedron(a, b, c, d, n) {
        divideTriangle(a, b, c, n);
        divideTriangle(d, c, b, n);
        divideTriangle(a, d, b, n);
        divideTriangle(a, c, d, n);
    };

    tetrahedron(va, vb, vc, vd, numTimesToSubdivide); // 递归细分生成球体
}

/****************************************************
* TODO1: 墨西哥帽模型生成，等距细分得z,x，函数计算得到y
****************************************************/
function generateHat() {
    var nRows = 11; // 线数，实际格数=nRows-1
    var nColumns = 11; // 线数，实际格数=nColumns-1
    const range = 0.5; // XZ平面的坐标范围：从 -1 到 1
    const A = 0.5; // 墨西哥帽的高度系数
    const stepX = (2 * range) / (nRows - 1); // X方向每一步的步长
    const stepZ = (2 * range) / (nColumns - 1); // Z方向每一步的步长

    // 嵌套数组data用于存储网格上交叉点的高值(y)值。
    var data = new Array(nRows);
    for (var i = 0; i < nRows; i++) {
        data[i] = new Array(nColumns);
    }

    // 遍历网格上每个点，计算y值
    for (var i = 0; i < nRows; i++) {
        for (var j = 0; j < nColumns; j++) {
            var x = -range + i * stepX;
            var z = -range + j * stepZ;
            var r = Math.sqrt(x * x*15 + z * z*15); // 计算 r = sqrt(x^2 + z^2)
            var y = A * (1 - r * r) * Math.exp(-r * r); // 墨西哥帽的函数
            // 将点存储在数组中
            data[i][j] = vec4(x, y, z, 1.0);
        }
    }

    // 为每四个顶点构成一个网格四边形，并存储顶点和颜色
    for (var i = 0; i < nRows - 1; i++) {
        for (var j = 0; j < nColumns - 1; j++) {
            var p1 = data[i][j];         // 左下角
            var p2 = data[i + 1][j];     // 右下角
            var p3 = data[i + 1][j + 1]; // 右上角
            var p4 = data[i][j + 1];     // 左上角

            // 生成两个三角形以构成一个四边形
            points.push(p1);
            points.push(p2);
            points.push(p3);
            points.push(p1);
            points.push(p3);
            points.push(p4);

            // 为这些顶点添加颜色（可以随意调整）
            var color;
            if (flag===0) {
                if ((i + j) % 2 === 0) {
                    color = vec4(0.0, 0.0, 0.0, 1.0);  // 黑色
                } else {
                    color = vec4(0.9, 0.9, 0.9, 1.0);  // 白色
                }
                colors.push(color);
                colors.push(color);
                colors.push(color);
                colors.push(color);
                colors.push(color);
                colors.push(color);
            }
            if (flag===1){
                // 为每个顶点随机生成颜色
            var color1 = vec4(Math.random(), Math.random(), Math.random(), 1.0);  // 随机颜色1
            var color2 = vec4(Math.random(), Math.random(), Math.random(), 1.0);  // 随机颜色2
            var color3 = vec4(Math.random(), Math.random(), Math.random(), 1.0);  // 随机颜色3
            var color4 = vec4(Math.random(), Math.random(), Math.random(), 1.0);  // 随机颜色4
            var color5 = vec4(Math.random(), Math.random(), Math.random(), 1.0);  // 随机颜色5
            var color6 = vec4(Math.random(), Math.random(), Math.random(), 1.0);  // 随机颜色6
            colors.push(color1);
            colors.push(color2);
            colors.push(color3);
            colors.push(color4);
            colors.push(color5);
            colors.push(color6);
            }
        }
    }
}
//茶壶

function loadTeapot() {
    const objFilePath = 'teapot.obj';
    const xhr = new XMLHttpRequest();
    xhr.open('GET', objFilePath, true);
    xhr.onload = function () {
        if (xhr.status === 200) {
            const objData = xhr.responseText;
            parseOBJ(objData);
            SendData();  // 在文件加载完成后发送数据
            render();    // 在文件加载完成后渲染
        } else {
            console.error("无法加载 OBJ 文件: " + xhr.status);
        }
    };
    xhr.onerror = function () {
        console.error("请求发生错误");
    };
    xhr.send();
}


function parseOBJ(data) {
    const lines = data.split('\n');
    const vertices = [];
    const faces = [];

    // 逐行解析OBJ数据
    for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts[0] === 'v') {
            // 顶点坐标
            const x = parseFloat(parts[1]);
            const y = parseFloat(parts[2]);
            const z = parseFloat(parts[3]);
            vertices.push(vec4(x, y, z, 1.0));
        } else if (parts[0] === 'f') {
            // 面索引（从1开始）
            const v1 = parseInt(parts[1]) - 1;
            const v2 = parseInt(parts[2]) - 1;
            const v3 = parseInt(parts[3]) - 1;
            faces.push([v1, v2, v3]);
        }
    }

    for (let i = 0; i < faces.length; i++){
        const face = faces[i];
        const v1 = vertices[face[0]];
        const v2 = vertices[face[1]];
        const v3 = vertices[face[2]];

        // 将每个面的顶点存入points数组
        points.push(v1);
        points.push(v2);
        points.push(v3);

        // 给每个顶点添加颜色黑白
        if (i%2 === 0){
            color = vec4(0.0, 0.0, 0.0, 1.0); // 黑色
        }
        else{
            color = vec4(1.0, 1.0, 1.0, 1.0); // 白色
        }
        colors.push(color);
        colors.push(color);
        colors.push(color);
    }
    console.log("OBJ模型加载完成，顶点数:", vertices.length, "面数:", faces.length);
}