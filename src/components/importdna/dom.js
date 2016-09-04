
/**
 * simplest regex for identifying a tag string versus a selector string
 * @type {RegExp}
 */
const tagRegex = new RegExp('\s*<([^>]+)>');

/**
 * getters and setters are created for these properties. The class does not attempt to distinguish between
 * Node, Element, HTMLElement etc so these properties may or may not exist on any particular member of our list.
 * Read only properties are prefixed with 'r+'.
 * For ElementList's with exactly one item, the getter returns the value returned by the native property.
 * For ElementList's containing more than one item an array of results is returned.
 * Empty ElementList's return null
 * @type {string[]}
 */
const properties = [
  // Node, properties
  'r+childNodes',
  'r+firstChild',
  'r+lastChild',
  'r+nextSibling',
  'r+previousSibling',
  'r+nodeName',
  'r+nodeType',
  'nodeValue',
  'r+ownerDocument',
  'r+parentElement',
  'r+parentNode',
  'textContent',
  // Element properties
  'r+attributes',
  'r+childElementCount',
  'r+children',
  'r+firstElementChild',
  'r+lastElementChild',
  'r+classList',
  'className',
  'r+clientTop',
  'r+clientLeft',
  'r+clientWidth',
  'r+clientHeight',
  'id',
  'innerHTML',
  'outerHTML',
  'innerText',
  'outerText',
  'r+localName',
  'r+scrollWidth',
  'r+scrollHeight',
  'scrollTop',
  'scrollLeft',
  'name',
  'title',
  'value',
];

/**
 * methods for native Node/Element/HTMLElement objects that we create pass through functions for.
 * Rules are the same as for getter properties i.e. an array is returned for lists with items > 1
 * @type {Array}
 */
const methods = [
  'appendChild',
  'removeChild',
  'replaceChild',
  'click',
  'cloneNode',
  'compareDocumentPosition',
  'contains',
  'hasChildNodes',
  'insertBefore',
  'getBoundingClientRect',
  'getAttribute',
  'getAttributeNS',
  'setAttribute',
  'setAttributeNS',
  'addEventListener',
  'removeEventListener',
  'normalize',
  'focus',
  'blur',
  'querySelector',
  'querySelectorAll',
];

/**
 * the actual elements class which inherits from native Array
 */
class ElementList extends Array {
  constructor(...args) {
    super();
    // this will be the elements we wrap
    let elements = [];
    // arg 0 is a string
    const isString = typeof(args[0]) === 'string';
    // arg 0 is a tag
    const isTag = isString && tagRegex.exec(args[0].trim());

    // first option is first argument is a CSS selector string and second optional element is the root element to apply the selector to.
    if ((args.length === 1 || args.length == 2) && isString && !isTag) {
      const root = args.length === 1 ? document : this.getNode(args[1]);
      // return a proxy using the results of the selector as the initial array
      elements = Array.from(root.querySelectorAll(args[0]));
    } else {
      // second option is that args if just a string e.g. '<div class="xyz"><p>Title</p></div>'
      // (white space is trimmed to determine if this might be a tag)
      if (args.length === 1 && isTag) {
        // use a temporary DIV and insertAdjacentHTML to construct the DOM
        const d = document.createElement('DIV');
        d.insertAdjacentHTML('afterbegin', args[0]);
        // normalize the context to remove extraneous white space
        d.normalize();
        // setup elements to wrap
        elements = Array.from(d.childNodes);
        // remove all the children of the temporary div, so that the newly created top level nodes will be unparented
        while (d.firstChild) d.removeChild(d.firstChild);
      } else {
        // only remaining option is that each argument is a DOM node or possible another elements list
        args.forEach(arg => {
          if (arg instanceof ElementList) {
            elements = elements.concat(arg);
          } else {
            elements.push(arg);
          }
        });
        elements = args;
      }
    }
    // push all the elements list, no matter how it was created onto ourselves.
    this.push(...elements);

    // setup read/write properties
    properties.forEach(p => {
      // property can be a name or 'r+' name for read only properties
      const tokens = p.split('+');
      const readOnly = tokens.length === 2 && tokens[0] === 'r';
      const name = readOnly ? tokens[1] : tokens[0];
      // create getter and optional setter
      const newProperty = Object.assign({
        get: this.genericGetter.bind(this, name),
      }, readOnly ? {} : {
        set: this.genericSetter.bind(this, name),
      });
      Object.defineProperty(this, name, newProperty);
    });

    // setup methods
    methods.forEach(name => {
      this[name] = this.genericMethod.bind(this, name);
    });


  }

  /**
   * all generic methods redirect here
   * @param name
   * @param args
   */
  genericMethod(name, ...args) {
    if (this.length === 0) {
      return undefined;
    }
    if (this.length === 1) {
      return this.el[name].call(this.el, ...args);
    }
    return this.map(node => node[name].call(node, ...args));
  }

  /**
   * generic getter
   * @param name - the property to return.
   */
  genericGetter(name) {
    if (this.length === 0) {
      return undefined;
    }
    if (this.length === 1) {
      return this.el[name];
    }
    return this.map(node => node[name]);
  }

  /**
   * generic setter
   * @param name
   * @param value
   */
  genericSetter(name, value) {
    this.forEach(n => n[name] = value);
  }

  /**
   * apply the key/value pairs in hash to all our elements
   */
  setStyles(hash) {
    this.forEach(element => {
      if (element.nodeType === Node.ELEMENT_NODE) {
        Object.keys(hash).forEach(key => {
          element.style[key] = hash[key];
        });
      }
    });
    return this;
  }
  /**
   * if the obj is a ElementList then return the first member otherwise assume
   * the object is a node and return it.
   */
  getNode(obj) {
    if (obj instanceof ElementList) return obj[0];
    return obj;
  }
  /**
   * if the obj is a ElementList return it, otherwise wrap the node in a ElementList
   */
  getNodes(obj) {
    if (obj instanceof ElementList) return obj;
    return new ElementList(obj);
  }
  /**
   * return the native el of the first element in the list
   */
  get el() {
    return this[0];
  }

  /**
   * remove all elements from the elements in our list
   */
  empty() {
    this.forEach(element => {
      while (element.firstChild) {
        element.removeChild(element.firstChild);
      }
    });
    return this;
  }

  /**
   * remove all our nodes from their parents
   */
  remove() {
    this.forEach(node => {
      if (node.parentNode) {
        node.parentNode.removeChild(node);
      }
    });
    return this;
  }

  /**
   * iterate every node and all their children looking for data-ref="name" attributes.
   * Assign targetObject[name] to the matching DOM element.
   * At the same time look for data-event-* attributes and add event listeners.
   * e.g. data-event-input="onInput" will call
   * element.addEventListener('input', targetObject["onInput"].bind(targetObject))
   * NOTE: The event handlers are not bound ( e.g. using .bind ) so you should use
   * an es7 fat arrow function to ensure binding.
   */
  zip(targetObject) {
    // we could use a CSS selector to find the data-ref attributes but for
    // event attribute (data-event-*) there is no available selector so
    // we walk the tree of elements using a stack.
    this.traverse(element => {
      if (element.nodeType === Node.ELEMENT_NODE) {
        // adopt references
        const name = element.getAttribute('data-ref');
        if (name) {
          targetObject[name] = new ElementList(element);
        }
        // add event handlers
        [...element.attributes,].forEach(attr => {
          const tokens = attr.localName.split('-');
          if (tokens[0] === 'data' && tokens[1] === 'event') {
            element.addEventListener(tokens[2], targetObject[attr.value]);
          }
        });
      }
    });
    return this;
  }
  /**
   * reverse the actions of zip. Remove references and remove event listeners
   */
  unzip(targetObject) {
    this.traverse(element => {
      if (element.nodeType === Node.ELEMENT_NODE) {
        // remove references
        const name = element.getAttribute('data-ref');
        if (name) {
          delete targetObject[name];
        }
        // remove event handlers
        [...element.attributes,].forEach(attr => {
          const tokens = attr.localName.split('-');
          if (tokens[0] === 'data' && tokens[1] === 'event') {
            element.removeEventListener(tokens[2], targetObject[attr.value]);
          }
        });
      }
    });
    return this;
  }
  /**
   * utility function. Used in zip, unzip for example. Traverses all nodes and their
   * children in the list invoking the callback for each one
   */
  traverse(callback) {
    this.forEach(node => {
      let stack = [node,];
      while (stack.length) {
        const element = stack.pop();
        callback.call(this, element);
        stack = stack.concat(...element.children);
      }
    });
    return this;
  }

  /**
   * add white space separated classes to our elements classList
   */
  addClasses(classes) {
    classes.split(' ')
    .filter(className => className.trim().length)
    .forEach(className => {
      this.forEach(element => {
        element.classList.add(className);
      });
    });
    return this;
  }

  /**
   * remove white space separated class names from the classList of each node
   * @param classes
   * @returns {ElementList}
   */
  removeClasses(classes) {
    classes.split(' ')
    .filter(className => className.trim().length)
    .forEach(className => {
      this.forEach(element => {
        element.classList.remove(className);
      });
    });
    return this;
  }

  /**
   * a common usage and worthy of a method. Add the given classes
   * to our items if the condition is truthy, otherwise remove them
   * @param classes
   * @param condition
   */
  classesConditional(classes, condition) {
    if (condition) {
      this.addClasses(classes);
    } else {
      this.removeClasses(classes);
    }
    return this;
  }

  /**
   * return a new ElementList contain a deep cloned copy
   * each node
   */
  clone() {
    return new ElementList([...this.map(n => n.cloneNode(true)),]);
  }

  /**
   * called addEventListener for each element in the list,
   * @param event
   * @param handler
   */
  on(event, handler, capture = false) {
    // listeners group by event name is an object ( since event is a string ) but the
    // handlers for each event are stored in a map which can take a function as a key.
    this.listeners = this.listeners || {};
    this.listeners[event] = this.listeners[event] || new Map();
    this.listeners[event].set(handler, {handler, capture,});
    this.forEach(n => n.addEventListener(event, handler, capture));
    return this;
  }

  /**
   * remove the handlers from the list. Three ways to call.
   * ()                   : remove all registered listeners
   * (eventName)          : remove all listeners for that event.
   * (eventName, handler) : remove the specific handler for a specific event.
   */
  off(event, handler, capture = false) {
    // ignore if we don't have any listeners
    if (!this.listeners) {
      return;
    }
    // if no event or handler then remove all registered events
    if (!event && !handler) {
      // iterate all events
      Object.keys(this.listeners).forEach(eventName => {
        this.listeners[eventName].forEach(record => {
          this.forEach(n => n.removeEventListener(eventName, record.handler, record.capture));
        });
      });
      // reset all listeners
      delete this.listeners;
    } else {
      // if only event name specified remove all listeners for that event
      if (event && !handler) {
        if (this.listeners[event]) {
          this.listeners[event].forEach(record => {
            this.forEach(n => n.removeEventListener(event, record.handler, record.capture));
          });
        }
        // delete listeners for this specific event
        delete this.listeners[event];
      } else {
        // remove the specific listener if it is present, by finding the record with the handler
        if (this.listeners[event]) {
          let record;
          this.listeners[event].forEach(record2 => {
            if (record2.handler === handler) {
              record = record2;
            }
          });
          if (record) {
            this.listeners[event].delete(record);
            this.forEach(n => n.removeEventListener(event, record.handler, record.capture));
          }
          // remove just this record
          this.listeners[event].delete(record);
        }
      }
    }
    return this;
  }
}

/**
 * We export a factory function for ElementList so there is no need to the new operator
 */
export default function() {
  return new ElementList(...arguments);
};
