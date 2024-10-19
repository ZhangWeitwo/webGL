var canvas;
var gl;
var program;
 // 用来区分绘制坐标还是物体，坐标轴不需要进行M变换
var vBuffer, cBuffer;//顶点属性数组
// 交互可调参数及根据参数生成的三个变换：M,V,P（全局变量）
var modelScale; //物体整体缩放的因子
var theta; // 视点（眼睛）绕Y轴旋转角度，参极坐标θ值，
var phi; // 视点（眼睛）绕X轴旋转角度，参极坐标φ值，
var phi0=phi;
var up=vec3(0,1,0);
var lastn=up;;
var isOrth; // 投影方式设置参数
var fov; // 透视投影的俯仰角，fov越大视野范围越大
var ModelMatrix; // 模型变换矩阵
var ViewMatrix; // 视图变换矩阵
var ProjectionMatrix; // 投影变换矩阵

// shader里的统一变量在本代码里的标识变量
var u_ModelMatrix, u_ViewMatrix, u_ProjectionMatrix;
var u_Flag;//用来区分绘制坐标还是物体，坐标轴不需要进行M变换

/* ***********窗口加载时调用:程序环境初始化程序****************** */
window.onload = function() {
    canvas = document.getElementById("canvas");
    gl = canvas.getContext('webgl2');
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    program = initShaders( gl, "shaders/3d-wandering.vert", "shaders/3d-wandering.frag" );
    gl.useProgram( program );
    
	//调整画布大小为正方形以保证图形长宽比例正确,设置视口viewport大小与画布一致
    resize();
	
	// 开启深度缓存，以正确渲染物体被遮挡部分，3D显示必备
    gl.enable(gl.DEPTH_TEST); 
	// 设置canvas画布背景色 -白色-
    gl.clearColor(1.0, 1.0, 1.0, 1.0); 
	
	
    // 初始化数据缓冲区，并关联attribute 着色器变量
    vBuffer = gl.createBuffer();//为points存储的缓存
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );  	
    cBuffer = gl.createBuffer();//为colors存储的缓存
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );
		
	// 关联uniform着色器变量
    u_ModelMatrix = gl.getUniformLocation(program,"u_ModelMatrix");
    u_ViewMatrix = gl.getUniformLocation( program, "u_ViewMatrix" );
    u_ProjectionMatrix = gl.getUniformLocation( program, "u_ProjectionMatrix" );
    u_Flag = gl.getUniformLocation(program, "u_Flag");

	//初始化交互界面上的相关参数
	initViewingParameters();
	
    // 生成XYZ坐标轴，调用models-data.js中函数//返回points和colors数组 
    vertextsXYZ(); 	
	// 生成立方体模型数据，调用models-data.js中函数//返回points和colors数组 
    generateCube(); 
	
    // 发送顶点属性数据points和colors给GPU
    SendData(); 	
    // 调用绘制函数进行渲染
    render(); 
}

/* 注册键盘按键事件，修改变换矩阵中的各项参数，并重新进行渲染render */
window.onkeydown = function(e){
    switch (e.keyCode) { 
		case 90:    // Z-模型沿Y轴旋转
            modelScale *=1.1;
            break;
        case 67:    // C-模型沿Y轴反向旋转
            modelScale *= 0.9;
            break;

        case 87:    // W-视点绕X轴顺时针旋转5度
            phi -= 5;
            break;
        case 83:    // S-视点绕X轴逆时针旋转5度
            phi += 5;
            break;
        case 65:    // A-视点绕Y轴顺时针旋转5度
            theta -= 5;
            break;
        case 68:    // D-视点绕Y轴逆时针旋转5度
            theta += 5;
            break;
                
        case 80:    // P-切换投影方式
            isOrth = !isOrth;
            break;
        case 77:    // M-放大俯仰角，给了一个限制范围
            fov = Math.min(fov + 5, 170);
            break;
        case 78:    // N-较小俯仰角
            fov = Math.max(fov - 5, 5);
            break; 			
			
		case 32:    // 空格-复位
            initViewingParameters();
            break;
    }        
    render();//参数变化后需要重新绘制画面
}

/* 绘图界面随窗口交互缩放而相应变化，保持1:1防止图形变形 */
window.onresize = resize;
function resize(){
    var size = Math.min(document.body.clientWidth, document.body.clientHeight);
    canvas.width = size;
    canvas.height = size;
    gl.viewport( 0, 0, canvas.width, canvas.height );
    render();
}
/* ****************************************
*  渲染函数render 
*******************************************/
function render(){    
    // 用背景色清屏
    gl.clear( gl.COLOR_BUFFER_BIT );
    
    // 构造观察流程中需要的三各变换矩阵
    ModelMatrix=formModelMatrix();//M:模型变换矩阵
    ViewMatrix=formViewMatrix(); //V:视点变换矩阵
    ProjectionMatrix=formProjectMatrix(); //投影变换矩阵
    
    // 传递变换矩阵    
    gl.uniformMatrix4fv( u_ModelMatrix, false, flatten(ModelMatrix) );     
    gl.uniformMatrix4fv( u_ViewMatrix, false, flatten(ViewMatrix) ); 
    gl.uniformMatrix4fv( u_ProjectionMatrix, false, flatten(ProjectionMatrix) ); 
	
    // 标志位设为0，用顶点数据绘制坐标系
    gl.uniform1i( u_Flag, 0 );
    gl.drawArrays( gl.LINES, 0, 6 ); // 绘制X轴，从0开始，读6个点
    gl.drawArrays( gl.LINES, 6, 6 ); // 绘制y轴，从6开始，读6个点
    gl.drawArrays( gl.LINES, 12, 6 ); // 绘制z轴，从12开始，读6个点        

    // 标志位设为1，用顶点数据绘制 面单色立方体
    gl.uniform1i( u_Flag, 1 );
    gl.drawArrays( gl.TRIANGLES, 18, points.length - 18 ); // 绘制物体,都是三角形网格表面
}


/* ****************************************************
* 初始化或复位：需要将交互参数及变换矩阵设置为初始值
********************************************************/
function initViewingParameters(){
	modelScale=1.0;		
    theta = 0;     
	phi = 0;
    isOrth = true;     
	fov = 120;
	ModelMatrix = mat4(); //单位矩阵
    up = vec3(0,1,0);
    ViewMatrix = mat4();//单位矩阵
    ProjectionMatrix = mat4();//单位矩阵
};
/****************************************************************
* 初始及交互菜单选择不同图形后，需要重新发送顶点属性数据给GPU
******************************************************************/
function SendData(){
    var pointsData = flatten(points);
    var colorsData = flatten(colors);
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, pointsData, gl.STATIC_DRAW );
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, colorsData, gl.STATIC_DRAW );
}
/********************************************************
* 交互菜单选择不同图形后，需要重新生成顶点数据并渲染
******************************************************/
function modelChange(model){
    points = [];
    colors = [];
    switch(model){
        case 'cube':{
            vertextsXYZ();
            generateCube();
            break;
        }
        case 'sphere':{
            vertextsXYZ();
            generateSphere();
            break;
        }
        case 'hat':{
            vertextsXYZ();
            generateHat();
            break;
        }
        case 'teapot':{
            vertextsXYZ();
            loadTeapot();
            break;
        }
    }
    SendData();//重新发送数据
	render();//重新渲染
}



/* ****************************************************
 * 生成观察流水管线中的 M,V,P矩阵  
********************************************************/

function formModelMatrix(){
//===================TODO2：生成物体缩放矩阵============================
//note: modify the `modelMatrix` to the correct value using `modelScale`
    var modelMatrix = mat4(
        1,0,0,0,
        0,1,0,0,
        0,0,1,0,
        0,0,0,1
    );
    modelMatrix[0][0] *= modelScale;
    modelMatrix[1][1] *= modelScale;
    modelMatrix[2][2] *= modelScale;
    return modelMatrix;
}

function formViewMatrix(){
    var radius = 2.0;
    const at = vec3(0.0, 0.0, 0.0);


    // 计算eye位置
    var eye = vec3(
        radius * Math.sin(radians(theta)) * Math.cos(radians(phi)), //x
        radius * Math.sin(radians(phi)), //y
        radius * Math.cos(radians(phi)) * Math.cos(radians(theta)) //z
    );
    // 计算观察方向n，并归一化
    var n = normalize(subtract(at, eye));
    //n和up重合
    if (areVec3Equal(n, vec3(0.0, 1, 0.0)) || areVec3Equal(n, vec3(0.0, -1.0, 0.0)) ){
        up = vec3(0,-up[1],0);
        var temp = normalize(subtract(n,lastn));
        lastn = n;
        return isPhiIncrease(phi)? lookAt(eye, at, vec3(-temp[0],-temp[1], -temp[2])): lookAt(eye, at, temp);
    }
    isPhiIncrease(phi);
    lastn = n;
    // 返回视点变换矩阵
    return lookAt(eye, at, up);
}
//是否相等
function areVec3Equal(vecA, vecB, epsilon = 0.00001) {
    if (!vecA || !vecB) return false;
    return Math.abs(vecA[0] - vecB[0]) < epsilon &&
           Math.abs(vecA[1] - vecB[1]) < epsilon &&
           Math.abs(vecA[2] - vecB[2]) < epsilon;
}
function formProjectMatrix(){
   //==========TODO2: 计算投影矩阵=======================
	//提示1：可调用common目录下的MVnew.js里ortho(),perspective()函数
    //ortho正交投影需要的参数有left, right, bottom, ytop, near, far
    //perspective透视投影需要的参数有fov, aspect, near, far， 
	//注意1：fov俯仰角是交互控制变化的参数，是全局变量初始值120
	//注意2：因为参数top是js的保留字，所以这里的参数改名为ytop
	//注意3：设置的视见体参数需要考虑将场景中的景物包含进去。
    const near =0.1;
    const far =10;
	const left =-2;
    const right =2;
    const bottom =-2;
    const ytop =2; // 注意：top是js全局变量，所以这里改名为ytop
	
	const aspect =1 ; //纵横比设置为1
	
    //note: need to switch projection mode by `isOrth` flag 
    //      and return corresponding projection matrix built by functions in MVnew.js
    //      with params above   return yourProjectionMatrix;
    if(isOrth){
        return ortho(left, right, bottom, ytop, near, far);
    }else{
        return perspective(fov, aspect,near,far);
    }
     //需要删除，替换为上面/* */中的语句
}
//判断phi是否增加
function isPhiIncrease(phi){
    if (phi>phi0){
        phi0=phi;
        return true;
    }
    else{
        phi0=phi;
        return false;
    }
}



