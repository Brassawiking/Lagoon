//@ts-check
import { repeat, ref, text } from '../../feppla/feppla.js'

const references = [
  "Atland",
  "Worship Site",
  "Gold Cave entrance",
  "Gold Cave B1",
  "Gold Cave Hallway 1",
  "Gold Cave B2",
  "Gold Cave Hallway 2",
  "Gold Cave Outdoors",
  "Elf Field",
  "Voloh",
  "Philips Castle entrance",
  "Philips Castle 1F",
  "Philips Castle 2F",
  "Philips Castle basement",
  "Philips Castle warp",
  "Dwarf Desert warp",
  "Dwarf Desert",
  "Denegul",
  "Dwarf Cave Corridor 1",
  "Dwarf Cave Corridor 2",
  "Dwarf Cave 1",
  "Dwarf Cave 2",
  "Silence Terrence",
  "Dwarf Cave Foyer",
  "Hobbit Valley",
  "Poper",
  "Poper House",
  "Poper Church",
  "Poper Church Basement",
  "Gnome Plain",
  "Siegfried Castle 1F",
  "Siegfried Castle 1F stairs",
  "Siegfried Castle 2F",
  "Siegfried Castle 3F",
  "Siegfried Castle basement",
  "Gnome Tree",
  "Lilaty",
  "Gnome Plain",
  "Ice Cave",
  "Nymph Spring",
  "Phantom Hill",
  "Phantom Hill summit",
  "Clouds",
  "Lagoon Castle entrance",
  "Lagoon Castle 1F",
  "Lagoon Castle 1F hallway 1",
  "Lagoon Castle 1F hallway 2",
  "Lagoon Castle 2F",
  "Lagoon Castle 2F hallway 1",
  "Lagoon Castle 2F hallway 2",
  "Lagoon Castle 3F",
  "Lagoon Castle 3F hallway 1",
  "Lagoon Castle 3F hallway 2",
  "Lagoon Castle 4F",
  "Lagoon Castle 4F hallway 1",
  "Lagoon Castle 4F hallway 2",
  "Lagoon Castle 5F",
  "Lagoon Castle 5F hallway 1",
  "Lagoon Castle 5F hallway 2",
  "Lagoon Castle dock",
  "Secret Place entrance",
  "Secret Place cottage",
  "Secret Place",
  "Atland (glitched)",
  "SAMSON's room",
  "NATELA's room",
  "EARDON's room",
  "DUMA's room",
  "THIMALE's room",
  "BATTLER's room",
  "Evil spirit's room 1",
  "Evil spirit's room 2",
  "ELLA's room",
  "King&Queen;'s chamber",
  "FELICIA's chamber"
]

export const Reference = () => `
  <div class="reference">

    <img loading="lazy" src="references/world-map-1.png">
    <img loading="lazy" src="references/world-map-2.png">

    ${repeat(() => references, (mapName, index) => `
      <div class="map-reference" map-width="?" map-height="?">
        <div>#${index} ${mapName}</div>
        <img loading="lazy" ${ref()
          .property('src', () => `references/maps-from-secret-place-homepage/${String(index).padStart(2, '0')}.png`)
          .on('load', (event) => {
            const width = event.target.clientWidth / 16
            const height = event.target.clientHeight / 16
            event.target.parentElement.setAttribute('map-width', width)
            event.target.parentElement.setAttribute('map-height', height)
          })
        }>
      </div>
    `)}
  </div>
`