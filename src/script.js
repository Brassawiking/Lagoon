import { ref, debugLiveWatchers, debugRefCounter, compareArrays } from '../framework/framework.js'
import { clamp, mouseDrag } from './utils.js'
import rawData from '../data/data.json' assert { type: 'json' }

const MOUSE_LEFT_BUTTON = 0
const MOUSE_MIDDLE_BUTTON = 1
const TILE_SIZE = 16

const MOUSE_LEFT_BUTTON_BIT = 1

const TOOL_MOVE = 'Move'
const TOOL_PAINT = 'Paint'

const data = structuredClone(rawData)
let viewOriginX = -50
let viewOriginY = -50
let viewZoom = 100
let currentMap
let currentTool = TOOL_MOVE
let currentPaintingTile = 0
window.x = data

const tileImages = await Promise.all(
  data.tiles.map(x => 
    new Promise(resolve => {
      const image = new Image(16, 16)
      image.addEventListener('load', () => {
        resolve(image)
      })
      image.src = x.image
    })
  )
)

const handleWheelZoom = (event) => {
  event.preventDefault();
  const delta = Math.sign(-event.deltaY) * 10
  viewZoom = clamp(viewZoom + delta, 10, 400)
}

const handleMousedownPan = (event) => {
  mouseDrag(event, MOUSE_MIDDLE_BUTTON, () => {
    const x = viewOriginX
    const y = viewOriginY

    return {
      onDrag: (deltaX, deltaY) => {
        viewOriginX = x - deltaX
        viewOriginY = y - deltaY
      }
    }
  })
}

const handleMousedownMap = (event, map, $element) => {
  if (currentMap !== map || currentTool !== TOOL_MOVE) {
    return
  }
  
  mouseDrag(event, MOUSE_LEFT_BUTTON, () => {
    const x = map.x
    const y = map.y
    $element.classList.add('dragged')

    return {
      onDrag: (deltaX, deltaY) => {
        map.x = x + Math.round(deltaX / (TILE_SIZE * viewZoom * 0.01)) 
        map.y = y + Math.round(deltaY / (TILE_SIZE * viewZoom * 0.01))
      },
      onDone: () => {
        $element.classList.remove('dragged') 
      }
    }
  })
}

const addMap = () => {
  const width = 16
  const height = 16
  data.maps = [
    ...data.maps,
    currentMap = {
      name: `New map (${data.maps.length + 1})`,
      width,
      height,
      x: 0,
      y: 0,
      tilemap: Array(width * height).fill(currentPaintingTile)
    }
  ]
}

const copyMap = () => {
  data.maps = [
    ...data.maps,
    currentMap = {
      name: `${currentMap.name} (copy)`,
      width: currentMap.width,
      height: currentMap.height,
      x: currentMap.x + currentMap.width + 2,
      y: currentMap.y,
      tilemap: [...currentMap.tilemap]
    }
  ]
}

const removeMap = () => {
  if (confirm('Are you sure you want to remove map?')) {
    data.maps = data.maps.filter((map) => map !== currentMap)
    currentMap = null
  }
}

const updateMapSize = (width, height) => {
  if (!currentMap) {
    return
  }

  const newTilemap = Array(width * height).fill(currentPaintingTile)
  currentMap.width = width
  currentMap.height = height
  currentMap.tilemap = newTilemap
}

document.querySelector('#app').innerHTML = `
  <div class="world-editor">
    <div class="view" ${ref()
      .on('click', () => currentMap = null)
      .on('mousedown', handleMousedownPan)
      .on('wheel', handleWheelZoom)
    }>
      <div class="canvas" ${ref()
        .style('scale', () => viewZoom / 100)
        .style('translate', () => `${-viewOriginX}px ${-viewOriginY}px`)
        .repeat(() => data.maps, (map) => `
          <div class="map" ${ref()
            .class('current', () => map === currentMap)
            .style('width', () => `${map.width * TILE_SIZE}px`)
            .style('height', () => `${map.height * TILE_SIZE}px`)
            .style('left', () => `${map.x * TILE_SIZE}px`)
            .style('top', () => `${map.y * TILE_SIZE}px`)
            .on('click', (event) => {
              event.stopPropagation()
              currentMap = map
            })
            .on('mousedown', (event, el) => handleMousedownMap(event, map, el))
          }>
            <div class="name" ${ref()
              .property('innerText', () => map.name)
            }></div>
            <canvas class="tiles" ${ref()
              .on('pointerdown', (event) => {
                if (currentMap !== map || currentTool !== TOOL_PAINT) {
                  return
                }
                const index = Math.floor(event.offsetX / TILE_SIZE) + Math.floor(event.offsetY / TILE_SIZE) * map.width
                if (event.button === MOUSE_LEFT_BUTTON) {
                  event.stopPropagation()
                  map.tilemap[index] = currentPaintingTile
                }
              })
              .on('pointermove', (originalEvent) => {
                if (currentMap !== map || currentTool !== TOOL_PAINT) {
                  return
                }
                const events = originalEvent.getCoalescedEvents()
                for (let i = 0 ; i < events.length ; ++i) {
                  const event = events[i]
                  const index = Math.floor(event.offsetX / TILE_SIZE) + Math.floor(event.offsetY / TILE_SIZE) * map.width
                  if (event.buttons & MOUSE_LEFT_BUTTON_BIT) {
                    map.tilemap[index] = currentPaintingTile
                  }
                }
              })
              .set((canvas) => {
                const ctx = canvas.getContext('2d')
                canvas.width = canvas.clientWidth
                canvas.height = canvas.clientHeight
                ctx.clearRect(0, 0, canvas.width, canvas.height)
                
                for (let index = 0 ; index < map.tilemap.length ; ++index) {
                  const image = tileImages[map.tilemap[index]] || tileImages[0]
                  ctx.drawImage(
                    image, 
                    (index % map.width) * TILE_SIZE, 
                    Math.floor(index / map.width) * TILE_SIZE
                  )
                }
              }, () => map.tilemap.slice(), compareArrays) 
            }></canvas>
          </div>
        `)
      }></div>
    </div>

    <div class="controls">
      <fieldset>
        <legend>Toolbar</legend>

        <div ${ref()
          .property('innerText', () => `Current tool: ${currentTool}`)
        }></div>

        <button ${ref()
          .on('click', () => currentTool = TOOL_MOVE)
          .property('innerText', () => TOOL_MOVE)
        }></button>

        <button ${ref()
          .on('click', () => currentTool = TOOL_PAINT)
          .property('innerText', () => TOOL_PAINT)
        }></button>
        
        <button ${ref()
          .on('click', addMap)
        }>
          Add map
        </button>

        <button ${ref()
          .on('click', () => {
            console.log(JSON.stringify(data, null, 2))
          })
        }>
          Copy JSON data
        </button>
      </fieldset>

      <fieldset>
        <legend>Info</legend>

        <div>
          <div ${ref().property('innerText', () => `View origin: ${viewOriginX}, ${viewOriginY}`)}></div>
          <div ${ref().property('innerText', () => `Zoom: ${viewZoom}%`)}></div>
          <div ${ref().property('innerText', () => `[Debug] Number of refs: ${debugRefCounter()}`)}></div>
          <div ${ref().property('innerText', () => `[Debug] Live watchers: ${debugLiveWatchers()}`)}></div>
        </div>
      </fieldset>

      <div ${ref()
        .style('display', () => currentMap ? '' : 'none')
        .repeat(() => currentMap ?  [currentMap] : [], () => `
          <fieldset>
            <legend>Current map selected</legend>

            <div style="display: flex; flex-direction: column;">
              <label>
                Name:
                <input ${ref()
                  .property('value', () => currentMap.name)
                  .on('input', (event) => currentMap.name = event.target.value)
                }/>
              </label>

              <label>
                Width:
                <input type="number" step="0" min="1" ${ref()
                  .property('value', () => currentMap.width)
                  .on('change', (event) => updateMapSize(parseInt(event.target.value) || 1, currentMap.height))
                }/>
              </label>

              <label>
                Height:
                <input type="number" step="0" min="1" ${ref()
                  .property('value', () => currentMap.height)
                  .on('change', (event) => updateMapSize(currentMap.width, parseInt(event.target.value) || 1))
                }/>
              </label>

              <div ${ref().property('innerText', () => `X: ${currentMap.x}`)}></div>
              <div ${ref().property('innerText', () => `Y: ${currentMap.y}`)}></div>
            </div>
            
            <button ${ref().on('click', copyMap)}>
              Copy map
            </button>
            
            <button ${ref().on('click', removeMap)}>
              Remove map
            </button>
          </fieldset>
        `, (x) => x, compareArrays)}>
      </div>

      <fieldset>
        <legend>Tiles</legend>

        <div class="tile-palette" ${ref()
          .repeat(() => data.tiles, (tile, index) => `
            <div class="preview" ${ref()
              .class('selected', () => index === currentPaintingTile)
              .on('click', () => currentPaintingTile = index)
            }>
              <div ${ref()
                .property('innerText', () => tile.image.split('.').at(0).split('/').at(-1))
              }></div>
              <img style="image-rendering: pixelated;" ${ref()
                .property('src', () => tile.image)
              }/>
            </div>
          `)}
        ></div>
      </fieldset>
    </div>
  </div>
`
