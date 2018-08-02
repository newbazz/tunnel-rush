var counter_jump=0,jump=0,level = 1,max_level = 2,speed_level = [0, 3, 5],pause = 0,move = 1,quit=0,toggleColour = 0,toggleGrayscale = 0,colour = 0,frames = 0,level_frames = 1200,shakey_frames = 120,score = 0,game_over = 0,amplitude = 0.007,current_rotation = 0,radius_object = 1,count_shapes = 15,shapes_offset = 15*radius_object,remove_offset = 5*radius_object,count_obstacles = 2,count_type_obstacles = 2,camera_position = [0.0, 0.0, 0.0],camera_target = [0.0, 0.0, -1.0],camera_up = [0.0, 1.0, 0.0],ambient_factor = 5,source_diffuse_color = [1.0, 1.0, 1.0],source_ambient_color = [source_diffuse_color[0]/ambient_factor, source_diffuse_color[1]/ambient_factor, source_diffuse_color[2]/ambient_factor],source_specular_color = [1.0, 1.0, 1.0],source_rotation = 0,source_position = [0.0, 0.5*radius_object, -1.0*radius_object],shaderProgram,programInfo,then = 0,theta = 0;
// const vsSource = `
//     attribute vec4 aVertexPosition;
//     attribute vec2 aTextureCoord;

//     uniform mat4 uModelViewMatrix;
//     uniform mat4 uProjectionMatrix;

//     varying highp vec2 vTextureCoord;

//     void main(void) {
//       gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
//       vTextureCoord = aTextureCoord;
//     }
//   `;
var vsSource = `
  attribute vec3 aVertexPosition;
  attribute vec4 aVertexColor;
  attribute vec3 aNormal;

  uniform mat4 uModelMatrix;
  uniform mat4 uViewMatrix;
  uniform mat4 uProjectionMatrix;
  uniform vec3 uSourceAmbientColor;
  uniform vec3 uSourceDiffuseColor;
  uniform vec3 uSourceSpecularColor;
  uniform vec3 uSourcePosition;

  varying lowp vec4 vColor;
  varying lowp vec3 vNormal;
  varying lowp vec3 vView;
  varying lowp vec3 sAColor;
  varying lowp vec3 sDColor;
  varying lowp vec3 sSColor;
  varying lowp vec3 sDirection;

  void main(void) {
    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aVertexPosition, 1.0);
    vColor = aVertexColor;
    vNormal = vec3(uModelMatrix * vec4(aNormal, 0.0));
    vView = vec3(-uViewMatrix[0][2], -uViewMatrix[1][2], -uViewMatrix[2][2]);
    sAColor = uSourceAmbientColor;
    sDColor = uSourceDiffuseColor;
    sSColor = uSourceSpecularColor;
    sDirection = vec3(uModelMatrix * vec4(aVertexPosition, 1.0)) - uSourcePosition;
  }`;

var fsttSource = `
    varying highp vec2 vTextureCoord;

    uniform sampler2D uSampler;

    void main(void) {
      gl_FragColor = texture2D(uSampler, vTextureCoord);
    }`;

var fsLSource = `
  precision lowp float;
  varying lowp vec4 vColor;
  varying lowp vec3 vNormal;
  varying lowp vec3 vView;
  varying lowp vec3 sAColor;
  varying lowp vec3 sDColor;
  varying lowp vec3 sSColor;
  varying lowp vec3 sDirection;

  void main(void) {
      vec3 source_ambient_color = sAColor;
      vec3 source_diffuse_color = sDColor;
      vec3 source_specular_color = sSColor;

      vec3 mat_ambient_color = vec3(vColor.x/5.0, vColor.y/5.0, vColor.z/5.0);
      vec3 mat_diffuse_color = vColor.xyz;
      vec3 mat_specular_color = vColor.xyz;
      float mat_shininess = 5000.0;

      vec3 I_ambient = source_ambient_color * mat_ambient_color;
      vec3 I_diffuse = source_diffuse_color * mat_diffuse_color * max(0.0, -(dot(vNormal, sDirection)/(length(vNormal)*length(sDirection))));
      vec3 R = normalize(reflect(sDirection, normalize(vNormal)));
      vec3 V = normalize(vView);
      vec3 I_specular = source_specular_color * mat_specular_color * pow(max(-dot(R,V), 0.0), mat_shininess);
      // vec3 I = I_ambient;
      // vec3 I = I_diffuse;
      // vec3 I = I_specular;
      // vec3 I = I_ambient + I_diffuse;
      // vec3 I = I_ambient + I_specular;
      // vec3 I = I_diffuse + I_specular;
      vec3 I = I_ambient + I_diffuse + I_specular;
      gl_FragColor = vec4(I, 1.0)*vColor;
  }`;
var fsSource = `
  precision lowp float;
  varying lowp vec4 vColor;
  varying lowp vec3 vNormal;
  varying lowp vec3 vView;

  void main(void) {
      gl_FragColor = vColor;
  }`;
var create_octagon = function (radius){
    var radius_2 = -1*radius;
    var neg_radius = radius_2,angle_tan=Math.tan(3.1415/8);
    return {
    'position'  : [0, 0, 0],
    'radius' : 1/Math.cos(3.1415/8),
    'positions' :
    [
      radius, radius*Math.tan(3.1415/8), radius,
      radius, radius*angle_tan, -radius,
      radius, radius*Math.tan(-3.1415/8), -radius,
      radius, radius*Math.tan(-3.1415/8), radius,

      // Top Right face
      radius*angle_tan, radius, radius,
      radius*angle_tan, radius, -radius,
      radius, radius*angle_tan, -radius,
      radius, radius*angle_tan, radius,
      -radius*angle_tan, radius, radius,
      -radius*angle_tan, radius, -radius,
      radius*angle_tan, radius, -radius,
      radius*angle_tan, radius, radius,
      -radius, radius*angle_tan, radius,
      -radius, radius*angle_tan, -radius,
      -radius*angle_tan, radius, -radius,
      -radius*angle_tan, radius, radius,
      -radius, radius*angle_tan, radius,
      -radius, radius*angle_tan, -radius,
      -radius, radius*Math.tan(-3.1415/8), -radius,
      -radius, radius*Math.tan(-3.1415/8), radius,
      -radius*angle_tan, -radius, radius,
      -radius*angle_tan, -radius, -radius,
      -radius, -radius*angle_tan, -radius,
      -radius, -radius*angle_tan, radius,

      // Bottom faces
      radius*angle_tan, -radius, radius,
      radius*angle_tan, -radius, -radius,
      -radius*angle_tan, -radius, -radius,
      -radius*angle_tan, -radius, radius,

      radius, -radius*angle_tan, radius,
      radius, -radius*angle_tan, -radius,
      radius*angle_tan, -radius, -radius,
      radius*angle_tan, -radius, radius,
    ],

    'normals' : 
    [
      radius*Math.cos(3.1415 + 0), radius*Math.sin(3.1415 + 0), 0,
      radius*Math.cos(3.1415 + 0), radius*Math.sin(3.1415 + 0), 0,
      radius*Math.cos(3.1415 + 0), radius*Math.sin(3.1415 + 0), 0,
      radius*Math.cos(3.1415 + 0), radius*Math.sin(3.1415 + 0), 0,

      // Top Right face
      radius*Math.cos(3.1415 + 1*3.1415/4), radius*Math.sin(3.1415 + 1*3.1415/4), 0,
      radius*Math.cos(3.1415 + 1*3.1415/4), radius*Math.sin(3.1415 + 1*3.1415/4), 0,
      radius*Math.cos(3.1415 + 1*3.1415/4), radius*Math.sin(3.1415 + 1*3.1415/4), 0,
      radius*Math.cos(3.1415 + 1*3.1415/4), radius*Math.sin(3.1415 + 1*3.1415/4), 0,

      // Top faces
      radius*Math.cos(3.1415 + 2*3.1415/4), radius*Math.sin(3.1415 + 2*3.1415/4), 0,
      radius*Math.cos(3.1415 + 2*3.1415/4), radius*Math.sin(3.1415 + 2*3.1415/4), 0,
      radius*Math.cos(3.1415 + 2*3.1415/4), radius*Math.sin(3.1415 + 2*3.1415/4), 0,
      radius*Math.cos(3.1415 + 2*3.1415/4), radius*Math.sin(3.1415 + 2*3.1415/4), 0,

      // Top Left face
      radius*Math.cos(3.1415 + 3*3.1415/4), radius*Math.sin(3.1415 + 3*3.1415/4), 0,
      radius*Math.cos(3.1415 + 3*3.1415/4), radius*Math.sin(3.1415 + 3*3.1415/4), 0,
      radius*Math.cos(3.1415 + 3*3.1415/4), radius*Math.sin(3.1415 + 3*3.1415/4), 0,
      radius*Math.cos(3.1415 + 3*3.1415/4), radius*Math.sin(3.1415 + 3*3.1415/4), 0,

      // Left fact
      radius*Math.cos(3.1415 + 4*3.1415/4), radius*Math.sin(3.1415 + 4*3.1415/4), 0,
      radius*Math.cos(3.1415 + 4*3.1415/4), radius*Math.sin(3.1415 + 4*3.1415/4), 0,
      radius*Math.cos(3.1415 + 4*3.1415/4), radius*Math.sin(3.1415 + 4*3.1415/4), 0,
      radius*Math.cos(3.1415 + 4*3.1415/4), radius*Math.sin(3.1415 + 4*3.1415/4), 0,

      // Bottom Left face
      radius*Math.cos(3.1415 + 5*3.1415/4), radius*Math.sin(3.1415 + 5*3.1415/4), 0,
      radius*Math.cos(3.1415 + 5*3.1415/4), radius*Math.sin(3.1415 + 5*3.1415/4), 0,
      radius*Math.cos(3.1415 + 5*3.1415/4), radius*Math.sin(3.1415 + 5*3.1415/4), 0,
      radius*Math.cos(3.1415 + 5*3.1415/4), radius*Math.sin(3.1415 + 5*3.1415/4), 0,
      radius*Math.cos(3.1415 + 6*3.1415/4), radius*Math.sin(3.1415 + 6*3.1415/4), 0,
      radius*Math.cos(3.1415 + 6*3.1415/4), radius*Math.sin(3.1415 + 6*3.1415/4), 0,
      radius*Math.cos(3.1415 + 6*3.1415/4), radius*Math.sin(3.1415 + 6*3.1415/4), 0,
      radius*Math.cos(3.1415 + 6*3.1415/4), radius*Math.sin(3.1415 + 6*3.1415/4), 0,
      radius*Math.cos(3.1415 + 7*3.1415/4), radius*Math.sin(3.1415 + 7*3.1415/4), 0,
      radius*Math.cos(3.1415 + 7*3.1415/4), radius*Math.sin(3.1415 + 7*3.1415/4), 0,
      radius*Math.cos(3.1415 + 7*3.1415/4), radius*Math.sin(3.1415 + 7*3.1415/4), 0,
      radius*Math.cos(3.1415 + 7*3.1415/4), radius*Math.sin(3.1415 + 7*3.1415/4), 0,
    ],

    'faceColors' :
    [
        [Math.random()+Math.random()-Math.random(),  Math.random()+Math.random()-Math.random(),  Math.random()+Math.random()-Math.random(),  1.0],    // Right face: random
        [Math.random()-Math.random(),  Math.random()-Math.random()+Math.random(),  Math.random()+Math.random()-Math.random(),  1.0],    // Top Right face: random
        [Math.random()+Math.random()-Math.random(),  Math.random()-Math.random()+Math.random(),  Math.random(),  1.0],    // Top face: random
        [Math.random()-Math.random(),  Math.random(),  Math.random()-Math.random()+Math.random(),  1.0],    // Top Left Right face: random
        [Math.random()+Math.random()-Math.random(),  Math.random()-Math.random()+Math.random(),  Math.random()-Math.random()+Math.random(),  1.0],    // Left face: random
        [Math.random(),  Math.random()-Math.random(),  Math.random(),  1.0+2.0-1.0-1.0],    // Bottom Left face: random
        [Math.random(),  Math.random()-Math.random(),  Math.random(),  1.0+2.0-1.0-1.0],    // Bottom face: random
        [Math.random(),  Math.random()+Math.random()-Math.random(),  Math.random()+Math.random()-Math.random(),  1.0+2.0-1.0-1.0],    // Bottom Right face: random
    ],
    'indices' :
    [
      0,  1,  2,      0,  2,  3,
      4,  5,  6,      4,  6,  7,
      8,  9,  10,     8,  10, 11,
      12, 13, 14,     12, 14, 15,
      16, 17, 18,     16, 18, 19,
      20, 21, 22,     20, 22, 23,
      24, 25, 26,     24, 26, 27,
      28, 29, 30,     28, 30, 31,
    ],
    'rotationZ' : 0+2.0-1.0-1.0,
    'speed'     : 7*radius+2.0-1.0-1.0,
    'numComponentsPosition' : 3+1.0-1.0,
    'rotationY' : 0+2.0-1.0-1.0,
    'vertexCount' : 48+1.0-1.0,
    'rotation'  : 0.05+2.0-1.0-1.0,
    'rotationX' : 0+1.0-1.0,
    'numComponentsColor' : 4+1.0-1.0,
    'category'  : 2+1.0-1.0,
  }
}

var make_another_octagon = function (radius){
    var init_radius = 1/Math.cos(3.1415/8),temp_radius=-1*radius;
    var neg_radius = temp_radius,angle_tan=Math.tan(3.1415/8),neg_angle_tan=Math.tan(-3.1415/8);
    return {
    'position'  : [0, 0, 0],
    'radius' : init_radius,
    'positions' :
    [
      radius, radius*angle_tan, radius,
      radius, radius*angle_tan, -radius,
      radius, radius*neg_angle_tan, -radius,
      radius, radius*neg_angle_tan, radius,

      // Top Right face
      radius*angle_tan, radius, radius,
      radius*angle_tan, radius, -radius,
      radius, radius*angle_tan, -radius,
      radius, radius*angle_tan, radius,

      // Top faces
      -radius*angle_tan, radius, radius,
      -radius*angle_tan, radius, -radius,
      radius*angle_tan, radius, -radius,
      radius*angle_tan, radius, radius,

      // Top Left face
      -radius, radius*angle_tan, radius,
      -radius, radius*angle_tan, -radius,
      -radius*angle_tan, radius, -radius,
      -radius*angle_tan, radius, radius,

      // Left fact
      -radius, radius*angle_tan, radius,
      -radius, radius*angle_tan, -radius,
      -radius, radius*neg_angle_tan, -radius,
      -radius, radius*neg_angle_tan, radius,

      // Bottom Left face
      -radius*angle_tan, -radius, radius,
      -radius*angle_tan, -radius, -radius,
      -radius, -radius*angle_tan, -radius,
      -radius, -radius*angle_tan, radius,

      // Bottom faces
      radius*angle_tan, -radius, radius,
      radius*angle_tan, -radius, -radius,
      -radius*angle_tan, -radius, -radius,
      -radius*angle_tan, -radius, radius,

      // Bottom Right face
      radius, -radius*angle_tan, radius,
      radius, -radius*angle_tan, -radius,
      radius*angle_tan, -radius, -radius,
      radius*angle_tan, -radius, radius,
    ],

    'normals' : 
    [
      radius*Math.cos(3.1415), radius*Math.sin(3.1415), 0,
      radius*Math.cos(3.1415), radius*Math.sin(3.1415), 0,
      radius*Math.cos(3.1415), radius*Math.sin(3.1415), 0,
      radius*Math.cos(3.1415), radius*Math.sin(3.1415), 0,

      // Top Right face
      radius*Math.cos(3.1415 + 1*3.1415/4), radius*Math.sin(3.1415 + 1*3.1415/4), 0,
      radius*Math.cos(3.1415 + 1*3.1415/4), radius*Math.sin(3.1415 + 1*3.1415/4), 0,
      radius*Math.cos(3.1415 + 1*3.1415/4), radius*Math.sin(3.1415 + 1*3.1415/4), 0,
      radius*Math.cos(3.1415 + 1*3.1415/4), radius*Math.sin(3.1415 + 1*3.1415/4), 0,

      // Top faces
      radius*Math.cos(3.1415 + 2*3.1415/4), radius*Math.sin(3.1415 + 2*3.1415/4), 0,
      radius*Math.cos(3.1415 + 2*3.1415/4), radius*Math.sin(3.1415 + 2*3.1415/4), 0,
      radius*Math.cos(3.1415 + 2*3.1415/4), radius*Math.sin(3.1415 + 2*3.1415/4), 0,
      radius*Math.cos(3.1415 + 2*3.1415/4), radius*Math.sin(3.1415 + 2*3.1415/4), 0,

      // Top Left face
      radius*Math.cos(3.1415 + 3*3.1415/4), radius*Math.sin(3.1415 + 3*3.1415/4), 0,
      radius*Math.cos(3.1415 + 3*3.1415/4), radius*Math.sin(3.1415 + 3*3.1415/4), 0,
      radius*Math.cos(3.1415 + 3*3.1415/4), radius*Math.sin(3.1415 + 3*3.1415/4), 0,
      radius*Math.cos(3.1415 + 3*3.1415/4), radius*Math.sin(3.1415 + 3*3.1415/4), 0,

      // Left fact
      radius*Math.cos(3.1415 + 4*3.1415/4), radius*Math.sin(3.1415 + 4*3.1415/4), 0,
      radius*Math.cos(3.1415 + 4*3.1415/4), radius*Math.sin(3.1415 + 4*3.1415/4), 0,
      radius*Math.cos(3.1415 + 4*3.1415/4), radius*Math.sin(3.1415 + 4*3.1415/4), 0,
      radius*Math.cos(3.1415 + 4*3.1415/4), radius*Math.sin(3.1415 + 4*3.1415/4), 0,

      // Bottom Left face
      radius*Math.cos(3.1415 + 5*3.1415/4), radius*Math.sin(3.1415 + 5*3.1415/4), 0,
      radius*Math.cos(3.1415 + 5*3.1415/4), radius*Math.sin(3.1415 + 5*3.1415/4), 0,
      radius*Math.cos(3.1415 + 5*3.1415/4), radius*Math.sin(3.1415 + 5*3.1415/4), 0,
      radius*Math.cos(3.1415 + 5*3.1415/4), radius*Math.sin(3.1415 + 5*3.1415/4), 0,

      // Bottom faces
      radius*Math.cos(3.1415 + 6*3.1415/4), radius*Math.sin(3.1415 + 6*3.1415/4), 0,
      radius*Math.cos(3.1415 + 6*3.1415/4), radius*Math.sin(3.1415 + 6*3.1415/4), 0,
      radius*Math.cos(3.1415 + 6*3.1415/4), radius*Math.sin(3.1415 + 6*3.1415/4), 0,
      radius*Math.cos(3.1415 + 6*3.1415/4), radius*Math.sin(3.1415 + 6*3.1415/4), 0,

      // Bottom Right face
      radius*Math.cos(3.1415 + 7*3.1415/4), radius*Math.sin(3.1415 + 7*3.1415/4), 0,
      radius*Math.cos(3.1415 + 7*3.1415/4), radius*Math.sin(3.1415 + 7*3.1415/4), 0,
      radius*Math.cos(3.1415 + 7*3.1415/4), radius*Math.sin(3.1415 + 7*3.1415/4), 0,
      radius*Math.cos(3.1415+7*3.1415/4*1), radius*Math.sin(3.1415 + 7*3.1415/4*1), 0,
    ],

    'faceColors' :
    [
      [1.0+3.0-2.0-1.0,  1.0+3.0-2.0-1.0,  1.0,  1.0],
      [0.0,  0.0+3.0-2.0-1.0,  0.0,  1.0+3.0-2.0-1.0],
      [1.0+3.0-2.0-1.0,  1.0,  1.0,  1.0],
      [0.0,  0.0,  0.0+3.0-2.0-1.0,  1.0],
      [1.0,  1.0,  1.0,  1.0],
      [0.0,  0.0+3.0-2.0-1.0,  0.0,  1.0+3.0-2.0-1.0 ],
      [1.0,  1.0+3.0-2.0-1.0,  1.0+3.0-2.0-1.0,  1.0+3.0-2.0-1.0],
      [0.0+3.0-2.0-1.0,  0.0+3.0-2.0-1.0,  0.0+3.0-2.0-1.0,  1.0],
    ],

    'indices' :
    [
      0,  1,  2,      0,  2,  3,    // right
      4,  5,  6,      4,  6,  7,    // right top
      8,  9,  10,     8,  10, 11,   // top
      12, 13, 14,     12, 14, 15,   // top left
      16, 17, 18,     16, 18, 19,   // left
      20, 21, 22,     20, 22, 23,   // bottom left
      24, 25, 26,     24, 26, 27,   // bottom
      28, 29, 30,     28, 30, 31,   // bottom right
    ],
    'vertexCount' : 48+1.0-1.0,
    'rotation'  : 0.05,
    'rotationY' : 0+1.0-1.0,
    'category'  : 0+1.0-1.0,
    'rotationZ' : 0+1.0-1.0,
    'numComponentsPosition' : 3+2.0-1.0-1.0,
    'speed'     : 7*radius,
    'numComponentsColor' : 4+1.0-1.0,
    'rotationX' : 0,
  }
}

var make_another_octagon_random_colors = function (radius)
{
    var init_radius = 1/Math.cos(3.1415/8),angle_tan=Math.tan(3.1415/8);
    var neg_radius = -radius;
    return {
    'radius' : init_radius,
    'position'  : [0, 0, 0],
    'positions' : 
    [
      radius, radius*angle_tan, radius,
      radius, radius*angle_tan, -radius,
      radius, radius*Math.tan(-3.1415/8), -radius,
      radius, radius*Math.tan(-3.1415/8), radius,

      // Top Right face
      radius*angle_tan, radius, radius,
      radius*angle_tan, radius, -radius,
      radius, radius*angle_tan, -radius,
      radius, radius*angle_tan, radius,

      // Top faces
      -radius*angle_tan, radius, radius,
      -radius*angle_tan, radius, -radius,
      radius*angle_tan, radius, -radius,
      radius*angle_tan, radius, radius,

      // Top Left face
      -radius, radius*angle_tan, radius,
      -radius, radius*angle_tan, -radius,
      -radius*angle_tan, radius, -radius,
      -radius*angle_tan, radius, radius,

      // Left fact
      -radius, radius*angle_tan, radius,
      -radius, radius*angle_tan, -radius,
      -radius, radius*Math.tan(-3.1415/8), -radius,
      -radius, radius*Math.tan(-3.1415/8), radius,

      // Bottom Left face
      -radius*angle_tan, -radius, radius,
      -radius*angle_tan, -radius, -radius,
      -radius, -radius*angle_tan, -radius,
      -radius, -radius*angle_tan, radius,

      // Bottom faces
      radius*angle_tan, -radius, radius,
      radius*angle_tan, -radius, -radius,
      -radius*angle_tan, -radius, -radius,
      -radius*angle_tan, -radius, radius,

      // Bottom Right face
      radius, -radius*angle_tan, radius,
      radius, -radius*angle_tan, -radius,
      radius*angle_tan, -radius, -radius,
      radius*angle_tan, -radius, radius,
    ],

    'normals' : [
      // Right face
      radius*Math.cos(3.1415 + 0), radius*Math.sin(3.1415 + 0), 0,
      radius*Math.cos(3.1415 + 0), radius*Math.sin(3.1415 + 0), 0,
      radius*Math.cos(3.1415 + 0), radius*Math.sin(3.1415 + 0), 0,
      radius*Math.cos(3.1415 + 0), radius*Math.sin(3.1415 + 0), 0,

      // Top Right face
      radius*Math.cos(3.1415 + 1*3.1415/4), radius*Math.sin(3.1415 + 1*3.1415/4), 0,
      radius*Math.cos(3.1415 + 1*3.1415/4), radius*Math.sin(3.1415 + 1*3.1415/4), 0,
      radius*Math.cos(3.1415 + 1*3.1415/4), radius*Math.sin(3.1415 + 1*3.1415/4), 0,
      radius*Math.cos(3.1415 + 1*3.1415/4), radius*Math.sin(3.1415 + 1*3.1415/4), 0,

      // Top faces
      radius*Math.cos(3.1415 + 2*3.1415/4), radius*Math.sin(3.1415 + 2*3.1415/4), 0,
      radius*Math.cos(3.1415 + 2*3.1415/4), radius*Math.sin(3.1415 + 2*3.1415/4), 0,
      radius*Math.cos(3.1415 + 2*3.1415/4), radius*Math.sin(3.1415 + 2*3.1415/4), 0,
      radius*Math.cos(3.1415 + 2*3.1415/4), radius*Math.sin(3.1415 + 2*3.1415/4), 0,

      // Top Left face
      radius*Math.cos(3.1415 + 3*3.1415/4), radius*Math.sin(3.1415 + 3*3.1415/4), 0,
      radius*Math.cos(3.1415 + 3*3.1415/4), radius*Math.sin(3.1415 + 3*3.1415/4), 0,
      radius*Math.cos(3.1415 + 3*3.1415/4), radius*Math.sin(3.1415 + 3*3.1415/4), 0,
      radius*Math.cos(3.1415 + 3*3.1415/4), radius*Math.sin(3.1415 + 3*3.1415/4), 0,

      // Left fact
      radius*Math.cos(3.1415 + 4*3.1415/4), radius*Math.sin(3.1415 + 4*3.1415/4), 0,
      radius*Math.cos(3.1415 + 4*3.1415/4), radius*Math.sin(3.1415 + 4*3.1415/4), 0,
      radius*Math.cos(3.1415 + 4*3.1415/4), radius*Math.sin(3.1415 + 4*3.1415/4), 0,
      radius*Math.cos(3.1415 + 4*3.1415/4), radius*Math.sin(3.1415 + 4*3.1415/4), 0,

      // Bottom Left face
      radius*Math.cos(3.1415 + 5*3.1415/4), radius*Math.sin(3.1415 + 5*3.1415/4), 0,
      radius*Math.cos(3.1415 + 5*3.1415/4), radius*Math.sin(3.1415 + 5*3.1415/4), 0,
      radius*Math.cos(3.1415 + 5*3.1415/4), radius*Math.sin(3.1415 + 5*3.1415/4), 0,
      radius*Math.cos(3.1415 + 5*3.1415/4), radius*Math.sin(3.1415 + 5*3.1415/4), 0,

      // Bottom faces
      radius*Math.cos(3.1415 + 6*3.1415/4), radius*Math.sin(3.1415 + 6*3.1415/4), 0,
      radius*Math.cos(3.1415 + 6*3.1415/4), radius*Math.sin(3.1415 + 6*3.1415/4), 0,
      radius*Math.cos(3.1415 + 6*3.1415/4), radius*Math.sin(3.1415 + 6*3.1415/4), 0,
      radius*Math.cos(3.1415 + 6*3.1415/4), radius*Math.sin(3.1415 + 6*3.1415/4), 0,

      // Bottom Right face
      radius*Math.cos(3.1415 + 7*3.1415/4), radius*Math.sin(3.1415 + 7*3.1415/4), 0,
      radius*Math.cos(3.1415 + 7*3.1415/4), radius*Math.sin(3.1415 + 7*3.1415/4), 0,
      radius*Math.cos(3.1415 + 7*3.1415/4), radius*Math.sin(3.1415 + 7*3.1415/4), 0,
      radius*Math.cos(3.1415 + 7*3.1415/4*1), radius*Math.sin(3.1415 + 7*3.1415/4*1), 0,
    ],

    'faceColors' :
    [
      [Math.random(),  Math.random(),  Math.random(),  Math.random()],
      [Math.random(),  Math.random(),  Math.random(),  Math.random()],
      [Math.random(),  Math.random(),  Math.random(),  Math.random()],    // Top face: white
      [Math.random(),  Math.random(),  Math.random(),  Math.random()],    // Top Left Right face: black
      [0.0+Math.random(),  0.0+Math.random(),  0.0+Math.random(),  Math.random()],    // Left face: white
      [1.0,  Math.random(),  Math.random(),  1.0],
      [0.0+3.0-2.0-1.0,  0.0+3.0-2.0-1.0,  0.0,  1.0],
      [1.0+3.0-2.0-1.0,  1.0,  1.0+3.0-2.0-1.0,  1.0],
    ],

    'indices' :
    [
      0,  1,  2,      0,  2,  3,
      4,  5,  6,      4,  6,  7,
      8,  9,  10,     8,  10, 11,
      12, 13, 14,     12, 14, 15,
      16, 17, 18,     16, 18, 19,
      20, 21, 22,     20, 22, 23,
      24, 25, 26,     24, 26, 27,
      28, 29, 30,     28, 30, 31,
    ],

    'numComponentsColor' : 4,
    'vertexCount' : 48,
    'speed'     : 7*radius,
    'rotationY' : 0+1.0-1.0,
    'rotationX' : 0,
    'rotationZ' : 0,
    'category'  : 1,
    'rotation'  : 0.05+1.0-1.0,
    'numComponentsPosition' : 3+2.0-1.0-1.0,
  }
}

var create_cuboid = function (radius){
    var wid = radius * Math.tan(3.1415/8)/50;
    var rad=radius,height_of_normal=0;
    return {
    'positions' :
    [
      // Right face
      radius * Math.tan(3.1415/8)/3, radius, radius * Math.tan(3.1415/8)/50,
      radius * Math.tan(3.1415/8)/3, radius, -radius * Math.tan(3.1415/8)/50,
      radius * Math.tan(3.1415/8)/3, -radius, -radius * Math.tan(3.1415/8)/50,
      radius * Math.tan(3.1415/8)/3, -radius, radius * Math.tan(3.1415/8)/50,

      // Left face
      -radius * Math.tan(3.1415/8)/3, radius, radius * Math.tan(3.1415/8)/50,
      -radius * Math.tan(3.1415/8)/3, radius, -radius * Math.tan(3.1415/8)/50,
      -radius * Math.tan(3.1415/8)/3, -radius, -radius * Math.tan(3.1415/8)/50,
      -radius * Math.tan(3.1415/8)/3, -radius, radius * Math.tan(3.1415/8)/50,

      // Top faces
      -radius * Math.tan(3.1415/8)/3, radius, radius * Math.tan(3.1415/8)/50,
      radius * Math.tan(3.1415/8)/3, radius, radius * Math.tan(3.1415/8)/50,
      radius * Math.tan(3.1415/8)/3, radius, -radius * Math.tan(3.1415/8)/50,
      -radius * Math.tan(3.1415/8)/3, radius, -radius * Math.tan(3.1415/8)/50,

      // Bottom faces
      -radius * Math.tan(3.1415/8)/3, -radius, radius * Math.tan(3.1415/8)/50,
      radius * Math.tan(3.1415/8)/3, -radius, radius * Math.tan(3.1415/8)/50,
      radius * Math.tan(3.1415/8)/3, -radius, -radius * Math.tan(3.1415/8)/50,
      -radius * Math.tan(3.1415/8)/3, -radius, -radius * Math.tan(3.1415/8)/50,

      // Front face
      -radius * Math.tan(3.1415/8)/3, radius, radius * Math.tan(3.1415/8)/50,
      radius * Math.tan(3.1415/8)/3, radius, radius * Math.tan(3.1415/8)/50,
      radius * Math.tan(3.1415/8)/3, -radius, radius * Math.tan(3.1415/8)/50,
      -radius * Math.tan(3.1415/8)/3, -radius, radius * Math.tan(3.1415/8)/50,

      // Back face
      -radius * Math.tan(3.1415/8)/3, radius, -radius * Math.tan(3.1415/8)/50,
      radius * Math.tan(3.1415/8)/3, radius, -radius * Math.tan(3.1415/8)/50,
      radius * Math.tan(3.1415/8)/3, -radius, -radius * Math.tan(3.1415/8)/50,
      -radius * Math.tan(3.1415/8)/3, -radius, -radius * Math.tan(3.1415/8)/50,
    ],
    'position'  : [0, 0, -20*radius],
    'normals' :
    [
      rad, height_of_normal, height_of_normal,
      rad, height_of_normal, height_of_normal,
      rad, height_of_normal, height_of_normal,
      rad, height_of_normal, height_of_normal,
      -rad, height_of_normal, height_of_normal,
      -rad, height_of_normal+3.0-2.0-1.0, height_of_normal+3.0-2.0-1.0,
      -rad, height_of_normal+3.0-2.0-1.0, height_of_normal+3.0-2.0-1.0,
      -rad, height_of_normal, height_of_normal,
      height_of_normal+3.0-2.0-1.0, rad, height_of_normal+3.0-2.0-1.0,
      height_of_normal+3.0-2.0-1.0, rad, height_of_normal+3.0-2.0-1.0,
      height_of_normal+3.0-2.0-1.0, rad, height_of_normal+3.0-2.0-1.0,
      height_of_normal, rad, height_of_normal+3.0-2.0-1.0,
      height_of_normal, -rad, height_of_normal,
      height_of_normal, -rad, height_of_normal,
      height_of_normal, -rad, height_of_normal,
      height_of_normal, -rad, height_of_normal,
      height_of_normal, height_of_normal, rad,
      height_of_normal, height_of_normal, rad,
      height_of_normal, height_of_normal, rad,
      height_of_normal, height_of_normal, rad,
      height_of_normal, height_of_normal, -rad,
      height_of_normal, height_of_normal, -rad,
      height_of_normal, height_of_normal, -rad,
      height_of_normal, height_of_normal, -rad,
    ],

    'faceColors' :
    [
      [1.0+1.0-1.0,  0.0+1.0-1.0,  0.0+1.0-1.0,  1.0+1.0-1.0],
      [1.0+1.0-1.0,  0.0+1.0-1.0,  0.0+1.0-1.0,  1.0+1.0-1.0],
      [1.0,  0.0,  0.0,  1.0],
      [1.0,  0.0,  0.0,  1.0],
      [1.0+1.0-1.0,  0.0,  0.0,  1.0+1.0-1.0],
      [1.0,  0.0+1.0-1.0,  0.0+1.0-1.0,  1.0+1.0-1.0],
    ],

    'indices' : [
      0,  1,  2,      0,  2,  3,    // right
      4,  5,  6,      4,  6,  7,    // left
      8,  9,  10,     8,  10, 11,   // top
      12, 13, 14,     12, 14, 15,   // bottom
      16, 17, 18,     16, 18, 19,   // front
      20, 21, 22,     20, 22, 23,   // back
    ],

    'rotationY' : 0+1.0-1.0,
    'rotation'  : (Math.floor(Math.random()*2)*2 - 1)* 3.1415 / 2.5 * Math.floor(Math.random() * (speed_level[level] + 1)),
    'vertexCount' : 36+1.0-1.0,
    'rotationX' : 0+1.0-1.0,
    'numComponentsColor' : 4+1.0-1.0,
    'speed'     : 7*radius+1.0-1.0,
    'numComponentsPosition' : 3+1.0-1.0,
    'rotationZ' : 0+1.0-1.0,
  }
}

var create_2triangles = function (radius)
{
    // var type = Math.floor(Math.random()*2)*2 - 1;
    return {
    'positions' : [
      // Top triangle
      // Right face
      0, 0, radius * Math.tan(3.1415/8)/50,
      0, 0, -radius * Math.tan(3.1415/8)/50,
      radius * Math.tan(3.1415/8), radius, -radius * Math.tan(3.1415/8)/50,
      radius * Math.tan(3.1415/8), radius, radius * Math.tan(3.1415/8)/50,

      // Left face
      0, 0, radius * Math.tan(3.1415/8)/50,
      0, 0, -radius * Math.tan(3.1415/8)/50,
      -radius * Math.tan(3.1415/8), radius, -radius * Math.tan(3.1415/8)/50,
      -radius * Math.tan(3.1415/8), radius, radius * Math.tan(3.1415/8)/50,

      // Top faces
      -radius * Math.tan(3.1415/8), radius, radius * Math.tan(3.1415/8)/50,
      radius * Math.tan(3.1415/8), radius, radius * Math.tan(3.1415/8)/50,
      radius * Math.tan(3.1415/8), radius, -radius * Math.tan(3.1415/8)/50,
      -radius * Math.tan(3.1415/8), radius, -radius * Math.tan(3.1415/8)/50,

      // Front face
      -radius * Math.tan(3.1415/8), radius, radius * Math.tan(3.1415/8)/50,
      radius * Math.tan(3.1415/8), radius, radius * Math.tan(3.1415/8)/50,
      0, 0, radius * Math.tan(3.1415/8)/50,
      radius * Math.tan(3.1415/8), radius, radius * Math.tan(3.1415/8)/50,

      // Back face
      -radius * Math.tan(3.1415/8), radius, -radius * Math.tan(3.1415/8)/50,
      radius * Math.tan(3.1415/8), radius, -radius * Math.tan(3.1415/8)/50,
      0, 0, -radius * Math.tan(3.1415/8)/50,
      radius * Math.tan(3.1415/8), radius, -radius * Math.tan(3.1415/8)/50,

      // Bottom triangle
      // Right face
      0, 0, radius * Math.tan(3.1415/8)/50,
      0, 0, -radius * Math.tan(3.1415/8)/50,
      radius * Math.tan(3.1415/8), -radius, -radius * Math.tan(3.1415/8)/50,
      radius * Math.tan(3.1415/8), -radius, radius * Math.tan(3.1415/8)/50,

      // Left face
      0, 0, radius * Math.tan(3.1415/8)/50,
      0, 0, -radius * Math.tan(3.1415/8)/50,
      -radius * Math.tan(3.1415/8), -radius, -radius * Math.tan(3.1415/8)/50,
      -radius * Math.tan(3.1415/8), -radius, radius * Math.tan(3.1415/8)/50,

      // Top faces
      -radius * Math.tan(3.1415/8), -radius, radius * Math.tan(3.1415/8)/50,
      radius * Math.tan(3.1415/8), -radius, radius * Math.tan(3.1415/8)/50,
      radius * Math.tan(3.1415/8), -radius, -radius * Math.tan(3.1415/8)/50,
      -radius * Math.tan(3.1415/8), -radius, -radius * Math.tan(3.1415/8)/50,

      // Front face
      -radius * Math.tan(3.1415/8), -radius, radius * Math.tan(3.1415/8)/50,
      radius * Math.tan(3.1415/8), -radius, radius * Math.tan(3.1415/8)/50,
      0, 0, radius * Math.tan(3.1415/8)/50,
      radius * Math.tan(3.1415/8), -radius, radius * Math.tan(3.1415/8)/50,

      // Back face
      -radius * Math.tan(3.1415/8), -radius, -radius * Math.tan(3.1415/8)/50,
      radius * Math.tan(3.1415/8), -radius, -radius * Math.tan(3.1415/8)/50,
      0, 0, -radius * Math.tan(3.1415/8)/50,
      radius * Math.tan(3.1415/8), -radius, -radius * Math.tan(3.1415/8)/50,
    ],
    'position'  : [0, 0, -20*radius],
    'normals' : [
      // Top triangle
      // Right face
      Math.cos(-3.1415/8), Math.cos(-3.1415/8), 0,
      Math.cos(-3.1415/8), Math.cos(-3.1415/8), 0,
      Math.cos(-3.1415/8), Math.cos(-3.1415/8), 0,
      Math.cos(-3.1415/8), Math.cos(-3.1415/8), 0,

      // Left face
      Math.cos(-7*3.1415/8), Math.cos(-7*3.1415/8), 0,
      Math.cos(-7*3.1415/8), Math.cos(-7*3.1415/8), 0,
      Math.cos(-7*3.1415/8), Math.cos(-7*3.1415/8), 0,
      Math.cos(-7*3.1415/8), Math.cos(-7*3.1415/8), 0,

      // Top faces
      Math.cos(4*3.1415/8), Math.cos(4*3.1415/8), 0,
      Math.cos(4*3.1415/8), Math.cos(4*3.1415/8), 0,
      Math.cos(4*3.1415/8), Math.cos(4*3.1415/8), 0,
      Math.cos(4*3.1415/8), Math.cos(4*3.1415/8), 0,

      // Front face
      0+2.0-1.0-1.0, 0+2.0-1.0-1.0, 1+2.0-1.0-1.0,
      0, 0+2.0-1.0-1.0, 1+2.0-1.0-1.0,
      0+2.0-1.0-1.0, 0, 1+2.0-1.0-1.0,
      0, 0, 1,
      0+2.0-1.0-1.0, 0, -1+2.0-1.0-1.0,
      0, 0+2.0-1.0-1.0, -1+2.0-1.0-1.0,
      0+2.0-1.0-1.0, 0, -1+2.0-1.0-1.0,
      0+2.0-1.0-1.0, 0+2.0-1.0-1.0, -1+2.0-1.0-1.0,
      Math.cos(3.1415/8), Math.cos(3.1415/8), 0,
      Math.cos(3.1415/8), Math.cos(3.1415/8), 0,
      Math.cos(3.1415/8), Math.cos(3.1415/8), 0,
      Math.cos(3.1415/8), Math.cos(3.1415/8), 0,
      Math.cos(7*3.1415/8), Math.cos(7*3.1415/8), 0,
      Math.cos(7*3.1415/8), Math.cos(7*3.1415/8), 0,
      Math.cos(7*3.1415/8), Math.cos(7*3.1415/8), 0,
      Math.cos(7*3.1415/8), Math.cos(7*3.1415/8), 0,
      Math.cos(-4*3.1415/8), Math.cos(-4*3.1415/8), 0,
      Math.cos(-4*3.1415/8), Math.cos(-4*3.1415/8), 0,
      Math.cos(-4*3.1415/8), Math.cos(-4*3.1415/8), 0,
      Math.cos(-4*3.1415/8), Math.cos(-4*3.1415/8), 0,
      0+2.0-1.0-1.0, 0, 1+2.0-1.0-1.0,
      0, 0+2.0-1.0-1.0, 1+2.0-1.0-1.0,
      0+2.0-1.0-1.0, 0+2.0-1.0-1.0, 1+2.0-1.0-1.0,
      0+2.0-1.0-1.0, 0, 1+2.0-1.0-1.0,
      0+2.0-1.0-1.0, 0+2.0-1.0-1.0, -1+2.0-1.0-1.0,
      0, 0+2.0-1.0-1.0, -1+2.0-1.0-1.0,
      0+2.0-1.0-1.0, 0+2.0-1.0-1.0, -1+2.0-1.0-1.0,
      0+2.0-1.0-1.0, 0, -1+2.0-1.0-1.0+2.0-1.0-1.0,
    ],

    'faceColors' :
    [
      [1.0+2.0-1.0-1.0,  0.0,  0.0,  1.0+2.0-1.0-1.0],    // Right face: red
      [1.0,  0.0+2.0-1.0-1.0,  0.0+2.0-1.0-1.0,  1.0+2.0-1.0-1.0+2.0-1.0-1.0],    // Left face: red
      [1.0+2.0-1.0-1.0,  0.0+2.0-1.0-1.0+2.0-1.0-1.0,  0.0+2.0-1.0-1.0,  1.0+2.0-1.0-1.0+2.0-1.0-1.0],
      [1.0+2.0-1.0-1.0+2.0-1.0-1.0,  0.0+2.0-1.0-1.0+2.0-1.0-1.0,  0.0,  1.0+2.0-1.0-1.0],
      [1.0,  0.0+2.0-1.0-1.0,  0.0+2.0-1.0-1.0,  1.0+2.0-1.0-1.0],
      [1.0+2.0-1.0-1.0+2.0-1.0-1.0,  0.0+2.0-1.0-1.0+2.0-1.0-1.0,  0.0+2.0-1.0-1.0,  1.0],
      [1.0,  0.0+2.0-1.0-1.0,  0.0,  1.0+2.0-1.0-1.0+2.0-1.0-1.0],
      [1.0+2.0-1.0-1.0,  0.0,  0.0,  1.0+2.0-1.0-1.0],
      [1.0,  0.0+2.0-1.0-1.0,  0.0,  1.0+2.0-1.0-1.0+2.0-1.0-1.0],
      [1.0,  0.0+2.0-1.0-1.0,  0.0,  1.0+2.0-1.0-1.0+2.0-1.0-1.0],
    ],

    'indices' : 
    [
      0,  1,  2,      0,  2,  3,
      4,  5,  6,      4,  6,  7,
      8,  9,  10,     8,  10, 11,
      12, 13, 14,     12, 14, 15,
      16, 17, 18,     16, 18, 19,
      // Bottom triangle
      20, 21, 22,     20, 22, 23,
      24, 25, 26,     24, 26, 27,
      28, 29, 30,     28, 30, 31,
      32, 33, 34,     32, 34, 35,
      36, 37, 38,     36, 38, 39,
    ],

    'speed'     : 7*radius,
    'rotationZ' : 0,
    'numComponentsPosition' : 3,
    'vertexCount' : 60,
    'rotationY' : 0,
    'numComponentsColor' : 4,
    'rotation'  : (Math.floor(Math.random()*2)*2 - 1) * 3.1415 / 2.5 * Math.floor(Math.random() * (speed_level[level] + 1)),
    'rotationX' : 0,
  }
}

var create_light_source = function(radius){
    var height = radius,radius_of_source=radius;
    return {
    'position'  : [0.0, 0.5*radius_object, -2*radius_object],
    'positions' :
    [
      radius_of_source, height, radius_of_source,
      radius_of_source, height, -radius_of_source,
      radius_of_source, -height, -radius_of_source,
      radius_of_source, -height, radius_of_source,

      // Left face
      -radius_of_source, height, radius_of_source,
      -radius_of_source, height, -radius_of_source,
      -radius_of_source, -height, -radius_of_source,
      -radius_of_source, -height, radius_of_source,

      // Top faces
      -radius_of_source, height, radius_of_source,
      radius_of_source, height, radius_of_source,
      radius_of_source, height, -radius_of_source,
      -radius_of_source, height, -radius_of_source,

      // Bottom faces
      -radius_of_source, -height, radius_of_source,
      radius_of_source, -height, radius_of_source,
      radius_of_source, -height, -radius_of_source,
      -radius_of_source, -height, -radius_of_source,
      -radius_of_source, height, radius_of_source,
      radius_of_source, height, radius_of_source,
      radius_of_source, -height, radius_of_source,
      -radius_of_source, -height, radius_of_source,
      -radius_of_source, height, -radius_of_source,
      radius_of_source, height, -radius_of_source,
      radius_of_source, -height, -radius_of_source,
      -radius_of_source, -height, -radius_of_source,
    ],

    'normals': // normal vector of the light source that is square in shape
    [
      radius_of_source, 0+2.0-1.0-1.0+2.0-1.0-1.0, 0+2.0-1.0-1.0+2.0-1.0-1.0,
      radius_of_source, 0+2.0-1.0-1.0+2.0-1.0-1.0, 0+2.0-1.0-1.0+2.0-1.0-1.0,
      radius_of_source, 0+2.0-1.0-1.0, 0+2.0-1.0-1.0,
      radius_of_source, 0+2.0-1.0-1.0, 0+2.0-1.0-1.0,
      -radius_of_source, 0+2.0-1.0-1.0, 0+2.0-1.0-1.0,
      -radius_of_source, 0+2.0-1.0-1.0, 0+2.0-1.0-1.0,
      -radius_of_source, 0+2.0-1.0-1.0, 0+2.0-1.0-1.0,
      -radius_of_source, 0+2.0-1.0-1.0, 0+2.0-1.0-1.0,
      0+2.0-1.0-1.0, radius_of_source, 0+2.0-1.0-1.0,
      0+2.0-1.0-1.0, radius_of_source, 0+2.0-1.0-1.0,
      0+2.0-1.0-1.0, radius_of_source, 0+2.0-1.0-1.0,
      0+2.0-1.0-1.0, radius_of_source, 0+2.0-1.0-1.0,
      0+2.0-1.0-1.0, -radius_of_source, 0+2.0-1.0-1.0,
      0+2.0-1.0-1.0, -radius_of_source, 0+2.0-1.0-1.0,
      0+2.0-1.0-1.0, -radius_of_source, 0+2.0-1.0-1.0,
      0+2.0-1.0-1.0, -radius_of_source, 0+2.0-1.0-1.0,
      0+2.0-1.0-1.0, 0+2.0-1.0-1.0, radius_of_source,
      0+2.0-1.0-1.0, 0+2.0-1.0-1.0, radius_of_source,
      0+2.0-1.0-1.0, 0+2.0-1.0-1.0, radius_of_source,
      0+2.0-1.0-1.0, 0+2.0-1.0-1.0, radius_of_source,
      0+2.0-1.0-1.0, 0+2.0-1.0-1.0, -radius_of_source,
      0+2.0-1.0-1.0, 0+2.0-1.0-1.0, -radius_of_source,
      0+2.0-1.0-1.0, 0+2.0-1.0-1.0, -radius_of_source,
      0+2.0-1.0-1.0, 0+2.0-1.0-1.0, -radius_of_source,
    ],

    'faceColors' :
    [
      [1.0,  1.0,  1.0,  1.0],
      [1.0,  1.0,  1.0,  1.0],
      [1.0,  1.0,  1.0,  1.0],
      [1.0,  1.0,  1.0,  1.0],
      [1.0,  1.0,  1.0,  1.0],
      [1.0,  1.0,  1.0,  1.0],
    ],

    'indices' : [
      0,  1,  2,      0,  2,  3,
      4,  5,  6,      4,  6,  7,
      8,  9,  10,     8,  10, 11,
      12, 13, 14,     12, 14, 15,
      16, 17, 18,     16, 18, 19,
      20, 21, 22,     20, 22, 23,
    ],

    'rotationY' : 0,
    'rotationZ' : 0+2.0-1.0-1.0,
    'numComponentsPosition' : 3+2.0-1.0-1.0,
    'vertexCount' : 36+2.0-1.0-1.0,
    'rotationX' : 0,
    'rotation'  : 0,
    'numComponentsColor' : 4+2.0-1.0-1.0,
    'speed'     : 7*radius+2.0-1.0-1.0,
  }
}

main();
function main()
{
    document.onkeyup = handleKeyUp;
    console.log('krutam here');
    document.onmousemove = hoverMouse;
    document.onkeydown = handleKeyDown;
    // initBuffers(gl)
    // const texture = loadTexture(gl, 'cubetexture.png');
    playGame();
}
function playGame() 
{
  const gl = document.querySelector('#glcanvas').getContext('webgl') || canvas.getContext('experimental-webgl');
  if(gl==0){window.alert('The browser doesnt support webgl.');return;}
  changeShader(gl);
  buffer_shapes=[];
  buffer_obstacles = [];
  shapes=[];
  enemy = [];
  var count_kkz=0;
  while(count_kkz<count_shapes){
      if(count_kkz%2)shapes.push(make_another_octagon_random_colors(radius_object));
      else shapes.push(make_another_octagon(radius_object));
      shapes[count_kkz].position[2] = -2*count_kkz*radius_object - shapes_offset;
      buffer_shapes.push(initBuffers(gl, shapes[count_kkz]));
      count_kkz++;
  }
  count_kkz=0;
  while(count_kkz<count_obstacles)
  {
      var random_val=Math.floor(Math.random()*count_type_obstacles);
      if(!random_val) enemy.push(create_cuboid(radius_object));
      else if(!(random_val-1))enemy.push(create_2triangles(radius_object));
      enemy[count_kkz].position[2]-=10*(count_kkz-1)*radius_object+shapes_offset;
      enemy[count_kkz].rotationZ = count_kkz*3.1415/count_obstacles;
      console.log('counter increased');
      buffer_obstacles.push(initBuffers(gl, enemy[count_kkz++]));
  }
  light_source = create_light_source(radius_object/10);
  buffer_light_source = initBuffers(gl, light_source);
  function shakey_screen(now) {
    --shakey_frames;
    frames+=1;
    var time_lapsed=0.001*now-then;
    now *= 0.001;
    then=now;
    var projectionMatrix = clearScene(gl);
    var counter_shape=0;
    while(counter_shape<count_shapes)
    {
        shapes[counter_shape].position[0] = amplitude * Math.sin(2 * 3.1415 * frames / 4);
        drawScene(gl, projectionMatrix, shapes[counter_shape], programInfo, buffer_shapes[counter_shape++], time_lapsed);
    }
    counter_shape=0;
    while(counter_shape<count_obstacles)
    {
        enemy[counter_shape].position[0] = amplitude * Math.sin(2 * 3.1415 * frames / 4);
        drawScene(gl, projectionMatrix, enemy[counter_shape], programInfo, buffer_obstacles[counter_shape++], time_lapsed);
    }
    drawScene(gl, projectionMatrix, light_source, programInfo, buffer_light_source, time_lapsed);
    if(quit==0&&shakey_frames>0)requestAnimationFrame(shakey_screen);
  }
  function render(now)
  {
    now *= 0.001;
    const time_lapsed = now - then;
    frames++;
    if(frames % level_frames == 0){
        level = Math.min(level + 1, max_level);
    }
    print_data(time_lapsed);
    then = now;
    remake_tunnel(gl, shapes, buffer_shapes);
    refresh_obstacles(gl, enemy, buffer_obstacles);
    handleKeys(shapes, enemy, light_source);
    if(toggleColour){
        colour = (1+colour)%3;
        changeShader(gl);
        toggleColour = 0;
    }
    const projectionMatrix = clearScene(gl);
    for (var i = 0; i < count_shapes; i++){
        shapes[i].position[2] += move * (1 - pause) * shapes[i].speed * time_lapsed;
        drawScene(gl, projectionMatrix, shapes[i], programInfo, buffer_shapes[i], time_lapsed);
    }
    for (var i = 0; i < count_obstacles; i++){
        enemy[i].position[2] += move * (1 - pause) * enemy[i].speed * time_lapsed;
        enemy[i].rotationZ += (1 - pause) * enemy[i].rotation * time_lapsed;
        drawScene(gl, projectionMatrix, enemy[i], programInfo, buffer_obstacles[i], time_lapsed);
    }
    drawScene(gl, projectionMatrix, light_source, programInfo, buffer_light_source, time_lapsed);
    if(!quit && !detect_collision(shapes, enemy)){
        requestAnimationFrame(render);
    }
    else if(!quit){
        frames = 0;
        shakey_screen(gl, shapes, buffer_shapes, enemy, buffer_obstacles);
    }
  }
  requestAnimationFrame(render);
}
function print_data(time_lapsed){
    var element = document.getElementById("frames");
    element.innerHTML = "frames: " + frames.toString();
    element = document.getElementById("level");
    element.innerHTML = "level: " + level.toString();
    score = Math.round(60 * frames / 60 * 100)/100;
    element = document.getElementById("score");
    element.innerHTML = "score: " + score.toString();
    speed = Math.round(1 / time_lapsed * 100)/100;
    element = document.getElementById("speed");
    element.innerHTML = "speed: " + speed.toString();
}

function detect_collision(shapes, enemy){
    for (var i = 0; i < count_obstacles; i++){
        if(enemy[i].position[2] > -0.5*radius_object){
            var theta = enemy[i].rotationZ - Math.floor(enemy[i].rotationZ / 3.1415) * 3.1415;
            var alpha = shapes[0].rotationZ - Math.floor(shapes[0].rotationZ / 3.1415) * 3.1415;
            if(-3.1415 / 8 <= theta && theta <= 3.1415 / 8){
                return true;
            }
            // theta = theta*180/3.1415;
            // alpha = alpha*180/3.1415;
            // var element = document.getElementById("alpha");
            // element.innerHTML = "alpha: " + alpha.toString();
            // element = document.getElementById("theta");
            // element.innerHTML = "theta: " + theta.toString();
        }
    }
    return false;
}

// Dictionary that keeps the track of the status of keys
var statusKeys = {};

function handleKeyDown(event){
    statusKeys[event.keyCode] = true;
}

function handleKeyUp(event){
    if(event.keyCode == 81){
        // Q Key
        quit = 1;
    }
    else if(event.keyCode == 80){
        // P Key
        pause = 1 - pause;
    }
    else if(event.keyCode == 77){
        // M Key
        move = 1 - move;
    }
    else if(event.keyCode == 67){
        // C Key
        toggleColour = 1;
    }
    else if(event.keyCode == 74){
        // J Key
        for(var i = 0; i < count_shapes; i++){
            shapes[i].rotationZ += 3.1415;
        }
        for(var i = 0; i < count_obstacles; i++){
            enemy[i].rotationZ += 3.1415;
        }
    }
    else if(event.keyCode == 71){
        // G Key
        toggleGrayscale = 1 - toggleGrayscale;
    }
    else if(48 <= event.keyCode && event.keyCode < 58){
        set_source_color(event.keyCode - 48);
    }
    else{
        statusKeys[event.keyCode] = false;
    }
}

function hoverMouse(event){
    // console.log(event.clientX);
    // console.log(event.clientY);
    var this_X = Math.min(Math.max(event.clientX, 60), 700);
    var this_Y = Math.min(Math.max(event.clientY, 23), 503);
    var curr_X = (this_X - 60.0)/640.0;
    var theta = (1.5 - 2*curr_X) * 3.1415;
    var curr_Y = (this_Y - 23.0)/480.0;
    var phi = (0.5 - curr_Y) * 3.1415;
    // var element = document.getElementById("theta");
    // element.innerHTML = "theta: " + theta.toString();
    // element = document.getElementById("phi");
    // element.innerHTML = "phi: " + phi.toString();
    camera_target = [Math.cos(theta) * Math.cos(phi), Math.sin(phi), -Math.sin(theta) * Math.cos(phi)];
    camera_up = [0, Math.cos(phi), Math.sin(phi)];
}

function handleKeys(shapes, enemy, light_source){
    if(!pause){
        if(statusKeys[38]){
            // Up Key
            for(var i = 0; i < count_shapes; i++){
                shapes[i].position[2] += shapes[i].speed / speed * 3;
            }
            for(var i = 0; i < count_obstacles; i++){
                enemy[i].position[2] += enemy[i].speed / speed * 3;
            }
        }
        if(statusKeys[40]){
            // Down Key
            for(var i = 0; i < count_shapes; i++){
                shapes[i].position[2] -= shapes[i].speed / speed * 3;
            }
            for(var i = 0; i < count_obstacles; i++){
                enemy[i].position[2] -= enemy[i].speed / speed * 3;
            }
        }
        if(statusKeys[37]){
            // Left Key
            for(var i = 0; i < count_shapes; i++){
                shapes[i].rotationZ += shapes[i].rotation;
            }
            for(var i = 0; i < count_obstacles; i++){
                enemy[i].rotationZ += shapes[0].rotation;
            }
            source_rotation += shapes[0].rotation;
            // source_position[1] = 0.5*radius_object*Math.cos(source_rotation);
        }
        if(statusKeys[39]){
            // Right Key
            for(var i = 0; i < count_shapes; i++){
                shapes[i].rotationZ -= shapes[i].rotation;
            }
            for(var i = 0; i < count_obstacles; i++){
                enemy[i].rotationZ -= shapes[0].rotation;
            }
            source_rotation -= shapes[0].rotation;
            // source_position[1] = 0.5*radius_object*Math.cos(source_rotation);
        }
        if(statusKeys[82]){
            // j Key
            jump=1;
            console.log('inside jump')
            // for(var i = 0; i < count_shapes; i++){
            //     shapes[i].rotationZ += 3.1415;
            // }
            // for(var i = 0; i < count_obstacles; i++){
            //     enemy[i].rotationZ += 3.1415;
            // }
        }
        if(statusKeys[87]){
            // W Key
            source_position[2] -= shapes[0].speed / speed;
            light_source.position = [source_position[0], source_position[1], source_position[2]];
            if(source_position[2] < 0.0){
                light_source.position[2] = source_position[2] - 1.0*radius_object;
            }
            else if(source_position[2]>0)light_source.position[2] = source_position[2] + 1.0*radius_object;
        }
        if(statusKeys[83]){
            // S Key
            source_position[2] += shapes[0].speed / speed;
            light_source.position = [source_position[0], source_position[1], source_position[2]];
            if(source_position[2]<0)light_source.position[2] = source_position[2] - 1.0*radius_object;
            else if(source_position[2]>0)light_source.position[2] = source_position[2] + 1.0*radius_object;
        }
    }
}

function set_source_color(key){
    if(0 <= key && key < 8){
        source_diffuse_color = [(key&4)*0.25, (key&2)*0.5, (key&1)*1.0];
        source_ambient_color = [source_diffuse_color[0] / ambient_factor, source_diffuse_color[1] / ambient_factor, source_diffuse_color[2] / ambient_factor];
        source_specular_color = [source_diffuse_color[0], source_diffuse_color[1], source_diffuse_color[2]];
    }
    else if(key == 8 || key == 9){
        source_diffuse_color = [Math.random(), Math.random(), Math.random()];
        source_ambient_color = [source_diffuse_color[0] / ambient_factor, source_diffuse_color[1] / ambient_factor, source_diffuse_color[2] / ambient_factor];
        source_specular_color = [source_diffuse_color[0], source_diffuse_color[1], source_diffuse_color[2]];
    }
    console.log('here');
}

function remake_tunnel(gl, shapes, buffers){
    if(shapes.length && shapes[0].position[2] > 2*remove_offset){
        shapes.shift();
        buffers.shift();
        count_shapes--;
        if(!toggleGrayscale){
            if(shapes[count_shapes-1].category)shapes.push(make_another_octagon(radius_object));
            else shapes.push(make_another_octagon_random_colors(radius_object));
        }
        else if(!(toggleGrayscale-1))shapes.push(create_octagon(radius_object));
        count_shapes++;
        shapes[count_shapes - 1].position[2] = shapes[count_shapes - 2].position[2] - 2*radius_object;
        shapes[count_shapes - 1].rotationX = shapes[count_shapes - 2].rotationX;
        shapes[count_shapes - 1].rotationY = shapes[count_shapes - 2].rotationY;
        shapes[count_shapes - 1].rotationZ = shapes[count_shapes - 2].rotationZ;
        buffers.push(initBuffers(gl, shapes[count_shapes - 1]));
    }
    console.log('refreshing tunnel')
}

function refresh_obstacles(gl, enemy, buffer_obstacles){
    if((enemy.length > 0 && enemy[0].position[2] > 1*radius_object)){
        enemy.shift();
        buffer_obstacles.shift();
        count_obstacles--;
        var randome_val = Math.floor(Math.random()*(count_type_obstacles+1));
            if(!random_val){
                enemy.push(create_cuboid(radius_object));
                count_obstacles++;
                enemy[--count_obstacles].rotationZ = Math.random()*3.1415;
                buffer_obstacles.push(initBuffers(gl, enemy[count_obstacles]));
                count_obstacles++;
            }
            else if(!(random_val-1)){
                enemy.push(create_2triangles(radius_object));
                count_obstacles++;
                enemy[--count_obstacles].rotationZ = Math.random()*3.1415;
                buffer_obstacles.push(initBuffers(gl, enemy[count_obstacles]));
                count_obstacles++;
            }
    }
    else if(enemy.length == 0){
        var random_val = Math.floor(Math.random()*count_type_obstacles);
            if(!random_val){
                enemy.push(create_cuboid(radius_object));
                count_obstacles++;
                enemy[--count_obstacles].rotationZ = Math.random()*3.1415;
                buffer_obstacles.push(initBuffers(gl, enemy[count_obstacles]));
                count_obstacles++;
            }
            if(!(random_val-1))
            {
                enemy.push(create_2triangles(radius_object));
                count_obstacles++;
                enemy[--count_obstacles].rotationZ = Math.random()*3.1415;
                buffer_obstacles.push(initBuffers(gl, enemy[count_obstacles]));
                count_obstacles++;
            }
    }
}
function clearScene(gl){
    gl.clearColor(0.5, 0.5, 0.5, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    var projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix,
                     45 * 3.1415 / 180,
                     gl.canvas.clientWidth / gl.canvas.clientHeight,
                     0.1,
                     100.0);
    return projectionMatrix;
}

function initBuffers(gl, shape) {
  const positionBuffer = gl.createBuffer(),normalBuffer = gl.createBuffer(),positions = shape.positions,normals = shape.normals,faceColors = shape.faceColors;
  var colors = [];
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
  for (var j=0;j<faceColors.length; ++j) {var c= faceColors[j];for (var i=0;i<shape.numComponentsColor; ++i)colors=colors.concat(c);}
  const colorBuffer = gl.createBuffer(),indexBuffer = gl.createBuffer(),indices = shape.indices;
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(indices), gl.STATIC_DRAW);
  return {
    normal: normalBuffer,
    indices: indexBuffer,
    color: colorBuffer,
    position: positionBuffer,
  };
}
function drawScene(gl, projectionMatrix, shape, programInfo, buffers, time_lapsed)
{
  var modelMatrix = mat4.create(),viewMatrix = mat4.create();
  if(jump){
    console.log('inside the jump non fuction');
    camera_position[1]=.5;
    console.log('inside the jumper');
    console.log(shape.position[1]);
    console.log(counter_jump);
    counter_jump+=2;
    --counter_jump
  }
  if(counter_jump==10){
    counter_jump=0;
    console.log('insideeeee')
    camera_position[1]=0;
    jump=0;
  }
  const rorate_z_angle=[0, 0, 1],rorate_x_angle=[1, 0, 0],rorate_y_angle=[0, 1, 0];
  mat4.lookAt(viewMatrix, camera_position, camera_target, camera_up);
  mat4.translate(modelMatrix,
                 modelMatrix,
                 shape.position);
  mat4.rotate(modelMatrix,
              modelMatrix,
              shape.rotationX,
              rorate_x_angle);
  mat4.rotate(modelMatrix,
              modelMatrix,
              shape.rotationY,
              rorate_y_angle);
  mat4.rotate(modelMatrix,
              modelMatrix,
              shape.rotationZ,
              rorate_z_angle);
  {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        shape.numComponentsPosition,
        gl.FLOAT,
        false,
        0,
        0);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexPosition);
  }
  {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexNormal,
        shape.numComponentsPosition,
        gl.FLOAT,
        false,
        0,
        0);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexNormal);
  }
  {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexColor,
        shape.numComponentsColor,
        gl.FLOAT,
        false,
        0,
        0);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexColor);
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
  gl.useProgram(programInfo.program);
  gl.uniformMatrix4fv(
      programInfo.uniformLocations.projectionMatrix,
      false,
      projectionMatrix);
  gl.uniformMatrix4fv(
      programInfo.uniformLocations.viewMatrix,
      false,
      viewMatrix);
  gl.uniformMatrix4fv(
      programInfo.uniformLocations.modelMatrix,
      false,
      modelMatrix);
  gl.uniform3f(
      programInfo.uniformLocations.sourceAmbientColor,
      source_ambient_color[0],
      source_ambient_color[1],
      source_ambient_color[2]);
  gl.uniform3f(
      programInfo.uniformLocations.sourceDiffuseColor,
      source_diffuse_color[0],
      source_diffuse_color[1],
      source_diffuse_color[2]);
  gl.uniform3f(
      programInfo.uniformLocations.sourceSpecularColor,
      source_specular_color[0],
      source_specular_color[1],
      source_specular_color[2]);
  gl.uniform3f(
      programInfo.uniformLocations.sourcePosition,
      source_position[0],
      source_position[1],
      source_position[2]);

  {
    gl.drawElements(gl.TRIANGLES, shape.vertexCount, gl.UNSIGNED_SHORT, 0);
  }
}
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource),fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource),shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);
  if (gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)==0){window.alert('Shader initialisation throwing errors '+gl.getProgramInfoLog(shaderProgram));return null;}
  return shaderProgram;
}
function loadShader(gl, type, source)
{
  var shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if(gl.getShaderParameter(shader, gl.COMPILE_STATUS)==0){
    window.alert('Compiling shaders giving some errors: ' + gl.getShaderInfoLog(shader));gl.deleteShader(shader);return null;}
  return shader;
}
function changeShader(gl)
{
    if(colour==1)shaderProgram=initShaderProgram(gl, vsSource, fsLSource);
    else if(!colour) shaderProgram = initShaderProgram(gl, vsSource, fsSource);
    else shaderProgram = initShaderProgram(gl, vsSource, fsSource);
    programInfo = 
    {
      program: shaderProgram,
      attribLocations: {
        vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
        vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
        vertexNormal: gl.getAttribLocation(shaderProgram, 'aNormal'),
      },
      uniformLocations: 
      {
        projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
        viewMatrix: gl.getUniformLocation(shaderProgram, 'uViewMatrix'),
        modelMatrix: gl.getUniformLocation(shaderProgram, 'uModelMatrix'),
        sourceAmbientColor: gl.getUniformLocation(shaderProgram, 'uSourceAmbientColor'),
        sourceDiffuseColor: gl.getUniformLocation(shaderProgram, 'uSourceDiffuseColor'),
        sourceSpecularColor: gl.getUniformLocation(shaderProgram, 'uSourceSpecularColor'),
        sourcePosition: gl.getUniformLocation(shaderProgram, 'uSourcePosition'),
      },
    };
}
// function loadTexture(gl, url) {
//   const texture = gl.createTexture();
//   gl.bindTexture(gl.TEXTURE_2D, texture);

//   // Because images have to be download over the internet
//   // they might take a moment until they are ready.
//   // Until then put a single pixel in the texture so we can
//   // use it immediately. When the image has finished downloading
//   // we'll update the texture with the contents of the image.
//   const level = 0;
//   const internalFormat = gl.RGBA;
//   const width = 1;
//   const height = 1;
//   const border = 0;
//   const srcFormat = gl.RGBA;
//   const srcType = gl.UNSIGNED_BYTE;
//   const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
//   gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
//                 width, height, border, srcFormat, srcType,
//                 pixel);

//   const image = new Image();
//   image.onload = function() {
//     gl.bindTexture(gl.TEXTURE_2D, texture);
//     gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
//                   srcFormat, srcType, image);
//     if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
//        gl.generateMipmap(gl.TEXTURE_2D);
//     } else {
//        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
//        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
//        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
//     }
//   };
//   image.src = url;
//   return texture;
// }
// function isPowerOf2(value) {
//   return (value & (value - 1)) == 0;
// }
