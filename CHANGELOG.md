# Change Log

## Create polygon drawing tool in Cesium

### 0.1.0 - 2022-11-16

- Start

### 0.1.0 - 2022-11-17

- Struct a project with react, cesium

### 0.2.0 - 2022-11-18

- Add common events and maptool implementations
- Add primitives for polygon and polyline
- Add a mixin named drawingTools for polygon drawing
- Add polygon drawing tool like as default drawing: mouse left click -> create vertex, mouse right click -> finish drawing

### 0.2.1 - 2022-11-21

- Fix review issue
- Add marker(following mouse cursor) on drawing.
- Event implementation
- Fix extendable line style

### 0.2.2 - 2022-11-22

- Add comments
- Adding snap functionalities (working on)

### 0.2.3 - 2022-11-23

- Add snap functionality

### 0.2.4 - 2022-11-24

- Dragging vertex
- Creating a vertex on edge

### 0.2.5 - 2022-11-25

- Finished all functionalities

### 0.2.6 - 2022-11-26

#### Fixed issues on MR [1](https://gitlab.com/aarav-unmanned/platform-dev/gis-development/-/merge_requests/1)

- Use the arrow function (https://gitlab.com/aarav-unmanned/platform-dev/gis-development/-/merge_requests/1#note_1178775358)
- Remove window object, use React Context (https://gitlab.com/aarav-unmanned/platform-dev/gis-development/-/merge_requests/1#note_1178819202)
- Not run in a non-dev environment (https://gitlab.com/aarav-unmanned/platform-dev/gis-development/-/merge_requests/1#note_1185705309)

#### Merge AaravMapViewer and AaravViewer (https://gitlab.com/aarav-unmanned/platform-dev/gis-development/-/merge_requests/1#note_1185718048)

#### Add an example for "Why do we need to raise this event here?" (https://gitlab.com/aarav-unmanned/platform-dev/gis-development/-/merge_requests/1#note_1185728653)

### 0.2.7 - 2022-11-29

- fix flickering polygon issue
