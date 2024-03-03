import { on, style, property, repeat, attribute, debugLiveWatchers } from './framework.js'
import { clamp, mouseDrag } from './utils.js'
import rawData from '../data.json' assert { type: 'json' }

const MOUSE_LEFT_BUTTON = 0
const MOUSE_MIDDLE_BUTTON = 1
const TILE_SIZE = 16

const data = structuredClone(rawData)
let viewOriginX = -50
let viewOriginY = -50
let viewZoom = 100
window.x = data

for (const map of data.maps) {
  map.tilemap = Array.from({length: map.width * map.height}, (_, i) => map.tilemap[i] || 0)
}

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
    <div class="world-editor--view" 
      ${on('mousedown', handleMousedownPan)}
      ${on('wheel', handleWheelZoom)}
    >
      <div class="world-editor--canvas"
        ${style('scale', () => viewZoom / 100)}
        ${style('translate', () => `${-viewOriginX}px ${-viewOriginY}px`)}
        ${repeat(() => data.maps, (map) => `
          <div class="world-editor--map"
            ${on('mousedown', (event, el) => handleMousedownMap(event, map, el))}
            ${style('width', () => `${map.width * TILE_SIZE}px`)}
            ${style('height', () => `${map.height * TILE_SIZE}px`)}
            ${style('left', () => `${map.x * TILE_SIZE}px`)}
            ${style('top', () => `${map.y * TILE_SIZE}px`)}
          >
            <div class="world-editor--map-name"
              ${property('innerText', () => map.name)}
            ></div>
            <svg class="tiles"
              ${repeat(() => map.tilemap, (tileId, index) => `
                <image class="tile"
                  ${attribute('href', () => (data.tiles[tileId] || data.tiles[0]).image)}
                  ${attribute('x', () => (index % map.width) * TILE_SIZE)}
                  ${attribute('y', () => (index / map.width | 0) * TILE_SIZE)}
                />
              `, (_, index) => index)}
            ></svg>
          </div>
        `)}
      ></div>
    </div>

    <div class="world-editor--controls">
      <div class="canvas-stats">
        <div ${property('innerText', () => `Live watchers: ${debugLiveWatchers()}`)}></div>
        <div ${property('innerText', () => `View origin: ${viewOriginX}, ${viewOriginY}`)}></div>
        <div ${property('innerText', () => `Zoom: ${viewZoom}%`)}></div>
      </div>

      <button ${on('click', addMap)}>
        Add map
      </button>

      <button ${on('click', removeMap)}>
        Remove map
      </button>
    </div>
  </div>
`

// 1. [DONE] Full page static render => .innerHTML
// 2. [DONE] Full page static render with data => .innerHTML + tagged template literal
// 3. [DONE] Event binding => Delayed binding by unique ref attribute
// 4. [DONE] Unify initial static data render with dynamic update => live binding
// 5. [DONE] Support derivative data => comparison function for set
// 6. Daisy-chained API to reduce refs
