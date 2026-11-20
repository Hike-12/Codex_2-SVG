# glyph/craft

A small, programmable studio for crisp SVG architecture diagrams. Describe a system in the Glyph DSL and see it update live, then export a portable SVG or a 2× PNG.

## Start locally

```sh
npm install
npm run dev
```

## Commands

- `npm test` runs the DSL, layout, and SVG export checks.
- `npm run build` type-checks the app and creates the production bundle in `dist/`.
- `npm run preview` serves the production bundle locally.

## Glyph DSL

```text
direction LR
theme blueprint

Client [shape: circle, icon: user, sub: "Web app"]
API [shape: pill, icon: gateway, badge: "EDGE"]
Database [shape: cylinder, icon: postgres]

Client -> API : "HTTPS"
API ~> Database : "Async write"
```

Supported edge operators are `->` for a directed connection, `~>` for an animated asynchronous flow, `=>` for a faster stream, and `<->` for a two-way connection. Nodes accept `label`, `sub`, `shape`, `icon`, `img`, `badge`, and `accent` attributes. Group related services with `group "Name" { ... }`.

The asset drawer contains 36 built-in vector icons. Uploaded images are stored in local browser storage and can be referenced as `img: @name`. Share links encode the current source in the URL hash. Dragged node positions are recorded in `// @pos` comments, so they travel with the diagram source.

## Stack

React, TypeScript, Vite, and hand-built SVG layout and routing. The app has no graph layout or icon framework dependency.
