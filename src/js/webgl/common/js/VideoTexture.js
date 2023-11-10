export class VideoTexture {
  constructor(gl) {
    this.copyVideo = false
    this.gl = gl
    this.video = null
    this.texture = null
    this.setupTexture()
  }

  async setupVideo(url) {
    const video = document.createElement('video')
    let playing = false
    let timeupdate = false

    video.autoplay = true
    video.muted = true
    video.loop = true
    video.playsInline = true

    const playVideo = () => {
      video
        .play()
        .then(() => {
          // ビデオの再生に成功した場合の処理
          window.removeEventListener('touchstart', playVideo)
        })
        .catch((e) => {
          // エラー処理
          console.error('Video play failed', e)
        })
    }

    window.addEventListener('touchstart', playVideo)

    video.addEventListener(
      'playing',
      () => {
        playing = true
        this.checkReady()
      },
      true,
    )

    video.addEventListener(
      'timeupdate',
      () => {
        timeupdate = true
        this.checkReady()
      },
      true,
    )

    video.src = url
    video.play()

    this.copyVideo = false

    this.checkReady = () => {
      if (playing && timeupdate) {
        this.copyVideo = true
      }
    }
    this.video = video
  }

  setupTexture() {
    const texture = this.gl.createTexture()
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture)

    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE)

    const initialPixel = new Uint8Array([0, 0, 0, 0])

    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, 1, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, initialPixel)
    this.gl.bindTexture(this.gl.TEXTURE_2D, null)

    this.texture = texture
  }

  updateTexture() {
    if (this.copyVideo) {
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture)
      this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true)
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.video)
      this.gl.bindTexture(this.gl.TEXTURE_2D, null)
    }
  }
}
