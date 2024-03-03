import { ref, debugLiveWatchers, debugRefCounter, compareArrays } from './framework2.js'
import { clamp, mouseDrag } from './utils.js'
import rawData from '../data.json' assert { type: 'json' }

const MOUSE_LEFT_BUTTON = 0
const MOUSE_MIDDLE_BUTTON = 1
const TILE_SIZE = 16

const MOUSE_LEFT_BUTTON_BIT = 1

const data = structuredClone(rawData)
let viewOriginX = -50
let viewOriginY = -50
let viewZoom = 100
let currentPaintingTile = 1
window.x = data

const handleWheelZoom = (event) => {
  event.preventDefault();
  const delta = Math.sign(-event.deltaY) * 10
  viewZoom = clamp(viewZoom + delta, 50, 400)
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
  data.maps = [
    ...data.maps,
    {
      name: 123,
      width: 8,
      height: 8,
      x: 5,
      y: 34,
      tilemap: []
    }
  ]
}

const removeMap = () => {
  data.maps = data.maps.slice(0, -1)
}

document.querySelector('#app').innerHTML = `
  <div class="world-editor">
    <div class="world-editor--view" ${ref()
      .on('mousedown', handleMousedownPan)
      .on('wheel', handleWheelZoom)
    }>
      <div class="world-editor--canvas" ${ref()
        .style('scale', () => viewZoom / 100)
        .style('translate', () => `${-viewOriginX}px ${-viewOriginY}px`)
        .repeat(() => data.maps, (map) => `
          <div class="world-editor--map" ${ref()
            .on('mousedown', (event, el) => handleMousedownMap(event, map, el))
            .style('width', () => `${map.width * TILE_SIZE}px`)
            .style('height', () => `${map.height * TILE_SIZE}px`)
            .style('left', () => `${map.x * TILE_SIZE}px`)
            .style('top', () => `${map.y * TILE_SIZE}px`)
          }>
            <div class="world-editor--map-name" ${ref()
              .property('innerText', () => map.name)
            }></div>
            <svg class="tiles" ${ref()
              .repeat(() => map.tilemap, (_, index) => `
                <image class="tile" ${ref()
                  .attribute('href', () => (data.tiles[map.tilemap[index]] || data.tiles[0]).image)
                  .attribute('x', () => (index % map.width) * TILE_SIZE)
                  .attribute('y', () => (index / map.width | 0) * TILE_SIZE)
                  .on('mousedown', (event) => {
                    if (event.button === MOUSE_LEFT_BUTTON) {
                      event.stopPropagation()
                      map.tilemap[index] = currentPaintingTile
                    }
                  })
                  .on('mouseover', (event) => {
                    if (event.buttons & MOUSE_LEFT_BUTTON_BIT) {
                      map.tilemap[index] = currentPaintingTile
                    }
                  })
                }/>
              `, (_, index) => index)
            }></svg>
          </div>
        `)
      }></div>
    </div>

    <div class="world-editor--controls">
      <div class="canvas-stats">
        <div ${ref().property('innerText', () => `Number of refs: ${debugRefCounter()}`)}></div>
        <div ${ref().property('innerText', () => `Live watchers: ${debugLiveWatchers()}`)}></div>
        <div ${ref().property('innerText', () => `View origin: ${viewOriginX}, ${viewOriginY}`)}></div>
        <div ${ref().property('innerText', () => `Zoom: ${viewZoom}%`)}></div>
      </div>

      <button ${ref().on('click', addMap)}>
        Add map
      </button>

      <button ${ref().on('click', removeMap)}>
        Remove map
      </button>

      <fieldset style="display: flex; flex-direction: column; gap: 10px;">
        <legend>Painting</legend>
        <input type="number" step="0" ${ref()
          .property('value', () => currentPaintingTile)
          .on('input', (event) => {
            currentPaintingTile = Number(event.target.value) || 0
          })
        }/>
        <div ${ref().property('innerText', () => (data.tiles[currentPaintingTile] || data.tiles[0]).name)}></div>
        <img style="image-rendering: pixelated;" ${ref()
          .property('src', () => (data.tiles[currentPaintingTile] || data.tiles[0]).image)
        }/>
      </fieldset>
    </div>
  </div>
`

// 1. [DONE] Full page static render => .innerHTML
// 2. [DONE] Full page static render with data => .innerHTML + tagged template literal
// 3. [DONE] Event binding => Delayed binding by unique ref attribute
// 4. [DONE] Unify initial static data render with dynamic update => live binding
// 5. [DONE] Support derivative data => comparison function for set
// 6. [DONE] Daisy-chained API to reduce refs => Refactored API and implementatoin
// 7. Support templating for conditional renderering


