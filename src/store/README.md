The store is a single object which persists application state and project data. It is mutated and accessed by actions and selectors respectively.

The store is a concept from [Redux](http://redux.js.org/), which explains it in great detail.

-

Our store is enhanced by some custom middleware / reducers:

- autosave (checking for specific events, and debouncing saves)
  - in the future, move to saving on specific events (e.g. change sequence), and imperative debouncing for others (metadata / structure changes)

- undo/redo (actions can add field `undoable: true`, and there is an undoReducerEnhancer (added to blocks / projects reducers)

- freezing (shallow Object.freeze of store object, so not mutated)

- saveLastAction, which saves the last action and exposes to extensions which subscribe to the store

-

Instance Map is used for simple caching behavior, to compare object references for a save to see if project has changed.
Will be greatly simplified once project structure is migrated to rollup.