import { ref } from '../../feppla/feppla.js'
import { loadImage, clamp } from '../utils.js'
import { resources } from './Editor.js'

const TILE_SIZE = 16

const RESOLUTION_WIDTH = 256
const RESOLUTION_HEIGHT = 224
const RESOLUTION_SCALE = 4

let currentMapIndex

let playerX
let playerY
let playerHitboxWidth = 21
let playerHitboxHeight = 17
let playerDirection = 'down'
let walkCounter = 0
const playerSpeed = 1.5 // TODO: Use 30 FPS update logic instead?

let prevKeys = {}
const keys = {}

const nasirSpriteSheet = await loadImage('graphics/sprites/nasir_spritesheet.png')

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
        let moving = false

        const gp = navigator.getGamepads()[0]

        if (keyDown('ArrowLeft') || gp?.buttons[14].pressed) {
          playerX = clamp(playerX - playerSpeed, Math.floor(playerHitboxWidth / 2), map.width * TILE_SIZE - Math.ceil(playerHitboxWidth / 2))
          playerDirection = 'left'
          moving = true
        }
        if (keyDown('ArrowRight') || gp?.buttons[15].pressed) {
          playerX = clamp(playerX + playerSpeed, Math.floor(playerHitboxWidth / 2), map.width * TILE_SIZE - Math.ceil(playerHitboxWidth / 2))
          playerDirection = 'right'
          moving = true
        }
        if (keyDown('ArrowUp') || gp?.buttons[12].pressed) {
          playerY = clamp(playerY - playerSpeed, Math.floor(playerHitboxHeight / 2), map.height * TILE_SIZE - Math.ceil(playerHitboxHeight / 2))
          playerDirection = 'up'
          moving = true
        }
        if (keyDown('ArrowDown') || gp?.buttons[13].pressed) {
          playerY = clamp(playerY + playerSpeed, Math.floor(playerHitboxHeight / 2), map.height * TILE_SIZE - Math.ceil(playerHitboxHeight / 2))
          playerDirection = 'down'
          moving = true
        }

        walkCounter = moving ? walkCounter + 1 : 0

        const ctx = canvas.getContext('2d')
        canvas.width = RESOLUTION_WIDTH
        canvas.height = RESOLUTION_HEIGHT
        canvas.style.width = `${canvas.width * RESOLUTION_SCALE}px`
        canvas.style.height = `${canvas.height * RESOLUTION_SCALE}px`
        
        ctx.fillStyle = '#f0f'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        const cameraX = clamp(Math.floor(playerX) - canvas.width / 2, 0, map.width * TILE_SIZE - canvas.width)
        const cameraY = clamp(Math.floor(playerY) - canvas.height / 2, 0, map.height * TILE_SIZE - canvas.height)

        for (let index = 0 ; index < map.tilemap.base.length ; ++index) {
          const tileIndex = map.tilemap.base[index]
          const x = (index % map.width) * TILE_SIZE - cameraX
          const y = Math.floor(index / map.width) * TILE_SIZE - cameraY

          if (x >= -TILE_SIZE && x <= canvas.width && y >= -TILE_SIZE && y <= canvas.height) {
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

        const directionToSpriteRow = {
          'up': 48 * 0,
          'down': 48 * 1,
          'left': 48 * 2,
          'right': 48 * 3,
        }

        const walkCycle = [
          32 * 0,
          32 * 1,
          32 * 0,
          32 * 2,
        ]

        ctx.drawImage(
          nasirSpriteSheet,
          walkCycle[(Math.floor(walkCounter / 6) % 4)],
          directionToSpriteRow[playerDirection],
          32,
          48,
          Math.floor(playerX - 16) - cameraX,
          Math.floor(playerY - 42) - cameraY,
          32,
          48,
        )

        for (let index = 0 ; index < map.tilemap.overlay.length ; ++index) {
          const tileIndex = map.tilemap.overlay[index]
          const x = (index % map.width) * TILE_SIZE - cameraX
          const y = Math.floor(index / map.width) * TILE_SIZE - cameraY

          if (tileIndex > 0 && x >= -TILE_SIZE && x <= canvas.width && y >= -TILE_SIZE && y <= canvas.height) {
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