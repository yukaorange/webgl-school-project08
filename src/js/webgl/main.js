'use strict'
import { mat4 } from 'gl-matrix'
import { Pane } from 'tweakpane'
import { Camera } from './common/js/Camera.js'
import { Clock } from './common/js/Clock.js'
import { Controls } from './common/js/Controls.js'
import { Program } from './common/js/Program.js'
import { Scene } from './common/js/Scene.js'
import { Texture } from './common/js/Texture.js'
import { Transforms } from './common/js/Transforms.js'
import { VideoTexture } from './common/js/VideoTexture.js'
import { utils } from './common/js/utils.js'
import fragmentShader from './shader/fragment.glsl'
import vertexShader from './shader/vertex.glsl'

let gl,
  scene,
  camera,
  clock,
  program,
  transforms,
  texture0,
  texAspectX,
  texAspectY,
  isBG,
  elapsedTime,
  aspect,
  videoTexture

let fov = 45
let fovRad = fov * (Math.PI / 180)
let theta = fovRad / 2
let planeHeight = 1
let distance = planeHeight / 2 / Math.tan(theta)

let cubeSize = [0.24, 0.24, 0.24]

function configure() {
  const canvas = utils.getCanvas('webgl-canvas')
  utils.autoResizeCanvas(canvas)

  gl = utils.getGLContext(canvas)
  gl.clearColor(1.0, 1.0, 1.0, 1)
  gl.clearDepth(100)
  gl.enable(gl.DEPTH_TEST)
  gl.depthFunc(gl.LESS)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

  program = new Program(gl, vertexShader, fragmentShader)

  const attributes = ['aVertexPosition', 'aVertexNormal', 'aVertexColor', 'aVertexTextureCoords']

  const uniforms = [
    'uProjectionMatrix',
    'uModelViewMatrix',
    'uNormalMatrix',
    'uMaterialDiffuse',
    'uMaterialAmbient',
    'uLightAmbient',
    'uLightDiffuse',
    'uLightPosition',
    'uAlpha',
    'uUseVertexColor',
    'uSampler',
    'uSamplerVideo',
    'uTexAspectX',
    'uTexAspectY',
    'uAspect',
    'uIsBG',
    'uResolution',
  ]

  program.load(attributes, uniforms)

  clock = new Clock()
  scene = new Scene(gl, program)

  camera = new Camera(Camera.ORBITING_TYPE, fovRad)
  camera.goHome([0, 0, distance])
  camera.setFocus([0, 0, 0])
  camera.setElevation(0)
  camera.setAzimuth(0)
  // new Controls(camera, canvas)

  texture0 = new Texture(gl)
  videoTexture = new VideoTexture(gl)

  aspect = gl.canvas.width / gl.canvas.height

  transforms = new Transforms(gl, program, camera, canvas)

  gl.uniform3fv(program.uLightPosition, [0, 0, 1])
  gl.uniform4fv(program.uLightAmbient, [0.8, 0.8, 0.8, 1])
  gl.uniform4fv(program.uLightDiffuse, [0.8, 0.8, 0.8, 1])
  gl.uniform1f(program.uAlpha, 1)
}

async function load() {
  await scene.load('/geometries/cube-texture.json', 'cube', {
    position: [0, 0, distance / 2],
    scale: cubeSize,
    rotate: [Math.PI / 9, Math.PI / 4, 0],
  })
  await scene.load('/geometries/plane.json', 'plane', {
    position: [0, 0, 0],
    scale: [aspect * planeHeight, planeHeight, 0],
    rotate: [0, 0, 0],
  })
}

async function loadTextures() {
  await texture0.setImage('textures/metal.webp')
  await videoTexture.setupVideo('movie/heart.mp4')
}

function render() {
  videoTexture.updateTexture()

  draw()
}

function draw() {
  elapsedTime = clock.getElapsedTime() / 1000
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  transforms.updatePerspective()

  try {
    program.useProgram()

    scene.traverse((object) => {
      transforms.calculateModelView()
      transforms.push()

      if (object.alias === 'plane') {
        // mat4.rotateY(transforms.modelViewMatrix, transforms.modelViewMatrix, (object.rotate[1] = elapsedTime / 10))
        mat4.translate(transforms.modelViewMatrix, transforms.modelViewMatrix, object.position)
        mat4.scale(transforms.modelViewMatrix, transforms.modelViewMatrix, object.scale)
        isBG = true
      } else {
        isBG = false
      }

      if (object.alias === 'cube') {
        mat4.translate(transforms.modelViewMatrix, transforms.modelViewMatrix, object.position)
        mat4.scale(transforms.modelViewMatrix, transforms.modelViewMatrix, object.scale)
        mat4.rotateY(transforms.modelViewMatrix, transforms.modelViewMatrix, elapsedTime / 2)
        mat4.rotateX(transforms.modelViewMatrix, transforms.modelViewMatrix, object.rotate[0])
      }
      // if (object.alias === 'plane') {
      // }

      transforms.setMatrixUniforms()
      transforms.pop()

      gl.uniform4fv(program.uMaterialDiffuse, object.diffuse)
      gl.uniform4fv(program.uMaterialAmbient, object.ambient)
      gl.uniform4fv(program.uMaterialSpecular, object.specular)
      gl.uniform2fv(program.uResolution, [
        window.innerWidth * window.devicePixelRatio,
        window.innerHeight * window.devicePixelRatio,
      ])
      gl.uniform1i(program.uUseVertexColor, false)
      gl.uniform1i(program.uIsBG, isBG)

      // Bind
      gl.bindVertexArray(object.vao)
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, object.ibo)

      // Activate texture
      if (object.textureCoords) {
        gl.uniform1f(program.uTexAspectX, texAspectX)
        gl.uniform1f(program.uTexAspectY, texAspectY)

        gl.activeTexture(gl.TEXTURE0)
        gl.uniform1f(program.uTexAspectX, texAspectX)
        gl.uniform1f(program.uTexAspectY, texAspectY)
        gl.bindTexture(gl.TEXTURE_2D, texture0.glTexture)
        gl.uniform1i(program.uSampler, 0)

        gl.activeTexture(gl.TEXTURE1)
        gl.uniform1f(program.uAspect, aspect)
        gl.bindTexture(gl.TEXTURE_2D, videoTexture.texture)
        gl.uniform1i(program.uSamplerVideo, 1)
      }

      // Draw
      if (object.wireframe) {
        gl.drawElements(gl.LINES, object.indices.length, gl.UNSIGNED_SHORT, 0)
      } else {
        gl.drawElements(gl.TRIANGLES, object.indices.length, gl.UNSIGNED_SHORT, 0)
      }

      // Clean
      gl.bindVertexArray(null)
      gl.bindBuffer(gl.ARRAY_BUFFER, null)
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null)
      gl.bindTexture(gl.TEXTURE_2D, null)
    })
  } catch (error) {
    console.error(error)
  }
}

function setUpPane() {
  const pane = new Pane({
    title: 'Parameters',
    expanded: true,
  })

  const INITIAL_LIGHT_PARAMS = {
    lightPosX: 0,
    lightPosY: 0,
    lightPosZ: 10,
    lightAmbR: 0.1,
    lightAmbG: 0.1,
    lightAmbB: 0.1,
    lightAmbA: 1,
    lightDiffR: 0.1,
    lightDiffG: 0.1,
    lightDiffB: 0.1,
    lightDiffA: 1,
  }

  const LIGHT_PARAMS = { ...INITIAL_LIGHT_PARAMS }

  const lightFolder = pane.addFolder({
    title: 'Light Settings',
    expanded: false,
  })

  const bindings = {}

  function addBinding(name, params) {
    bindings[name] = lightFolder.addBinding(LIGHT_PARAMS, name, params).on('change', updateLightUniforms)
  }

  // Light Position Controls
  addBinding('lightPosX', { min: -50, max: 50 })
  addBinding('lightPosY', { min: -50, max: 50 })
  addBinding('lightPosZ', { min: -50, max: 50 })

  // Light Ambient Controls
  addBinding('lightAmbR', { min: 0, max: 1, step: 0.01 })
  addBinding('lightAmbG', { min: 0, max: 1, step: 0.01 })
  addBinding('lightAmbB', { min: 0, max: 1, step: 0.01 })
  addBinding('lightAmbA', { min: 0, max: 1, step: 0.01 })

  // Light Diffuse Controls
  addBinding('lightDiffR', { min: 0, max: 1, step: 0.01 })
  addBinding('lightDiffG', { min: 0, max: 1, step: 0.01 })
  addBinding('lightDiffB', { min: 0, max: 1, step: 0.01 })
  addBinding('lightDiffA', { min: 0, max: 1, step: 0.01 })

  lightFolder.addButton({ title: 'Reset' }).on('click', () => {
    Object.assign(LIGHT_PARAMS, INITIAL_LIGHT_PARAMS)
    for (let key in bindings) {
      bindings[key].refresh()
    }
    updateLightUniforms()
  })

  function updateLightUniforms() {
    gl.uniform3fv(program.uLightPosition, [LIGHT_PARAMS.lightPosX, LIGHT_PARAMS.lightPosY, LIGHT_PARAMS.lightPosZ])
    gl.uniform4fv(program.uLightAmbient, [
      LIGHT_PARAMS.lightAmbR,
      LIGHT_PARAMS.lightAmbG,
      LIGHT_PARAMS.lightAmbB,
      LIGHT_PARAMS.lightAmbA,
    ])
    gl.uniform4fv(program.uLightDiffuse, [
      LIGHT_PARAMS.lightDiffR,
      LIGHT_PARAMS.lightDiffG,
      LIGHT_PARAMS.lightDiffB,
      LIGHT_PARAMS.lightDiffA,
    ])
  }
}

function resize() {
  const windowWidth = window.innerWidth
  let plane = scene.get('plane')
  let cube = scene.get('cube')
  aspect = gl.canvas.width / gl.canvas.height

  plane.scale[0] = planeHeight * aspect

  if (windowWidth < 780) {
    cube.scale = [
      ...cubeSize.map((size) => {
        return size * 0.7
      }),
    ]
  } else {
    cube.scale = cubeSize
  }
}

function resizeHandler() {
  const currentWidth = window.innerWidth
  window.addEventListener('resize', () => {
    const newWidth = window.innerWidth
    const widthDiff = newWidth - currentWidth
    if (widthDiff > 0.1 || widthDiff < -0.1) {
      resize()
      updateAspect()
    }
  })
  resize()
  updateAspect()
}

function updateAspect() {
  aspect = gl.canvas.width / gl.canvas.height
  let aspectX = gl.canvas.width / gl.canvas.height
  let aspectY = gl.canvas.height / gl.canvas.width
  let culclatedAspectX = aspectX / texture0.imageAspect
  let culclatedAspectY = aspectY / texture0.imageAspectY
  texAspectX = culclatedAspectX
  texAspectY = culclatedAspectY
  // console.log(
  //   `windowAspX:${aspectX}\nwindowAspY:${aspectY}\nimageAspX :${texture0.imageAspect}\nimageAspY :${texture0.imageAspectY}\ntexAspX   :${texAspectX}\ntexAspY   :${texAspectY}`,
  // )
}

export async function init() {
  configure()
  await load()
  await loadTextures()
  // setUpPane()
  resizeHandler()
  clock.on('tick', render)
}
