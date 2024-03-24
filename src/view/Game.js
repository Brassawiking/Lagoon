import { ref } from "../../feppla/feppla.js"
import { loadImage, clamp } from "../utils.js"
import { resources } from "./Editor.js"

const TILE_SIZE = 16
let currentMapIndex = 0
let cameraX = 0
let cameraY = 0

let playerX = 112
let playerY = 96
let playerDirection = 'down'
const playerSpeed = 1.5

let prevKeys = {}
const keys = {}

const nasirSpriteImages = {
  left: await loadImage('graphics/sprites/nasirLeft.png'),
  right: await loadImage('graphics/sprites/nasirRight.png'),
  up: await loadImage('graphics/sprites/nasirUp.png'),
  down: await loadImage('graphics/sprites/nasirDown.png')
} 

const keyDown = (key) => keys[key]
const keyPressed = (key) => keys[key] && !prevKeys[key]

export const Game = () => `
  <div class="game" tabindex="0" ${ref()
    .node((el) => {
      el.focus()
    })
    .on('keydown', (event) => {
      keys[event.key] = true
    })
    .on('keyup', (event) => {
      keys[event.key] = false
    })
  }>
    <canvas class="dialog" ${ref()
      .live((canvas) => {
        const tileImages = resources.tileImages
        const map = resources.data.maps[currentMapIndex]

        if (keyDown('ArrowLeft')) {
          playerX = clamp(playerX - playerSpeed, 0, map.width * TILE_SIZE - 24)
          playerDirection = 'left'
        }
        if (keyDown('ArrowRight')) {
          playerX = clamp(playerX + playerSpeed, 0, map.width * TILE_SIZE - 24)
          playerDirection = 'right'
        }
        if (keyDown('ArrowUp')) {
          playerY = clamp(playerY - playerSpeed, 0, map.height * TILE_SIZE - 32)
          playerDirection = 'up'
        }
        if (keyDown('ArrowDown')) {
          playerY = clamp(playerY + playerSpeed, 0, map.height * TILE_SIZE - 32)
          playerDirection = 'down'
        }

        const leftEdge = 56
        const rightEdge = 256 - leftEdge - 24
        const topEdge = 56
        const bottomEdge = 224 - topEdge - 32
        if (playerX - cameraX < leftEdge) {
          cameraX = clamp(Math.floor(playerX) - leftEdge, 0, map.width * TILE_SIZE - 256)
        }
        if (playerX - cameraX > rightEdge) {
          cameraX = clamp(Math.floor(playerX) - rightEdge, 0, map.width * TILE_SIZE - 256)
        }
        if (playerY - cameraY < topEdge) {
          cameraY = clamp(Math.floor(playerY) - topEdge, 0, map.height * TILE_SIZE - 224)
        }
        if (playerY - cameraY > bottomEdge) {
          cameraY = clamp(Math.floor(playerY) - bottomEdge, 0, map.height * TILE_SIZE - 224)
        }

        if (keyPressed('a')) {
          currentMapIndex = clamp(currentMapIndex - 1, 0, resources.data.maps.length - 1)
          cameraX = 0
          cameraY = 0
          playerX = 112
          playerY = 96
        }
        if (keyPressed('d')) {
          currentMapIndex = clamp(currentMapIndex + 1, 0, resources.data.maps.length - 1)
          cameraX = 0
          cameraY = 0
          playerX = 112
          playerY = 96
        }

        prevKeys = {
          ...keys
        }

        const ctx = canvas.getContext('2d')
        canvas.width = 256
        canvas.height = 224
        canvas.style.width = `${canvas.width * 3}px`
        canvas.style.height = `${canvas.height * 3}px`
        
        ctx.fillStyle = "#f0f"
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        for (let index = 0 ; index < map.tilemap.length ; ++index) {
          const image = tileImages[map.tilemap[index]] || tileImages[0]
          const x = (index % map.width) * TILE_SIZE - cameraX
          const y = Math.floor(index / map.width) * TILE_SIZE - cameraY

          if (x >= -TILE_SIZE && x <= 256 && y >= -TILE_SIZE && y <= 224) {
            ctx.drawImage(
              image, 
              x, 
              y
            )
          }
        }

        ctx.drawImage(
          nasirSpriteImages[playerDirection],
          Math.floor(playerX) - cameraX,
          Math.floor(playerY) - cameraY
        )
      })
    }></canvas>
  </div>
`