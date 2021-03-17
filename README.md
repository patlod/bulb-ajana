# bulb-ajana
## Bulb 
A customised brainstorming tool that saves tons of paper (notebooks or plain DIN A4 printable..).

It's functionality is inspired by note taking apps and extended to enable better visual display of your thoughts and ideas while staying as simple as possible. (therefore: __A__ lmost __J__ ust __A__ nother __N__ otes __A__ pp)
Very similar to Apple Notes App for a simple reason, in my opinion one of the best notes applications out there, simply for the reason that creates the perfect combination of usability and simplicity.

![Note Editor](/images/bulb_note_editor.png)

__Next writing notes & search, Bulb offers two additional features:__
1. __Graph View__: You can switch between a note editor and a graph editor display where you can set connections between your notes. This should assist your work process in a mindmap way. _E.g. in a one man software development endeavor, during a more advanced writing process, systems analysis, investigation, information gathering, etc. you often find yourself in a situation, where you benefit from organising your thoughts in a map display or something similar, to see connections and change the perspective on the data, to minimise the efforts of your brain to do so and then focus its energy on the actual analytical thought process._
2. __Tagging__: Setting tags on the notes can assist that process as it allows to form any kind of categories on your data such as prioritisation, grouping, pointing out features, etc.

![Graph Editor](/images/bulb_graph_editor.png)

![Active Search](/images/bulb_active_search.png)

## Usage
Bulb works project based. You simply create one to several databases within your project (research, code, etc.), thus you have everything in one place. 

Data is stored as JSON format in file databases which can be stored anywhere on your computer. 
This introduces the following advantages: 
1. If you have a project of any kind you can conveniently store all your note data within the specific project. Thus you have your data in one place. 
2. You can directly access and modify your data also without your notes application.

## Development

__Installing the modules:__
```bash 
npm install 
```
__Running the development server:__
```bash
gulp start
```

## Architecture Overview
![App Architecture](/images/app_architecture.png)






