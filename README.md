# Lagoon

https://brassawiking.github.io/Lagoon/

## Bugs
- Paint tool can bleed into wrong index at the edges

## Milestones

### Content
- [ ] Roughly block out all original maps 
  - 16 / 75 done

### Editor
- [x] Basic editing to create and block out maps
- [x] Canvas based rendering for maps
- [ ] Multiple tile layers in maps

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
- [x] Support templating for conditional renderering
  - => Referencing by comment and text nodes
- [ ] Scope reference queries to element being rendered into
