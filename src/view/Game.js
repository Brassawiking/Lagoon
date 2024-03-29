import { ref } from '../../feppla/feppla.js'
import { loadImage, clamp } from '../utils.js'
import { resources } from './Editor.js'

const TILE_SIZE = 16
let currentMapIndex

let playerX
let playerY
let playerHitboxWidth = 21
let playerHitboxHeight = 17
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

const setMap = (mapIndex, entranceIndex) => {
  if (mapIndex === currentMapIndex || mapIndex < 0 || mapIndex > resources.data.maps.length - 1) {
    return
  }

  const map = resources.data.maps[mapIndex]
  playerX = map.entrances[entranceIndex].x
  playerY = map.entrances[entranceIndex].y
  currentMapIndex = mapIndex
}

setMap(0, 0)

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
          playerX = clamp(playerX - playerSpeed, Math.floor(playerHitboxWidth / 2), map.width * TILE_SIZE - Math.ceil(playerHitboxWidth / 2))
          playerDirection = 'left'
        }
        if (keyDown('ArrowRight')) {
          playerX = clamp(playerX + playerSpeed, Math.floor(playerHitboxWidth / 2), map.width * TILE_SIZE - Math.ceil(playerHitboxWidth / 2))
          playerDirection = 'right'
        }
        if (keyDown('ArrowUp')) {
          playerY = clamp(playerY - playerSpeed, Math.floor(playerHitboxHeight / 2), map.height * TILE_SIZE - Math.ceil(playerHitboxHeight / 2))
          playerDirection = 'up'
        }
        if (keyDown('ArrowDown')) {
          playerY = clamp(playerY + playerSpeed, Math.floor(playerHitboxHeight / 2), map.height * TILE_SIZE - Math.ceil(playerHitboxHeight / 2))
          playerDirection = 'down'
        }

        const ctx = canvas.getContext('2d')
        canvas.width = 256
        canvas.height = 224
        canvas.style.width = `${canvas.width * 3}px`
        canvas.style.height = `${canvas.height * 3}px`
        
        ctx.fillStyle = '#f0f'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        const cameraX = clamp(Math.floor(playerX) - 256 / 2, 0, map.width * TILE_SIZE - 256)
        const cameraY = clamp(Math.floor(playerY) - 224 / 2, 0, map.height * TILE_SIZE - 224)

        for (let index = 0 ; index < map.tilemap.base.length ; ++index) {
          const tileIndex = map.tilemap.base[index]
          const x = (index % map.width) * TILE_SIZE - cameraX
          const y = Math.floor(index / map.width) * TILE_SIZE - cameraY

          if (x >= -TILE_SIZE && x <= 256 && y >= -TILE_SIZE && y <= 224) {
            ctx.drawImage(
              tileImages[tileIndex] || tileImages[0], 
              x, 
              y
            )
          }
        }

        ctx.fillStyle = '#ffff0080'
        if (playerDirection === 'right') {
          ctx.fillRect(
            Math.floor(playerX + 0) - cameraX, 
            Math.floor(playerY - 8) - cameraY, 
            25, 
            16
          )
        }
        if (playerDirection === 'down') {
          ctx.fillRect(
            Math.floor(playerX - 16) - cameraX, 
            Math.floor(playerY - 0) - cameraY, 
            32, 
            15
          )
        }
        if (playerDirection === 'left') {
          ctx.fillRect(
            Math.floor(playerX - 25) - cameraX, 
            Math.floor(playerY - 8) - cameraY, 
            25, 
            16
          )
        }
        if (playerDirection === 'up') {
          ctx.fillRect(
            Math.floor(playerX - 16) - cameraX, 
            Math.floor(playerY - 15) - cameraY, 
            32, 
            15
          )
        }

        ctx.fillStyle = '#ff000080'
        ctx.fillRect(
          Math.floor(playerX - Math.floor(playerHitboxWidth / 2)) - cameraX, 
          Math.floor(playerY - Math.floor(playerHitboxHeight / 2)) - cameraY, 
          playerHitboxWidth, 
          playerHitboxHeight
        )

        ctx.drawImage(
          nasirSpriteImages[playerDirection],
          Math.floor(playerX-12) - cameraX,
          Math.floor(playerY-24-2) - cameraY
        )

        for (let index = 0 ; index < map.tilemap.overlay.length ; ++index) {
          const tileIndex = map.tilemap.overlay[index]
          const x = (index % map.width) * TILE_SIZE - cameraX
          const y = Math.floor(index / map.width) * TILE_SIZE - cameraY

          if (tileIndex > 0 && x >= -TILE_SIZE && x <= 256 && y >= -TILE_SIZE && y <= 224) {
            ctx.drawImage(
              tileImages[tileIndex] || tileImages[0], 
              x, 
              y
            )
          }
        }

        for (let i = 0; i < map.exits.length ; ++i) {
          const exit = map.exits[0]
          if (
            playerX >= exit.x * TILE_SIZE && 
            playerX < (exit.x + exit.width) * TILE_SIZE &&
            playerY >= exit.y * TILE_SIZE && 
            playerY < (exit.y + exit.height) * TILE_SIZE
          ) {
            setMap(exit.target.mapIndex, exit.target.entranceIndex)
          }
        }

        if (keyPressed('a')) {
          setMap(currentMapIndex - 1, 0)
        }
        if (keyPressed('d')) {
          setMap(currentMapIndex + 1, 0)
        }

        prevKeys = {
          ...keys
        }
      })
    }></canvas>
  </div>
`