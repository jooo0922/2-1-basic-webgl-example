"use strict";

let gl, canvas, shaderProgram, vertexBuffer;

function createGLContext(canvas) {
  const names = ["webgl", "experimental-webgl"];
  let context = null;

  for (let i = 0; i < names.length; i++) {
    try {
      context = canvas.getContext(names[i]);
    } catch (error) {}

    if (context) {
      break; // 브라우저가 'webgl' 또는 'experimental-webgl' 중 하나를 지원하여 WebGLRenderingContext를 리턴받으면 반복문을 끝냄.
    }
  }

  if (context) {
    // 안티 패턴이므로 사용하지 않도록 함. 아래 gl.viewport() 관련 정리 참고
    // context.viewportWidth = canvas.width;
    // context.viewportHeight = canvas.height;
  } else {
    alert("Failed to create WebGL context!");
  }

  return context;
}

function loadShader(type, shaderSource) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert("Error compiling shader" + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  } else {
    return shader;
  }
}

function setupShaders() {
  const vertexShaderSource =
    "attribute vec3 aVertexPosition; \n" +
    "void main() { \n" +
    " gl_Position = vec4(aVertexPosition, 1.0); \n" +
    "} \n";

  const fragmentShaderSource =
    "precision mediump float; \n" +
    "void main() { \n" +
    " gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0); \n" +
    "} \n";

  const vertexShader = loadShader(gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = loadShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  gl.useProgram(shaderProgram);

  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(
    shaderProgram,
    "aVertexPosition"
  );
}

function setupBuffers() {
  vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer); // gl.ARRAY_BUFFER는 vertex attribute(버텍스 좌표, 텍스트 좌표, 버텍스 컬러 등)들을 포함하는 버퍼 객체
  const triangleVertices = [0.0, 0.5, 0.0, -0.5, -0.5, 0.0, 0.5, -0.5, 0.0];
  gl.bufferData(
    // 버텍스 데이터를 현재 바인딩된 버퍼 객체인 vertexBuffer에 기록해 줌.
    gl.ARRAY_BUFFER,
    new Float32Array(triangleVertices),
    gl.STATIC_DRAW // 세번째 인자는 최적화를 위한 버퍼 저장소의 사용패턴을 지정하는 GLenum값. gl.STATIC_DRAW는 어플리케이션에서 한 번만 지정되고, draw 명령의 소스로 여려 번 사용되는 패턴으로 지정한 것.
  );

  // draw 함수에서 필요한 값들을 버퍼 객체에 임의의 프로퍼티로 할당해놓음. 이런 방식이 좋은 방법은 아니라고 나와있음...
  vertexBuffer.itemSize = 3; // 버텍스 셰이더의 애트리뷰트에 몇 개의 원소가 존재하는지 알려줌(vec3니까 3개지)
  vertexBuffer.numberOfItems = 3; // 현재 이 버퍼에 몇 개의 아이템 또는 버텍스가 있는지 알려줌(버텍스 하나 당 x, y, z 세개의 좌표값이 필요하므로, 9개의 배열을 3개씩 묶으면 총 3개의 버텍스가 있는거겠지.)
}

function draw() {
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT); // startup 함수에서 gl.clearColor()로 지정한 색상값으로 색상 버퍼를 채워줌. 그니까 셰이더로 그림을 그리기 전에 배경을 지정된 색상으로 싹 한번 덮어준다는 거임. 2DContext로 치면 clearRect인데 색상을 커스텀 지정한 느낌?

  gl.vertexAttribPointer(
    shaderProgram.vertexPositionAttribute,
    vertexBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute); // vertex attribute 배열들을 활성화하는 것 같음

  gl.drawArrays(gl.TRIANGLES, 0, vertexBuffer.numberOfItems);
}

function startup() {
  canvas = document.getElementById("myGLCanvas");
  gl = WebGLDebugUtils.makeDebugContext(createGLContext(canvas)); // WebGLRenderingContext로부터 WebGL API의 메서드를 호출할 때 일반적으로 사용되는 접두사
  setupShaders();
  setupBuffers();
  gl.clearColor(0.0, 0.0, 0.0, 1.0); // draw 함수에서 배경색 clear 시 사용할 색상을 검정색으로 지정함.
  draw();
}

/**
 * 'webgl' vs 'experimental webgl'
 *
 * canvas.getContext()를 이용해서 WebGLRenderingContext를 얻을 때
 * 위의 두 이름을 반복문을 돌려 모두 사용하는 게 보일거임.
 *
 * 저 둘의 차이가 뭐냐면,
 * 브라우저가 WebGL 최종 스펙 구현을 완료하면 'webgl'로 불러올 수 있지만,
 * Edge 같은 브라우저는 아직 모든 스펙을 구현하지 못했기 때문에 'experimental-webgl'을 사용해야 함.
 *
 * 그래서 일반적으로는 두 이름을 반복문을 돌려서 WebGLRenderingContext를 구해본 뒤(일반적으로는 'webgl' 먼저 돌림.)
 * WebGLRenderingContext를 가져오는 데 성공하면 반복문을 중단함.
 */

/**
 * try...catch
 *
 * 스크립트가 런타임에서 에러가 발생하면 스크립트 실행이 즉시 중단되어 버리는데,
 * try...catch 문법을 사용하면 에러를 '잡아서(catch)' 에러를 핸들링하는 작업을 catch block에서 수행해 줌.
 * 이렇게 함으로써 에러가 발생해도 스크립트가 중단되는 것을 방지할 수 있음.
 *
 * 여기서는 'webgl'과 'experimental-webgl' 모두 지원하지 않을 경우,
 * 에러를 catch block으로 잡아준 뒤, 그 다음 코드를 이어서 실행할 수 있도록 해줌.
 *
 * 이후 for loop 바깥 쪽 if-else block에서
 * context에 WebGLRenderingContext를 리턴받았냐 못받았냐에 따라
 * WebGLRenderingContext 크기 조정 또는 경고 메시지를 띄우는 작업을 수행함.
 */

/**
 * gl.viewport() 관련 정리
 *
 *
 * 1. gl.viewport()
 *
 * 뷰포트는 그리기 버퍼 안에 그려지는 렌더링 결과의 위치를 결정해주는데,
 * WebGLRenderingContext를 처음 생성할 때 원점이 (0, 0)에 캔버스와 너비와 높이가 동일한 뷰포트 영역이 초기값으로 지정된 상태임.
 *
 * 이 때, 뷰포트는 정규화된 clip space 좌표계(좌표축의 양끝이 -1 <-> +1인 좌표계)를
 * x축은 0 <-> gl.canvas.width로, y축은 0 <-> gl.canvas.height으로 매핑시켜 줌.
 *
 * 즉, 버텍스 셰이더의 gl_Position으로 설정한 clip space 좌표값을 어떻게 screen space 좌표값으로
 * 변환하는지 WebGL에 알려주는 역할이라고 보면 됨.
 *
 *
 * 2. gl.viewportHeight(), gl.viewportWidth() -> 쓰지 말 것!!!
 *
 * 얘내들은 WebGLRenderingContext의 메서드가 아님. WebGL 명세서의 일부가 아니라,
 * 개발자가 gl.viewport(x, y, width, height)로 뷰포트 크기를 설정할 때,
 * 캔버스의 픽셀 수 만큼으로 설정하기 위해 gl 내부에 임의로 만든 속성값임.
 *
 * 이거는 다른 개발자가 WebGL 스펙의 일부로 착각할 수도 있을 뿐만 아니라,
 * 사용자가 윈도우를 리사이징 할때마다 매번 2개의 속성값을 재설정해줘야 하는 번거로움이 있음.
 * 그냥 일을 사서 만드는 짓이라고 보면 됨.
 * 전형적으로 사용해지 말아야 할 Anti Pattern 이라고 함. 근데 책이 오래되어서 그냥 써있는 듯...
 *
 * 대신 아래와 같이
 * gl.viewport(0, 0, gl.canvas.width, gl.canvas.heigt);
 * gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
 * 캔버스나 컨텍스트의 너비와 높이값을 사용할 것을 권장하고 있음.
 */

/**
 * precision mediump float 이 뭘까?
 *
 * 프래그먼트 셰이더에서 주로 사용되는 정밀도 지정자.
 * 즉, GPU가 프래그먼트 셰이더에서 float(부동소수점으로 표현되는 실수값) 변수값을 계산할 때,
 * 어느 정도의 정밀도를 사용할 지 결정해주는 거임.
 *
 * highp는 높은 정밀도, mediump는 중간 정밀도, lowp는 저 정밀도를 의미함.
 * 굳이 mediump를 쓰는 이유는, highp는 실수값을 더 정밀하게 표현할 수 있지만
 * 일부 시스템이 이를 지원하지 않기 때문에 해당 시스템에서는 코드가 전혀 작동하지 않는다고 함.
 *
 * 스택오버플로우 답변에 따르면 시스템 별로 다음과 같이 사용하는 게 좋다고 함.
 * -vertex position -> highp
 * -텍스쳐 좌표 -> mediump
 * -색상값 -> lowp
 *
 * 근데 일단 책에서는 프래그먼트 셰이더는 mediump 정밀도로 지정해주는 게 좋다고 함.
 */

/**
 * WebGLRenderingContext.getShaderParameter(shader, pname)
 *
 * 첫번째 인자로 전달해 준 셰이더 객체에 대한 정보를 리턴해 줌.
 * pname은 GLenum 이라고 불리는 다섯 자리 unsigned long 타입의 정수를 의미함.
 * gl.DELETE_STATUS, gl.COMPILE_STATUS, gl.SHADER_TYPE 이 들어갈 수 있으며,
 * 각기 다른 GLenum값으로 구분됨.
 *
 * 저 GLenum으로 요청한 정보의 결과값을 리턴해준다고 보면 됨.
 * 여기서는 gl.COMPILE_STATUS을 요청했으니
 * 컴파일이 성공했다면 true, 그렇지 않다면 false를 리턴해줄거임. -> GLboolean 이라고 불림
 */

/**
 * gl.drawArrays(gl.TRIANGLES, 0, vertexBuffer.numberOfItems)
 *
 * 그래픽 파이프라인 상에서 'primitive assembly'를 해주는 메서드 같음.
 * 첫 번째 인자는 TRIANGLE/LINE/POINTS 등 어떤 형태의 primitive로 조립할건지 타입을 정해줌
 * 두 번째 인자는 버텍스 데이터가 담긴 버퍼 배열에서 몇 번째 값부터 시작할건지 정해줌
 * 세 번째 인자는 버텍스 데이터가 담긴 버퍼 배열 상에서 버텍스가 몇 개인지, 즉 몇 묶음으로 데이터들을 사용할건지 정해줌.
 *
 * 세 번째 인자에 넣는 값은 setupBuffers() 함수에서 numberOfItems라는 임의의 프로퍼티로 3으로 저장했었지!
 */
