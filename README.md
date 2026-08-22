# JSON Atlas

A highly sophisticated, privacy-first, fully local JSON interactive visualizer.

## The Problem
Reading massive, nested JSON payloads from APIs is a nightmare. Existing visualizers either require you to upload your sensitive company data to a random server, or they are too simplistic.

## The Solution
JSON Atlas recursively parses your JSON into an Abstract Syntax Tree (AST) and renders it instantly as a physics-based, draggable node-graph using Vis.js. 

It handles Arrays, Objects, and Leaf Values with distinct topologies. It completely runs client-side in the browser, meaning your data never leaves your machine.

## Usage
Simply open `index.html`, paste your JSON, and explore the interactive atlas map of your data architecture.
