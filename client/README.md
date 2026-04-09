# Client

This directory contains the **TypeScript source code** for browser-side behavior.

The code here is bundled with **esbuild**, and the compiled JavaScript is written into Django's static directory.

## Project structure

Client source code lives in: `client/src`

Django HTML templates live in:

* [crossword/templates/crossword](../crossword/templates/crossword/)

    ```
    index.html
    puzzle.html
    privacy.html
    ```

Static assets served by Django live in:

* [crossword/static/crossword](../crossword/static/crossword/)

    ```
    css/
    icons/
    imgs/
    dist/   (compiled JS bundles from client/src)
    ```

Compiled JavaScript bundles are written to:

* [crossword/static/crossword/dist](../crossword/static/crossword/dist/)

## Mental model

* **client/src** → TypeScript source code
* **crossword/static/crossword/** → CSS, icons, images
* **crossword/static/crossword/dist/** → compiled JavaScript bundles
* **crossword/templates/crossword/** → Django HTML templates

If you're looking for the HTML page structure, start here:  
* [crossword/templates/crossword](../crossword/templates/crossword/)