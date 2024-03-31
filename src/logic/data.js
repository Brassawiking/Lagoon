//@ts-check

export class Data {
  /**
   * @param {Data} data
   */
  constructor(data) {
    /** @type {Tile[]} */
    this.tiles = data.tiles
    
    /** @type {Map[]} */
    this.maps = data.maps
  }
}

export class Tile {
  /**
   * @param {Tile} tile
   */
  constructor(tile) {
    /** @type {string} */
    this.image = tile.image
    
    /** @type {boolean | undefined} */
    this.collide = tile.collide
  }
}

export class Map {
  /**
   * @param {Map} map
   */
  constructor(map) {
    /** @type {string} */
    this.name = map.name

    /** @type {number} */
    this.width = map.width

    /** @type {number} */
    this.height = map.height

    /** @type {number} */
    this.x = map.x

    /** @type {number} */
    this.y = map.y

    /** @type {Entrance[]} */
    this.entrances = map.entrances

    /** @type {Exit[]} */
    this.exits = map.exits

    /** @type {Tilemaps} */
    this.tilemaps = map.tilemaps
  }
}

export class Entrance {
  /**
   * @param {Entrance} entrance
   */
  constructor(entrance) {
    /** @type {number} */
    this.x = entrance.x

    /** @type {number} */
    this.y = entrance.y
  }
}

export class Exit {
  /**
   * @param {Exit} exit
   */
  constructor(exit) {
    /** @type {number} */
    this.width = exit.width

    /** @type {number} */
    this.height = exit.height

    /** @type {number} */
    this.x = exit.x

    /** @type {number} */
    this.y = exit.y

    /** @type {ExitTarget} */
    this.target = exit.target
  }
}

export class ExitTarget {
  /**
   * @param {ExitTarget} target
   */
  constructor(target) {
    /** @type {number} */
    this.mapIndex = target.mapIndex

    /** @type {number} */
    this.entranceIndex = target.entranceIndex
  }
}

export class Tilemaps {
  /**
   * @param {Tilemaps} tilemaps
   */
  constructor(tilemaps) { 
    /** @type {number[]} */
    this.base = tilemaps.base

    /** @type {number[]} */
    this.overlay = tilemaps.overlay
  }
}