# Lagoon

https://brassawiking.github.io/Lagoon/

## Bugs
- No credits given for references
- Philips castle 1F wrong height (also width?)

## Milestones

### Game
- [x] Rough basic camera and movement
- [x] Travel between maps

### Content
- [ ] Roughly block out all original maps 
  - 16 / 74 done

### Editor
- [x] Basic editing to create and block out maps
- [x] Canvas based rendering for maps
- [x] Support for entrances and exits betweens maps
  - [ ] Proper editing
- [x] Multiple tile layers in maps

### Feppla (Framework)
- [x] Full page static render
  - => .innerHTML
- [x] Full page static render with data 
  - => .innerHTML + tagged template literal
- [x] Event binding 
  - => Deferred binding by unique ref attribute
- [x] Unify initial static data render with dynamic update 
  - => live binding
- [x] Support derivative data 
  - => comparison function for set
- [x] Daisy-chained API to reduce refs 
  - => Refactored API and implementation
- [x] Support conditional rendering in templates
  - => Referencing by comment and text nodes
- [ ] Scope reference queries to element being rendered into (Over-optimization?)
