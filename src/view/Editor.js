import { ref, debugLiveWatchers, debugRefCounter, debugTemplateCounter, compareArrays, text, repeat, iffy } from '../../feppla/feppla.js'
import { clamp, mouseDrag, loadImage } from '../utils.js'
import rawData from '../../data/data.json' with { type: 'json' }

const MOUSE_LEFT_BUTTON = 0
const MOUSE_MIDDLE_BUTTON = 1
const TILE_SIZE = 16

const MOUSE_LEFT_BUTTON_BIT = 1

const TOOL_MOVE = 'Move'
const TOOL_PAINT = 'Paint'
const TOOL_ENTRANCE = 'Entrance'
const TOOL_EXIT = 'Exit'

const data = structuredClone(rawData)
let viewOriginX = -50
let viewOriginY = -50
let viewZoom = 100
let currentMap
let currentTool = TOOL_MOVE
let currentPaintingTile = 0
let showCollide = true
window.x = data

data.maps = data.maps.map((map) => {
  if (!map.entrances.length) {
    console.log(`Map "${map.name}" missing entrance, adding automatically`)
    map.entrances.push({
      x: 128,
      y: 112
    })
  }

  map.exits.forEach(exit => {
    exit.target = {
      mapIndex: 0,
      entranceIndex: 0
    }
  })

  map.entrances.forEach(entrance => {
    entrance.x = Math.floor(entrance.x / 8) * 8
    entrance.y = Math.floor(entrance.y / 8) * 8
  })

  return {
    name: map.name,
    width: map.width,
    height: map.height,
    x: map.x,
    y: map.y,
    entrances: map.entrances,
    exits: map.exits,
    tilemap: map.tilemap
  }
})

const tileImages = await Promise.all(
  data.tiles.map(x => loadImage(x.image))
)

export const resources = {
  data,
  tileImages
}

const handleWheelZoom = (event) => {
  event.preventDefault();
  const delta = Math.sign(-event.deltaY) * 5
  viewZoom = clamp(viewZoom + delta, 10, 400)
}

const handleMousedownPan = (event) => {
  mouseDrag(event, MOUSE_MIDDLE_BUTTON, () => {
    const x = viewOriginX
    const y = viewOriginY

    return {
      onDrag: (deltaX, deltaY) => {
        viewOriginX = x - Math.round(deltaX * 100 / viewZoom)
        viewOriginY = y - Math.round(deltaY * 100 / viewZoom)
      }
    }
  })
}

const handleMoveMap = (event, map, $element) => {
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

const handleEditMap = (event, map) => {
  if (currentMap !== map) {
    return
  }
  
  if (currentTool === TOOL_PAINT) {
    const index = 
      clamp(Math.floor(event.offsetX / TILE_SIZE), 0, map.width - 1) 
      + clamp(Math.floor(event.offsetY / TILE_SIZE), 0, map.height - 1) * map.width

    if (event.buttons & MOUSE_LEFT_BUTTON_BIT) {
      event.stopPropagation()
      map.tilemap[index] = currentPaintingTile
    }
  }

  if (currentTool === TOOL_ENTRANCE) {
    if (event.buttons & MOUSE_LEFT_BUTTON_BIT) {
      event.stopPropagation()
      map.entrances = [{
        x: clamp(Math.floor(event.offsetX / 8) * 8, 0, (map.width * TILE_SIZE) - 1),
        y: clamp(Math.floor(event.offsetY / 8) * 8, 0, (map.height * TILE_SIZE) - 1)
      }]
    }
  }

  if (currentTool === TOOL_EXIT) {
    if (event.buttons & MOUSE_LEFT_BUTTON_BIT) {
      event.stopPropagation()
      map.exits = [{
        x: clamp(Math.round(event.offsetX / TILE_SIZE), 0, map.width - 1),
        y: clamp(Math.round(event.offsetY / TILE_SIZE), 0, map.height - 1),
        width: 4,
        height: 4
      }]
    }
  }
}

const drawCalls = []
const renderMap = (canvas, map) => {
  drawCalls.push(() => {
    const ctx = canvas.getContext('2d')
    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    for (let index = 0 ; index < map.tilemap.length ; ++index) {
      const tileIndex = map.tilemap[index]
      const tile = data.tiles[tileIndex]
      const image = tileImages[map.tilemap[index]] || tileImages[0]
      const x = (index % map.width) * TILE_SIZE
      const y = Math.floor(index / map.width) * TILE_SIZE
      ctx.drawImage(
        image, 
        x, 
        y
      )

      if (showCollide && tile.collide) {
        ctx.fillStyle = '#ff000080'
        ctx.fillRect(
          x,
          y,
          TILE_SIZE,
          TILE_SIZE,
        )
      }
    }

    for (let i = 0 ; i < map.entrances.length ; ++i) {
      const entrance = map.entrances[i]
      ctx.beginPath()
      ctx.arc(entrance.x, entrance.y, 8, 0, 2 * Math.PI, false)
      ctx.fillStyle = '#00ff0080'
      ctx.fill()
    }

    for (let i = 0 ; i < map.exits.length ; ++i) {
      const exit = map.exits[i]
      ctx.fillStyle = '#ff00ff80'
      ctx.fillRect(
        exit.x * TILE_SIZE,
        exit.y * TILE_SIZE,
        exit.width * TILE_SIZE,
        exit.height * TILE_SIZE,
      )
    }
  })
}

export const Editor = () => `
  <div class="editor">
    <div class="view" ${ref()
      .on('click', () => currentMap = null)
      .on('mousedown', handleMousedownPan)
      .on('wheel', handleWheelZoom)
    }>
      <div class="canvas" ${ref()
        .style('scale', () => viewZoom / 100)
        .live(() => {
          if (drawCalls.length) {
            const drawCall = drawCalls.shift()
            drawCall()
          }
        })
      }>
        ${repeat(() => data.maps, (map) => `
          <div class="map" ${ref()
            .class('current', () => map === currentMap)
            .style('width', () => `${map.width * TILE_SIZE}px`)
            .style('height', () => `${map.height * TILE_SIZE}px`)
            .style('left', () => `${map.x * TILE_SIZE - viewOriginX}px`)
            .style('top', () => `${map.y * TILE_SIZE - viewOriginY}px`)
            .on('click', (event) => {
              event.stopPropagation()
              currentMap = map
            })
            .on('mousedown', (event, el) => handleMoveMap(event, map, el))
          }>
            <div class="name">
              ${text(() => map.name)}
            </div>
            <canvas class="tiles" ${ref()
              .on('pointerdown', (event) => handleEditMap(event, map))
              .on('pointermove', (originalEvent) => {
                const events = originalEvent.getCoalescedEvents()
                for (let i = 0 ; i < events.length ; ++i) {
                  handleEditMap(events[i], map)
                }
              })
              .set((canvas) => renderMap(canvas, map), () => map.tilemap.slice(), compareArrays) 
              .set((canvas) => renderMap(canvas, map), () => map.entrances.slice(), compareArrays) 
              .set((canvas) => renderMap(canvas, map), () => map.exits.slice(), compareArrays) 
              .set((canvas) => renderMap(canvas, map), () => showCollide) 
            }></canvas>
          </div>
        `)}
      </div>
    </div>

    <div class="number-of-maps-goal">
      Number of maps goal! ${text(() => data.maps.length)} of 74 blocked out!
      <progress ${ref()
        .property('value', () => data.maps.length / 74)
      }></progress>
    </div>

    <div class="controls">
      <fieldset>
        <legend>Toolbar</legend>

        <div>
          Current tool: <span style="color: #ffff00;">${text(() => currentTool)}</span>
        </div>

        <button ${ref().on('click', () => currentTool = TOOL_MOVE)}>
          ${TOOL_MOVE}
        </button>

        <button ${ref().on('click', () => currentTool = TOOL_PAINT)}>
          ${TOOL_PAINT}
        </button>

        <button ${ref().on('click', () => currentTool = TOOL_ENTRANCE)}>
          ${TOOL_ENTRANCE}
        </button>
        
        <button ${ref().on('click', () => currentTool = TOOL_EXIT)}>
          ${TOOL_EXIT}
        </button>
        
        <button ${ref().on('click', addMap)}>
          Add map
        </button>

        <button ${ref().on('click', () => { console.log(JSON.stringify(data, null, 2)) })}>
          Copy JSON data
        </button>
      </fieldset>

      <fieldset>
        <legend>View</legend>

        <label>
          <div>
            <input type="checkbox" style="width: auto" ${ref()
              .property('checked', () => showCollide)
              .on('change', () => showCollide = !showCollide)
            }>
            Show tile collide
          </div>
        </label>
      </fieldset>

      <fieldset>
        <legend>Info</legend>

        <table>
          <tr>
            <th>View origin</th>
            <th>:</th>
            <td>${text(() => viewOriginX)}, ${text(() => viewOriginY)}</td>
          </tr>
          <tr>
            <th>Zoom</th>
            <th>:</th>
            <td>${text(() => viewZoom)}%</td>
          </tr>
          <tr>
            <th>[Debug] Used refs</th>
            <th>:</th>
            <td>${text(() => debugRefCounter())}</td>
          </tr>
          <tr>
            <th>[Debug] Used templates</th>
            <th>:</th>
            <td>${text(() => debugTemplateCounter())}</td>
          </tr>
          <tr>
            <th>[Debug] Live watchers</th>
            <th>:</th>
            <td>${text(() => debugLiveWatchers())}</td>
          </tr>
        </table>
      </fieldset>

      ${iffy(() => currentMap, () => `
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
              <input type="number" min="1" ${ref()
                .property('value', () => currentMap.width)
                .on('change', (event) => updateMapSize(parseInt(event.target.value) || 1, currentMap.height))
              }/>
            </label>

            <label>
              Height:
              <input type="number" min="1" ${ref()
                .property('value', () => currentMap.height)
                .on('change', (event) => updateMapSize(currentMap.width, parseInt(event.target.value) || 1))
              }/>
            </label>

            <div>X: ${text(() => currentMap.x)}</div>
            <div>Y: ${text(() => currentMap.y)}</div>
          </div>
          
          <label>
            Fill tile index:
            <input type="number" min="0" value="0" ${ref()
              .property('max', () => data.tiles.length - 1)
              .on('keypress', (event) =>  { 
                if (event.key === 'Enter') {
                  currentMap.tilemap = currentMap.tilemap.map(x => x == event.target.value ? currentPaintingTile : x)
                } 
              })
            }>
          </label>

          <button ${ref().on('click', copyMap)}>
            Copy map
          </button>
          
          <button ${ref().on('click', removeMap)}>
            Remove map
          </button>
        </fieldset>
      `)}

      <fieldset>
        <legend>Tiles (${data.tiles.length})</legend>

        <div class="tile-palette"> 
          ${repeat(() => data.tiles.toSorted((a, b) => a.image.localeCompare(b.image)), (tile) => `
            <div class="preview" ${ref()
              .class('selected', () => tile === data.tiles[currentPaintingTile])
              .on('click', () => currentPaintingTile = data.tiles.indexOf(tile))
            }>
              <img draggable="false" loading="lazy" ${ref()
                .property('src', () => tile.image)
              }/>
              <div>
                ${text(() => `${tile.image.split('.').at(0).split('/').at(-1)} (${data.tiles.indexOf(tile)})`)}
              </div>
            </div>
          `, undefined, compareArrays)}
        </div>
      </fieldset>
    </div>
  </div>
`