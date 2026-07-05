const methods$o = {
  one: {},
  two: {},
  three: {},
  four: {}
};
const model$6 = {
  one: {},
  two: {},
  three: {}
};
const compute$b = {};
const hooks = [];
const tmpWrld = { methods: methods$o, model: model$6, compute: compute$b, hooks };
const isArray$b = (input) => Object.prototype.toString.call(input) === "[object Array]";
const fns$5 = {
  /** add metadata to term objects */
  compute: function(input) {
    const { world: world2 } = this;
    const compute2 = world2.compute;
    if (typeof input === "string" && compute2.hasOwnProperty(input)) {
      compute2[input](this);
    } else if (isArray$b(input)) {
      input.forEach((name) => {
        if (world2.compute.hasOwnProperty(name)) {
          compute2[name](this);
        } else {
          console.warn("no compute:", input);
        }
      });
    } else if (typeof input === "function") {
      input(this);
    } else {
      console.warn("no compute:", input);
    }
    return this;
  }
};
const forEach = function(cb) {
  const ptrs = this.fullPointer;
  ptrs.forEach((ptr, i2) => {
    const view = this.update([ptr]);
    cb(view, i2);
  });
  return this;
};
const map = function(cb, empty) {
  const ptrs = this.fullPointer;
  const res = ptrs.map((ptr, i2) => {
    const view = this.update([ptr]);
    const out2 = cb(view, i2);
    if (out2 === void 0) {
      return this.none();
    }
    return out2;
  });
  if (res.length === 0) {
    return empty || this.update([]);
  }
  if (res[0] !== void 0) {
    if (typeof res[0] === "string") {
      return res;
    }
    if (typeof res[0] === "object" && (res[0] === null || !res[0].isView)) {
      return res;
    }
  }
  let all2 = [];
  res.forEach((ptr) => {
    all2 = all2.concat(ptr.fullPointer);
  });
  return this.toView(all2);
};
const filter = function(cb) {
  let ptrs = this.fullPointer;
  ptrs = ptrs.filter((ptr, i2) => {
    const view = this.update([ptr]);
    return cb(view, i2);
  });
  const res = this.update(ptrs);
  return res;
};
const find$6 = function(cb) {
  const ptrs = this.fullPointer;
  const found = ptrs.find((ptr, i2) => {
    const view = this.update([ptr]);
    return cb(view, i2);
  });
  return this.update([found]);
};
const some = function(cb) {
  const ptrs = this.fullPointer;
  return ptrs.some((ptr, i2) => {
    const view = this.update([ptr]);
    return cb(view, i2);
  });
};
const random = function(n2 = 1) {
  let ptrs = this.fullPointer;
  let r2 = Math.floor(Math.random() * ptrs.length);
  if (r2 + n2 > this.length) {
    r2 = this.length - n2;
    r2 = r2 < 0 ? 0 : r2;
  }
  ptrs = ptrs.slice(r2, r2 + n2);
  return this.update(ptrs);
};
const loops = { forEach, map, filter, find: find$6, some, random };
const utils = {
  /** */
  termList: function() {
    return this.methods.one.termList(this.docs);
  },
  /** return individual terms*/
  terms: function(n2) {
    const m2 = this.match(".");
    return typeof n2 === "number" ? m2.eq(n2) : m2;
  },
  /** */
  groups: function(group) {
    if (group || group === 0) {
      return this.update(this._groups[group] || []);
    }
    const res = {};
    Object.keys(this._groups).forEach((k2) => {
      res[k2] = this.update(this._groups[k2]);
    });
    return res;
  },
  /** */
  eq: function(n2) {
    let ptr = this.pointer;
    if (!ptr) {
      ptr = this.docs.map((_doc, i2) => [i2]);
    }
    if (ptr[n2]) {
      return this.update([ptr[n2]]);
    }
    return this.none();
  },
  /** */
  first: function() {
    return this.eq(0);
  },
  /** */
  last: function() {
    const n2 = this.fullPointer.length - 1;
    return this.eq(n2);
  },
  /** grab term[0] for every match */
  firstTerms: function() {
    return this.match("^.");
  },
  /** grab the last term for every match  */
  lastTerms: function() {
    return this.match(".$");
  },
  /** */
  slice: function(min2, max2) {
    let pntrs = this.pointer || this.docs.map((_o, n2) => [n2]);
    pntrs = pntrs.slice(min2, max2);
    return this.update(pntrs);
  },
  /** return a view of the entire document */
  all: function() {
    return this.update().toView();
  },
  /**  */
  fullSentences: function() {
    const ptrs = this.fullPointer.map((a2) => [a2[0]]);
    return this.update(ptrs).toView();
  },
  /** return a view of no parts of the document */
  none: function() {
    return this.update([]);
  },
  /** are these two views looking at the same words? */
  isDoc: function(b) {
    if (!b || !b.isView) {
      return false;
    }
    const aPtr = this.fullPointer;
    const bPtr = b.fullPointer;
    if (!aPtr.length === bPtr.length) {
      return false;
    }
    return aPtr.every((ptr, i2) => {
      if (!bPtr[i2]) {
        return false;
      }
      return ptr[0] === bPtr[i2][0] && ptr[1] === bPtr[i2][1] && ptr[2] === bPtr[i2][2];
    });
  },
  /** how many seperate terms does the document have? */
  wordCount: function() {
    return this.docs.reduce((count, terms) => {
      count += terms.filter((t2) => t2.text !== "").length;
      return count;
    }, 0);
  },
  // is the pointer the full sentence?
  isFull: function() {
    const ptrs = this.pointer;
    if (!ptrs) {
      return true;
    }
    if (ptrs.length === 0 || ptrs[0][0] !== 0) {
      return false;
    }
    let wantTerms = 0;
    let haveTerms = 0;
    this.document.forEach((terms) => wantTerms += terms.length);
    this.docs.forEach((terms) => haveTerms += terms.length);
    return wantTerms === haveTerms;
  },
  // return the nth elem of a doc
  getNth: function(n2) {
    if (typeof n2 === "number") {
      return this.eq(n2);
    } else if (typeof n2 === "string") {
      return this.if(n2);
    }
    return this;
  }
};
utils.group = utils.groups;
utils.fullSentence = utils.fullSentences;
utils.sentence = utils.fullSentences;
utils.lastTerm = utils.lastTerms;
utils.firstTerm = utils.firstTerms;
const methods$n = Object.assign({}, utils, fns$5, loops);
methods$n.get = methods$n.eq;
class View {
  constructor(document, pointer, groups = {}) {
    const props = [
      ["document", document],
      ["world", tmpWrld],
      ["_groups", groups],
      ["_cache", null],
      ["viewType", "View"]
    ];
    props.forEach((a2) => {
      Object.defineProperty(this, a2[0], {
        value: a2[1],
        writable: true
      });
    });
    this.ptrs = pointer;
  }
  /* getters:  */
  get docs() {
    let docs = this.document;
    if (this.ptrs) {
      docs = tmpWrld.methods.one.getDoc(this.ptrs, this.document);
    }
    return docs;
  }
  get pointer() {
    return this.ptrs;
  }
  get methods() {
    return this.world.methods;
  }
  get model() {
    return this.world.model;
  }
  get hooks() {
    return this.world.hooks;
  }
  get isView() {
    return true;
  }
  // is the view not-empty?
  get found() {
    return this.docs.length > 0;
  }
  // how many matches we have
  get length() {
    return this.docs.length;
  }
  // return a more-hackable pointer
  get fullPointer() {
    const { docs, ptrs, document } = this;
    const pointers2 = ptrs || docs.map((_d, n2) => [n2]);
    return pointers2.map((a2) => {
      let [n2, start2, end2, id, endId] = a2;
      start2 = start2 || 0;
      end2 = end2 || (document[n2] || []).length;
      if (document[n2] && document[n2][start2]) {
        id = id || document[n2][start2].id;
        if (document[n2][end2 - 1]) {
          endId = endId || document[n2][end2 - 1].id;
        }
      }
      return [n2, start2, end2, id, endId];
    });
  }
  // create a new View, from this one
  update(pointer) {
    const m2 = new View(this.document, pointer);
    if (this._cache && pointer && pointer.length > 0) {
      const cache2 = [];
      pointer.forEach((ptr, i2) => {
        const [n2, start2, end2] = ptr;
        if (ptr.length === 1) {
          cache2[i2] = this._cache[n2];
        } else if (start2 === 0 && this.document[n2].length === end2) {
          cache2[i2] = this._cache[n2];
        }
      });
      if (cache2.length > 0) {
        m2._cache = cache2;
      }
    }
    m2.world = this.world;
    return m2;
  }
  // create a new View, from this one
  toView(pointer) {
    return new View(this.document, pointer || this.pointer);
  }
  fromText(input) {
    const { methods: methods2 } = this;
    const document = methods2.one.tokenize.fromString(input, this.world);
    const doc = new View(document);
    doc.world = this.world;
    doc.compute(["normal", "freeze", "lexicon"]);
    if (this.world.compute.preTagger) {
      doc.compute("preTagger");
    }
    doc.compute("unfreeze");
    return doc;
  }
  clone() {
    let document = this.document.slice(0);
    document = document.map((terms) => {
      return terms.map((term) => {
        term = Object.assign({}, term);
        term.tags = new Set(term.tags);
        return term;
      });
    });
    const m2 = this.update(this.pointer);
    m2.document = document;
    m2._cache = this._cache;
    return m2;
  }
}
Object.assign(View.prototype, methods$n);
const version = "14.15.1";
const isObject$6 = function(item) {
  return item && typeof item === "object" && !Array.isArray(item);
};
const isArray$a = function(arr) {
  return Object.prototype.toString.call(arr) === "[object Array]";
};
function mergeDeep(model2, plugin2) {
  if (isObject$6(plugin2)) {
    for (const key in plugin2) {
      if (isObject$6(plugin2[key])) {
        if (!model2[key]) Object.assign(model2, { [key]: {} });
        mergeDeep(model2[key], plugin2[key]);
      } else {
        Object.assign(model2, { [key]: plugin2[key] });
      }
    }
  }
  return model2;
}
function mergeQuick(model2, plugin2) {
  for (const key in plugin2) {
    model2[key] = model2[key] || {};
    Object.assign(model2[key], plugin2[key]);
  }
  return model2;
}
const addIrregulars = function(model2, conj) {
  const m2 = model2.two.models || {};
  Object.keys(conj).forEach((k2) => {
    if (conj[k2].pastTense) {
      if (m2.toPast) {
        m2.toPast.ex[k2] = conj[k2].pastTense;
      }
      if (m2.fromPast) {
        m2.fromPast.ex[conj[k2].pastTense] = k2;
      }
    }
    if (conj[k2].presentTense) {
      if (m2.toPresent) {
        m2.toPresent.ex[k2] = conj[k2].presentTense;
      }
      if (m2.fromPresent) {
        m2.fromPresent.ex[conj[k2].presentTense] = k2;
      }
    }
    if (conj[k2].gerund) {
      if (m2.toGerund) {
        m2.toGerund.ex[k2] = conj[k2].gerund;
      }
      if (m2.fromGerund) {
        m2.fromGerund.ex[conj[k2].gerund] = k2;
      }
    }
    if (conj[k2].comparative) {
      if (m2.toComparative) {
        m2.toComparative.ex[k2] = conj[k2].comparative;
      }
      if (m2.fromComparative) {
        m2.fromComparative.ex[conj[k2].comparative] = k2;
      }
    }
    if (conj[k2].superlative) {
      if (m2.toSuperlative) {
        m2.toSuperlative.ex[k2] = conj[k2].superlative;
      }
      if (m2.fromSuperlative) {
        m2.fromSuperlative.ex[conj[k2].superlative] = k2;
      }
    }
  });
};
const extend = function(plugin2, world2, View2, nlp2) {
  if (isArray$a(plugin2)) {
    plugin2.forEach((p2) => extend(p2, world2, View2, nlp2));
    return;
  }
  const { methods: methods2, model: model2, compute: compute2, hooks: hooks2 } = world2;
  if (plugin2.methods) {
    mergeQuick(methods2, plugin2.methods);
  }
  if (plugin2.model) {
    mergeDeep(model2, plugin2.model);
  }
  if (plugin2.irregulars) {
    addIrregulars(model2, plugin2.irregulars);
  }
  if (plugin2.compute) {
    Object.assign(compute2, plugin2.compute);
  }
  if (hooks2) {
    world2.hooks = hooks2.concat(plugin2.hooks || []);
  }
  if (plugin2.api) {
    plugin2.api(View2);
  }
  if (plugin2.lib) {
    Object.keys(plugin2.lib).forEach((k2) => nlp2[k2] = plugin2.lib[k2]);
  }
  if (plugin2.tags) {
    nlp2.addTags(plugin2.tags);
  }
  if (plugin2.words) {
    nlp2.addWords(plugin2.words);
  }
  if (plugin2.frozen) {
    nlp2.addWords(plugin2.frozen, true);
  }
  if (plugin2.mutate) {
    plugin2.mutate(world2, nlp2);
  }
};
var define_process_env_default$5 = {};
const verbose = function(set) {
  const env2 = typeof process === "undefined" || !define_process_env_default$5 ? self.env || {} : define_process_env_default$5;
  env2.DEBUG_TAGS = set === "tagger" || set === true ? true : "";
  env2.DEBUG_MATCH = set === "match" || set === true ? true : "";
  env2.DEBUG_CHUNKS = set === "chunker" || set === true ? true : "";
  return this;
};
const isObject$5 = (val) => {
  return Object.prototype.toString.call(val) === "[object Object]";
};
const isArray$9 = function(arr) {
  return Object.prototype.toString.call(arr) === "[object Array]";
};
const fromJson = function(json) {
  return json.map((o2) => {
    return o2.terms.map((term) => {
      if (isArray$9(term.tags)) {
        term.tags = new Set(term.tags);
      }
      return term;
    });
  });
};
const preTokenized = function(arr) {
  return arr.map((a2) => {
    return a2.map((str) => {
      return {
        text: str,
        normal: str,
        //cleanup
        pre: "",
        post: " ",
        tags: /* @__PURE__ */ new Set()
      };
    });
  });
};
const inputs = function(input, View2, world2) {
  const { methods: methods2 } = world2;
  const doc = new View2([]);
  doc.world = world2;
  if (typeof input === "number") {
    input = String(input);
  }
  if (!input) {
    return doc;
  }
  if (typeof input === "string") {
    const document = methods2.one.tokenize.fromString(input, world2);
    return new View2(document);
  }
  if (isObject$5(input) && input.isView) {
    return new View2(input.document, input.ptrs);
  }
  if (isArray$9(input)) {
    if (isArray$9(input[0])) {
      const document2 = preTokenized(input);
      return new View2(document2);
    }
    const document = fromJson(input);
    return new View2(document);
  }
  return doc;
};
const world = Object.assign({}, tmpWrld);
const nlp = function(input, lex) {
  if (lex) {
    nlp.addWords(lex);
  }
  const doc = inputs(input, View, world);
  if (input) {
    doc.compute(world.hooks);
  }
  return doc;
};
Object.defineProperty(nlp, "_world", {
  value: world,
  writable: true
});
nlp.tokenize = function(input, lex) {
  const { compute: compute2 } = this._world;
  if (lex) {
    nlp.addWords(lex);
  }
  const doc = inputs(input, View, world);
  if (compute2.contractions) {
    doc.compute(["alias", "normal", "machine", "contractions"]);
  }
  return doc;
};
nlp.plugin = function(plugin2) {
  extend(plugin2, this._world, View, this);
  return this;
};
nlp.extend = nlp.plugin;
nlp.world = function() {
  return this._world;
};
nlp.model = function() {
  return this._world.model;
};
nlp.methods = function() {
  return this._world.methods;
};
nlp.hooks = function() {
  return this._world.hooks;
};
nlp.verbose = verbose;
nlp.version = version;
const createCache = function(document) {
  const cache2 = document.map((terms) => {
    const items = /* @__PURE__ */ new Set();
    terms.forEach((term) => {
      if (term.normal !== "") {
        items.add(term.normal);
      }
      if (term.switch) {
        items.add(`%${term.switch}%`);
      }
      if (term.implicit) {
        items.add(term.implicit);
      }
      if (term.machine) {
        items.add(term.machine);
      }
      if (term.root) {
        items.add(term.root);
      }
      if (term.alias) {
        term.alias.forEach((str) => items.add(str));
      }
      const tags = Array.from(term.tags);
      for (let t2 = 0; t2 < tags.length; t2 += 1) {
        items.add("#" + tags[t2]);
      }
    });
    return items;
  });
  return cache2;
};
const methods$m = {
  one: {
    cacheDoc: createCache
  }
};
const methods$l = {
  /** */
  cache: function() {
    this._cache = this.methods.one.cacheDoc(this.document);
    return this;
  },
  /** */
  uncache: function() {
    this._cache = null;
    return this;
  }
};
const addAPI$3 = function(View2) {
  Object.assign(View2.prototype, methods$l);
};
const compute$a = {
  cache: function(view) {
    view._cache = view.methods.one.cacheDoc(view.document);
  }
};
const cache$1 = {
  api: addAPI$3,
  compute: compute$a,
  methods: methods$m
};
const caseFns = {
  /** */
  toLowerCase: function() {
    this.termList().forEach((t2) => {
      t2.text = t2.text.toLowerCase();
    });
    return this;
  },
  /** */
  toUpperCase: function() {
    this.termList().forEach((t2) => {
      t2.text = t2.text.toUpperCase();
    });
    return this;
  },
  /** */
  toTitleCase: function() {
    this.termList().forEach((t2) => {
      t2.text = t2.text.replace(/^ *[a-z\u00C0-\u00FF]/, (x) => x.toUpperCase());
    });
    return this;
  },
  /** */
  toCamelCase: function() {
    this.docs.forEach((terms) => {
      terms.forEach((t2, i2) => {
        if (i2 !== 0) {
          t2.text = t2.text.replace(/^ *[a-z\u00C0-\u00FF]/, (x) => x.toUpperCase());
        }
        if (i2 !== terms.length - 1) {
          t2.post = "";
        }
      });
    });
    return this;
  }
};
const isTitleCase$4 = (str) => new RegExp("^\\p{Lu}[\\p{Ll}'’]", "u").test(str) || new RegExp("^\\p{Lu}$", "u").test(str);
const toTitleCase$2 = (str) => str.replace(new RegExp("^\\p{Ll}", "u"), (x) => x.toUpperCase());
const toLowerCase$1 = (str) => str.replace(new RegExp("^\\p{Lu}", "u"), (x) => x.toLowerCase());
const spliceArr = (parent, index2, child) => {
  child.forEach((term) => term.dirty = true);
  if (parent) {
    const args = [index2, 0].concat(child);
    Array.prototype.splice.apply(parent, args);
  }
  return parent;
};
const endSpace = function(terms) {
  const hasSpace2 = / $/;
  const hasDash2 = /[-–—]/;
  const lastTerm = terms[terms.length - 1];
  if (lastTerm && !hasSpace2.test(lastTerm.post) && !hasDash2.test(lastTerm.post)) {
    lastTerm.post += " ";
  }
};
const movePunct = (source, end2, needle) => {
  const juicy = /[-.?!,;:)–—'"]/g;
  const wasLast = source[end2 - 1];
  if (!wasLast) {
    return;
  }
  const post = wasLast.post;
  if (juicy.test(post)) {
    const punct = post.match(juicy).join("");
    const last = needle[needle.length - 1];
    last.post = punct + last.post;
    wasLast.post = wasLast.post.replace(juicy, "");
  }
};
const moveTitleCase = function(home, start2, needle) {
  const from = home[start2];
  if (start2 !== 0 || !isTitleCase$4(from.text)) {
    return;
  }
  needle[0].text = toTitleCase$2(needle[0].text);
  const old = home[start2];
  if (old.tags.has("ProperNoun") || old.tags.has("Acronym")) {
    return;
  }
  if (isTitleCase$4(old.text) && old.text.length > 1) {
    old.text = toLowerCase$1(old.text);
  }
};
const cleanPrepend = function(home, ptr, needle, document) {
  const [n2, start2, end2] = ptr;
  if (start2 === 0) {
    endSpace(needle);
  } else if (end2 === document[n2].length) {
    endSpace(needle);
  } else {
    endSpace(needle);
    endSpace([home[ptr[1]]]);
  }
  moveTitleCase(home, start2, needle);
  spliceArr(home, start2, needle);
};
const cleanAppend = function(home, ptr, needle, document) {
  const [n2, , end2] = ptr;
  const total = (document[n2] || []).length;
  if (end2 < total) {
    movePunct(home, end2, needle);
    endSpace(needle);
  } else if (total === end2) {
    endSpace(home);
    movePunct(home, end2, needle);
    if (document[n2 + 1]) {
      needle[needle.length - 1].post += " ";
    }
  }
  spliceArr(home, ptr[2], needle);
  ptr[4] = needle[needle.length - 1].id;
};
let index$1 = 0;
const pad3 = (str) => {
  str = str.length < 3 ? "0" + str : str;
  return str.length < 3 ? "0" + str : str;
};
const toId = function(term) {
  let [n2, i2] = term.index || [0, 0];
  index$1 += 1;
  index$1 = index$1 > 46655 ? 0 : index$1;
  n2 = n2 > 46655 ? 0 : n2;
  i2 = i2 > 1294 ? 0 : i2;
  let id = pad3(index$1.toString(36));
  id += pad3(n2.toString(36));
  let tx = i2.toString(36);
  tx = tx.length < 2 ? "0" + tx : tx;
  id += tx;
  const r2 = parseInt(Math.random() * 36, 10);
  id += r2.toString(36);
  return term.normal + "|" + id.toUpperCase();
};
const expand$3 = function(m2) {
  if (m2.has("@hasContraction") && typeof m2.contractions === "function") {
    const more = m2.grow("@hasContraction");
    more.contractions().expand();
  }
};
const isArray$8 = (arr) => Object.prototype.toString.call(arr) === "[object Array]";
const addIds$2 = function(terms) {
  terms = terms.map((term) => {
    term.id = toId(term);
    return term;
  });
  return terms;
};
const getTerms = function(input, world2) {
  const { methods: methods2 } = world2;
  if (typeof input === "string") {
    return methods2.one.tokenize.fromString(input, world2)[0];
  }
  if (typeof input === "object" && input.isView) {
    return input.clone().docs[0] || [];
  }
  if (isArray$8(input)) {
    return isArray$8(input[0]) ? input[0] : input;
  }
  return [];
};
const insert = function(input, view, prepend) {
  const { document, world: world2 } = view;
  view.uncache();
  const ptrs = view.fullPointer;
  const selfPtrs = view.fullPointer;
  view.forEach((m2, i2) => {
    const ptr = m2.fullPointer[0];
    const [n2] = ptr;
    const home = document[n2];
    let terms = getTerms(input, world2);
    if (terms.length === 0) {
      return;
    }
    terms = addIds$2(terms);
    if (prepend) {
      expand$3(view.update([ptr]).firstTerm());
      cleanPrepend(home, ptr, terms, document);
    } else {
      expand$3(view.update([ptr]).lastTerm());
      cleanAppend(home, ptr, terms, document);
    }
    if (document[n2] && document[n2][ptr[1]]) {
      ptr[3] = document[n2][ptr[1]].id;
    }
    selfPtrs[i2] = ptr;
    ptr[2] += terms.length;
    ptrs[i2] = ptr;
  });
  const doc = view.toView(ptrs);
  view.ptrs = selfPtrs;
  doc.compute(["id", "index", "freeze", "lexicon"]);
  if (doc.world.compute.preTagger) {
    doc.compute("preTagger");
  }
  doc.compute("unfreeze");
  return doc;
};
const fns$4 = {
  insertAfter: function(input) {
    return insert(input, this, false);
  },
  insertBefore: function(input) {
    return insert(input, this, true);
  }
};
fns$4.append = fns$4.insertAfter;
fns$4.prepend = fns$4.insertBefore;
fns$4.insert = fns$4.insertAfter;
const dollarStub = /\$[0-9a-z]+/g;
const fns$3 = {};
const isTitleCase$3 = (str) => new RegExp("^\\p{Lu}[\\p{Ll}'’]", "u").test(str) || new RegExp("^\\p{Lu}$", "u").test(str);
const toTitleCase$1 = (str) => str.replace(new RegExp("^\\p{Ll}", "u"), (x) => x.toUpperCase());
const toLowerCase = (str) => str.replace(new RegExp("^\\p{Lu}", "u"), (x) => x.toLowerCase());
const replaceByFn = function(main, fn, keep2) {
  main.forEach((m2) => {
    const out2 = fn(m2);
    m2.replaceWith(out2, keep2);
  });
  return main;
};
const subDollarSign = function(input, main) {
  if (typeof input !== "string") {
    return input;
  }
  const groups = main.groups();
  input = input.replace(dollarStub, (a2) => {
    const num = a2.replace(/\$/, "");
    if (groups.hasOwnProperty(num)) {
      return groups[num].text();
    }
    return a2;
  });
  return input;
};
fns$3.replaceWith = function(input, keep2 = {}) {
  let ptrs = this.fullPointer;
  const main = this;
  this.uncache();
  if (typeof input === "function") {
    return replaceByFn(main, input, keep2);
  }
  const terms = main.docs[0];
  if (!terms) return main;
  const isOriginalPossessive = keep2.possessives && terms[terms.length - 1].tags.has("Possessive");
  const isOriginalTitleCase = keep2.case && isTitleCase$3(terms[0].text);
  input = subDollarSign(input, main);
  const original = this.update(ptrs);
  ptrs = ptrs.map((ptr) => ptr.slice(0, 3));
  const oldTags = (original.docs[0] || []).map((term) => Array.from(term.tags));
  const originalPre = original.docs[0][0].pre;
  const originalPost = original.docs[0][original.docs[0].length - 1].post;
  if (typeof input === "string") {
    input = this.fromText(input).compute("id");
  }
  main.insertAfter(input);
  if (original.has("@hasContraction") && main.contractions) {
    const more = main.grow("@hasContraction+");
    more.contractions().expand();
  }
  main.delete(original);
  if (isOriginalPossessive) {
    const tmp = main.docs[0];
    const term = tmp[tmp.length - 1];
    if (!term.tags.has("Possessive")) {
      term.text += "'s";
      term.normal += "'s";
      term.tags.add("Possessive");
    }
  }
  if (originalPre && main.docs[0]) {
    main.docs[0][0].pre = originalPre;
  }
  if (originalPost && main.docs[0]) {
    const lastOne = main.docs[0][main.docs[0].length - 1];
    if (!lastOne.post.trim()) {
      lastOne.post = originalPost;
    }
  }
  const m2 = main.toView(ptrs).compute(["index", "freeze", "lexicon"]);
  if (m2.world.compute.preTagger) {
    m2.compute("preTagger");
  }
  m2.compute("unfreeze");
  if (keep2.tags) {
    m2.terms().forEach((term, i2) => {
      term.tagSafe(oldTags[i2]);
    });
  }
  if (!m2.docs[0] || !m2.docs[0][0]) return m2;
  if (keep2.case) {
    const transformCase = isOriginalTitleCase ? toTitleCase$1 : toLowerCase;
    m2.docs[0][0].text = transformCase(m2.docs[0][0].text);
  }
  return m2;
};
fns$3.replace = function(match2, input, keep2) {
  if (match2 && !input) {
    return this.replaceWith(match2, keep2);
  }
  const m2 = this.match(match2);
  if (!m2.found) {
    return this;
  }
  this.soften();
  return m2.replaceWith(input, keep2);
};
const repairPunct = function(terms, len) {
  const last = terms.length - 1;
  const from = terms[last];
  const to = terms[last - len];
  if (to && from) {
    to.post += from.post;
    to.post = to.post.replace(/ +([.?!,;:])/, "$1");
    to.post = to.post.replace(/[,;:]+([.?!])/, "$1");
  }
};
const pluckOut = function(document, nots) {
  nots.forEach((ptr) => {
    const [n2, start2, end2] = ptr;
    const len = end2 - start2;
    if (!document[n2]) {
      return;
    }
    if (end2 === document[n2].length && end2 > 1) {
      repairPunct(document[n2], len);
    }
    document[n2].splice(start2, len);
  });
  for (let i2 = document.length - 1; i2 >= 0; i2 -= 1) {
    if (document[i2].length === 0) {
      document.splice(i2, 1);
      if (i2 === document.length && document[i2 - 1]) {
        const terms = document[i2 - 1];
        const lastTerm = terms[terms.length - 1];
        if (lastTerm) {
          lastTerm.post = lastTerm.post.trimEnd();
        }
      }
    }
  }
  return document;
};
const fixPointers$1 = function(ptrs, gonePtrs) {
  ptrs = ptrs.map((ptr) => {
    const [n2] = ptr;
    if (!gonePtrs[n2]) {
      return ptr;
    }
    gonePtrs[n2].forEach((no) => {
      const len = no[2] - no[1];
      if (ptr[1] <= no[1] && ptr[2] >= no[2]) {
        ptr[2] -= len;
      }
    });
    return ptr;
  });
  ptrs.forEach((ptr, i2) => {
    if (ptr[1] === 0 && ptr[2] == 0) {
      for (let n2 = i2 + 1; n2 < ptrs.length; n2 += 1) {
        ptrs[n2][0] -= 1;
        if (ptrs[n2][0] < 0) {
          ptrs[n2][0] = 0;
        }
      }
    }
  });
  ptrs = ptrs.filter((ptr) => ptr[2] - ptr[1] > 0);
  ptrs = ptrs.map((ptr) => {
    ptr[3] = null;
    ptr[4] = null;
    return ptr;
  });
  return ptrs;
};
const methods$k = {
  /** */
  remove: function(reg) {
    const { indexN: indexN2 } = this.methods.one.pointer;
    this.uncache();
    let self2 = this.all();
    let not = this;
    if (reg) {
      self2 = this;
      not = this.match(reg);
    }
    const isFull = !self2.ptrs;
    if (not.has("@hasContraction") && not.contractions) {
      const more = not.grow("@hasContraction");
      more.contractions().expand();
    }
    let ptrs = self2.fullPointer;
    const nots = not.fullPointer.reverse();
    const document = pluckOut(this.document, nots);
    const gonePtrs = indexN2(nots);
    ptrs = fixPointers$1(ptrs, gonePtrs);
    self2.ptrs = ptrs;
    self2.document = document;
    self2.compute("index");
    if (isFull) {
      self2.ptrs = void 0;
    }
    if (!reg) {
      this.ptrs = [];
      return self2.none();
    }
    const res = self2.toView(ptrs);
    return res;
  }
};
methods$k.delete = methods$k.remove;
const methods$j = {
  /** add this punctuation or whitespace before each match: */
  pre: function(str, concat2) {
    if (str === void 0 && this.found) {
      return this.docs[0][0].pre;
    }
    this.docs.forEach((terms) => {
      const term = terms[0];
      if (concat2 === true) {
        term.pre += str;
      } else {
        term.pre = str;
      }
    });
    return this;
  },
  /** add this punctuation or whitespace after each match: */
  post: function(str, concat2) {
    if (str === void 0) {
      const last = this.docs[this.docs.length - 1];
      return last[last.length - 1].post;
    }
    this.docs.forEach((terms) => {
      const term = terms[terms.length - 1];
      if (concat2 === true) {
        term.post += str;
      } else {
        term.post = str;
      }
    });
    return this;
  },
  /** remove whitespace from start/end */
  trim: function() {
    if (!this.found) {
      return this;
    }
    const docs = this.docs;
    const start2 = docs[0][0];
    start2.pre = start2.pre.trimStart();
    const last = docs[docs.length - 1];
    const end2 = last[last.length - 1];
    end2.post = end2.post.trimEnd();
    return this;
  },
  /** connect words with hyphen, and remove whitespace */
  hyphenate: function() {
    this.docs.forEach((terms) => {
      terms.forEach((t2, i2) => {
        if (i2 !== 0) {
          t2.pre = "";
        }
        if (terms[i2 + 1]) {
          t2.post = "-";
        }
      });
    });
    return this;
  },
  /** remove hyphens between words, and set whitespace */
  dehyphenate: function() {
    const hasHyphen2 = /[-–—]/;
    this.docs.forEach((terms) => {
      terms.forEach((t2) => {
        if (hasHyphen2.test(t2.post)) {
          t2.post = " ";
        }
      });
    });
    return this;
  },
  /** add quotations around these matches */
  toQuotations: function(start2, end2) {
    start2 = start2 || `"`;
    end2 = end2 || `"`;
    this.docs.forEach((terms) => {
      terms[0].pre = start2 + terms[0].pre;
      const last = terms[terms.length - 1];
      last.post = end2 + last.post;
    });
    return this;
  },
  /** add brackets around these matches */
  toParentheses: function(start2, end2) {
    start2 = start2 || `(`;
    end2 = end2 || `)`;
    this.docs.forEach((terms) => {
      terms[0].pre = start2 + terms[0].pre;
      const last = terms[terms.length - 1];
      last.post = end2 + last.post;
    });
    return this;
  }
};
methods$j.deHyphenate = methods$j.dehyphenate;
methods$j.toQuotation = methods$j.toQuotations;
const alpha = (a2, b) => {
  if (a2.normal < b.normal) {
    return -1;
  }
  if (a2.normal > b.normal) {
    return 1;
  }
  return 0;
};
const length = (a2, b) => {
  const left = a2.normal.trim().length;
  const right = b.normal.trim().length;
  if (left < right) {
    return 1;
  }
  if (left > right) {
    return -1;
  }
  return 0;
};
const wordCount$1 = (a2, b) => {
  if (a2.words < b.words) {
    return 1;
  }
  if (a2.words > b.words) {
    return -1;
  }
  return 0;
};
const sequential = (a2, b) => {
  if (a2[0] < b[0]) {
    return 1;
  }
  if (a2[0] > b[0]) {
    return -1;
  }
  return a2[1] > b[1] ? 1 : -1;
};
const byFreq = function(arr) {
  const counts = {};
  arr.forEach((o2) => {
    counts[o2.normal] = counts[o2.normal] || 0;
    counts[o2.normal] += 1;
  });
  arr.sort((a2, b) => {
    const left = counts[a2.normal];
    const right = counts[b.normal];
    if (left < right) {
      return 1;
    }
    if (left > right) {
      return -1;
    }
    return 0;
  });
  return arr;
};
const methods$i = { alpha, length, wordCount: wordCount$1, sequential, byFreq };
const seqNames = /* @__PURE__ */ new Set(["index", "sequence", "seq", "sequential", "chron", "chronological"]);
const freqNames = /* @__PURE__ */ new Set(["freq", "frequency", "topk", "repeats"]);
const alphaNames = /* @__PURE__ */ new Set(["alpha", "alphabetical"]);
const customSort = function(view, fn) {
  let ptrs = view.fullPointer;
  ptrs = ptrs.sort((a2, b) => {
    a2 = view.update([a2]);
    b = view.update([b]);
    return fn(a2, b);
  });
  view.ptrs = ptrs;
  return view;
};
const sort = function(input) {
  const { docs, pointer } = this;
  this.uncache();
  if (typeof input === "function") {
    return customSort(this, input);
  }
  input = input || "alpha";
  const ptrs = pointer || docs.map((_d, n2) => [n2]);
  let arr = docs.map((terms, n2) => {
    return {
      index: n2,
      words: terms.length,
      normal: terms.map((t2) => t2.machine || t2.normal || "").join(" "),
      pointer: ptrs[n2]
    };
  });
  if (seqNames.has(input)) {
    input = "sequential";
  }
  if (alphaNames.has(input)) {
    input = "alpha";
  }
  if (freqNames.has(input)) {
    arr = methods$i.byFreq(arr);
    return this.update(arr.map((o2) => o2.pointer));
  }
  if (typeof methods$i[input] === "function") {
    arr = arr.sort(methods$i[input]);
    return this.update(arr.map((o2) => o2.pointer));
  }
  return this;
};
const reverse$1 = function() {
  let ptrs = this.pointer || this.docs.map((_d, n2) => [n2]);
  ptrs = [].concat(ptrs);
  ptrs = ptrs.reverse();
  if (this._cache) {
    this._cache = this._cache.reverse();
  }
  return this.update(ptrs);
};
const unique = function() {
  const already = /* @__PURE__ */ new Set();
  const res = this.filter((m2) => {
    const txt = m2.text("machine");
    if (already.has(txt)) {
      return false;
    }
    already.add(txt);
    return true;
  });
  return res;
};
const sort$1 = { unique, reverse: reverse$1, sort };
const isArray$7 = (arr) => Object.prototype.toString.call(arr) === "[object Array]";
const combineDocs = function(homeDocs, inputDocs) {
  if (homeDocs.length > 0) {
    const end2 = homeDocs[homeDocs.length - 1];
    const last = end2[end2.length - 1];
    if (/ /.test(last.post) === false) {
      last.post += " ";
    }
  }
  homeDocs = homeDocs.concat(inputDocs);
  return homeDocs;
};
const combineViews = function(home, input) {
  if (home.document === input.document) {
    const ptrs2 = home.fullPointer.concat(input.fullPointer);
    return home.toView(ptrs2).compute("index");
  }
  const ptrs = input.fullPointer;
  ptrs.forEach((a2) => {
    a2[0] += home.document.length;
  });
  home.document = combineDocs(home.document, input.docs);
  return home.all();
};
const concat = {
  // add string as new match/sentence
  concat: function(input) {
    if (typeof input === "string") {
      const more = this.fromText(input);
      if (!this.found || !this.ptrs) {
        this.document = this.document.concat(more.document);
      } else {
        const ptrs = this.fullPointer;
        const at = ptrs[ptrs.length - 1][0];
        this.document.splice(at, 0, ...more.document);
      }
      return this.all().compute("index");
    }
    if (typeof input === "object" && input.isView) {
      return combineViews(this, input);
    }
    if (isArray$7(input)) {
      const docs = combineDocs(this.document, input);
      this.document = docs;
      return this.all();
    }
    return this;
  }
};
const harden = function() {
  this.ptrs = this.fullPointer;
  return this;
};
const soften = function() {
  let ptr = this.ptrs;
  if (!ptr || ptr.length < 1) {
    return this;
  }
  ptr = ptr.map((a2) => a2.slice(0, 3));
  this.ptrs = ptr;
  return this;
};
const harden$1 = { harden, soften };
const methods$h = Object.assign({}, caseFns, fns$4, fns$3, methods$k, methods$j, sort$1, concat, harden$1);
const addAPI$2 = function(View2) {
  Object.assign(View2.prototype, methods$h);
};
const compute$9 = {
  id: function(view) {
    const docs = view.docs;
    for (let n2 = 0; n2 < docs.length; n2 += 1) {
      for (let i2 = 0; i2 < docs[n2].length; i2 += 1) {
        const term = docs[n2][i2];
        term.id = term.id || toId(term);
      }
    }
  }
};
const change = {
  api: addAPI$2,
  compute: compute$9
};
const contractions$1 = [
  // simple mappings
  { word: "@", out: ["at"] },
  { word: "arent", out: ["are", "not"] },
  { word: "alot", out: ["a", "lot"] },
  { word: "brb", out: ["be", "right", "back"] },
  { word: "cannot", out: ["can", "not"] },
  { word: "dun", out: ["do", "not"] },
  { word: "can't", out: ["can", "not"] },
  { word: "shan't", out: ["should", "not"] },
  { word: "won't", out: ["will", "not"] },
  { word: "that's", out: ["that", "is"] },
  { word: "what's", out: ["what", "is"] },
  { word: "let's", out: ["let", "us"] },
  // { word: "there's", out: ['there', 'is'] },
  { word: "dunno", out: ["do", "not", "know"] },
  { word: "gonna", out: ["going", "to"] },
  { word: "gotta", out: ["have", "got", "to"] },
  //hmm
  { word: "gimme", out: ["give", "me"] },
  { word: "outta", out: ["out", "of"] },
  { word: "tryna", out: ["trying", "to"] },
  { word: "gtg", out: ["got", "to", "go"] },
  { word: "im", out: ["i", "am"] },
  { word: "imma", out: ["I", "will"] },
  { word: "imo", out: ["in", "my", "opinion"] },
  { word: "irl", out: ["in", "real", "life"] },
  { word: "ive", out: ["i", "have"] },
  { word: "rn", out: ["right", "now"] },
  { word: "tbh", out: ["to", "be", "honest"] },
  { word: "wanna", out: ["want", "to"] },
  { word: `c'mere`, out: ["come", "here"] },
  { word: `c'mon`, out: ["come", "on"] },
  // shoulda, coulda
  { word: "shoulda", out: ["should", "have"] },
  { word: "coulda", out: ["coulda", "have"] },
  { word: "woulda", out: ["woulda", "have"] },
  { word: "musta", out: ["must", "have"] },
  { word: "tis", out: ["it", "is"] },
  { word: "twas", out: ["it", "was"] },
  { word: `y'know`, out: ["you", "know"] },
  { word: "ne'er", out: ["never"] },
  { word: "o'er", out: ["over"] },
  // contraction-part mappings
  { after: "ll", out: ["will"] },
  { after: "ve", out: ["have"] },
  { after: "re", out: ["are"] },
  { after: "m", out: ["am"] },
  // french contractions
  { before: "c", out: ["ce"] },
  { before: "m", out: ["me"] },
  { before: "n", out: ["ne"] },
  { before: "qu", out: ["que"] },
  { before: "s", out: ["se"] },
  { before: "t", out: ["tu"] },
  // t'aime
  // missing apostrophes
  { word: "shouldnt", out: ["should", "not"] },
  { word: "couldnt", out: ["could", "not"] },
  { word: "wouldnt", out: ["would", "not"] },
  { word: "hasnt", out: ["has", "not"] },
  { word: "wasnt", out: ["was", "not"] },
  { word: "isnt", out: ["is", "not"] },
  { word: "cant", out: ["can", "not"] },
  { word: "dont", out: ["do", "not"] },
  { word: "wont", out: ["will", "not"] },
  // apostrophe d
  { word: "howd", out: ["how", "did"] },
  { word: "whatd", out: ["what", "did"] },
  { word: "whend", out: ["when", "did"] },
  { word: "whered", out: ["where", "did"] }
];
const t$1 = true;
const numberSuffixes = {
  "st": t$1,
  "nd": t$1,
  "rd": t$1,
  "th": t$1,
  "am": t$1,
  "pm": t$1,
  "max": t$1,
  "°": t$1,
  "s": t$1,
  // 1990s
  "e": t$1,
  // 18e - french/spanish ordinal
  "er": t$1,
  //french 1er
  "ère": t$1,
  //''
  "ème": t$1
  //french 2ème
};
const model$5 = {
  one: {
    contractions: contractions$1,
    numberSuffixes
  }
};
const insertContraction$1 = function(document, point, words2) {
  const [n2, w] = point;
  if (!words2 || words2.length === 0) {
    return;
  }
  words2 = words2.map((word, i2) => {
    word.implicit = word.text;
    word.machine = word.text;
    word.pre = "";
    word.post = "";
    word.text = "";
    word.normal = "";
    word.index = [n2, w + i2];
    return word;
  });
  if (words2[0]) {
    words2[0].pre = document[n2][w].pre;
    words2[words2.length - 1].post = document[n2][w].post;
    words2[0].text = document[n2][w].text;
    words2[0].normal = document[n2][w].normal;
  }
  document[n2].splice(w, 1, ...words2);
};
const hasContraction$3 = /'/;
const alwaysDid = /* @__PURE__ */ new Set([
  "what",
  "how",
  "when",
  "where",
  "why"
]);
const useWould = /* @__PURE__ */ new Set([
  "be",
  "go",
  "start",
  "think",
  "need"
]);
const useHad = /* @__PURE__ */ new Set([
  "been",
  "gone"
]);
const _apostropheD$1 = function(terms, i2) {
  const before2 = terms[i2].normal.split(hasContraction$3)[0];
  if (alwaysDid.has(before2)) {
    return [before2, "did"];
  }
  if (terms[i2 + 1]) {
    if (useHad.has(terms[i2 + 1].normal)) {
      return [before2, "had"];
    }
    if (useWould.has(terms[i2 + 1].normal)) {
      return [before2, "would"];
    }
  }
  return null;
};
const apostropheT$1 = function(terms, i2) {
  if (terms[i2].normal === "ain't" || terms[i2].normal === "aint") {
    return null;
  }
  const before2 = terms[i2].normal.replace(/n't/, "");
  return [before2, "not"];
};
const hasContraction$2 = /'/;
const isFeminine = /(e|é|aison|sion|tion)$/;
const isMasculine = /(age|isme|acle|ege|oire)$/;
const preL = (terms, i2) => {
  const after2 = terms[i2].normal.split(hasContraction$2)[1];
  if (after2 && after2.endsWith("e")) {
    return ["la", after2];
  }
  return ["le", after2];
};
const preD = (terms, i2) => {
  const after2 = terms[i2].normal.split(hasContraction$2)[1];
  if (after2 && isFeminine.test(after2) && !isMasculine.test(after2)) {
    return ["du", after2];
  } else if (after2 && after2.endsWith("s")) {
    return ["des", after2];
  }
  return ["de", after2];
};
const preJ = (terms, i2) => {
  const after2 = terms[i2].normal.split(hasContraction$2)[1];
  return ["je", after2];
};
const french = {
  preJ,
  preL,
  preD
};
const isRange = /^([0-9.]{1,4}[a-z]{0,2}) ?[-–—] ?([0-9]{1,4}[a-z]{0,2})$/i;
const timeRange = /^([0-9]{1,2}(:[0-9][0-9])?(am|pm)?) ?[-–—] ?([0-9]{1,2}(:[0-9][0-9])?(am|pm)?)$/i;
const phoneNum = /^[0-9]{3}-[0-9]{4}$/;
const numberRange = function(terms, i2) {
  const term = terms[i2];
  let parts = term.text.match(isRange);
  if (parts !== null) {
    if (term.tags.has("PhoneNumber") === true || phoneNum.test(term.text)) {
      return null;
    }
    return [parts[1], "to", parts[2]];
  } else {
    parts = term.text.match(timeRange);
    if (parts !== null) {
      return [parts[1], "to", parts[4]];
    }
  }
  return null;
};
const numUnit = /^([+-]?[0-9][.,0-9]*)([a-z°²³µ/]+)$/;
const numberUnit = function(terms, i2, world2) {
  const notUnit = world2.model.one.numberSuffixes || {};
  const term = terms[i2];
  const parts = term.text.match(numUnit);
  if (parts !== null) {
    const unit = parts[2].toLowerCase().trim();
    if (notUnit.hasOwnProperty(unit)) {
      return null;
    }
    return [parts[1], unit];
  }
  return null;
};
const byApostrophe$1 = /'/;
const numDash = /^[0-9][^-–—]*[-–—].*?[0-9]/;
const reTag$1 = function(terms, view, start2, len) {
  const tmp = view.update();
  tmp.document = [terms];
  let end2 = start2 + len;
  if (start2 > 0) {
    start2 -= 1;
  }
  if (terms[end2]) {
    end2 += 1;
  }
  tmp.ptrs = [[0, start2, end2]];
};
const byEnd$1 = {
  // ain't
  t: (terms, i2) => apostropheT$1(terms, i2),
  // how'd
  d: (terms, i2) => _apostropheD$1(terms, i2)
};
const byStart = {
  // j'aime
  j: (terms, i2) => french.preJ(terms, i2),
  // l'amour
  l: (terms, i2) => french.preL(terms, i2),
  // d'amerique
  d: (terms, i2) => french.preD(terms, i2)
};
const knownOnes = function(list2, term, before2, after2) {
  for (let i2 = 0; i2 < list2.length; i2 += 1) {
    const o2 = list2[i2];
    if (o2.word === term.normal) {
      return o2.out;
    } else if (after2 !== null && after2 === o2.after) {
      return [before2].concat(o2.out);
    } else if (before2 !== null && before2 === o2.before && after2 && after2.length > 2) {
      return o2.out.concat(after2);
    }
  }
  return null;
};
const toDocs$1 = function(words2, view) {
  const doc = view.fromText(words2.join(" "));
  doc.compute(["id", "alias"]);
  return doc.docs[0];
};
const thereHas = function(terms, i2) {
  for (let k2 = i2 + 1; k2 < 5; k2 += 1) {
    if (!terms[k2]) {
      break;
    }
    if (terms[k2].normal === "been") {
      return ["there", "has"];
    }
  }
  return ["there", "is"];
};
const contractions = (view) => {
  const { world: world2, document } = view;
  const { model: model2, methods: methods2 } = world2;
  const list2 = model2.one.contractions || [];
  document.forEach((terms, n2) => {
    for (let i2 = terms.length - 1; i2 >= 0; i2 -= 1) {
      let before2 = null;
      let after2 = null;
      if (byApostrophe$1.test(terms[i2].normal) === true) {
        const res = terms[i2].normal.split(byApostrophe$1);
        before2 = res[0];
        after2 = res[1];
      }
      let words2 = knownOnes(list2, terms[i2], before2, after2);
      if (!words2 && byEnd$1.hasOwnProperty(after2)) {
        words2 = byEnd$1[after2](terms, i2, world2);
      }
      if (!words2 && byStart.hasOwnProperty(before2)) {
        words2 = byStart[before2](terms, i2);
      }
      if (before2 === "there" && after2 === "s") {
        words2 = thereHas(terms, i2);
      }
      if (words2) {
        words2 = toDocs$1(words2, view);
        insertContraction$1(document, [n2, i2], words2);
        reTag$1(document[n2], view, i2, words2.length);
        continue;
      }
      if (numDash.test(terms[i2].normal)) {
        words2 = numberRange(terms, i2);
        if (words2) {
          words2 = toDocs$1(words2, view);
          insertContraction$1(document, [n2, i2], words2);
          methods2.one.setTag(words2, "NumberRange", world2);
          if (words2[2] && words2[2].tags.has("Time")) {
            methods2.one.setTag([words2[0]], "Time", world2, null, "time-range");
          }
          reTag$1(document[n2], view, i2, words2.length);
        }
        continue;
      }
      words2 = numberUnit(terms, i2, world2);
      if (words2) {
        words2 = toDocs$1(words2, view);
        insertContraction$1(document, [n2, i2], words2);
        methods2.one.setTag([words2[1]], "Unit", world2, null, "contraction-unit");
      }
    }
  });
};
const compute$8 = { contractions };
const plugin$3 = {
  model: model$5,
  compute: compute$8,
  hooks: ["contractions"]
};
const freeze$1 = function(view) {
  const world2 = view.world;
  const { model: model2, methods: methods2 } = view.world;
  const setTag2 = methods2.one.setTag;
  const { frozenLex: frozenLex2 } = model2.one;
  const multi = model2.one._multiCache || {};
  view.docs.forEach((terms) => {
    for (let i2 = 0; i2 < terms.length; i2 += 1) {
      const t2 = terms[i2];
      const word = t2.machine || t2.normal;
      if (multi[word] !== void 0 && terms[i2 + 1]) {
        const end2 = i2 + multi[word] - 1;
        for (let k2 = end2; k2 > i2; k2 -= 1) {
          const words2 = terms.slice(i2, k2 + 1);
          const str = words2.map((term) => term.machine || term.normal).join(" ");
          if (frozenLex2.hasOwnProperty(str) === true) {
            setTag2(words2, frozenLex2[str], world2, false, "1-frozen-multi-lexicon");
            words2.forEach((term) => term.frozen = true);
            continue;
          }
        }
      }
      if (frozenLex2[word] !== void 0 && frozenLex2.hasOwnProperty(word)) {
        setTag2([t2], frozenLex2[word], world2, false, "1-freeze-lexicon");
        t2.frozen = true;
        continue;
      }
    }
  });
};
const unfreeze = function(view) {
  view.docs.forEach((ts) => {
    ts.forEach((term) => {
      delete term.frozen;
    });
  });
  return view;
};
const compute$7 = { frozen: freeze$1, freeze: freeze$1, unfreeze };
const blue = (str) => "\x1B[34m" + str + "\x1B[0m";
const dim = (str) => "\x1B[3m\x1B[2m" + str + "\x1B[0m";
const debug$2 = function(view) {
  view.docs.forEach((terms) => {
    console.log(blue("\n  ┌─────────"));
    terms.forEach((t2) => {
      let str = `  ${dim("│")}  `;
      const txt = t2.implicit || t2.text || "-";
      if (t2.frozen === true) {
        str += `${blue(txt)} ❄️`;
      } else {
        str += dim(txt);
      }
      console.log(str);
    });
  });
};
const freeze = {
  // add .compute('freeze')
  compute: compute$7,
  mutate: (world2) => {
    const methods2 = world2.methods.one;
    methods2.termMethods.isFrozen = (term) => term.frozen === true;
    methods2.debug.freeze = debug$2;
    methods2.debug.frozen = debug$2;
  },
  api: function(View2) {
    View2.prototype.freeze = function() {
      this.docs.forEach((ts) => {
        ts.forEach((term) => {
          term.frozen = true;
        });
      });
      return this;
    };
    View2.prototype.unfreeze = function() {
      this.compute("unfreeze");
    };
    View2.prototype.isFrozen = function() {
      return this.match("@isFrozen+");
    };
  },
  // run it in init
  hooks: ["freeze"]
};
const multiWord = function(terms, start_i, world2) {
  const { model: model2, methods: methods2 } = world2;
  const setTag2 = methods2.one.setTag;
  const multi = model2.one._multiCache || {};
  const { lexicon: lexicon2 } = model2.one || {};
  const t2 = terms[start_i];
  const word = t2.machine || t2.normal;
  if (multi[word] !== void 0 && terms[start_i + 1]) {
    const end2 = start_i + multi[word] - 1;
    for (let i2 = end2; i2 > start_i; i2 -= 1) {
      const words2 = terms.slice(start_i, i2 + 1);
      if (words2.length <= 1) {
        return false;
      }
      const str = words2.map((term) => term.machine || term.normal).join(" ");
      if (lexicon2.hasOwnProperty(str) === true) {
        const tag2 = lexicon2[str];
        setTag2(words2, tag2, world2, false, "1-multi-lexicon");
        if (tag2 && tag2.length === 2 && (tag2[0] === "PhrasalVerb" || tag2[1] === "PhrasalVerb")) {
          setTag2([words2[1]], "Particle", world2, false, "1-phrasal-particle");
        }
        return true;
      }
    }
    return false;
  }
  return null;
};
const prefix$3 = /^(under|over|mis|re|un|dis|semi|pre|post)-?/;
const allowPrefix = /* @__PURE__ */ new Set(["Verb", "Infinitive", "PastTense", "Gerund", "PresentTense", "Adjective", "Participle"]);
const checkLexicon = function(terms, i2, world2) {
  const { model: model2, methods: methods2 } = world2;
  const setTag2 = methods2.one.setTag;
  const { lexicon: lexicon2 } = model2.one;
  const t2 = terms[i2];
  const word = t2.machine || t2.normal;
  if (lexicon2[word] !== void 0 && lexicon2.hasOwnProperty(word)) {
    setTag2([t2], lexicon2[word], world2, false, "1-lexicon");
    return true;
  }
  if (t2.alias) {
    const found = t2.alias.find((str) => lexicon2.hasOwnProperty(str));
    if (found) {
      setTag2([t2], lexicon2[found], world2, false, "1-lexicon-alias");
      return true;
    }
  }
  if (prefix$3.test(word) === true) {
    const stem = word.replace(prefix$3, "");
    if (lexicon2.hasOwnProperty(stem) && stem.length > 3) {
      if (allowPrefix.has(lexicon2[stem])) {
        setTag2([t2], lexicon2[stem], world2, false, "1-lexicon-prefix");
        return true;
      }
    }
  }
  return null;
};
const lexicon$3 = function(view) {
  const world2 = view.world;
  view.docs.forEach((terms) => {
    for (let i2 = 0; i2 < terms.length; i2 += 1) {
      if (terms[i2].tags.size === 0) {
        let found = null;
        found = found || multiWord(terms, i2, world2);
        found = found || checkLexicon(terms, i2, world2);
      }
    }
  });
};
const compute$6 = {
  lexicon: lexicon$3
};
const expand$2 = function(words2) {
  const lex = {};
  const _multi = {};
  Object.keys(words2).forEach((word) => {
    const tag2 = words2[word];
    word = word.toLowerCase().trim();
    word = word.replace(/'s\b/, "");
    const split2 = word.split(/ /);
    if (split2.length > 1) {
      if (_multi[split2[0]] === void 0 || split2.length > _multi[split2[0]]) {
        _multi[split2[0]] = split2.length;
      }
    }
    lex[word] = lex[word] || tag2;
  });
  delete lex[""];
  delete lex[null];
  delete lex[" "];
  return { lex, _multi };
};
const methods$g = {
  one: {
    expandLexicon: expand$2
  }
};
const addWords = function(words2, isFrozen = false) {
  const world2 = this.world();
  const { methods: methods2, model: model2 } = world2;
  if (!words2) {
    return;
  }
  Object.keys(words2).forEach((k2) => {
    if (typeof words2[k2] === "string" && words2[k2].startsWith("#")) {
      words2[k2] = words2[k2].replace(/^#/, "");
    }
  });
  if (isFrozen === true) {
    const { lex: lex2, _multi: _multi2 } = methods2.one.expandLexicon(words2, world2);
    Object.assign(model2.one._multiCache, _multi2);
    Object.assign(model2.one.frozenLex, lex2);
    return;
  }
  if (methods2.two.expandLexicon) {
    const { lex: lex2, _multi: _multi2 } = methods2.two.expandLexicon(words2, world2);
    Object.assign(model2.one.lexicon, lex2);
    Object.assign(model2.one._multiCache, _multi2);
  }
  const { lex, _multi } = methods2.one.expandLexicon(words2, world2);
  Object.assign(model2.one.lexicon, lex);
  Object.assign(model2.one._multiCache, _multi);
};
const lib$5 = { addWords };
const model$4 = {
  one: {
    lexicon: {},
    //setup blank lexicon
    _multiCache: {},
    frozenLex: {}
    //2nd lexicon
  }
};
const lexicon$2 = {
  model: model$4,
  methods: methods$g,
  compute: compute$6,
  lib: lib$5,
  hooks: ["lexicon"]
};
const tokenize$1 = function(phrase, world2) {
  const { methods: methods2, model: model2 } = world2;
  const terms = methods2.one.tokenize.splitTerms(phrase, model2).map((t2) => methods2.one.tokenize.splitWhitespace(t2, model2));
  return terms.map((term) => term.text.toLowerCase());
};
const buildTrie = function(phrases, world2) {
  const goNext = [{}];
  const endAs = [null];
  const failTo = [0];
  const xs = [];
  let n2 = 0;
  phrases.forEach(function(phrase) {
    let curr = 0;
    const words2 = tokenize$1(phrase, world2);
    for (let i2 = 0; i2 < words2.length; i2++) {
      const word = words2[i2];
      if (goNext[curr] && goNext[curr].hasOwnProperty(word)) {
        curr = goNext[curr][word];
      } else {
        n2++;
        goNext[curr][word] = n2;
        goNext[n2] = {};
        curr = n2;
        endAs[n2] = null;
      }
    }
    endAs[curr] = [words2.length];
  });
  for (const word in goNext[0]) {
    n2 = goNext[0][word];
    failTo[n2] = 0;
    xs.push(n2);
  }
  while (xs.length) {
    const r2 = xs.shift();
    const keys = Object.keys(goNext[r2]);
    for (let i2 = 0; i2 < keys.length; i2 += 1) {
      const word = keys[i2];
      const s2 = goNext[r2][word];
      xs.push(s2);
      n2 = failTo[r2];
      while (n2 > 0 && !goNext[n2].hasOwnProperty(word)) {
        n2 = failTo[n2];
      }
      if (goNext.hasOwnProperty(n2)) {
        const fs = goNext[n2][word];
        failTo[s2] = fs;
        if (endAs[fs]) {
          endAs[s2] = endAs[s2] || [];
          endAs[s2] = endAs[s2].concat(endAs[fs]);
        }
      } else {
        failTo[s2] = 0;
      }
    }
  }
  return { goNext, endAs, failTo };
};
const scanWords = function(terms, trie, opts2) {
  let n2 = 0;
  const results = [];
  for (let i2 = 0; i2 < terms.length; i2++) {
    const word = terms[i2][opts2.form] || terms[i2].normal;
    while (n2 > 0 && (trie.goNext[n2] === void 0 || !trie.goNext[n2].hasOwnProperty(word))) {
      n2 = trie.failTo[n2] || 0;
    }
    if (!trie.goNext[n2].hasOwnProperty(word)) {
      continue;
    }
    n2 = trie.goNext[n2][word];
    if (trie.endAs[n2]) {
      const arr = trie.endAs[n2];
      for (let o2 = 0; o2 < arr.length; o2++) {
        const len = arr[o2];
        const term = terms[i2 - len + 1];
        const [no, start2] = term.index;
        results.push([no, start2, start2 + len, term.id]);
      }
    }
  }
  return results;
};
const cacheMiss = function(words2, cache2) {
  for (let i2 = 0; i2 < words2.length; i2 += 1) {
    if (cache2.has(words2[i2]) === true) {
      return false;
    }
  }
  return true;
};
const scan = function(view, trie, opts2) {
  let results = [];
  opts2.form = opts2.form || "normal";
  const docs = view.docs;
  if (!trie.goNext || !trie.goNext[0]) {
    console.error("Compromise invalid lookup trie");
    return view.none();
  }
  const firstWords = Object.keys(trie.goNext[0]);
  for (let i2 = 0; i2 < docs.length; i2++) {
    if (view._cache && view._cache[i2] && cacheMiss(firstWords, view._cache[i2]) === true) {
      continue;
    }
    const terms = docs[i2];
    const found = scanWords(terms, trie, opts2);
    if (found.length > 0) {
      results = results.concat(found);
    }
  }
  return view.update(results);
};
const isObject$4 = (val) => {
  return Object.prototype.toString.call(val) === "[object Object]";
};
function api$m(View2) {
  View2.prototype.lookup = function(input, opts2 = {}) {
    if (!input) {
      return this.none();
    }
    if (typeof input === "string") {
      input = [input];
    }
    const trie = isObject$4(input) ? input : buildTrie(input, this.world);
    let res = scan(this, trie, opts2);
    res = res.settle();
    return res;
  };
}
const truncate = (list2, val) => {
  for (let i2 = list2.length - 1; i2 >= 0; i2 -= 1) {
    if (list2[i2] !== val) {
      list2 = list2.slice(0, i2 + 1);
      return list2;
    }
  }
  return list2;
};
const compress = function(trie) {
  trie.goNext = trie.goNext.map((o2) => {
    if (Object.keys(o2).length === 0) {
      return void 0;
    }
    return o2;
  });
  trie.goNext = truncate(trie.goNext, void 0);
  trie.failTo = truncate(trie.failTo, 0);
  trie.endAs = truncate(trie.endAs, null);
  return trie;
};
const lib$4 = {
  /** turn an array or object into a compressed trie*/
  buildTrie: function(input) {
    const trie = buildTrie(input, this.world());
    return compress(trie);
  }
};
lib$4.compile = lib$4.buildTrie;
const lookup = {
  api: api$m,
  lib: lib$4
};
const relPointer = function(ptrs, parent) {
  if (!parent) {
    return ptrs;
  }
  ptrs.forEach((ptr) => {
    const n2 = ptr[0];
    if (parent[n2]) {
      ptr[0] = parent[n2][0];
      ptr[1] += parent[n2][1];
      ptr[2] += parent[n2][1];
    }
  });
  return ptrs;
};
const fixPointers = function(res, parent) {
  let { ptrs } = res;
  const { byGroup } = res;
  ptrs = relPointer(ptrs, parent);
  Object.keys(byGroup).forEach((k2) => {
    byGroup[k2] = relPointer(byGroup[k2], parent);
  });
  return { ptrs, byGroup };
};
const parseRegs = function(regs, opts2, world2) {
  const one = world2.methods.one;
  if (typeof regs === "number") {
    regs = String(regs);
  }
  if (typeof regs === "string") {
    regs = one.killUnicode(regs, world2);
    regs = one.parseMatch(regs, opts2, world2);
  }
  return regs;
};
const isObject$3 = (val) => {
  return Object.prototype.toString.call(val) === "[object Object]";
};
const isView = (val) => val && isObject$3(val) && val.isView === true;
const isNet = (val) => val && isObject$3(val) && val.isNet === true;
const match$1 = function(regs, group, opts2) {
  const one = this.methods.one;
  if (isView(regs)) {
    return this.intersection(regs);
  }
  if (isNet(regs)) {
    return this.sweep(regs, { tagger: false }).view.settle();
  }
  regs = parseRegs(regs, opts2, this.world);
  const todo = { regs, group };
  const res = one.match(this.docs, todo, this._cache);
  const { ptrs, byGroup } = fixPointers(res, this.fullPointer);
  const view = this.toView(ptrs);
  view._groups = byGroup;
  return view;
};
const matchOne = function(regs, group, opts2) {
  const one = this.methods.one;
  if (isView(regs)) {
    return this.intersection(regs).eq(0);
  }
  if (isNet(regs)) {
    return this.sweep(regs, { tagger: false, matchOne: true }).view;
  }
  regs = parseRegs(regs, opts2, this.world);
  const todo = { regs, group, justOne: true };
  const res = one.match(this.docs, todo, this._cache);
  const { ptrs, byGroup } = fixPointers(res, this.fullPointer);
  const view = this.toView(ptrs);
  view._groups = byGroup;
  return view;
};
const has = function(regs, group, opts2) {
  const one = this.methods.one;
  if (isView(regs)) {
    const ptrs2 = this.intersection(regs).fullPointer;
    return ptrs2.length > 0;
  }
  if (isNet(regs)) {
    return this.sweep(regs, { tagger: false }).view.found;
  }
  regs = parseRegs(regs, opts2, this.world);
  const todo = { regs, group, justOne: true };
  const ptrs = one.match(this.docs, todo, this._cache).ptrs;
  return ptrs.length > 0;
};
const ifFn = function(regs, group, opts2) {
  const one = this.methods.one;
  if (isView(regs)) {
    return this.filter((m2) => m2.intersection(regs).found);
  }
  if (isNet(regs)) {
    const m2 = this.sweep(regs, { tagger: false }).view.settle();
    return this.if(m2);
  }
  regs = parseRegs(regs, opts2, this.world);
  const todo = { regs, group, justOne: true };
  let ptrs = this.fullPointer;
  const cache2 = this._cache || [];
  ptrs = ptrs.filter((ptr, i2) => {
    const m2 = this.update([ptr]);
    const res = one.match(m2.docs, todo, cache2[i2]).ptrs;
    return res.length > 0;
  });
  const view = this.update(ptrs);
  if (this._cache) {
    view._cache = ptrs.map((ptr) => cache2[ptr[0]]);
  }
  return view;
};
const ifNo = function(regs, group, opts2) {
  const { methods: methods2 } = this;
  const one = methods2.one;
  if (isView(regs)) {
    return this.filter((m2) => !m2.intersection(regs).found);
  }
  if (isNet(regs)) {
    const m2 = this.sweep(regs, { tagger: false }).view.settle();
    return this.ifNo(m2);
  }
  regs = parseRegs(regs, opts2, this.world);
  const cache2 = this._cache || [];
  const view = this.filter((m2, i2) => {
    const todo = { regs, group, justOne: true };
    const ptrs = one.match(m2.docs, todo, cache2[i2]).ptrs;
    return ptrs.length === 0;
  });
  if (this._cache) {
    view._cache = view.ptrs.map((ptr) => cache2[ptr[0]]);
  }
  return view;
};
const match$2 = { matchOne, match: match$1, has, if: ifFn, ifNo };
const before = function(regs, group, opts2) {
  const { indexN: indexN2 } = this.methods.one.pointer;
  const pre = [];
  const byN = indexN2(this.fullPointer);
  Object.keys(byN).forEach((k2) => {
    const first = byN[k2].sort((a2, b) => a2[1] > b[1] ? 1 : -1)[0];
    if (first[1] > 0) {
      pre.push([first[0], 0, first[1]]);
    }
  });
  const preWords = this.toView(pre);
  if (!regs) {
    return preWords;
  }
  return preWords.match(regs, group, opts2);
};
const after = function(regs, group, opts2) {
  const { indexN: indexN2 } = this.methods.one.pointer;
  const post = [];
  const byN = indexN2(this.fullPointer);
  const document = this.document;
  Object.keys(byN).forEach((k2) => {
    const last = byN[k2].sort((a2, b) => a2[1] > b[1] ? -1 : 1)[0];
    const [n2, , end2] = last;
    if (end2 < document[n2].length) {
      post.push([n2, end2, document[n2].length]);
    }
  });
  const postWords = this.toView(post);
  if (!regs) {
    return postWords;
  }
  return postWords.match(regs, group, opts2);
};
const growLeft = function(regs, group, opts2) {
  if (typeof regs === "string") {
    regs = this.world.methods.one.parseMatch(regs, opts2, this.world);
  }
  regs[regs.length - 1].end = true;
  const ptrs = this.fullPointer;
  this.forEach((m2, n2) => {
    const more = m2.before(regs, group);
    if (more.found) {
      const terms = more.terms();
      ptrs[n2][1] -= terms.length;
      ptrs[n2][3] = terms.docs[0][0].id;
    }
  });
  return this.update(ptrs);
};
const growRight = function(regs, group, opts2) {
  if (typeof regs === "string") {
    regs = this.world.methods.one.parseMatch(regs, opts2, this.world);
  }
  regs[0].start = true;
  const ptrs = this.fullPointer;
  this.forEach((m2, n2) => {
    const more = m2.after(regs, group);
    if (more.found) {
      const terms = more.terms();
      ptrs[n2][2] += terms.length;
      ptrs[n2][4] = null;
    }
  });
  return this.update(ptrs);
};
const grow = function(regs, group, opts2) {
  return this.growRight(regs, group, opts2).growLeft(regs, group, opts2);
};
const lookaround = { before, after, growLeft, growRight, grow };
const combine = function(left, right) {
  return [left[0], left[1], right[2]];
};
const isArray$6 = function(arr) {
  return Object.prototype.toString.call(arr) === "[object Array]";
};
const getDoc$2 = (reg, view, group) => {
  if (typeof reg === "string" || isArray$6(reg)) {
    return view.match(reg, group);
  }
  if (!reg) {
    return view.none();
  }
  return reg;
};
const addIds$1 = function(ptr, view) {
  const [n2, start2, end2] = ptr;
  if (view.document[n2] && view.document[n2][start2]) {
    ptr[3] = ptr[3] || view.document[n2][start2].id;
    if (view.document[n2][end2 - 1]) {
      ptr[4] = ptr[4] || view.document[n2][end2 - 1].id;
    }
  }
  return ptr;
};
const methods$f = {};
methods$f.splitOn = function(m2, group) {
  const { splitAll: splitAll2 } = this.methods.one.pointer;
  const splits = getDoc$2(m2, this, group).fullPointer;
  const all2 = splitAll2(this.fullPointer, splits);
  let res = [];
  all2.forEach((o2) => {
    res.push(o2.passthrough);
    res.push(o2.before);
    res.push(o2.match);
    res.push(o2.after);
  });
  res = res.filter((p2) => p2);
  res = res.map((p2) => addIds$1(p2, this));
  return this.update(res);
};
methods$f.splitBefore = function(m2, group) {
  const { splitAll: splitAll2 } = this.methods.one.pointer;
  const splits = getDoc$2(m2, this, group).fullPointer;
  const all2 = splitAll2(this.fullPointer, splits);
  for (let i2 = 0; i2 < all2.length; i2 += 1) {
    if (!all2[i2].after && all2[i2 + 1] && all2[i2 + 1].before) {
      if (all2[i2].match && all2[i2].match[0] === all2[i2 + 1].before[0]) {
        all2[i2].after = all2[i2 + 1].before;
        delete all2[i2 + 1].before;
      }
    }
  }
  let res = [];
  all2.forEach((o2) => {
    res.push(o2.passthrough);
    res.push(o2.before);
    if (o2.match && o2.after) {
      res.push(combine(o2.match, o2.after));
    } else {
      res.push(o2.match);
    }
  });
  res = res.filter((p2) => p2);
  res = res.map((p2) => addIds$1(p2, this));
  return this.update(res);
};
methods$f.splitAfter = function(m2, group) {
  const { splitAll: splitAll2 } = this.methods.one.pointer;
  const splits = getDoc$2(m2, this, group).fullPointer;
  const all2 = splitAll2(this.fullPointer, splits);
  let res = [];
  all2.forEach((o2) => {
    res.push(o2.passthrough);
    if (o2.before && o2.match) {
      res.push(combine(o2.before, o2.match));
    } else {
      res.push(o2.before);
      res.push(o2.match);
    }
    res.push(o2.after);
  });
  res = res.filter((p2) => p2);
  res = res.map((p2) => addIds$1(p2, this));
  return this.update(res);
};
methods$f.split = methods$f.splitAfter;
const isNeighbour = function(ptrL, ptrR) {
  if (!ptrL || !ptrR) {
    return false;
  }
  if (ptrL[0] !== ptrR[0]) {
    return false;
  }
  return ptrL[2] === ptrR[1];
};
const mergeIf = function(doc, lMatch, rMatch) {
  const world2 = doc.world;
  const parseMatch = world2.methods.one.parseMatch;
  lMatch = lMatch || ".$";
  rMatch = rMatch || "^.";
  const leftMatch = parseMatch(lMatch, {}, world2);
  const rightMatch = parseMatch(rMatch, {}, world2);
  leftMatch[leftMatch.length - 1].end = true;
  rightMatch[0].start = true;
  const ptrs = doc.fullPointer;
  const res = [ptrs[0]];
  for (let i2 = 1; i2 < ptrs.length; i2 += 1) {
    const ptrL = res[res.length - 1];
    const ptrR = ptrs[i2];
    const left = doc.update([ptrL]);
    const right = doc.update([ptrR]);
    if (isNeighbour(ptrL, ptrR) && left.has(leftMatch) && right.has(rightMatch)) {
      res[res.length - 1] = [ptrL[0], ptrL[1], ptrR[2], ptrL[3], ptrR[4]];
    } else {
      res.push(ptrR);
    }
  }
  return doc.update(res);
};
const methods$e = {
  //  merge only if conditions are met
  joinIf: function(lMatch, rMatch) {
    return mergeIf(this, lMatch, rMatch);
  },
  // merge all neighbouring matches
  join: function() {
    return mergeIf(this);
  }
};
const methods$d = Object.assign({}, match$2, lookaround, methods$f, methods$e);
methods$d.lookBehind = methods$d.before;
methods$d.lookBefore = methods$d.before;
methods$d.lookAhead = methods$d.after;
methods$d.lookAfter = methods$d.after;
methods$d.notIf = methods$d.ifNo;
const matchAPI = function(View2) {
  Object.assign(View2.prototype, methods$d);
};
const bySlashes = /(?:^|\s)([![^]*(?:<[^<]*>)?\/.*?[^\\/]\/[?\]+*$~]*)(?:\s|$)/;
const byParentheses = /([!~[^]*(?:<[^<]*>)?\([^)]+[^\\)]\)[?\]+*$~]*)(?:\s|$)/;
const byWord$1 = / /g;
const isBlock = (str) => {
  return /^[![^]*(<[^<]*>)?\(/.test(str) && /\)[?\]+*$~]*$/.test(str);
};
const isReg = (str) => {
  return /^[![^]*(<[^<]*>)?\//.test(str) && /\/[?\]+*$~]*$/.test(str);
};
const cleanUp$1 = function(arr) {
  arr = arr.map((str) => str.trim());
  arr = arr.filter((str) => str);
  return arr;
};
const parseBlocks = function(txt) {
  const arr = txt.split(bySlashes);
  let res = [];
  arr.forEach((str) => {
    if (isReg(str)) {
      res.push(str);
      return;
    }
    res = res.concat(str.split(byParentheses));
  });
  res = cleanUp$1(res);
  let final = [];
  res.forEach((str) => {
    if (isBlock(str)) {
      final.push(str);
    } else if (isReg(str)) {
      final.push(str);
    } else {
      final = final.concat(str.split(byWord$1));
    }
  });
  final = cleanUp$1(final);
  return final;
};
const hasMinMax = /\{([0-9]+)?(, *[0-9]*)?\}/;
const andSign = /&&/;
const captureName = new RegExp(/^<\s*(\S+)\s*>/);
const titleCase$2 = (str) => str.charAt(0).toUpperCase() + str.substring(1);
const end = (str) => str.charAt(str.length - 1);
const start = (str) => str.charAt(0);
const stripStart = (str) => str.substring(1);
const stripEnd = (str) => str.substring(0, str.length - 1);
const stripBoth = function(str) {
  str = stripStart(str);
  str = stripEnd(str);
  return str;
};
const parseToken = function(w, opts2) {
  const obj = {};
  for (let i2 = 0; i2 < 2; i2 += 1) {
    if (end(w) === "$") {
      obj.end = true;
      w = stripEnd(w);
    }
    if (start(w) === "^") {
      obj.start = true;
      w = stripStart(w);
    }
    if (end(w) === "?") {
      obj.optional = true;
      w = stripEnd(w);
    }
    if (start(w) === "[" || end(w) === "]") {
      obj.group = null;
      if (start(w) === "[") {
        obj.groupStart = true;
      }
      if (end(w) === "]") {
        obj.groupEnd = true;
      }
      w = w.replace(/^\[/, "");
      w = w.replace(/\]$/, "");
      if (start(w) === "<") {
        const res = captureName.exec(w);
        if (res.length >= 2) {
          obj.group = res[1];
          w = w.replace(res[0], "");
        }
      }
    }
    if (end(w) === "+") {
      obj.greedy = true;
      w = stripEnd(w);
    }
    if (w !== "*" && end(w) === "*" && w !== "\\*") {
      obj.greedy = true;
      w = stripEnd(w);
    }
    if (start(w) === "!") {
      obj.negative = true;
      w = stripStart(w);
    }
    if (start(w) === "~" && end(w) === "~" && w.length > 2) {
      w = stripBoth(w);
      obj.fuzzy = true;
      obj.min = opts2.fuzzy || 0.85;
      if (/\(/.test(w) === false) {
        obj.word = w;
        return obj;
      }
    }
    if (start(w) === "/" && end(w) === "/") {
      w = stripBoth(w);
      if (opts2.caseSensitive) {
        obj.use = "text";
      }
      obj.regex = new RegExp(w);
      return obj;
    }
    if (hasMinMax.test(w) === true) {
      w = w.replace(hasMinMax, (_a, b, c2) => {
        if (c2 === void 0) {
          obj.min = Number(b);
          obj.max = Number(b);
        } else {
          c2 = c2.replace(/, */, "");
          if (b === void 0) {
            obj.min = 0;
            obj.max = Number(c2);
          } else {
            obj.min = Number(b);
            obj.max = Number(c2 || 999);
          }
        }
        obj.greedy = true;
        if (!obj.min) {
          obj.optional = true;
        }
        return "";
      });
    }
    if (start(w) === "(" && end(w) === ")") {
      if (andSign.test(w)) {
        obj.choices = w.split(andSign);
        obj.operator = "and";
      } else {
        obj.choices = w.split("|");
        obj.operator = "or";
      }
      obj.choices[0] = stripStart(obj.choices[0]);
      const last = obj.choices.length - 1;
      obj.choices[last] = stripEnd(obj.choices[last]);
      obj.choices = obj.choices.map((s2) => s2.trim());
      obj.choices = obj.choices.filter((s2) => s2);
      obj.choices = obj.choices.map((str) => {
        return str.split(/ /g).map((s2) => parseToken(s2, opts2));
      });
      w = "";
    }
    if (start(w) === "{" && end(w) === "}") {
      w = stripBoth(w);
      obj.root = w;
      if (/\//.test(w)) {
        const split2 = obj.root.split(/\//);
        obj.root = split2[0];
        obj.pos = split2[1];
        if (obj.pos === "adj") {
          obj.pos = "Adjective";
        }
        obj.pos = obj.pos.charAt(0).toUpperCase() + obj.pos.substr(1).toLowerCase();
        if (split2[2] !== void 0) {
          obj.sense = split2[2];
        }
      }
      return obj;
    }
    if (start(w) === "<" && end(w) === ">") {
      w = stripBoth(w);
      obj.chunk = titleCase$2(w);
      obj.greedy = true;
      return obj;
    }
    if (start(w) === "%" && end(w) === "%") {
      w = stripBoth(w);
      obj.switch = w;
      return obj;
    }
  }
  if (start(w) === "#") {
    obj.tag = stripStart(w);
    obj.tag = titleCase$2(obj.tag);
    return obj;
  }
  if (start(w) === "@") {
    obj.method = stripStart(w);
    return obj;
  }
  if (w === ".") {
    obj.anything = true;
    return obj;
  }
  if (w === "*") {
    obj.anything = true;
    obj.greedy = true;
    obj.optional = true;
    return obj;
  }
  if (w) {
    w = w.replace("\\*", "*");
    w = w.replace("\\.", ".");
    if (opts2.caseSensitive) {
      obj.use = "text";
    } else {
      w = w.toLowerCase();
    }
    obj.word = w;
  }
  return obj;
};
const hasDash$2 = /[a-z0-9][-–—][a-z]/i;
const splitHyphens$1 = function(regs, world2) {
  const prefixes2 = world2.model.one.prefixes;
  for (let i2 = regs.length - 1; i2 >= 0; i2 -= 1) {
    const reg = regs[i2];
    if (reg.word && hasDash$2.test(reg.word)) {
      let words2 = reg.word.split(/[-–—]/g);
      if (prefixes2.hasOwnProperty(words2[0])) {
        continue;
      }
      words2 = words2.filter((w) => w).reverse();
      regs.splice(i2, 1);
      words2.forEach((w) => {
        const obj = Object.assign({}, reg);
        obj.word = w;
        regs.splice(i2, 0, obj);
      });
    }
  }
  return regs;
};
const addVerbs = function(token, world2) {
  const { all: all2 } = world2.methods.two.transform.verb || {};
  const str = token.root;
  if (!all2) {
    return [];
  }
  return all2(str, world2.model);
};
const addNoun = function(token, world2) {
  const { all: all2 } = world2.methods.two.transform.noun || {};
  if (!all2) {
    return [token.root];
  }
  return all2(token.root, world2.model);
};
const addAdjective = function(token, world2) {
  const { all: all2 } = world2.methods.two.transform.adjective || {};
  if (!all2) {
    return [token.root];
  }
  return all2(token.root, world2.model);
};
const inflectRoot = function(regs, world2) {
  regs = regs.map((token) => {
    if (token.root) {
      if (world2.methods.two && world2.methods.two.transform) {
        let choices = [];
        if (token.pos) {
          if (token.pos === "Verb") {
            choices = choices.concat(addVerbs(token, world2));
          } else if (token.pos === "Noun") {
            choices = choices.concat(addNoun(token, world2));
          } else if (token.pos === "Adjective") {
            choices = choices.concat(addAdjective(token, world2));
          }
        } else {
          choices = choices.concat(addVerbs(token, world2));
          choices = choices.concat(addNoun(token, world2));
          choices = choices.concat(addAdjective(token, world2));
        }
        choices = choices.filter((str) => str);
        if (choices.length > 0) {
          token.operator = "or";
          token.fastOr = new Set(choices);
        }
      } else {
        token.machine = token.root;
        delete token.id;
        delete token.root;
      }
    }
    return token;
  });
  return regs;
};
const nameGroups = function(regs) {
  let index2 = 0;
  let inGroup = null;
  for (let i2 = 0; i2 < regs.length; i2++) {
    const token = regs[i2];
    if (token.groupStart === true) {
      inGroup = token.group;
      if (inGroup === null) {
        inGroup = String(index2);
        index2 += 1;
      }
    }
    if (inGroup !== null) {
      token.group = inGroup;
    }
    if (token.groupEnd === true) {
      inGroup = null;
    }
  }
  return regs;
};
const doFastOrMode = function(tokens) {
  return tokens.map((token) => {
    if (token.choices !== void 0) {
      if (token.operator !== "or") {
        return token;
      }
      if (token.fuzzy === true) {
        return token;
      }
      const shouldPack = token.choices.every((block) => {
        if (block.length !== 1) {
          return false;
        }
        const reg = block[0];
        if (reg.fuzzy === true) {
          return false;
        }
        if (reg.start || reg.end) {
          return false;
        }
        if (reg.word !== void 0 && reg.negative !== true && reg.optional !== true && reg.method !== true) {
          return true;
        }
        return false;
      });
      if (shouldPack === true) {
        token.fastOr = /* @__PURE__ */ new Set();
        token.choices.forEach((block) => {
          token.fastOr.add(block[0].word);
        });
        delete token.choices;
      }
    }
    return token;
  });
};
const fuzzyOr = function(regs) {
  return regs.map((reg) => {
    if (reg.fuzzy && reg.choices) {
      reg.choices.forEach((r2) => {
        if (r2.length === 1 && r2[0].word) {
          r2[0].fuzzy = true;
          r2[0].min = reg.min;
        }
      });
    }
    return reg;
  });
};
const postProcess = function(regs) {
  regs = nameGroups(regs);
  regs = doFastOrMode(regs);
  regs = fuzzyOr(regs);
  return regs;
};
const syntax = function(input, opts2, world2) {
  if (input === null || input === void 0 || input === "") {
    return [];
  }
  opts2 = opts2 || {};
  if (typeof input === "number") {
    input = String(input);
  }
  let tokens = parseBlocks(input);
  tokens = tokens.map((str) => parseToken(str, opts2));
  tokens = splitHyphens$1(tokens, world2);
  tokens = inflectRoot(tokens, world2);
  tokens = postProcess(tokens);
  return tokens;
};
const anyIntersection = function(setA, setB) {
  for (const elem of setB) {
    if (setA.has(elem)) {
      return true;
    }
  }
  return false;
};
const failFast = function(regs, cache2) {
  for (let i2 = 0; i2 < regs.length; i2 += 1) {
    const reg = regs[i2];
    if (reg.optional === true || reg.negative === true || reg.fuzzy === true) {
      continue;
    }
    if (reg.word !== void 0 && cache2.has(reg.word) === false) {
      return true;
    }
    if (reg.tag !== void 0 && cache2.has("#" + reg.tag) === false) {
      return true;
    }
    if (reg.fastOr && anyIntersection(reg.fastOr, cache2) === false) {
      return false;
    }
  }
  return false;
};
const editDistance = function(strA, strB) {
  const aLength = strA.length, bLength = strB.length;
  if (aLength === 0) {
    return bLength;
  }
  if (bLength === 0) {
    return aLength;
  }
  const limit = (bLength > aLength ? bLength : aLength) + 1;
  if (Math.abs(aLength - bLength) > (limit || 100)) {
    return limit || 100;
  }
  const matrix = [];
  for (let i2 = 0; i2 < limit; i2++) {
    matrix[i2] = [i2];
    matrix[i2].length = limit;
  }
  for (let i2 = 0; i2 < limit; i2++) {
    matrix[0][i2] = i2;
  }
  let j2, a_index, b_index, cost, min2, t2;
  for (let i2 = 1; i2 <= aLength; ++i2) {
    a_index = strA[i2 - 1];
    for (j2 = 1; j2 <= bLength; ++j2) {
      if (i2 === j2 && matrix[i2][j2] > 4) {
        return aLength;
      }
      b_index = strB[j2 - 1];
      cost = a_index === b_index ? 0 : 1;
      min2 = matrix[i2 - 1][j2] + 1;
      if ((t2 = matrix[i2][j2 - 1] + 1) < min2) min2 = t2;
      if ((t2 = matrix[i2 - 1][j2 - 1] + cost) < min2) min2 = t2;
      const shouldUpdate = i2 > 1 && j2 > 1 && a_index === strB[j2 - 2] && strA[i2 - 2] === b_index && (t2 = matrix[i2 - 2][j2 - 2] + cost) < min2;
      if (shouldUpdate) {
        matrix[i2][j2] = t2;
      } else {
        matrix[i2][j2] = min2;
      }
    }
  }
  return matrix[aLength][bLength];
};
const fuzzyMatch = function(strA, strB, minLength = 3) {
  if (strA === strB) {
    return 1;
  }
  if (strA.length < minLength || strB.length < minLength) {
    return 0;
  }
  const steps = editDistance(strA, strB);
  const length2 = Math.max(strA.length, strB.length);
  const relative2 = length2 === 0 ? 0 : steps / length2;
  const similarity = 1 - relative2;
  return similarity;
};
const startQuote = /([\u0022\uFF02\u0027\u201C\u2018\u201F\u201B\u201E\u2E42\u201A\u00AB\u2039\u2035\u2036\u2037\u301D\u0060\u301F])/;
const endQuote = /([\u0022\uFF02\u0027\u201D\u2019\u00BB\u203A\u2032\u2033\u2034\u301E\u00B4])/;
const hasHyphen$1 = /^[-–—]$/;
const hasDash$1 = / [-–—]{1,3} /;
const hasPost = (term, punct) => term.post.indexOf(punct) !== -1;
const methods$c = {
  /** does it have a quotation symbol?  */
  hasQuote: (term) => startQuote.test(term.pre) || endQuote.test(term.post),
  /** does it have a comma?  */
  hasComma: (term) => hasPost(term, ","),
  /** does it end in a period? */
  hasPeriod: (term) => hasPost(term, ".") === true && hasPost(term, "...") === false,
  /** does it end in an exclamation */
  hasExclamation: (term) => hasPost(term, "!"),
  /** does it end with a question mark? */
  hasQuestionMark: (term) => hasPost(term, "?") || hasPost(term, "¿"),
  /** is there a ... at the end? */
  hasEllipses: (term) => hasPost(term, "..") || hasPost(term, "…"),
  /** is there a semicolon after term word? */
  hasSemicolon: (term) => hasPost(term, ";"),
  /** is there a colon after term word? */
  hasColon: (term) => hasPost(term, ":"),
  /** is there a slash '/' in term word? */
  hasSlash: (term) => /\//.test(term.text),
  /** a hyphen connects two words like-term */
  hasHyphen: (term) => hasHyphen$1.test(term.post) || hasHyphen$1.test(term.pre),
  /** a dash separates words - like that */
  hasDash: (term) => hasDash$1.test(term.post) || hasDash$1.test(term.pre),
  /** is it multiple words combinded */
  hasContraction: (term) => Boolean(term.implicit),
  /** is it an acronym */
  isAcronym: (term) => term.tags.has("Acronym"),
  /** does it have any tags */
  isKnown: (term) => term.tags.size > 0,
  /** uppercase first letter, then a lowercase */
  isTitleCase: (term) => new RegExp("^\\p{Lu}[a-z'\\u00C0-\\u00FF]", "u").test(term.text),
  /** uppercase all letters */
  isUpperCase: (term) => new RegExp("^\\p{Lu}+$", "u").test(term.text)
};
methods$c.hasQuotation = methods$c.hasQuote;
let wrapMatch = function() {
};
const doesMatch$1 = function(term, reg, index2, length2) {
  if (reg.anything === true) {
    return true;
  }
  if (reg.start === true && index2 !== 0) {
    return false;
  }
  if (reg.end === true && index2 !== length2 - 1) {
    return false;
  }
  if (reg.id !== void 0 && reg.id === term.id) {
    return true;
  }
  if (reg.word !== void 0) {
    if (reg.use) {
      return reg.word === term[reg.use];
    }
    if (term.machine !== null && term.machine === reg.word) {
      return true;
    }
    if (term.alias !== void 0 && term.alias.hasOwnProperty(reg.word)) {
      return true;
    }
    if (reg.fuzzy === true) {
      if (reg.word === term.root) {
        return true;
      }
      const score = fuzzyMatch(reg.word, term.normal);
      if (score >= reg.min) {
        return true;
      }
    }
    if (term.alias && term.alias.some((str) => str === reg.word)) {
      return true;
    }
    return reg.word === term.text || reg.word === term.normal;
  }
  if (reg.tag !== void 0) {
    return term.tags.has(reg.tag) === true;
  }
  if (reg.method !== void 0) {
    if (typeof methods$c[reg.method] === "function" && methods$c[reg.method](term) === true) {
      return true;
    }
    return false;
  }
  if (reg.pre !== void 0) {
    return term.pre && term.pre.includes(reg.pre);
  }
  if (reg.post !== void 0) {
    return term.post && term.post.includes(reg.post);
  }
  if (reg.regex !== void 0) {
    let str = term.normal;
    if (reg.use) {
      str = term[reg.use];
    }
    return reg.regex.test(str);
  }
  if (reg.chunk !== void 0) {
    return term.chunk === reg.chunk;
  }
  if (reg.switch !== void 0) {
    return term.switch === reg.switch;
  }
  if (reg.machine !== void 0) {
    return term.normal === reg.machine || term.machine === reg.machine || term.root === reg.machine;
  }
  if (reg.sense !== void 0) {
    return term.sense === reg.sense;
  }
  if (reg.fastOr !== void 0) {
    if (reg.pos && !term.tags.has(reg.pos)) {
      return null;
    }
    const str = term.root || term.implicit || term.machine || term.normal;
    return reg.fastOr.has(str) || reg.fastOr.has(term.text);
  }
  if (reg.choices !== void 0) {
    if (reg.operator === "and") {
      return reg.choices.every((r2) => wrapMatch(term, r2, index2, length2));
    }
    return reg.choices.some((r2) => wrapMatch(term, r2, index2, length2));
  }
  return false;
};
wrapMatch = function(t2, reg, index2, length2) {
  const result = doesMatch$1(t2, reg, index2, length2);
  if (reg.negative === true) {
    return !result;
  }
  return result;
};
const getGreedy = function(state, endReg) {
  const reg = Object.assign({}, state.regs[state.r], { start: false, end: false });
  const start2 = state.t;
  for (; state.t < state.terms.length; state.t += 1) {
    if (endReg && wrapMatch(state.terms[state.t], endReg, state.start_i + state.t, state.phrase_length)) {
      return state.t;
    }
    const count = state.t - start2 + 1;
    if (reg.max !== void 0 && count === reg.max) {
      return state.t;
    }
    if (wrapMatch(state.terms[state.t], reg, state.start_i + state.t, state.phrase_length) === false) {
      if (reg.min !== void 0 && count < reg.min) {
        return null;
      }
      return state.t;
    }
  }
  return state.t;
};
const greedyTo = function(state, nextReg) {
  let t2 = state.t;
  if (!nextReg) {
    return state.terms.length;
  }
  for (; t2 < state.terms.length; t2 += 1) {
    if (wrapMatch(state.terms[t2], nextReg, state.start_i + t2, state.phrase_length) === true) {
      return t2;
    }
  }
  return null;
};
const isEndGreedy = function(reg, state) {
  if (reg.end === true && reg.greedy === true) {
    if (state.start_i + state.t < state.phrase_length - 1) {
      const tmpReg = Object.assign({}, reg, { end: false });
      if (wrapMatch(state.terms[state.t], tmpReg, state.start_i + state.t, state.phrase_length) === true) {
        return true;
      }
    }
  }
  return false;
};
const getGroup$1 = function(state, term_index) {
  if (state.groups[state.inGroup]) {
    return state.groups[state.inGroup];
  }
  state.groups[state.inGroup] = {
    start: term_index,
    length: 0
  };
  return state.groups[state.inGroup];
};
const doAstrix = function(state) {
  const { regs } = state;
  const reg = regs[state.r];
  const skipto = greedyTo(state, regs[state.r + 1]);
  if (skipto === null || skipto === 0) {
    return null;
  }
  if (reg.min !== void 0 && skipto - state.t < reg.min) {
    return null;
  }
  if (reg.max !== void 0 && skipto - state.t > reg.max) {
    state.t = state.t + reg.max;
    return true;
  }
  if (state.hasGroup === true) {
    const g3 = getGroup$1(state, state.t);
    g3.length = skipto - state.t;
  }
  state.t = skipto;
  return true;
};
const isArray$5 = function(arr) {
  return Object.prototype.toString.call(arr) === "[object Array]";
};
const doOrBlock = function(state, skipN = 0) {
  const block = state.regs[state.r];
  let wasFound = false;
  for (let c2 = 0; c2 < block.choices.length; c2 += 1) {
    const regs = block.choices[c2];
    if (!isArray$5(regs)) {
      return false;
    }
    wasFound = regs.every((cr, w_index) => {
      let extra = 0;
      const t2 = state.t + w_index + skipN + extra;
      if (state.terms[t2] === void 0) {
        return false;
      }
      const foundBlock = wrapMatch(state.terms[t2], cr, t2 + state.start_i, state.phrase_length);
      if (foundBlock === true && cr.greedy === true) {
        for (let i2 = 1; i2 < state.terms.length; i2 += 1) {
          const term = state.terms[t2 + i2];
          if (term) {
            const keepGoing = wrapMatch(term, cr, state.start_i + i2, state.phrase_length);
            if (keepGoing === true) {
              extra += 1;
            } else {
              break;
            }
          }
        }
      }
      skipN += extra;
      return foundBlock;
    });
    if (wasFound) {
      skipN += regs.length;
      break;
    }
  }
  if (wasFound && block.greedy === true) {
    return doOrBlock(state, skipN);
  }
  return skipN;
};
const doAndBlock = function(state) {
  let longest = 0;
  const reg = state.regs[state.r];
  const allDidMatch = reg.choices.every((block) => {
    const allWords = block.every((cr, w_index) => {
      const tryTerm = state.t + w_index;
      if (state.terms[tryTerm] === void 0) {
        return false;
      }
      return wrapMatch(state.terms[tryTerm], cr, tryTerm, state.phrase_length);
    });
    if (allWords === true && block.length > longest) {
      longest = block.length;
    }
    return allWords;
  });
  if (allDidMatch === true) {
    return longest;
  }
  return false;
};
const orBlock = function(state) {
  const { regs } = state;
  const reg = regs[state.r];
  const skipNum = doOrBlock(state);
  if (skipNum) {
    if (reg.negative === true) {
      return null;
    }
    if (state.hasGroup === true) {
      const g3 = getGroup$1(state, state.t);
      g3.length += skipNum;
    }
    if (reg.end === true) {
      const end2 = state.phrase_length;
      if (state.t + state.start_i + skipNum !== end2) {
        return null;
      }
    }
    state.t += skipNum;
    return true;
  } else if (!reg.optional) {
    return null;
  }
  return true;
};
const andBlock = function(state) {
  const { regs } = state;
  const reg = regs[state.r];
  const skipNum = doAndBlock(state);
  if (skipNum) {
    if (reg.negative === true) {
      return null;
    }
    if (state.hasGroup === true) {
      const g3 = getGroup$1(state, state.t);
      g3.length += skipNum;
    }
    if (reg.end === true) {
      const end2 = state.phrase_length - 1;
      if (state.t + state.start_i !== end2) {
        return null;
      }
    }
    state.t += skipNum;
    return true;
  } else if (!reg.optional) {
    return null;
  }
  return true;
};
const negGreedy = function(state, reg, nextReg) {
  let skip = 0;
  for (let t2 = state.t; t2 < state.terms.length; t2 += 1) {
    let found = wrapMatch(state.terms[t2], reg, state.start_i + state.t, state.phrase_length);
    if (found) {
      break;
    }
    if (nextReg) {
      found = wrapMatch(state.terms[t2], nextReg, state.start_i + state.t, state.phrase_length);
      if (found) {
        break;
      }
    }
    skip += 1;
    if (reg.max !== void 0 && skip === reg.max) {
      break;
    }
  }
  if (skip === 0) {
    return false;
  }
  if (reg.min && reg.min > skip) {
    return false;
  }
  state.t += skip;
  return true;
};
const doNegative = function(state) {
  const { regs } = state;
  const reg = regs[state.r];
  const tmpReg = Object.assign({}, reg);
  tmpReg.negative = false;
  const found = wrapMatch(state.terms[state.t], tmpReg, state.start_i + state.t, state.phrase_length);
  if (found) {
    return false;
  }
  if (reg.optional) {
    const nextReg = regs[state.r + 1];
    if (nextReg) {
      const fNext = wrapMatch(state.terms[state.t], nextReg, state.start_i + state.t, state.phrase_length);
      if (fNext) {
        state.r += 1;
      } else if (nextReg.optional && regs[state.r + 2]) {
        const fNext2 = wrapMatch(state.terms[state.t], regs[state.r + 2], state.start_i + state.t, state.phrase_length);
        if (fNext2) {
          state.r += 2;
        }
      }
    }
  }
  if (reg.greedy) {
    return negGreedy(state, tmpReg, regs[state.r + 1]);
  }
  state.t += 1;
  return true;
};
const foundOptional = function(state) {
  const { regs } = state;
  const reg = regs[state.r];
  const term = state.terms[state.t];
  const nextRegMatched = wrapMatch(term, regs[state.r + 1], state.start_i + state.t, state.phrase_length);
  if (reg.negative || nextRegMatched) {
    const nextTerm = state.terms[state.t + 1];
    if (!nextTerm || !wrapMatch(nextTerm, regs[state.r + 1], state.start_i + state.t, state.phrase_length)) {
      state.r += 1;
    }
  }
};
const greedyMatch = function(state) {
  const { regs, phrase_length } = state;
  const reg = regs[state.r];
  state.t = getGreedy(state, regs[state.r + 1]);
  if (state.t === null) {
    return null;
  }
  if (reg.min && reg.min > state.t) {
    return null;
  }
  if (reg.end === true && state.start_i + state.t !== phrase_length) {
    return null;
  }
  return true;
};
const contractionSkip = function(state) {
  const term = state.terms[state.t];
  const reg = state.regs[state.r];
  if (term.implicit && state.terms[state.t + 1]) {
    const nextTerm = state.terms[state.t + 1];
    if (!nextTerm.implicit) {
      return;
    }
    if (reg.word === term.normal) {
      state.t += 1;
    }
    if (reg.method === "hasContraction") {
      state.t += 1;
    }
  }
};
const setGroup = function(state, startAt) {
  const reg = state.regs[state.r];
  const g3 = getGroup$1(state, startAt);
  if (state.t > 1 && reg.greedy) {
    g3.length += state.t - startAt;
  } else {
    g3.length++;
  }
};
const simpleMatch = function(state) {
  const { regs } = state;
  const reg = regs[state.r];
  const term = state.terms[state.t];
  const startAt = state.t;
  if (reg.optional && regs[state.r + 1] && reg.negative) {
    return true;
  }
  if (reg.optional && regs[state.r + 1]) {
    foundOptional(state);
  }
  if (term.implicit && state.terms[state.t + 1]) {
    contractionSkip(state);
  }
  state.t += 1;
  if (reg.end === true && state.t !== state.terms.length && reg.greedy !== true) {
    return null;
  }
  if (reg.greedy === true) {
    const alive = greedyMatch(state);
    if (!alive) {
      return null;
    }
  }
  if (state.hasGroup === true) {
    setGroup(state, startAt);
  }
  return true;
};
const tryHere = function(terms, regs, start_i, phrase_length) {
  if (terms.length === 0 || regs.length === 0) {
    return null;
  }
  const state = {
    t: 0,
    terms,
    r: 0,
    regs,
    groups: {},
    start_i,
    phrase_length,
    inGroup: null
  };
  for (; state.r < regs.length; state.r += 1) {
    const reg = regs[state.r];
    state.hasGroup = Boolean(reg.group);
    if (state.hasGroup === true) {
      state.inGroup = reg.group;
    } else {
      state.inGroup = null;
    }
    if (!state.terms[state.t]) {
      const alive = regs.slice(state.r).some((remain) => !remain.optional);
      if (alive === false) {
        break;
      }
      return null;
    }
    if (reg.anything === true && reg.greedy === true) {
      const alive = doAstrix(state);
      if (!alive) {
        return null;
      }
      continue;
    }
    if (reg.choices !== void 0 && reg.operator === "or") {
      const alive = orBlock(state);
      if (!alive) {
        return null;
      }
      continue;
    }
    if (reg.choices !== void 0 && reg.operator === "and") {
      const alive = andBlock(state);
      if (!alive) {
        return null;
      }
      continue;
    }
    if (reg.anything === true) {
      if (reg.negative && reg.anything) {
        return null;
      }
      const alive = simpleMatch(state);
      if (!alive) {
        return null;
      }
      continue;
    }
    if (isEndGreedy(reg, state) === true) {
      const alive = simpleMatch(state);
      if (!alive) {
        return null;
      }
      continue;
    }
    if (reg.negative) {
      const alive = doNegative(state);
      if (!alive) {
        return null;
      }
      continue;
    }
    const hasMatch = wrapMatch(state.terms[state.t], reg, state.start_i + state.t, state.phrase_length);
    if (hasMatch === true) {
      const alive = simpleMatch(state);
      if (!alive) {
        return null;
      }
      continue;
    }
    if (reg.optional === true) {
      continue;
    }
    return null;
  }
  const pntr = [null, start_i, state.t + start_i];
  if (pntr[1] === pntr[2]) {
    return null;
  }
  const groups = {};
  Object.keys(state.groups).forEach((k2) => {
    const o2 = state.groups[k2];
    const start2 = start_i + o2.start;
    groups[k2] = [null, start2, start2 + o2.length];
  });
  return { pointer: pntr, groups };
};
const getGroup = function(res, group) {
  const ptrs = [];
  const byGroup = {};
  if (res.length === 0) {
    return { ptrs, byGroup };
  }
  if (typeof group === "number") {
    group = String(group);
  }
  if (group) {
    res.forEach((r2) => {
      if (r2.groups[group]) {
        ptrs.push(r2.groups[group]);
      }
    });
  } else {
    res.forEach((r2) => {
      ptrs.push(r2.pointer);
      Object.keys(r2.groups).forEach((k2) => {
        byGroup[k2] = byGroup[k2] || [];
        byGroup[k2].push(r2.groups[k2]);
      });
    });
  }
  return { ptrs, byGroup };
};
const notIf$1 = function(results, not, docs) {
  results = results.filter((res) => {
    const [n2, start2, end2] = res.pointer;
    const terms = docs[n2].slice(start2, end2);
    for (let i2 = 0; i2 < terms.length; i2 += 1) {
      const slice = terms.slice(i2);
      const found = tryHere(slice, not, i2, terms.length);
      if (found !== null) {
        return false;
      }
    }
    return true;
  });
  return results;
};
const addSentence = function(res, n2) {
  res.pointer[0] = n2;
  Object.keys(res.groups).forEach((k2) => {
    res.groups[k2][0] = n2;
  });
  return res;
};
const handleStart = function(terms, regs, n2) {
  let res = tryHere(terms, regs, 0, terms.length);
  if (res) {
    res = addSentence(res, n2);
    return res;
  }
  return null;
};
const runMatch$1 = function(docs, todo, cache2) {
  cache2 = cache2 || [];
  const { regs, group, justOne } = todo;
  let results = [];
  if (!regs || regs.length === 0) {
    return { ptrs: [], byGroup: {} };
  }
  const minLength = regs.filter((r2) => r2.optional !== true && r2.negative !== true).length;
  docs: for (let n2 = 0; n2 < docs.length; n2 += 1) {
    const terms = docs[n2];
    if (cache2[n2] && failFast(regs, cache2[n2])) {
      continue;
    }
    if (regs[0].start === true) {
      const foundStart = handleStart(terms, regs, n2);
      if (foundStart) {
        results.push(foundStart);
      }
      continue;
    }
    for (let i2 = 0; i2 < terms.length; i2 += 1) {
      const slice = terms.slice(i2);
      if (slice.length < minLength) {
        break;
      }
      let res = tryHere(slice, regs, i2, terms.length);
      if (res) {
        res = addSentence(res, n2);
        results.push(res);
        if (justOne === true) {
          break docs;
        }
        const end2 = res.pointer[2];
        if (Math.abs(end2 - 1) > i2) {
          i2 = Math.abs(end2 - 1);
        }
      }
    }
  }
  if (regs[regs.length - 1].end === true) {
    results = results.filter((res) => {
      const n2 = res.pointer[0];
      return docs[n2].length === res.pointer[2];
    });
  }
  if (todo.notIf) {
    results = notIf$1(results, todo.notIf, docs);
  }
  results = getGroup(results, group);
  results.ptrs.forEach((ptr) => {
    const [n2, start2, end2] = ptr;
    ptr[3] = docs[n2][start2].id;
    ptr[4] = docs[n2][end2 - 1].id;
  });
  return results;
};
const methods$b = {
  one: {
    termMethods: methods$c,
    parseMatch: syntax,
    match: runMatch$1
  }
};
const lib$3 = {
  /** pre-parse any match statements */
  parseMatch: function(str, opts2) {
    const world2 = this.world();
    const killUnicode2 = world2.methods.one.killUnicode;
    if (killUnicode2) {
      str = killUnicode2(str, world2);
    }
    return world2.methods.one.parseMatch(str, opts2, world2);
  }
};
const match = {
  api: matchAPI,
  methods: methods$b,
  lib: lib$3
};
const isClass = /^\../;
const isId = /^#./;
const escapeXml = (str) => {
  str = str.replace(/&/g, "&amp;");
  str = str.replace(/</g, "&lt;");
  str = str.replace(/>/g, "&gt;");
  str = str.replace(/"/g, "&quot;");
  str = str.replace(/'/g, "&apos;");
  return str;
};
const toTag = function(k2) {
  let start2 = "";
  let end2 = "</span>";
  k2 = escapeXml(k2);
  if (isClass.test(k2)) {
    start2 = `<span class="${k2.replace(/^\./, "")}"`;
  } else if (isId.test(k2)) {
    start2 = `<span id="${k2.replace(/^#/, "")}"`;
  } else {
    start2 = `<${k2}`;
    end2 = `</${k2}>`;
  }
  start2 += ">";
  return { start: start2, end: end2 };
};
const getIndex = function(doc, obj) {
  const starts = {};
  const ends = {};
  Object.keys(obj).forEach((k2) => {
    let res = obj[k2];
    const tag2 = toTag(k2);
    if (typeof res === "string") {
      res = doc.match(res);
    }
    res.docs.forEach((terms) => {
      if (terms.every((t2) => t2.implicit)) {
        return;
      }
      const a2 = terms[0].id;
      starts[a2] = starts[a2] || [];
      starts[a2].push(tag2.start);
      const b = terms[terms.length - 1].id;
      ends[b] = ends[b] || [];
      ends[b].push(tag2.end);
    });
  });
  return { starts, ends };
};
const html = function(obj) {
  const { starts, ends } = getIndex(this, obj);
  let out2 = "";
  this.docs.forEach((terms) => {
    for (let i2 = 0; i2 < terms.length; i2 += 1) {
      const t2 = terms[i2];
      if (starts.hasOwnProperty(t2.id)) {
        out2 += starts[t2.id].join("");
      }
      out2 += t2.pre || "";
      out2 += t2.text || "";
      if (ends.hasOwnProperty(t2.id)) {
        out2 += ends[t2.id].join("");
      }
      out2 += t2.post || "";
    }
  });
  return out2;
};
const html$1 = { html };
const trimEnd = /[,:;)\]*.?~!\u0022\uFF02\u201D\u2019\u00BB\u203A\u2032\u2033\u2034\u301E\u00B4—-]+$/;
const trimStart = /^[(['"*~\uFF02\u201C\u2018\u201F\u201B\u201E\u2E42\u201A\u00AB\u2039\u2035\u2036\u2037\u301D\u0060\u301F]+/;
const punctToKill = /[,:;)('"\u201D\]]/;
const isHyphen = /^[-–—]$/;
const hasSpace = / /;
const textFromTerms = function(terms, opts2, keepSpace = true) {
  let txt = "";
  terms.forEach((t2) => {
    let pre = t2.pre || "";
    let post = t2.post || "";
    if (opts2.punctuation === "some") {
      pre = pre.replace(trimStart, "");
      if (isHyphen.test(post)) {
        post = " ";
      }
      post = post.replace(punctToKill, "");
      post = post.replace(/\?!+/, "?");
      post = post.replace(/!+/, "!");
      post = post.replace(/\?+/, "?");
      post = post.replace(/\.{2,}/, "");
      if (t2.tags.has("Abbreviation")) {
        post = post.replace(/\./, "");
      }
    }
    if (opts2.whitespace === "some") {
      pre = pre.replace(/\s/, "");
      post = post.replace(/\s+/, " ");
    }
    if (!opts2.keepPunct) {
      pre = pre.replace(trimStart, "");
      if (post === "-") {
        post = " ";
      } else {
        post = post.replace(trimEnd, "");
      }
    }
    let word = t2[opts2.form || "text"] || t2.normal || "";
    if (opts2.form === "implicit") {
      word = t2.implicit || t2.text;
    }
    if (opts2.form === "root" && t2.implicit) {
      word = t2.root || t2.implicit || t2.normal;
    }
    if ((opts2.form === "machine" || opts2.form === "implicit" || opts2.form === "root") && t2.implicit) {
      if (!post || !hasSpace.test(post)) {
        post += " ";
      }
    }
    txt += pre + word + post;
  });
  if (keepSpace === false) {
    txt = txt.trim();
  }
  if (opts2.lowerCase === true) {
    txt = txt.toLowerCase();
  }
  return txt;
};
const textFromDoc = function(docs, opts2) {
  let text2 = "";
  if (!docs || !docs[0] || !docs[0][0]) {
    return text2;
  }
  for (let i2 = 0; i2 < docs.length; i2 += 1) {
    text2 += textFromTerms(docs[i2], opts2, true);
  }
  if (!opts2.keepSpace) {
    text2 = text2.trim();
  }
  if (opts2.keepEndPunct === false) {
    if (!docs[0][0].tags.has("Emoticon")) {
      text2 = text2.replace(trimStart, "");
    }
    const last = docs[docs.length - 1];
    if (!last[last.length - 1].tags.has("Emoticon")) {
      text2 = text2.replace(trimEnd, "");
    }
    if (text2.endsWith(`'`) && !text2.endsWith(`s'`)) {
      text2 = text2.replace(/'/, "");
    }
  }
  if (opts2.cleanWhitespace === true) {
    text2 = text2.trim();
  }
  return text2;
};
const fmts = {
  text: {
    form: "text"
  },
  normal: {
    whitespace: "some",
    punctuation: "some",
    case: "some",
    unicode: "some",
    form: "normal"
  },
  machine: {
    keepSpace: false,
    whitespace: "some",
    punctuation: "some",
    case: "none",
    unicode: "some",
    form: "machine"
  },
  root: {
    keepSpace: false,
    whitespace: "some",
    punctuation: "some",
    case: "some",
    unicode: "some",
    form: "root"
  },
  implicit: {
    form: "implicit"
  }
};
fmts.clean = fmts.normal;
fmts.reduced = fmts.root;
const k = [];
let i$1 = 0;
for (; i$1 < 64; ) {
  k[i$1] = 0 | Math.sin(++i$1 % Math.PI) * 4294967296;
}
const md5 = function(s2) {
  let b, c2, d2, j2 = decodeURI(encodeURI(s2)) + "", a2 = j2.length;
  const h2 = [b = 1732584193, c2 = 4023233417, ~b, ~c2], words2 = [];
  s2 = --a2 / 4 + 2 | 15;
  words2[--s2] = a2 * 8;
  for (; ~a2; ) {
    words2[a2 >> 2] |= j2.charCodeAt(a2) << 8 * a2--;
  }
  for (i$1 = j2 = 0; i$1 < s2; i$1 += 16) {
    a2 = h2;
    for (; j2 < 64; a2 = [
      d2 = a2[3],
      b + ((d2 = a2[0] + [b & c2 | ~b & d2, d2 & b | ~d2 & c2, b ^ c2 ^ d2, c2 ^ (b | ~d2)][a2 = j2 >> 4] + k[j2] + ~~words2[i$1 | [j2, 5 * j2 + 1, 3 * j2 + 5, 7 * j2][a2] & 15]) << (a2 = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21][4 * a2 + j2++ % 4]) | d2 >>> -a2),
      b,
      c2
    ]) {
      b = a2[1] | 0;
      c2 = a2[2];
    }
    for (j2 = 4; j2; ) h2[--j2] += a2[j2];
  }
  for (s2 = ""; j2 < 32; ) {
    s2 += (h2[j2 >> 3] >> (1 ^ j2++) * 4 & 15).toString(16);
  }
  return s2;
};
const defaults$2 = {
  text: true,
  terms: true
};
const opts = { case: "none", unicode: "some", form: "machine", punctuation: "some" };
const merge = function(a2, b) {
  return Object.assign({}, a2, b);
};
const fns$2 = {
  text: (terms) => textFromTerms(terms, { keepPunct: true }, false),
  normal: (terms) => textFromTerms(terms, merge(fmts.normal, { keepPunct: true }), false),
  implicit: (terms) => textFromTerms(terms, merge(fmts.implicit, { keepPunct: true }), false),
  machine: (terms) => textFromTerms(terms, opts, false),
  root: (terms) => textFromTerms(terms, merge(opts, { form: "root" }), false),
  hash: (terms) => md5(textFromTerms(terms, { keepPunct: true }, false)),
  offset: (terms) => {
    const len = fns$2.text(terms).length;
    return {
      index: terms[0].offset.index,
      start: terms[0].offset.start,
      length: len
    };
  },
  terms: (terms) => {
    return terms.map((t2) => {
      const term = Object.assign({}, t2);
      term.tags = Array.from(t2.tags);
      return term;
    });
  },
  confidence: (_terms, view, i2) => view.eq(i2).confidence(),
  syllables: (_terms, view, i2) => view.eq(i2).syllables(),
  sentence: (_terms, view, i2) => view.eq(i2).fullSentence().text(),
  dirty: (terms) => terms.some((t2) => t2.dirty === true)
};
fns$2.sentences = fns$2.sentence;
fns$2.clean = fns$2.normal;
fns$2.reduced = fns$2.root;
const toJSON$2 = function(view, option) {
  option = option || {};
  if (typeof option === "string") {
    option = {};
  }
  option = Object.assign({}, defaults$2, option);
  if (option.offset) {
    view.compute("offset");
  }
  return view.docs.map((terms, i2) => {
    const res = {};
    Object.keys(option).forEach((k2) => {
      if (option[k2] && fns$2[k2]) {
        res[k2] = fns$2[k2](terms, view, i2);
      }
    });
    return res;
  });
};
const methods$a = {
  /** return data */
  json: function(n2) {
    const res = toJSON$2(this, n2);
    if (typeof n2 === "number") {
      return res[n2];
    }
    return res;
  }
};
methods$a.data = methods$a.json;
const isClientSide = () => typeof window !== "undefined" && window.document;
const debug$1 = function(fmt2) {
  const debugMethods = this.methods.one.debug || {};
  if (fmt2 && debugMethods.hasOwnProperty(fmt2)) {
    debugMethods[fmt2](this);
    return this;
  }
  if (isClientSide()) {
    debugMethods.clientSide(this);
    return this;
  }
  debugMethods.tags(this);
  return this;
};
const toText$3 = function(term) {
  const pre = term.pre || "";
  const post = term.post || "";
  return pre + term.text + post;
};
const findStarts = function(doc, obj) {
  const starts = {};
  Object.keys(obj).forEach((reg) => {
    const m2 = doc.match(reg);
    m2.fullPointer.forEach((a2) => {
      starts[a2[3]] = { fn: obj[reg], end: a2[2] };
    });
  });
  return starts;
};
const wrap = function(doc, obj) {
  const starts = findStarts(doc, obj);
  let text2 = "";
  doc.docs.forEach((terms, n2) => {
    for (let i2 = 0; i2 < terms.length; i2 += 1) {
      const t2 = terms[i2];
      if (starts.hasOwnProperty(t2.id)) {
        const { fn, end: end2 } = starts[t2.id];
        const m2 = doc.update([[n2, i2, end2]]);
        text2 += terms[i2].pre || "";
        text2 += fn(m2);
        i2 = end2 - 1;
        text2 += terms[i2].post || "";
      } else {
        text2 += toText$3(t2);
      }
    }
  });
  return text2;
};
const isObject$2 = (val) => {
  return Object.prototype.toString.call(val) === "[object Object]";
};
const topk = function(arr) {
  const obj = {};
  arr.forEach((a2) => {
    obj[a2] = obj[a2] || 0;
    obj[a2] += 1;
  });
  const res = Object.keys(obj).map((k2) => {
    return { normal: k2, count: obj[k2] };
  });
  return res.sort((a2, b) => a2.count > b.count ? -1 : 0);
};
const out = function(method) {
  if (isObject$2(method)) {
    return wrap(this, method);
  }
  if (method === "text") {
    return this.text();
  }
  if (method === "normal") {
    return this.text("normal");
  }
  if (method === "root") {
    return this.text("root");
  }
  if (method === "machine" || method === "reduced") {
    return this.text("machine");
  }
  if (method === "hash" || method === "md5") {
    return md5(this.text());
  }
  if (method === "json") {
    return this.json();
  }
  if (method === "offset" || method === "offsets") {
    this.compute("offset");
    return this.json({ offset: true });
  }
  if (method === "array") {
    const arr = this.docs.map((terms) => {
      return terms.reduce((str, t2) => {
        return str + t2.pre + t2.text + t2.post;
      }, "").trim();
    });
    return arr.filter((str) => str);
  }
  if (method === "freq" || method === "frequency" || method === "topk") {
    return topk(this.json({ normal: true }).map((o2) => o2.normal));
  }
  if (method === "terms") {
    let list2 = [];
    this.docs.forEach((terms) => {
      let words2 = terms.map((t2) => t2.text);
      words2 = words2.filter((t2) => t2);
      list2 = list2.concat(words2);
    });
    return list2;
  }
  if (method === "tags") {
    return this.docs.map((terms) => {
      return terms.reduce((h2, t2) => {
        h2[t2.implicit || t2.normal] = Array.from(t2.tags);
        return h2;
      }, {});
    });
  }
  if (method === "debug") {
    return this.debug();
  }
  return this.text();
};
const methods$9 = {
  /** */
  debug: debug$1,
  /** */
  out,
  /** */
  wrap: function(obj) {
    return wrap(this, obj);
  }
};
const isObject$1 = (val) => {
  return Object.prototype.toString.call(val) === "[object Object]";
};
const text = {
  /** */
  text: function(fmt2) {
    let opts2 = {};
    if (fmt2 && typeof fmt2 === "string" && fmts.hasOwnProperty(fmt2)) {
      opts2 = Object.assign({}, fmts[fmt2]);
    } else if (fmt2 && isObject$1(fmt2)) {
      opts2 = Object.assign({}, fmt2);
    }
    if (opts2.keepSpace === void 0 && !this.isFull()) {
      opts2.keepSpace = false;
    }
    if (opts2.keepEndPunct === void 0 && this.pointer) {
      const ptr = this.pointer[0];
      if (ptr && ptr[1]) {
        opts2.keepEndPunct = false;
      } else {
        opts2.keepEndPunct = true;
      }
    }
    if (opts2.keepPunct === void 0) {
      opts2.keepPunct = true;
    }
    if (opts2.keepSpace === void 0) {
      opts2.keepSpace = true;
    }
    return textFromDoc(this.docs, opts2);
  }
};
const methods$8 = Object.assign({}, methods$9, text, methods$a, html$1);
const addAPI$1 = function(View2) {
  Object.assign(View2.prototype, methods$8);
};
const logClientSide = function(view) {
  console.log("%c -=-=- ", "background-color:#6699cc;");
  view.forEach((m2) => {
    console.groupCollapsed(m2.text());
    const terms = m2.docs[0];
    const out2 = terms.map((t2) => {
      let text2 = t2.text || "-";
      if (t2.implicit) {
        text2 = "[" + t2.implicit + "]";
      }
      const tags = "[" + Array.from(t2.tags).join(", ") + "]";
      return { text: text2, tags };
    });
    console.table(out2, ["text", "tags"]);
    console.groupEnd();
  });
};
const reset = "\x1B[0m";
const cli = {
  green: (str) => "\x1B[32m" + str + reset,
  red: (str) => "\x1B[31m" + str + reset,
  blue: (str) => "\x1B[34m" + str + reset,
  magenta: (str) => "\x1B[35m" + str + reset,
  cyan: (str) => "\x1B[36m" + str + reset,
  yellow: (str) => "\x1B[33m" + str + reset,
  black: (str) => "\x1B[30m" + str + reset,
  dim: (str) => "\x1B[2m" + str + reset,
  i: (str) => "\x1B[3m" + str + reset
};
const tagString = function(tags, model2) {
  if (model2.one.tagSet) {
    tags = tags.map((tag2) => {
      if (!model2.one.tagSet.hasOwnProperty(tag2)) {
        return tag2;
      }
      const c2 = model2.one.tagSet[tag2].color || "blue";
      return cli[c2](tag2);
    });
  }
  return tags.join(", ");
};
const showTags = function(view) {
  const { docs, model: model2 } = view;
  if (docs.length === 0) {
    console.log(cli.blue("\n     ──────"));
  }
  docs.forEach((terms) => {
    console.log(cli.blue("\n  ┌─────────"));
    terms.forEach((t2) => {
      const tags = [...t2.tags || []];
      let text2 = t2.text || "-";
      if (t2.sense) {
        text2 = `{${t2.normal}/${t2.sense}}`;
      }
      if (t2.implicit) {
        text2 = "[" + t2.implicit + "]";
      }
      text2 = cli.yellow(text2);
      let word = "'" + text2 + "'";
      if (t2.reference) {
        const str2 = view.update([t2.reference]).text("normal");
        word += ` - ${cli.dim(cli.i("[" + str2 + "]"))}`;
      }
      word = word.padEnd(18);
      const str = cli.blue("  │ ") + cli.i(word) + "  - " + tagString(tags, model2);
      console.log(str);
    });
  });
  console.log("\n");
};
const showChunks = function(view) {
  const { docs } = view;
  console.log("");
  docs.forEach((terms) => {
    const out2 = [];
    terms.forEach((term) => {
      if (term.chunk === "Noun") {
        out2.push(cli.blue(term.implicit || term.normal));
      } else if (term.chunk === "Verb") {
        out2.push(cli.green(term.implicit || term.normal));
      } else if (term.chunk === "Adjective") {
        out2.push(cli.yellow(term.implicit || term.normal));
      } else if (term.chunk === "Pivot") {
        out2.push(cli.red(term.implicit || term.normal));
      } else {
        out2.push(term.implicit || term.normal);
      }
    });
    console.log(out2.join(" "), "\n");
  });
  console.log("\n");
};
const split$1 = (txt, offset2, index2) => {
  const buff = index2 * 9;
  const start2 = offset2.start + buff;
  const end2 = start2 + offset2.length;
  const pre = txt.substring(0, start2);
  const mid = txt.substring(start2, end2);
  const post = txt.substring(end2, txt.length);
  return [pre, mid, post];
};
const spliceIn = function(txt, offset2, index2) {
  const parts = split$1(txt, offset2, index2);
  return `${parts[0]}${cli.blue(parts[1])}${parts[2]}`;
};
const showHighlight = function(doc) {
  if (!doc.found) {
    return;
  }
  const bySentence = {};
  doc.fullPointer.forEach((ptr) => {
    bySentence[ptr[0]] = bySentence[ptr[0]] || [];
    bySentence[ptr[0]].push(ptr);
  });
  Object.keys(bySentence).forEach((k2) => {
    const full = doc.update([[Number(k2)]]);
    let txt = full.text();
    const matches2 = doc.update(bySentence[k2]);
    const json = matches2.json({ offset: true });
    json.forEach((obj, i2) => {
      txt = spliceIn(txt, obj.offset, i2);
    });
    console.log(txt);
  });
  console.log("\n");
};
const debug = {
  tags: showTags,
  clientSide: logClientSide,
  chunks: showChunks,
  highlight: showHighlight
};
const output = {
  api: addAPI$1,
  methods: {
    one: {
      hash: md5,
      debug
    }
  }
};
const doesOverlap = function(a2, b) {
  if (a2[0] !== b[0]) {
    return false;
  }
  const [, startA, endA] = a2;
  const [, startB, endB] = b;
  if (startA <= startB && endA > startB) {
    return true;
  }
  if (startB <= startA && endB > startA) {
    return true;
  }
  return false;
};
const getExtent = function(ptrs) {
  let min2 = ptrs[0][1];
  let max2 = ptrs[0][2];
  ptrs.forEach((ptr) => {
    if (ptr[1] < min2) {
      min2 = ptr[1];
    }
    if (ptr[2] > max2) {
      max2 = ptr[2];
    }
  });
  return [ptrs[0][0], min2, max2];
};
const indexN = function(ptrs) {
  const byN = {};
  ptrs.forEach((ref) => {
    byN[ref[0]] = byN[ref[0]] || [];
    byN[ref[0]].push(ref);
  });
  return byN;
};
const uniquePtrs = function(arr) {
  const obj = {};
  for (let i2 = 0; i2 < arr.length; i2 += 1) {
    obj[arr[i2].join(",")] = arr[i2];
  }
  return Object.values(obj);
};
const pivotBy = function(full, m2) {
  const [n2, start2] = full;
  const mStart = m2[1];
  const mEnd = m2[2];
  const res = {};
  if (start2 < mStart) {
    const end2 = mStart < full[2] ? mStart : full[2];
    res.before = [n2, start2, end2];
  }
  res.match = m2;
  if (full[2] > mEnd) {
    res.after = [n2, mEnd, full[2]];
  }
  return res;
};
const doesMatch = function(full, m2) {
  return full[1] <= m2[1] && m2[2] <= full[2];
};
const splitAll = function(full, m2) {
  const byN = indexN(m2);
  const res = [];
  full.forEach((ptr) => {
    const [n2] = ptr;
    let matches2 = byN[n2] || [];
    matches2 = matches2.filter((p2) => doesMatch(ptr, p2));
    if (matches2.length === 0) {
      res.push({ passthrough: ptr });
      return;
    }
    matches2 = matches2.sort((a2, b) => a2[1] - b[1]);
    let carry = ptr;
    matches2.forEach((p2, i2) => {
      const found = pivotBy(carry, p2);
      if (!matches2[i2 + 1]) {
        res.push(found);
      } else {
        res.push({ before: found.before, match: found.match });
        if (found.after) {
          carry = found.after;
        }
      }
    });
  });
  return res;
};
const max$1 = 20;
const blindSweep = function(id, doc, n2) {
  for (let i2 = 0; i2 < max$1; i2 += 1) {
    if (doc[n2 - i2]) {
      const index2 = doc[n2 - i2].findIndex((term) => term.id === id);
      if (index2 !== -1) {
        return [n2 - i2, index2];
      }
    }
    if (doc[n2 + i2]) {
      const index2 = doc[n2 + i2].findIndex((term) => term.id === id);
      if (index2 !== -1) {
        return [n2 + i2, index2];
      }
    }
  }
  return null;
};
const repairEnding = function(ptr, document) {
  const [n2, start2, , , endId] = ptr;
  const terms = document[n2];
  const newEnd = terms.findIndex((t2) => t2.id === endId);
  if (newEnd === -1) {
    ptr[2] = document[n2].length;
    ptr[4] = terms.length ? terms[terms.length - 1].id : null;
  } else {
    ptr[2] = newEnd;
  }
  return document[n2].slice(start2, ptr[2] + 1);
};
const getDoc$1 = function(ptrs, document) {
  let doc = [];
  ptrs.forEach((ptr, i2) => {
    if (!ptr) {
      return;
    }
    let [n2, start2, end2, id, endId] = ptr;
    let terms = document[n2] || [];
    if (start2 === void 0) {
      start2 = 0;
    }
    if (end2 === void 0) {
      end2 = terms.length;
    }
    if (id && (!terms[start2] || terms[start2].id !== id)) {
      const wild = blindSweep(id, document, n2);
      if (wild !== null) {
        const len = end2 - start2;
        terms = document[wild[0]].slice(wild[1], wild[1] + len);
        const startId = terms[0] ? terms[0].id : null;
        ptrs[i2] = [wild[0], wild[1], wild[1] + len, startId];
      }
    } else {
      terms = terms.slice(start2, end2);
    }
    if (terms.length === 0) {
      return;
    }
    if (start2 === end2) {
      return;
    }
    if (endId && terms[terms.length - 1].id !== endId) {
      terms = repairEnding(ptr, document);
    }
    doc.push(terms);
  });
  doc = doc.filter((a2) => a2.length > 0);
  return doc;
};
const termList = function(docs) {
  const arr = [];
  for (let i2 = 0; i2 < docs.length; i2 += 1) {
    for (let t2 = 0; t2 < docs[i2].length; t2 += 1) {
      arr.push(docs[i2][t2]);
    }
  }
  return arr;
};
const methods$7 = {
  one: {
    termList,
    getDoc: getDoc$1,
    pointer: {
      indexN,
      splitAll
    }
  }
};
const getUnion = function(a2, b) {
  const both = a2.concat(b);
  const byN = indexN(both);
  let res = [];
  both.forEach((ptr) => {
    const [n2] = ptr;
    if (byN[n2].length === 1) {
      res.push(ptr);
      return;
    }
    const hmm = byN[n2].filter((m2) => doesOverlap(ptr, m2));
    hmm.push(ptr);
    const range = getExtent(hmm);
    res.push(range);
  });
  res = uniquePtrs(res);
  return res;
};
const subtract = function(refs, not) {
  const res = [];
  const found = splitAll(refs, not);
  found.forEach((o2) => {
    if (o2.passthrough) {
      res.push(o2.passthrough);
    }
    if (o2.before) {
      res.push(o2.before);
    }
    if (o2.after) {
      res.push(o2.after);
    }
  });
  return res;
};
const intersection = function(a2, b) {
  const start2 = a2[1] < b[1] ? b[1] : a2[1];
  const end2 = a2[2] > b[2] ? b[2] : a2[2];
  if (start2 < end2) {
    return [a2[0], start2, end2];
  }
  return null;
};
const getIntersection = function(a2, b) {
  const byN = indexN(b);
  const res = [];
  a2.forEach((ptr) => {
    let hmm = byN[ptr[0]] || [];
    hmm = hmm.filter((p2) => doesOverlap(ptr, p2));
    if (hmm.length === 0) {
      return;
    }
    hmm.forEach((h2) => {
      const overlap = intersection(ptr, h2);
      if (overlap) {
        res.push(overlap);
      }
    });
  });
  return res;
};
const isArray$4 = function(arr) {
  return Object.prototype.toString.call(arr) === "[object Array]";
};
const getDoc = (m2, view) => {
  if (typeof m2 === "string" || isArray$4(m2)) {
    return view.match(m2);
  }
  if (!m2) {
    return view.none();
  }
  return m2;
};
const addIds = function(ptrs, docs) {
  return ptrs.map((ptr) => {
    const [n2, start2] = ptr;
    if (docs[n2] && docs[n2][start2]) {
      ptr[3] = docs[n2][start2].id;
    }
    return ptr;
  });
};
const methods$6 = {};
methods$6.union = function(m2) {
  m2 = getDoc(m2, this);
  let ptrs = getUnion(this.fullPointer, m2.fullPointer);
  ptrs = addIds(ptrs, this.document);
  return this.toView(ptrs);
};
methods$6.and = methods$6.union;
methods$6.intersection = function(m2) {
  m2 = getDoc(m2, this);
  let ptrs = getIntersection(this.fullPointer, m2.fullPointer);
  ptrs = addIds(ptrs, this.document);
  return this.toView(ptrs);
};
methods$6.not = function(m2) {
  m2 = getDoc(m2, this);
  let ptrs = subtract(this.fullPointer, m2.fullPointer);
  ptrs = addIds(ptrs, this.document);
  return this.toView(ptrs);
};
methods$6.difference = methods$6.not;
methods$6.complement = function() {
  const doc = this.all();
  let ptrs = subtract(doc.fullPointer, this.fullPointer);
  ptrs = addIds(ptrs, this.document);
  return this.toView(ptrs);
};
methods$6.settle = function() {
  let ptrs = this.fullPointer;
  ptrs.forEach((ptr) => {
    ptrs = getUnion(ptrs, [ptr]);
  });
  ptrs = addIds(ptrs, this.document);
  return this.update(ptrs);
};
const addAPI = function(View2) {
  Object.assign(View2.prototype, methods$6);
};
const pointers = {
  methods: methods$7,
  api: addAPI
};
const lib$2 = {
  // compile a list of matches into a match-net
  buildNet: function(matches2) {
    const methods2 = this.methods();
    const net2 = methods2.one.buildNet(matches2, this.world());
    net2.isNet = true;
    return net2;
  }
};
const api$l = function(View2) {
  View2.prototype.sweep = function(net2, opts2 = {}) {
    const { world: world2, docs } = this;
    const { methods: methods2 } = world2;
    let found = methods2.one.bulkMatch(docs, net2, this.methods, opts2);
    if (opts2.tagger !== false) {
      methods2.one.bulkTagger(found, docs, this.world);
    }
    found = found.map((o2) => {
      const ptr = o2.pointer;
      const term = docs[ptr[0]][ptr[1]];
      const len = ptr[2] - ptr[1];
      if (term.index) {
        o2.pointer = [
          term.index[0],
          term.index[1],
          ptr[1] + len
        ];
      }
      return o2;
    });
    const ptrs = found.map((o2) => o2.pointer);
    found = found.map((obj) => {
      obj.view = this.update([obj.pointer]);
      delete obj.regs;
      delete obj.needs;
      delete obj.pointer;
      delete obj._expanded;
      return obj;
    });
    return {
      view: this.update(ptrs),
      found
    };
  };
};
const getTokenNeeds = function(reg) {
  if (reg.optional === true || reg.negative === true) {
    return null;
  }
  if (reg.tag) {
    return "#" + reg.tag;
  }
  if (reg.word) {
    return reg.word;
  }
  if (reg.switch) {
    return `%${reg.switch}%`;
  }
  return null;
};
const getNeeds = function(regs) {
  const needs = [];
  regs.forEach((reg) => {
    needs.push(getTokenNeeds(reg));
    if (reg.operator === "and" && reg.choices) {
      reg.choices.forEach((oneSide) => {
        oneSide.forEach((r2) => {
          needs.push(getTokenNeeds(r2));
        });
      });
    }
  });
  return needs.filter((str) => str);
};
const getWants = function(regs) {
  const wants = [];
  let count = 0;
  regs.forEach((reg) => {
    if (reg.operator === "or" && !reg.optional && !reg.negative) {
      if (reg.fastOr) {
        Array.from(reg.fastOr).forEach((w) => {
          wants.push(w);
        });
      }
      if (reg.choices) {
        reg.choices.forEach((rs) => {
          rs.forEach((r2) => {
            const n2 = getTokenNeeds(r2);
            if (n2) {
              wants.push(n2);
            }
          });
        });
      }
      count += 1;
    }
  });
  return { wants, count };
};
const parse$5 = function(matches2, world2) {
  const parseMatch = world2.methods.one.parseMatch;
  matches2.forEach((obj) => {
    obj.regs = parseMatch(obj.match, {}, world2);
    if (typeof obj.ifNo === "string") {
      obj.ifNo = [obj.ifNo];
    }
    if (obj.notIf) {
      obj.notIf = parseMatch(obj.notIf, {}, world2);
    }
    obj.needs = getNeeds(obj.regs);
    const { wants, count } = getWants(obj.regs);
    obj.wants = wants;
    obj.minWant = count;
    obj.minWords = obj.regs.filter((o2) => !o2.optional).length;
  });
  return matches2;
};
const buildNet = function(matches2, world2) {
  matches2 = parse$5(matches2, world2);
  const hooks2 = {};
  matches2.forEach((obj) => {
    obj.needs.forEach((str) => {
      hooks2[str] = Array.isArray(hooks2[str]) ? hooks2[str] : [];
      hooks2[str].push(obj);
    });
    obj.wants.forEach((str) => {
      hooks2[str] = Array.isArray(hooks2[str]) ? hooks2[str] : [];
      hooks2[str].push(obj);
    });
  });
  Object.keys(hooks2).forEach((k2) => {
    const already = {};
    hooks2[k2] = hooks2[k2].filter((obj) => {
      if (typeof already[obj.match] === "boolean") {
        return false;
      }
      already[obj.match] = true;
      return true;
    });
  });
  const always = matches2.filter((o2) => o2.needs.length === 0 && o2.wants.length === 0);
  return {
    hooks: hooks2,
    always
  };
};
const getHooks = function(docCaches, hooks2) {
  return docCaches.map((set, i2) => {
    let maybe = [];
    Object.keys(hooks2).forEach((k2) => {
      if (docCaches[i2].has(k2)) {
        maybe = maybe.concat(hooks2[k2]);
      }
    });
    const already = {};
    maybe = maybe.filter((m2) => {
      if (typeof already[m2.match] === "boolean") {
        return false;
      }
      already[m2.match] = true;
      return true;
    });
    return maybe;
  });
};
const localTrim = function(maybeList, docCache) {
  return maybeList.map((list2, n2) => {
    const haves = docCache[n2];
    list2 = list2.filter((obj) => {
      return obj.needs.every((need) => haves.has(need));
    });
    list2 = list2.filter((obj) => {
      if (obj.ifNo !== void 0 && obj.ifNo.some((no) => haves.has(no)) === true) {
        return false;
      }
      return true;
    });
    list2 = list2.filter((obj) => {
      if (obj.wants.length === 0) {
        return true;
      }
      const found = obj.wants.filter((str) => haves.has(str)).length;
      return found >= obj.minWant;
    });
    return list2;
  });
};
const runMatch = function(maybeList, document, docCache, methods2, opts2) {
  const results = [];
  for (let n2 = 0; n2 < maybeList.length; n2 += 1) {
    for (let i2 = 0; i2 < maybeList[n2].length; i2 += 1) {
      const m2 = maybeList[n2][i2];
      const res = methods2.one.match([document[n2]], m2);
      if (res.ptrs.length > 0) {
        res.ptrs.forEach((ptr) => {
          ptr[0] = n2;
          const todo = Object.assign({}, m2, { pointer: ptr });
          if (m2.unTag !== void 0) {
            todo.unTag = m2.unTag;
          }
          results.push(todo);
        });
        if (opts2.matchOne === true) {
          return [results[0]];
        }
      }
    }
  }
  return results;
};
const tooSmall = function(maybeList, document) {
  return maybeList.map((arr, i2) => {
    const termCount = document[i2].length;
    arr = arr.filter((o2) => {
      return termCount >= o2.minWords;
    });
    return arr;
  });
};
const sweep$1 = function(document, net2, methods2, opts2 = {}) {
  const docCache = methods2.one.cacheDoc(document);
  let maybeList = getHooks(docCache, net2.hooks);
  maybeList = localTrim(maybeList, docCache);
  if (net2.always.length > 0) {
    maybeList = maybeList.map((arr) => arr.concat(net2.always));
  }
  maybeList = tooSmall(maybeList, document);
  const results = runMatch(maybeList, document, docCache, methods2, opts2);
  return results;
};
const canBe$1 = function(terms, tag2, model2) {
  const tagSet = model2.one.tagSet;
  if (!tagSet.hasOwnProperty(tag2)) {
    return true;
  }
  const not = tagSet[tag2].not || [];
  for (let i2 = 0; i2 < terms.length; i2 += 1) {
    const term = terms[i2];
    for (let k2 = 0; k2 < not.length; k2 += 1) {
      if (term.tags.has(not[k2]) === true) {
        return false;
      }
    }
  }
  return true;
};
var define_process_env_default$4 = {};
const tagger$1 = function(list2, document, world2) {
  const { model: model2, methods: methods2 } = world2;
  const { getDoc: getDoc2, setTag: setTag2, unTag: unTag2 } = methods2.one;
  const looksPlural2 = methods2.two.looksPlural;
  if (list2.length === 0) {
    return list2;
  }
  const env2 = typeof process === "undefined" || !define_process_env_default$4 ? self.env || {} : define_process_env_default$4;
  if (env2.DEBUG_TAGS) {
    console.log(`

  \x1B[32m→ ${list2.length} post-tagger:\x1B[0m`);
  }
  return list2.map((todo) => {
    if (!todo.tag && !todo.chunk && !todo.unTag) {
      return;
    }
    const reason = todo.reason || todo.match;
    const terms = getDoc2([todo.pointer], document)[0];
    if (todo.safe === true) {
      if (canBe$1(terms, todo.tag, model2) === false) {
        return;
      }
      if (terms[terms.length - 1].post === "-") {
        return;
      }
    }
    if (todo.tag !== void 0) {
      setTag2(terms, todo.tag, world2, todo.safe, `[post] '${reason}'`);
      if (todo.tag === "Noun" && looksPlural2) {
        const term = terms[terms.length - 1];
        if (looksPlural2(term.text)) {
          setTag2([term], "Plural", world2, todo.safe, "quick-plural");
        } else {
          setTag2([term], "Singular", world2, todo.safe, "quick-singular");
        }
      }
      if (todo.freeze === true) {
        terms.forEach((term) => term.frozen = true);
      }
    }
    if (todo.unTag !== void 0) {
      unTag2(terms, todo.unTag, world2, todo.safe, reason);
    }
    if (todo.chunk) {
      terms.forEach((t2) => t2.chunk = todo.chunk);
    }
  });
};
const methods$5 = {
  buildNet,
  bulkMatch: sweep$1,
  bulkTagger: tagger$1
};
const sweep = {
  lib: lib$2,
  api: api$l,
  methods: {
    one: methods$5
  }
};
var define_process_env_default$3 = {};
const isMulti = / /;
const addChunk = function(term, tag2) {
  if (tag2 === "Noun") {
    term.chunk = tag2;
  }
  if (tag2 === "Verb") {
    term.chunk = tag2;
  }
};
const tagTerm = function(term, tag2, tagSet, isSafe) {
  if (term.tags.has(tag2) === true) {
    return null;
  }
  if (tag2 === ".") {
    return null;
  }
  if (term.frozen === true) {
    isSafe = true;
  }
  const known = tagSet[tag2];
  if (known) {
    if (known.not && known.not.length > 0) {
      for (let o2 = 0; o2 < known.not.length; o2 += 1) {
        if (isSafe === true && term.tags.has(known.not[o2])) {
          return null;
        }
        term.tags.delete(known.not[o2]);
      }
    }
    if (known.parents && known.parents.length > 0) {
      for (let o2 = 0; o2 < known.parents.length; o2 += 1) {
        term.tags.add(known.parents[o2]);
        addChunk(term, known.parents[o2]);
      }
    }
  }
  term.tags.add(tag2);
  term.dirty = true;
  addChunk(term, tag2);
  return true;
};
const multiTag = function(terms, tagString2, tagSet, isSafe) {
  const tags = tagString2.split(isMulti);
  terms.forEach((term, i2) => {
    let tag2 = tags[i2];
    if (tag2) {
      tag2 = tag2.replace(/^#/, "");
      tagTerm(term, tag2, tagSet, isSafe);
    }
  });
};
const isArray$3 = function(arr) {
  return Object.prototype.toString.call(arr) === "[object Array]";
};
const log$1 = (terms, tag2, reason = "") => {
  const yellow = (str) => "\x1B[33m\x1B[3m" + str + "\x1B[0m";
  const i2 = (str) => "\x1B[3m" + str + "\x1B[0m";
  const word = terms.map((t2) => {
    return t2.text || "[" + t2.implicit + "]";
  }).join(" ");
  if (typeof tag2 !== "string" && tag2.length > 2) {
    tag2 = tag2.slice(0, 2).join(", #") + " +";
  }
  tag2 = typeof tag2 !== "string" ? tag2.join(", #") : tag2;
  console.log(` ${yellow(word).padEnd(24)} \x1B[32m→\x1B[0m #${tag2.padEnd(22)}  ${i2(reason)}`);
};
const setTag = function(terms, tag2, world2 = {}, isSafe, reason) {
  const tagSet = world2.model.one.tagSet || {};
  if (!tag2) {
    return;
  }
  const env2 = typeof process === "undefined" || !define_process_env_default$3 ? self.env || {} : define_process_env_default$3;
  if (env2 && env2.DEBUG_TAGS) {
    log$1(terms, tag2, reason);
  }
  if (isArray$3(tag2) === true) {
    tag2.forEach((tg) => setTag(terms, tg, world2, isSafe));
    return;
  }
  if (typeof tag2 !== "string") {
    console.warn(`compromise: Invalid tag '${tag2}'`);
    return;
  }
  tag2 = tag2.trim();
  if (isMulti.test(tag2)) {
    multiTag(terms, tag2, tagSet, isSafe);
    return;
  }
  tag2 = tag2.replace(/^#/, "");
  for (let i2 = 0; i2 < terms.length; i2 += 1) {
    tagTerm(terms[i2], tag2, tagSet, isSafe);
  }
};
const unTag = function(terms, tag2, tagSet) {
  tag2 = tag2.trim().replace(/^#/, "");
  for (let i2 = 0; i2 < terms.length; i2 += 1) {
    const term = terms[i2];
    if (term.frozen === true) {
      continue;
    }
    if (tag2 === "*") {
      term.tags.clear();
      continue;
    }
    const known = tagSet[tag2];
    if (known && known.children.length > 0) {
      for (let o2 = 0; o2 < known.children.length; o2 += 1) {
        term.tags.delete(known.children[o2]);
      }
    }
    term.tags.delete(tag2);
  }
};
const canBe = function(term, tag2, tagSet) {
  if (!tagSet.hasOwnProperty(tag2)) {
    return true;
  }
  const not = tagSet[tag2].not || [];
  for (let i2 = 0; i2 < not.length; i2 += 1) {
    if (term.tags.has(not[i2])) {
      return false;
    }
  }
  return true;
};
const e = function(e2) {
  return e2.children = e2.children || [], e2._cache = e2._cache || {}, e2.props = e2.props || {}, e2._cache.parents = e2._cache.parents || [], e2._cache.children = e2._cache.children || [], e2;
}, t = /^ *(#|\/\/)/, n$1 = function(t2) {
  let n2 = t2.trim().split(/->/), r2 = [];
  n2.forEach(((t3) => {
    r2 = r2.concat((function(t4) {
      if (!(t4 = t4.trim())) return null;
      if (/^\[/.test(t4) && /\]$/.test(t4)) {
        let n3 = (t4 = (t4 = t4.replace(/^\[/, "")).replace(/\]$/, "")).split(/,/);
        return n3 = n3.map(((e2) => e2.trim())).filter(((e2) => e2)), n3 = n3.map(((t5) => e({ id: t5 }))), n3;
      }
      return [e({ id: t4 })];
    })(t3));
  })), r2 = r2.filter(((e2) => e2));
  let i2 = r2[0];
  for (let e2 = 1; e2 < r2.length; e2 += 1) i2.children.push(r2[e2]), i2 = r2[e2];
  return r2[0];
}, r = (e2, t2) => {
  let n2 = [], r2 = [e2];
  for (; r2.length > 0; ) {
    let e3 = r2.pop();
    n2.push(e3), e3.children && e3.children.forEach(((n3) => {
      t2 && t2(e3, n3), r2.push(n3);
    }));
  }
  return n2;
}, i = (e2) => "[object Array]" === Object.prototype.toString.call(e2), c = (e2) => (e2 = e2 || "").trim(), s$1 = function(c2 = []) {
  return "string" == typeof c2 ? (function(r2) {
    let i2 = r2.split(/\r?\n/), c3 = [];
    i2.forEach(((e2) => {
      if (!e2.trim() || t.test(e2)) return;
      let r3 = ((e3) => {
        const t2 = /^( {2}|\t)/;
        let n2 = 0;
        for (; t2.test(e3); ) e3 = e3.replace(t2, ""), n2 += 1;
        return n2;
      })(e2);
      c3.push({ indent: r3, node: n$1(e2) });
    }));
    let s3 = (function(e2) {
      let t2 = { children: [] };
      return e2.forEach(((n2, r3) => {
        0 === n2.indent ? t2.children = t2.children.concat(n2.node) : e2[r3 - 1] && (function(e3, t3) {
          let n3 = e3[t3].indent;
          for (; t3 >= 0; t3 -= 1) if (e3[t3].indent < n3) return e3[t3];
          return e3[0];
        })(e2, r3).node.children.push(n2.node);
      })), t2;
    })(c3);
    return s3 = e(s3), s3;
  })(c2) : i(c2) ? (function(t2) {
    let n2 = {};
    t2.forEach(((e2) => {
      n2[e2.id] = e2;
    }));
    let r2 = e({});
    return t2.forEach(((t3) => {
      if ((t3 = e(t3)).parent) if (n2.hasOwnProperty(t3.parent)) {
        let e2 = n2[t3.parent];
        delete t3.parent, e2.children.push(t3);
      } else console.warn(`[Grad] - missing node '${t3.parent}'`);
      else r2.children.push(t3);
    })), r2;
  })(c2) : (r(s2 = c2).forEach(e), s2);
  var s2;
}, h = (e2) => "\x1B[31m" + e2 + "\x1B[0m", o = (e2) => "\x1B[2m" + e2 + "\x1B[0m", l = function(e2, t2) {
  let n2 = "-> ";
  t2 && (n2 = o("→ "));
  let i2 = "";
  return r(e2).forEach(((e3, r2) => {
    let c2 = e3.id || "";
    if (t2 && (c2 = h(c2)), 0 === r2 && !e3.id) return;
    let s2 = e3._cache.parents.length;
    i2 += "    ".repeat(s2) + n2 + c2 + "\n";
  })), i2;
}, a = function(e2) {
  let t2 = r(e2);
  t2.forEach(((e3) => {
    delete (e3 = Object.assign({}, e3)).children;
  }));
  let n2 = t2[0];
  return n2 && !n2.id && 0 === Object.keys(n2.props).length && t2.shift(), t2;
}, p$3 = { text: l, txt: l, array: a, flat: a }, d = function(e2, t2) {
  return "nested" === t2 || "json" === t2 ? e2 : "debug" === t2 ? (console.log(l(e2, true)), null) : p$3.hasOwnProperty(t2) ? p$3[t2](e2) : e2;
}, u = (e2) => {
  r(e2, ((e3, t2) => {
    e3.id && (e3._cache.parents = e3._cache.parents || [], t2._cache.parents = e3._cache.parents.concat([e3.id]));
  }));
}, f$1 = (e2, t2) => (Object.keys(t2).forEach(((n2) => {
  if (t2[n2] instanceof Set) {
    let r2 = e2[n2] || /* @__PURE__ */ new Set();
    e2[n2] = /* @__PURE__ */ new Set([...r2, ...t2[n2]]);
  } else {
    if (((e3) => e3 && "object" == typeof e3 && !Array.isArray(e3))(t2[n2])) {
      let r2 = e2[n2] || {};
      e2[n2] = Object.assign({}, t2[n2], r2);
    } else i(t2[n2]) ? e2[n2] = t2[n2].concat(e2[n2] || []) : void 0 === e2[n2] && (e2[n2] = t2[n2]);
  }
})), e2), j = /\//;
let g$2 = class g {
  constructor(e2 = {}) {
    Object.defineProperty(this, "json", { enumerable: false, value: e2, writable: true });
  }
  get children() {
    return this.json.children;
  }
  get id() {
    return this.json.id;
  }
  get found() {
    return this.json.id || this.json.children.length > 0;
  }
  props(e2 = {}) {
    let t2 = this.json.props || {};
    return "string" == typeof e2 && (t2[e2] = true), this.json.props = Object.assign(t2, e2), this;
  }
  get(t2) {
    if (t2 = c(t2), !j.test(t2)) {
      let e2 = this.json.children.find(((e3) => e3.id === t2));
      return new g(e2);
    }
    let n2 = ((e2, t3) => {
      let n3 = ((e3) => "string" != typeof e3 ? e3 : (e3 = e3.replace(/^\//, "")).split(/\//))(t3 = t3 || "");
      for (let t4 = 0; t4 < n3.length; t4 += 1) {
        let r2 = e2.children.find(((e3) => e3.id === n3[t4]));
        if (!r2) return null;
        e2 = r2;
      }
      return e2;
    })(this.json, t2) || e({});
    return new g(n2);
  }
  add(t2, n2 = {}) {
    if (i(t2)) return t2.forEach(((e2) => this.add(c(e2), n2))), this;
    t2 = c(t2);
    let r2 = e({ id: t2, props: n2 });
    return this.json.children.push(r2), new g(r2);
  }
  remove(e2) {
    return e2 = c(e2), this.json.children = this.json.children.filter(((t2) => t2.id !== e2)), this;
  }
  nodes() {
    return r(this.json).map(((e2) => (delete (e2 = Object.assign({}, e2)).children, e2)));
  }
  cache() {
    return ((e2) => {
      let t2 = r(e2, ((e3, t3) => {
        e3.id && (e3._cache.parents = e3._cache.parents || [], e3._cache.children = e3._cache.children || [], t3._cache.parents = e3._cache.parents.concat([e3.id]));
      })), n2 = {};
      t2.forEach(((e3) => {
        e3.id && (n2[e3.id] = e3);
      })), t2.forEach(((e3) => {
        e3._cache.parents.forEach(((t3) => {
          n2.hasOwnProperty(t3) && n2[t3]._cache.children.push(e3.id);
        }));
      })), e2._cache.children = Object.keys(n2);
    })(this.json), this;
  }
  list() {
    return r(this.json);
  }
  fillDown() {
    var e2;
    return e2 = this.json, r(e2, ((e3, t2) => {
      t2.props = f$1(t2.props, e3.props);
    })), this;
  }
  depth() {
    u(this.json);
    let e2 = r(this.json), t2 = e2.length > 1 ? 1 : 0;
    return e2.forEach(((e3) => {
      if (0 === e3._cache.parents.length) return;
      let n2 = e3._cache.parents.length + 1;
      n2 > t2 && (t2 = n2);
    })), t2;
  }
  out(e2) {
    return u(this.json), d(this.json, e2);
  }
  debug() {
    return u(this.json), d(this.json, "debug"), this;
  }
};
const _ = function(e2) {
  let t2 = s$1(e2);
  return new g$2(t2);
};
_.prototype.plugin = function(e2) {
  e2(this);
};
const colors = {
  Noun: "blue",
  Verb: "green",
  Negative: "green",
  Date: "red",
  Value: "red",
  Adjective: "magenta",
  Preposition: "cyan",
  Conjunction: "cyan",
  Determiner: "cyan",
  Hyphenated: "cyan",
  Adverb: "cyan"
};
const getColor = function(node) {
  if (colors.hasOwnProperty(node.id)) {
    return colors[node.id];
  }
  if (colors.hasOwnProperty(node.is)) {
    return colors[node.is];
  }
  const found = node._cache.parents.find((c2) => colors[c2]);
  return colors[found];
};
const fmt = function(nodes) {
  const res = {};
  nodes.forEach((node) => {
    const { not, also, is, novel } = node.props;
    let parents = node._cache.parents;
    if (also) {
      parents = parents.concat(also);
    }
    res[node.id] = {
      is,
      not,
      novel,
      also,
      parents,
      children: node._cache.children,
      color: getColor(node)
    };
  });
  Object.keys(res).forEach((k2) => {
    const nots = new Set(res[k2].not);
    res[k2].not.forEach((not) => {
      if (res[not]) {
        res[not].children.forEach((tag2) => nots.add(tag2));
      }
    });
    res[k2].not = Array.from(nots);
  });
  return res;
};
const toArr = function(input) {
  if (!input) {
    return [];
  }
  if (typeof input === "string") {
    return [input];
  }
  return input;
};
const addImplied = function(tags, already) {
  Object.keys(tags).forEach((k2) => {
    if (tags[k2].isA) {
      tags[k2].is = tags[k2].isA;
    }
    if (tags[k2].notA) {
      tags[k2].not = tags[k2].notA;
    }
    if (tags[k2].is && typeof tags[k2].is === "string") {
      if (!already.hasOwnProperty(tags[k2].is) && !tags.hasOwnProperty(tags[k2].is)) {
        tags[tags[k2].is] = {};
      }
    }
    if (tags[k2].not && typeof tags[k2].not === "string" && !tags.hasOwnProperty(tags[k2].not)) {
      if (!already.hasOwnProperty(tags[k2].not) && !tags.hasOwnProperty(tags[k2].not)) {
        tags[tags[k2].not] = {};
      }
    }
  });
  return tags;
};
const validate = function(tags, already) {
  tags = addImplied(tags, already);
  Object.keys(tags).forEach((k2) => {
    tags[k2].children = toArr(tags[k2].children);
    tags[k2].not = toArr(tags[k2].not);
  });
  Object.keys(tags).forEach((k2) => {
    const nots = tags[k2].not || [];
    nots.forEach((no) => {
      if (tags[no] && tags[no].not) {
        tags[no].not.push(k2);
      }
    });
  });
  return tags;
};
const compute$5 = function(allTags2) {
  const flatList = Object.keys(allTags2).map((k2) => {
    const o2 = allTags2[k2];
    const props = { not: new Set(o2.not), also: o2.also, is: o2.is, novel: o2.novel };
    return { id: k2, parent: o2.is, props, children: [] };
  });
  const graph = _(flatList).cache().fillDown();
  return graph.out("array");
};
const fromUser = function(tags) {
  Object.keys(tags).forEach((k2) => {
    tags[k2] = Object.assign({}, tags[k2]);
    tags[k2].novel = true;
  });
  return tags;
};
const addTags$1 = function(tags, already) {
  if (Object.keys(already).length > 0) {
    tags = fromUser(tags);
  }
  tags = validate(tags, already);
  const allTags2 = Object.assign({}, already, tags);
  const nodes = compute$5(allTags2);
  const res = fmt(nodes);
  return res;
};
const methods$4 = {
  one: {
    setTag,
    unTag,
    addTags: addTags$1,
    canBe
  }
};
const isArray$2 = function(arr) {
  return Object.prototype.toString.call(arr) === "[object Array]";
};
const fns$1 = {
  /** add a given tag, to all these terms */
  tag: function(input, reason = "", isSafe) {
    if (!this.found || !input) {
      return this;
    }
    const terms = this.termList();
    if (terms.length === 0) {
      return this;
    }
    const { methods: methods2, verbose: verbose2, world: world2 } = this;
    if (verbose2 === true) {
      console.log(" +  ", input, reason || "");
    }
    if (isArray$2(input)) {
      input.forEach((tag2) => methods2.one.setTag(terms, tag2, world2, isSafe, reason));
    } else {
      methods2.one.setTag(terms, input, world2, isSafe, reason);
    }
    this.uncache();
    return this;
  },
  /** add a given tag, only if it is consistent */
  tagSafe: function(input, reason = "") {
    return this.tag(input, reason, true);
  },
  /** remove a given tag from all these terms */
  unTag: function(input, reason) {
    if (!this.found || !input) {
      return this;
    }
    const terms = this.termList();
    if (terms.length === 0) {
      return this;
    }
    const { methods: methods2, verbose: verbose2, model: model2 } = this;
    if (verbose2 === true) {
      console.log(" -  ", input, reason || "");
    }
    const tagSet = model2.one.tagSet;
    if (isArray$2(input)) {
      input.forEach((tag2) => methods2.one.unTag(terms, tag2, tagSet));
    } else {
      methods2.one.unTag(terms, input, tagSet);
    }
    this.uncache();
    return this;
  },
  /** return only the terms that can be this tag  */
  canBe: function(tag2) {
    tag2 = tag2.replace(/^#/, "");
    const tagSet = this.model.one.tagSet;
    const canBe2 = this.methods.one.canBe;
    const nope2 = [];
    this.document.forEach((terms, n2) => {
      terms.forEach((term, i2) => {
        if (!canBe2(term, tag2, tagSet)) {
          nope2.push([n2, i2, i2 + 1]);
        }
      });
    });
    const noDoc = this.update(nope2);
    return this.difference(noDoc);
  }
};
const tagAPI = function(View2) {
  Object.assign(View2.prototype, fns$1);
};
const addTags = function(tags) {
  const { model: model2, methods: methods2 } = this.world();
  const tagSet = model2.one.tagSet;
  const fn = methods2.one.addTags;
  const res = fn(tags, tagSet);
  model2.one.tagSet = res;
  return this;
};
const lib$1 = { addTags };
const boringTags = /* @__PURE__ */ new Set(["Auxiliary", "Possessive"]);
const sortByKids = function(tags, tagSet) {
  tags = tags.sort((a2, b) => {
    if (boringTags.has(a2) || !tagSet.hasOwnProperty(b)) {
      return 1;
    }
    if (boringTags.has(b) || !tagSet.hasOwnProperty(a2)) {
      return -1;
    }
    let kids = tagSet[a2].children || [];
    const aKids = kids.length;
    kids = tagSet[b].children || [];
    const bKids = kids.length;
    return aKids - bKids;
  });
  return tags;
};
const tagRank = function(view) {
  const { document, world: world2 } = view;
  const tagSet = world2.model.one.tagSet;
  document.forEach((terms) => {
    terms.forEach((term) => {
      const tags = Array.from(term.tags);
      term.tagRank = sortByKids(tags, tagSet);
    });
  });
};
const tag = {
  model: {
    one: { tagSet: {} }
  },
  compute: {
    tagRank
  },
  methods: methods$4,
  api: tagAPI,
  lib: lib$1
};
const initSplit = /([.!?\u203D\u2E18\u203C\u2047-\u2049\u3002]+\s)/g;
const splitsOnly = /^[.!?\u203D\u2E18\u203C\u2047-\u2049\u3002]+\s$/;
const newLine = /((?:\r?\n|\r)+)/;
const basicSplit = function(text2) {
  const all2 = [];
  const lines = text2.split(newLine);
  for (let i2 = 0; i2 < lines.length; i2++) {
    const arr = lines[i2].split(initSplit);
    for (let o2 = 0; o2 < arr.length; o2++) {
      if (arr[o2 + 1] && splitsOnly.test(arr[o2 + 1]) === true) {
        arr[o2] += arr[o2 + 1];
        arr[o2 + 1] = "";
      }
      if (arr[o2] !== "") {
        all2.push(arr[o2]);
      }
    }
  }
  return all2;
};
const hasLetter$1 = /[a-z0-9\u00C0-\u00FF\u00a9\u00ae\u2000-\u3300\ud000-\udfff]/i;
const hasSomething$1 = /\S/;
const notEmpty = function(splits) {
  const chunks2 = [];
  for (let i2 = 0; i2 < splits.length; i2++) {
    const s2 = splits[i2];
    if (s2 === void 0 || s2 === "") {
      continue;
    }
    if (hasSomething$1.test(s2) === false || hasLetter$1.test(s2) === false) {
      if (chunks2[chunks2.length - 1]) {
        chunks2[chunks2.length - 1] += s2;
        continue;
      } else if (splits[i2 + 1]) {
        splits[i2 + 1] = s2 + splits[i2 + 1];
        continue;
      }
    }
    chunks2.push(s2);
  }
  return chunks2;
};
const hasNewline = function(c2) {
  return Boolean(c2.match(/\n$/));
};
const smartMerge = function(chunks2, world2) {
  const isSentence2 = world2.methods.one.tokenize.isSentence;
  const abbrevs = world2.model.one.abbreviations || /* @__PURE__ */ new Set();
  const sentences2 = [];
  for (let i2 = 0; i2 < chunks2.length; i2++) {
    const c2 = chunks2[i2];
    if (chunks2[i2 + 1] && !isSentence2(c2, abbrevs) && !hasNewline(c2)) {
      chunks2[i2 + 1] = c2 + (chunks2[i2 + 1] || "");
    } else if (c2 && c2.length > 0) {
      sentences2.push(c2);
      chunks2[i2] = "";
    }
  }
  return sentences2;
};
const MAX_QUOTE = 280;
const pairs$1 = {
  '"': '"',
  // 'StraightDoubleQuotes'
  "＂": "＂",
  // 'StraightDoubleQuotesWide'
  // '\u0027': '\u0027', // 'StraightSingleQuotes'
  "“": "”",
  // 'CommaDoubleQuotes'
  // '\u2018': '\u2019', // 'CommaSingleQuotes'
  "‟": "”",
  // 'CurlyDoubleQuotesReversed'
  // '\u201B': '\u2019', // 'CurlySingleQuotesReversed'
  "„": "”",
  // 'LowCurlyDoubleQuotes'
  "⹂": "”",
  // 'LowCurlyDoubleQuotesReversed'
  "‚": "’",
  // 'LowCurlySingleQuotes'
  "«": "»",
  // 'AngleDoubleQuotes'
  "‹": "›",
  // 'AngleSingleQuotes'
  "‵": "′",
  // 'PrimeSingleQuotes'
  "‶": "″",
  // 'PrimeDoubleQuotes'
  "‷": "‴",
  // 'PrimeTripleQuotes'
  "〝": "〞",
  // 'PrimeDoubleQuotes'
  // '\u0060': '\u00B4', // 'PrimeSingleQuotes'
  "〟": "〞"
  // 'LowPrimeDoubleQuotesReversed'
};
const openQuote = RegExp("[" + Object.keys(pairs$1).join("") + "]", "g");
const closeQuote = RegExp("[" + Object.values(pairs$1).join("") + "]", "g");
const closesQuote = function(str) {
  if (!str) {
    return false;
  }
  const m2 = str.match(closeQuote);
  if (m2 !== null && m2.length === 1) {
    return true;
  }
  return false;
};
const quoteMerge = function(splits) {
  const arr = [];
  for (let i2 = 0; i2 < splits.length; i2 += 1) {
    const split2 = splits[i2];
    const m2 = split2.match(openQuote);
    if (m2 !== null && m2.length === 1) {
      if (closesQuote(splits[i2 + 1]) && splits[i2 + 1].length < MAX_QUOTE) {
        splits[i2] += splits[i2 + 1];
        arr.push(splits[i2]);
        splits[i2 + 1] = "";
        i2 += 1;
        continue;
      }
      if (closesQuote(splits[i2 + 2])) {
        const toAdd = splits[i2 + 1] + splits[i2 + 2];
        if (toAdd.length < MAX_QUOTE) {
          splits[i2] += toAdd;
          arr.push(splits[i2]);
          splits[i2 + 1] = "";
          splits[i2 + 2] = "";
          i2 += 2;
          continue;
        }
      }
    }
    arr.push(splits[i2]);
  }
  return arr;
};
const MAX_LEN = 250;
const hasOpen$2 = /\(/g;
const hasClosed$2 = /\)/g;
const mergeParens = function(splits) {
  const arr = [];
  for (let i2 = 0; i2 < splits.length; i2 += 1) {
    const split2 = splits[i2];
    const m2 = split2.match(hasOpen$2);
    if (m2 !== null && m2.length === 1) {
      if (splits[i2 + 1] && splits[i2 + 1].length < MAX_LEN) {
        const m22 = splits[i2 + 1].match(hasClosed$2);
        if (m22 !== null && m2.length === 1 && !hasOpen$2.test(splits[i2 + 1])) {
          splits[i2] += splits[i2 + 1];
          arr.push(splits[i2]);
          splits[i2 + 1] = "";
          i2 += 1;
          continue;
        }
      }
    }
    arr.push(splits[i2]);
  }
  return arr;
};
const hasSomething = /\S/;
const startWhitespace = /^\s+/;
const splitSentences = function(text2, world2) {
  text2 = text2 || "";
  text2 = String(text2);
  if (!text2 || typeof text2 !== "string" || hasSomething.test(text2) === false) {
    return [];
  }
  text2 = text2.replace(" ", " ");
  const splits = basicSplit(text2);
  let sentences2 = notEmpty(splits);
  sentences2 = smartMerge(sentences2, world2);
  sentences2 = quoteMerge(sentences2);
  sentences2 = mergeParens(sentences2);
  if (sentences2.length === 0) {
    return [text2];
  }
  for (let i2 = 1; i2 < sentences2.length; i2 += 1) {
    const ws = sentences2[i2].match(startWhitespace);
    if (ws !== null) {
      sentences2[i2 - 1] += ws[0];
      sentences2[i2] = sentences2[i2].replace(startWhitespace, "");
    }
  }
  return sentences2;
};
const hasHyphen = function(str, model2) {
  const parts = str.split(/[-–—]/);
  if (parts.length <= 1) {
    return false;
  }
  const { prefixes: prefixes2, suffixes: suffixes2 } = model2.one;
  if (parts[0].length === 1 && /[a-z]/i.test(parts[0])) {
    return false;
  }
  if (prefixes2.hasOwnProperty(parts[0])) {
    return false;
  }
  parts[1] = parts[1].trim().replace(/[.?!]$/, "");
  if (suffixes2.hasOwnProperty(parts[1])) {
    return false;
  }
  const reg = /^([a-z\u00C0-\u00FF`"'/]+)[-–—]([a-z0-9\u00C0-\u00FF].*)/i;
  if (reg.test(str) === true) {
    return true;
  }
  const reg2 = /^[('"]?([0-9]{1,4})[-–—]([a-z\u00C0-\u00FF`"'/-]+[)'"]?$)/i;
  if (reg2.test(str) === true) {
    return true;
  }
  return false;
};
const splitHyphens = function(word) {
  const arr = [];
  const hyphens = word.split(/[-–—]/);
  let whichDash = "-";
  const found = word.match(/[-–—]/);
  if (found && found[0]) {
    whichDash = found;
  }
  for (let o2 = 0; o2 < hyphens.length; o2++) {
    if (o2 === hyphens.length - 1) {
      arr.push(hyphens[o2]);
    } else {
      arr.push(hyphens[o2] + whichDash);
    }
  }
  return arr;
};
const combineRanges = function(arr) {
  const startRange = /^[0-9]{1,4}(:[0-9][0-9])?([a-z]{1,2})? ?[-–—] ?$/;
  const endRange = /^[0-9]{1,4}([a-z]{1,2})? ?$/;
  for (let i2 = 0; i2 < arr.length - 1; i2 += 1) {
    if (arr[i2 + 1] && startRange.test(arr[i2]) && endRange.test(arr[i2 + 1])) {
      arr[i2] = arr[i2] + arr[i2 + 1];
      arr[i2 + 1] = null;
    }
  }
  return arr;
};
const isSlash = new RegExp("\\p{L} ?\\/ ?\\p{L}+$", "u");
const combineSlashes = function(arr) {
  for (let i2 = 1; i2 < arr.length - 1; i2++) {
    if (isSlash.test(arr[i2])) {
      arr[i2 - 1] += arr[i2] + arr[i2 + 1];
      arr[i2] = null;
      arr[i2 + 1] = null;
    }
  }
  return arr;
};
const wordlike = /\S/;
const isBoundary = /^[!?.]+$/;
const naiiveSplit = /(\S+)/;
let notWord = [
  ".",
  "?",
  "!",
  ":",
  ";",
  "-",
  "–",
  "—",
  "--",
  "...",
  "(",
  ")",
  "[",
  "]",
  '"',
  "'",
  "`",
  "«",
  "»",
  "*",
  "•"
];
notWord = notWord.reduce((h2, c2) => {
  h2[c2] = true;
  return h2;
}, {});
const isArray$1 = function(arr) {
  return Object.prototype.toString.call(arr) === "[object Array]";
};
const splitWords = function(str, model2) {
  let result = [];
  let arr = [];
  str = str || "";
  if (typeof str === "number") {
    str = String(str);
  }
  if (isArray$1(str)) {
    return str;
  }
  const words2 = str.split(naiiveSplit);
  for (let i2 = 0; i2 < words2.length; i2++) {
    if (hasHyphen(words2[i2], model2) === true) {
      arr = arr.concat(splitHyphens(words2[i2]));
      continue;
    }
    arr.push(words2[i2]);
  }
  let carry = "";
  for (let i2 = 0; i2 < arr.length; i2++) {
    const word = arr[i2];
    if (wordlike.test(word) === true && notWord.hasOwnProperty(word) === false && isBoundary.test(word) === false) {
      if (result.length > 0) {
        result[result.length - 1] += carry;
        result.push(word);
      } else {
        result.push(carry + word);
      }
      carry = "";
    } else {
      carry += word;
    }
  }
  if (carry) {
    if (result.length === 0) {
      result[0] = "";
    }
    result[result.length - 1] += carry;
  }
  result = combineSlashes(result);
  result = combineRanges(result);
  result = result.filter((s2) => s2);
  return result;
};
const isLetter = new RegExp("\\p{Letter}", "u");
const isNumber = /[\p{Number}\p{Currency_Symbol}]/u;
const hasAcronym = /^[a-z]\.([a-z]\.)+/i;
const chillin = /[sn]['’]$/;
const normalizePunctuation = function(str, model2) {
  const { prePunctuation: prePunctuation2, postPunctuation: postPunctuation2, emoticons: emoticons2 } = model2.one;
  let original = str;
  let pre = "";
  let post = "";
  const chars = Array.from(str);
  if (emoticons2.hasOwnProperty(str.trim())) {
    return { str: str.trim(), pre, post: " " };
  }
  let len = chars.length;
  for (let i2 = 0; i2 < len; i2 += 1) {
    const c2 = chars[0];
    if (prePunctuation2[c2] === true) {
      continue;
    }
    if ((c2 === "+" || c2 === "-") && isNumber.test(chars[1])) {
      break;
    }
    if (c2 === "'" && c2.length === 3 && isNumber.test(chars[1])) {
      break;
    }
    if (isLetter.test(c2) || isNumber.test(c2)) {
      break;
    }
    pre += chars.shift();
  }
  len = chars.length;
  for (let i2 = 0; i2 < len; i2 += 1) {
    const c2 = chars[chars.length - 1];
    if (postPunctuation2[c2] === true) {
      continue;
    }
    if (isLetter.test(c2) || isNumber.test(c2)) {
      break;
    }
    if (c2 === "." && hasAcronym.test(original) === true) {
      continue;
    }
    if (c2 === "'" && chillin.test(original) === true) {
      continue;
    }
    post = chars.pop() + post;
  }
  str = chars.join("");
  if (str === "") {
    original = original.replace(/ *$/, (after2) => {
      post = after2 || "";
      return "";
    });
    str = original;
    pre = "";
  }
  return { str, pre, post };
};
const parseTerm = (txt, model2) => {
  const { str, pre, post } = normalizePunctuation(txt, model2);
  const parsed = {
    text: str,
    pre,
    post,
    tags: /* @__PURE__ */ new Set()
  };
  return parsed;
};
const killUnicode = function(str, world2) {
  const unicode2 = world2.model.one.unicode || {};
  str = str || "";
  const chars = str.split("");
  chars.forEach((s2, i2) => {
    if (unicode2[s2]) {
      chars[i2] = unicode2[s2];
    }
  });
  return chars.join("");
};
const clean = function(str) {
  str = str || "";
  str = str.toLowerCase();
  str = str.trim();
  const original = str;
  str = str.replace(/[,;.!?]+$/, "");
  str = str.replace(/\u2026/g, "...");
  str = str.replace(/\u2013/g, "-");
  if (/^[:;]/.test(str) === false) {
    str = str.replace(/\.{3,}$/g, "");
    str = str.replace(/[",.!:;?)]+$/g, "");
    str = str.replace(/^['"(]+/g, "");
  }
  str = str.replace(/[\u200B-\u200D\uFEFF]/g, "");
  str = str.trim();
  if (str === "") {
    str = original;
  }
  str = str.replace(/([0-9]),([0-9])/g, "$1$2");
  return str;
};
const periodAcronym$1 = /([A-Z]\.)+[A-Z]?,?$/;
const oneLetterAcronym$1 = /^[A-Z]\.,?$/;
const noPeriodAcronym$1 = /[A-Z]{2,}('s|,)?$/;
const lowerCaseAcronym$1 = /([a-z]\.)+[a-z]\.?$/;
const isAcronym$2 = function(str) {
  if (periodAcronym$1.test(str) === true) {
    return true;
  }
  if (lowerCaseAcronym$1.test(str) === true) {
    return true;
  }
  if (oneLetterAcronym$1.test(str) === true) {
    return true;
  }
  if (noPeriodAcronym$1.test(str) === true) {
    return true;
  }
  return false;
};
const doAcronym = function(str) {
  if (isAcronym$2(str)) {
    str = str.replace(/\./g, "");
  }
  return str;
};
const normalize$1 = function(term, world2) {
  const killUnicode2 = world2.methods.one.killUnicode;
  let str = term.text || "";
  str = clean(str);
  str = killUnicode2(str, world2);
  str = doAcronym(str);
  term.normal = str;
};
const parse$4 = function(input, world2) {
  const { methods: methods2, model: model2 } = world2;
  const { splitSentences: splitSentences2, splitTerms, splitWhitespace } = methods2.one.tokenize;
  input = input || "";
  const sentences2 = splitSentences2(input, world2);
  input = sentences2.map((txt) => {
    let terms = splitTerms(txt, model2);
    terms = terms.map((t2) => splitWhitespace(t2, model2));
    terms.forEach((t2) => {
      normalize$1(t2, world2);
    });
    return terms;
  });
  return input;
};
const isAcronym$1 = /[ .][A-Z]\.? *$/i;
const hasEllipse = /(?:\u2026|\.{2,}) *$/;
const hasLetter = new RegExp("\\p{L}", "u");
const hasPeriod$1 = /\. *$/;
const leadInit = /^[A-Z]\. $/;
const isSentence = function(str, abbrevs) {
  if (hasLetter.test(str) === false) {
    return false;
  }
  if (isAcronym$1.test(str) === true) {
    return false;
  }
  if (str.length === 3 && leadInit.test(str)) {
    return false;
  }
  if (hasEllipse.test(str) === true) {
    return false;
  }
  const txt = str.replace(/[.!?\u203D\u2E18\u203C\u2047-\u2049] *$/, "");
  const words2 = txt.split(" ");
  const lastWord = words2[words2.length - 1].toLowerCase();
  if (abbrevs.hasOwnProperty(lastWord) === true && hasPeriod$1.test(str) === true) {
    return false;
  }
  return true;
};
const methods$3 = {
  one: {
    killUnicode,
    tokenize: {
      splitSentences,
      isSentence,
      splitTerms: splitWords,
      splitWhitespace: parseTerm,
      fromString: parse$4
    }
  }
};
const aliases$1 = {
  "&": "and",
  "@": "at",
  "%": "percent",
  "plz": "please",
  "bein": "being"
};
const misc$6 = [
  "approx",
  "apt",
  "bc",
  "cyn",
  "eg",
  "esp",
  "est",
  "etc",
  "ex",
  "exp",
  "prob",
  //probably
  "pron",
  // Pronunciation
  "gal",
  //gallon
  "min",
  "pseud",
  "fig",
  //figure
  "jd",
  "lat",
  //latitude
  "lng",
  //longitude
  "vol",
  //volume
  "fm",
  //not am
  "def",
  //definition
  "misc",
  "plz",
  //please
  "ea",
  //each
  "ps",
  "sec",
  //second
  "pt",
  "pref",
  //preface
  "pl",
  //plural
  "pp",
  //pages
  "qt",
  //quarter
  "fr",
  //french
  "sq",
  "nee",
  //given name at birth
  "ss",
  //ship, or sections
  "tel",
  "temp",
  "vet",
  "ver",
  //version
  "fem",
  //feminine
  "masc",
  //masculine
  "eng",
  //engineering/english
  "adj",
  //adjective
  "vb",
  //verb
  "rb",
  //adverb
  "inf",
  //infinitive
  "situ",
  // in situ
  "vivo",
  "vitro",
  "wr"
  //world record
];
const honorifics$1 = [
  "adj",
  "adm",
  "adv",
  "asst",
  "atty",
  "bldg",
  "brig",
  "capt",
  "cmdr",
  "comdr",
  "cpl",
  "det",
  "dr",
  "esq",
  "gen",
  "gov",
  "hon",
  "jr",
  "llb",
  "lt",
  "maj",
  "messrs",
  "mlle",
  "mme",
  "mr",
  "mrs",
  "ms",
  "mstr",
  "phd",
  "prof",
  "pvt",
  "rep",
  "reps",
  "res",
  "rev",
  "sen",
  "sens",
  "sfc",
  "sgt",
  "sir",
  "sr",
  "supt",
  "surg"
  //miss
  //misses
];
const months = ["jan", "feb", "mar", "apr", "jun", "jul", "aug", "sep", "sept", "oct", "nov", "dec"];
const nouns$3 = [
  "ad",
  "al",
  "arc",
  "ba",
  "bl",
  "ca",
  "cca",
  "col",
  "corp",
  "ft",
  "fy",
  "ie",
  "lit",
  "ma",
  "md",
  "pd",
  "tce"
];
const organizations = ["dept", "univ", "assn", "bros", "inc", "ltd", "co"];
const places$2 = [
  "rd",
  "st",
  "dist",
  "mt",
  "ave",
  "blvd",
  "cl",
  // 'ct',
  "cres",
  "hwy",
  //states
  "ariz",
  "cal",
  "calif",
  "colo",
  "conn",
  "fla",
  "fl",
  "ga",
  "ida",
  "ia",
  "kan",
  "kans",
  "minn",
  "neb",
  "nebr",
  "okla",
  "penna",
  "penn",
  "pa",
  "dak",
  "tenn",
  "tex",
  "ut",
  "vt",
  "va",
  "wis",
  "wisc",
  "wy",
  "wyo",
  "usafa",
  "alta",
  "ont",
  "que",
  "sask"
];
const units = [
  "dl",
  "ml",
  "gal",
  // 'ft', //ambiguous
  "qt",
  "pt",
  "tbl",
  "tsp",
  "tbsp",
  "km",
  "dm",
  //decimeter
  "cm",
  "mm",
  "mi",
  "td",
  "hr",
  //hour
  "hrs",
  //hour
  "kg",
  "hg",
  "dg",
  //decigram
  "cg",
  //centigram
  "mg",
  //milligram
  "µg",
  //microgram
  "lb",
  //pound
  "oz",
  //ounce
  "sq ft",
  "hz",
  //hertz
  "mps",
  //meters per second
  "mph",
  "kmph",
  //kilometers per hour
  "kb",
  //kilobyte
  "mb",
  //megabyte
  // 'gb', //ambig
  "tb",
  //terabyte
  "lx",
  //lux
  "lm",
  //lumen
  // 'pa', //ambig
  "fl oz",
  //
  "yb"
];
const list$2 = [
  [misc$6],
  [units, "Unit"],
  [nouns$3, "Noun"],
  [honorifics$1, "Honorific"],
  [months, "Month"],
  [organizations, "Organization"],
  [places$2, "Place"]
];
const abbreviations = {};
const lexicon$1 = {};
list$2.forEach((a2) => {
  a2[0].forEach((w) => {
    abbreviations[w] = true;
    lexicon$1[w] = "Abbreviation";
    if (a2[1] !== void 0) {
      lexicon$1[w] = [lexicon$1[w], a2[1]];
    }
  });
});
const prefixes$1 = [
  "anti",
  "bi",
  "co",
  "contra",
  "de",
  "extra",
  "infra",
  "inter",
  "intra",
  "macro",
  "micro",
  "mis",
  "mono",
  "multi",
  "peri",
  "pre",
  "pro",
  "proto",
  "pseudo",
  "re",
  "sub",
  "supra",
  "trans",
  "tri",
  "un",
  "out",
  //out-lived
  "ex"
  //ex-wife
  // 'counter',
  // 'mid',
  // 'out',
  // 'non',
  // 'over',
  // 'post',
  // 'semi',
  // 'super', //'super-cool'
  // 'ultra', //'ulta-cool'
  // 'under',
  // 'whole',
].reduce((h2, str) => {
  h2[str] = true;
  return h2;
}, {});
const suffixes$4 = {
  "like": true,
  "ish": true,
  "less": true,
  "able": true,
  "elect": true,
  "type": true,
  "designate": true
  // 'fold':true,
};
const compact = {
  "!": "¡",
  "?": "¿Ɂ",
  '"': '“”"❝❞',
  "'": "‘‛❛❜’",
  "-": "—–",
  a: "ªÀÁÂÃÄÅàáâãäåĀāĂăĄąǍǎǞǟǠǡǺǻȀȁȂȃȦȧȺΆΑΔΛάαλАаѦѧӐӑӒӓƛæ",
  b: "ßþƀƁƂƃƄƅɃΒβϐϦБВЪЬвъьѢѣҌҍ",
  c: "¢©ÇçĆćĈĉĊċČčƆƇƈȻȼͻͼϲϹϽϾСсєҀҁҪҫ",
  d: "ÐĎďĐđƉƊȡƋƌ",
  e: "ÈÉÊËèéêëĒēĔĕĖėĘęĚěƐȄȅȆȇȨȩɆɇΈΕΞΣέεξϵЀЁЕеѐёҼҽҾҿӖӗễ",
  f: "ƑƒϜϝӺӻҒғſ",
  g: "ĜĝĞğĠġĢģƓǤǥǦǧǴǵ",
  h: "ĤĥĦħƕǶȞȟΉΗЂЊЋНнђћҢңҤҥҺһӉӊ",
  I: "ÌÍÎÏ",
  i: "ìíîïĨĩĪīĬĭĮįİıƖƗȈȉȊȋΊΐΪίιϊІЇіїi̇",
  j: "ĴĵǰȷɈɉϳЈј",
  k: "ĶķĸƘƙǨǩΚκЌЖКжкќҚқҜҝҞҟҠҡ",
  l: "ĹĺĻļĽľĿŀŁłƚƪǀǏǐȴȽΙӀӏ",
  m: "ΜϺϻМмӍӎ",
  n: "ÑñŃńŅņŇňŉŊŋƝƞǸǹȠȵΝΠήηϞЍИЙЛПийлпѝҊҋӅӆӢӣӤӥπ",
  o: "ÒÓÔÕÖØðòóôõöøŌōŎŏŐőƟƠơǑǒǪǫǬǭǾǿȌȍȎȏȪȫȬȭȮȯȰȱΌΘΟθοσόϕϘϙϬϴОФоѲѳӦӧӨөӪӫ",
  p: "ƤΡρϷϸϼРрҎҏÞ",
  q: "Ɋɋ",
  r: "ŔŕŖŗŘřƦȐȑȒȓɌɍЃГЯгяѓҐґ",
  s: "ŚśŜŝŞşŠšƧƨȘșȿЅѕ",
  t: "ŢţŤťŦŧƫƬƭƮȚțȶȾΓΤτϮТт",
  u: "ÙÚÛÜùúûüŨũŪūŬŭŮůŰűŲųƯưƱƲǓǔǕǖǗǘǙǚǛǜȔȕȖȗɄΰυϋύ",
  v: "νѴѵѶѷ",
  w: "ŴŵƜωώϖϢϣШЩшщѡѿ",
  x: "×ΧχϗϰХхҲҳӼӽӾӿ",
  y: "ÝýÿŶŷŸƳƴȲȳɎɏΎΥΫγψϒϓϔЎУучўѰѱҮүҰұӮӯӰӱӲӳ",
  z: "ŹźŻżŽžƵƶȤȥɀΖ"
};
const unicode = {};
Object.keys(compact).forEach(function(k2) {
  compact[k2].split("").forEach(function(s2) {
    unicode[s2] = k2;
  });
});
const prePunctuation = {
  "#": true,
  //#hastag
  "@": true,
  //@atmention
  "_": true,
  //underscore
  "°": true,
  // '+': true,//+4
  // '\\-',//-4  (escape)
  // '.',//.4
  // zero-width chars
  "​": true,
  "‌": true,
  "‍": true,
  "\uFEFF": true
};
const postPunctuation = {
  "%": true,
  //88%
  "_": true,
  //underscore
  "°": true,
  //degrees, italian ordinal
  // '\'',// sometimes
  // zero-width chars
  "​": true,
  "‌": true,
  "‍": true,
  "\uFEFF": true
};
const emoticons$1 = {
  "<3": true,
  "</3": true,
  "<\\3": true,
  ":^P": true,
  ":^p": true,
  ":^O": true,
  ":^3": true
};
const model$3 = {
  one: {
    aliases: aliases$1,
    abbreviations,
    prefixes: prefixes$1,
    suffixes: suffixes$4,
    prePunctuation,
    postPunctuation,
    lexicon: lexicon$1,
    //give this one forward
    unicode,
    emoticons: emoticons$1
  }
};
const hasSlash$1 = /\//;
const hasDomain = /[a-z]\.[a-z]/i;
const isMath = /[0-9]/;
const addAliases = function(term, world2) {
  const str = term.normal || term.text || term.machine;
  const aliases2 = world2.model.one.aliases;
  if (aliases2.hasOwnProperty(str)) {
    term.alias = term.alias || [];
    term.alias.push(aliases2[str]);
  }
  if (hasSlash$1.test(str) && !hasDomain.test(str) && !isMath.test(str)) {
    const arr = str.split(hasSlash$1);
    if (arr.length <= 3) {
      arr.forEach((word) => {
        word = word.trim();
        if (word !== "") {
          term.alias = term.alias || [];
          term.alias.push(word);
        }
      });
    }
  }
  return term;
};
const hasDash = new RegExp("^\\p{Letter}+-\\p{Letter}+$", "u");
const doMachine = function(term) {
  let str = term.implicit || term.normal || term.text;
  str = str.replace(/['’]s$/, "");
  str = str.replace(/s['’]$/, "s");
  str = str.replace(/([aeiou][ktrp])in'$/, "$1ing");
  if (hasDash.test(str)) {
    str = str.replace(/-/g, "");
  }
  str = str.replace(/^[#@]/, "");
  if (str !== term.normal) {
    term.machine = str;
  }
};
const freq = function(view) {
  const docs = view.docs;
  const counts = {};
  for (let i2 = 0; i2 < docs.length; i2 += 1) {
    for (let t2 = 0; t2 < docs[i2].length; t2 += 1) {
      const term = docs[i2][t2];
      const word = term.machine || term.normal;
      counts[word] = counts[word] || 0;
      counts[word] += 1;
    }
  }
  for (let i2 = 0; i2 < docs.length; i2 += 1) {
    for (let t2 = 0; t2 < docs[i2].length; t2 += 1) {
      const term = docs[i2][t2];
      const word = term.machine || term.normal;
      term.freq = counts[word];
    }
  }
};
const offset = function(view) {
  let elapsed = 0;
  let index2 = 0;
  const docs = view.document;
  for (let i2 = 0; i2 < docs.length; i2 += 1) {
    for (let t2 = 0; t2 < docs[i2].length; t2 += 1) {
      const term = docs[i2][t2];
      term.offset = {
        index: index2,
        start: elapsed + term.pre.length,
        length: term.text.length
      };
      elapsed += term.pre.length + term.text.length + term.post.length;
      index2 += 1;
    }
  }
};
const index = function(view) {
  const document = view.document;
  for (let n2 = 0; n2 < document.length; n2 += 1) {
    for (let i2 = 0; i2 < document[n2].length; i2 += 1) {
      document[n2][i2].index = [n2, i2];
    }
  }
};
const wordCount = function(view) {
  let n2 = 0;
  const docs = view.docs;
  for (let i2 = 0; i2 < docs.length; i2 += 1) {
    for (let t2 = 0; t2 < docs[i2].length; t2 += 1) {
      if (docs[i2][t2].normal === "") {
        continue;
      }
      n2 += 1;
      docs[i2][t2].wordCount = n2;
    }
  }
};
const termLoop$1 = function(view, fn) {
  const docs = view.docs;
  for (let i2 = 0; i2 < docs.length; i2 += 1) {
    for (let t2 = 0; t2 < docs[i2].length; t2 += 1) {
      fn(docs[i2][t2], view.world);
    }
  }
};
const methods$2 = {
  alias: (view) => termLoop$1(view, addAliases),
  machine: (view) => termLoop$1(view, doMachine),
  normal: (view) => termLoop$1(view, normalize$1),
  freq,
  offset,
  index,
  wordCount
};
const tokenize = {
  compute: methods$2,
  methods: methods$3,
  model: model$3,
  hooks: ["alias", "machine", "index", "id"]
};
const typeahead$1 = function(view) {
  const prefixes2 = view.model.one.typeahead;
  const docs = view.docs;
  if (docs.length === 0 || Object.keys(prefixes2).length === 0) {
    return;
  }
  const lastPhrase = docs[docs.length - 1] || [];
  const lastTerm = lastPhrase[lastPhrase.length - 1];
  if (lastTerm.post) {
    return;
  }
  if (prefixes2.hasOwnProperty(lastTerm.normal)) {
    const found = prefixes2[lastTerm.normal];
    lastTerm.implicit = found;
    lastTerm.machine = found;
    lastTerm.typeahead = true;
    if (view.compute.preTagger) {
      view.last().unTag("*").compute(["lexicon", "preTagger"]);
    }
  }
};
const compute$4 = { typeahead: typeahead$1 };
const autoFill = function() {
  const docs = this.docs;
  if (docs.length === 0) {
    return this;
  }
  const lastPhrase = docs[docs.length - 1] || [];
  const term = lastPhrase[lastPhrase.length - 1];
  if (term.typeahead === true && term.machine) {
    term.text = term.machine;
    term.normal = term.machine;
  }
  return this;
};
const api$k = function(View2) {
  View2.prototype.autoFill = autoFill;
};
const getPrefixes = function(arr, opts2, world2) {
  let index2 = {};
  const collisions = [];
  const existing = world2.prefixes || {};
  arr.forEach((str) => {
    str = str.toLowerCase().trim();
    let max2 = str.length;
    if (opts2.max && max2 > opts2.max) {
      max2 = opts2.max;
    }
    for (let size = opts2.min; size < max2; size += 1) {
      const prefix2 = str.substring(0, size);
      if (opts2.safe && world2.model.one.lexicon.hasOwnProperty(prefix2)) {
        continue;
      }
      if (existing.hasOwnProperty(prefix2) === true) {
        collisions.push(prefix2);
        continue;
      }
      if (index2.hasOwnProperty(prefix2) === true) {
        collisions.push(prefix2);
        continue;
      }
      index2[prefix2] = str;
    }
  });
  index2 = Object.assign({}, existing, index2);
  collisions.forEach((str) => {
    delete index2[str];
  });
  return index2;
};
const isObject = (val) => {
  return Object.prototype.toString.call(val) === "[object Object]";
};
const defaults$1 = {
  safe: true,
  min: 3
};
const prepare = function(words2 = [], opts2 = {}) {
  const model2 = this.model();
  opts2 = Object.assign({}, defaults$1, opts2);
  if (isObject(words2)) {
    Object.assign(model2.one.lexicon, words2);
    words2 = Object.keys(words2);
  }
  const prefixes2 = getPrefixes(words2, opts2, this.world());
  Object.keys(prefixes2).forEach((str) => {
    if (model2.one.typeahead.hasOwnProperty(str)) {
      delete model2.one.typeahead[str];
      return;
    }
    model2.one.typeahead[str] = prefixes2[str];
  });
  return this;
};
const lib = {
  typeahead: prepare
};
const model$2 = {
  one: {
    typeahead: {}
    //set a blank key-val
  }
};
const typeahead = {
  model: model$2,
  api: api$k,
  lib,
  compute: compute$4,
  hooks: ["typeahead"]
};
nlp.extend(change);
nlp.extend(output);
nlp.extend(match);
nlp.extend(pointers);
nlp.extend(tag);
nlp.plugin(plugin$3);
nlp.extend(tokenize);
nlp.extend(freeze);
nlp.plugin(cache$1);
nlp.extend(lookup);
nlp.extend(typeahead);
nlp.extend(lexicon$2);
nlp.extend(sweep);
const irregularPlurals = {
  // -a
  addendum: "addenda",
  corpus: "corpora",
  criterion: "criteria",
  curriculum: "curricula",
  genus: "genera",
  memorandum: "memoranda",
  opus: "opera",
  ovum: "ova",
  phenomenon: "phenomena",
  referendum: "referenda",
  // -ae
  alga: "algae",
  alumna: "alumnae",
  antenna: "antennae",
  formula: "formulae",
  larva: "larvae",
  nebula: "nebulae",
  vertebra: "vertebrae",
  // -is
  analysis: "analyses",
  axis: "axes",
  diagnosis: "diagnoses",
  parenthesis: "parentheses",
  prognosis: "prognoses",
  synopsis: "synopses",
  thesis: "theses",
  neurosis: "neuroses",
  // -x
  appendix: "appendices",
  index: "indices",
  matrix: "matrices",
  ox: "oxen",
  sex: "sexes",
  // -i
  alumnus: "alumni",
  bacillus: "bacilli",
  cactus: "cacti",
  fungus: "fungi",
  hippopotamus: "hippopotami",
  libretto: "libretti",
  modulus: "moduli",
  nucleus: "nuclei",
  octopus: "octopi",
  radius: "radii",
  stimulus: "stimuli",
  syllabus: "syllabi",
  // -ie
  cookie: "cookies",
  calorie: "calories",
  auntie: "aunties",
  movie: "movies",
  pie: "pies",
  rookie: "rookies",
  tie: "ties",
  zombie: "zombies",
  // -f
  leaf: "leaves",
  loaf: "loaves",
  thief: "thieves",
  // ee-
  foot: "feet",
  goose: "geese",
  tooth: "teeth",
  // -eaux
  beau: "beaux",
  chateau: "chateaux",
  tableau: "tableaux",
  // -ses
  bus: "buses",
  gas: "gases",
  circus: "circuses",
  crisis: "crises",
  virus: "viruses",
  database: "databases",
  excuse: "excuses",
  abuse: "abuses",
  avocado: "avocados",
  barracks: "barracks",
  child: "children",
  clothes: "clothes",
  echo: "echoes",
  embargo: "embargoes",
  epoch: "epochs",
  deer: "deer",
  halo: "halos",
  man: "men",
  woman: "women",
  mosquito: "mosquitoes",
  mouse: "mice",
  person: "people",
  quiz: "quizzes",
  rodeo: "rodeos",
  shoe: "shoes",
  sombrero: "sombreros",
  stomach: "stomachs",
  tornado: "tornados",
  tuxedo: "tuxedos",
  volcano: "volcanoes"
};
const lexData = {
  "Comparative": "true¦bett1f0;arth0ew0in0;er",
  "Superlative": "true¦earlier",
  "PresentTense": "true¦bests,sounds",
  "Condition": "true¦lest,unless",
  "PastTense": "true¦began,came,d4had,kneel3l2m0sa4we1;ea0sg2;nt;eap0i0;ed;id",
  "Participle": "true¦0:09;a06b01cZdXeat0fSgQhPoJprov0rHs7t6u4w1;ak0ithdra02o2r1;i02uY;k0v0;nd1pr04;ergoJoJ;ak0hHo3;e9h7lain,o6p5t4un3w1;o1um;rn;g,k;ol0reS;iQok0;ught,wn;ak0o1runk;ne,wn;en,wn;ewriNi1uJ;dd0s0;ut3ver1;do4se0t1;ak0h2;do2g1;roG;ne;ast0i7;iv0o1;ne,tt0;all0loBor1;bi3g2s1;ak0e0;iv0o9;dd0;ove,r1;a5eamt,iv0;hos0lu1;ng;e4i3lo2ui1;lt;wn;tt0;at0en,gun;r2w1;ak0ok0;is0;en",
  "Gerund": "true¦accord0be0doin,go0result0stain0;ing",
  "Expression": "true¦a0Yb0Uc0Sd0Oe0Mfarew0Lg0FhZjeez,lWmVnToOpLsJtIuFvEw7y0;a5e3i1u0;ck,p;k04p0;ee,pee;a0p,s;!h;!a,h,y;a5h2o1t0;af,f;rd up,w;atsoever,e1o0;a,ops;e,w;hoo,t;ery w06oi0L;gh,h0;! 0h,m;huh,oh;here nPsk,ut tut;h0ic;eesh,hh,it,oo;ff,h1l0ow,sst;ease,s,z;ew,ooey;h1i,mg,o0uch,w,y;h,o,ps;! 0h;hTmy go0wT;d,sh;a7evertheless,o0;!pe;eh,mm;ah,eh,m1ol0;!s;ao,fao;aCeBi9o2u0;h,mph,rra0zzC;h,y;l1o0;r6y9;la,y0;! 0;c1moCsmok0;es;ow;!p hip hoor0;ay;ck,e,llo,y;ha1i,lleluj0;ah;!ha;ah,ee4o1r0;eat scott,r;l1od0sh; grief,bye;ly;! whiz;ell;e0h,t cetera,ureka,ww,xcuse me;k,p;'oh,a0rat,uh;m0ng;mit,n0;!it;mon,o0;ngratulations,wabunga;a2oo1r0tw,ye;avo,r;!ya;h,m; 1h0ka,las,men,rgh,ye;!a,em,h,oy;la",
  "Negative": "true¦n0;ever,o0;n,t",
  "QuestionWord": "true¦how3wh0;at,e1ich,o0y;!m,se;n,re; come,'s",
  "Reflexive": "true¦h4it5my5o1the0your2;ir1m1;ne3ur0;sel0;f,ves;er0im0;self",
  "Plural": "true¦dick0gre0ones,records;ens",
  "Unit|Noun": "true¦cEfDgChBinchAk9lb,m6newt5oz,p4qt,t1y0;ardEd;able1b0ea1sp;!l,sp;spo1;a,t,x;on9;!b,g,i1l,m,p0;h,s;!les;!b,elvin,g,m;!es;g,z;al,b;eet,oot,t;m,up0;!s",
  "Value": "true¦a few",
  "Imperative": "true¦bewa0come he0;re",
  "Plural|Verb": "true¦leaves",
  "Demonym": "true¦0:15;1:12;a0Vb0Oc0Dd0Ce08f07g04h02iYjVkTlPmLnIomHpEqatari,rCs7t5u4v3welAz2;am0Gimbabwe0;enezuel0ietnam0I;gAkrai1;aiwTex0hai,rinida0Ju2;ni0Prkmen;a5cotti4e3ingapoOlovak,oma0Spaniard,udRw2y0W;ede,iss;negal0Cr09;sh;mo0uT;o5us0Jw2;and0;a2eru0Fhilippi0Nortugu07uerto r0S;kist3lesti1na2raguay0;ma1;ani;ami00i2orweP;caragu0geri2;an,en;a3ex0Lo2;ngo0Drocc0;cedo1la2;gasy,y07;a4eb9i2;b2thua1;e0Cy0;o,t01;azakh,eny0o2uwaiI;re0;a2orda1;ma0Ap2;anO;celandic,nd4r2sraeli,ta01vo05;a2iB;ni0qi;i0oneU;aiAin2ondur0unO;di;amEe2hanai0reek,uatemal0;or2rm0;gi0;ilipino,ren8;cuadoVgyp4mira3ngli2sto1thiopi0urope0;shm0;ti;ti0;aPominUut3;a9h6o4roat3ub0ze2;ch;!i0;lom2ngol5;bi0;a6i2;le0n2;ese;lifor1m2na3;bo2eroo1;di0;angladeshi,el6o4r3ul2;gaE;azi9it;li2s1;vi0;aru2gi0;si0;fAl7merBngol0r5si0us2;sie,tr2;a2i0;li0;genti2me1;ne;ba1ge2;ri0;ni0;gh0r2;ic0;an",
  "Organization": "true¦0:4Q;a3Tb3Bc2Od2He2Df27g1Zh1Ti1Pj1Nk1Ll1Gm12n0Po0Mp0Cqu0Br02sTtHuCv9w3xiaomi,y1;amaha,m1Bou1w1B;gov,tu3C;a4e2iki1orld trade organizati33;leaRped0O;lls fargo,st1;fie2Hinghou2R;l1rner br3U;gree3Jl street journ2Im1E;an halOeriz2Xisa,o1;dafo2Yl1;kswagMvo;b4kip,n2ps,s1;a tod3Aps;es3Mi1;lev3Fted natio3C;er,s; mobi32aco beRd bOe9gi frida3Lh3im horto3Amz,o1witt3D;shi49y1;ota,s r 05;e 1in lizzy;b3carpen3Jdaily ma3Dguess w2holli0s1w2;mashing pumpki35uprem0;ho;ea1lack eyed pe3Xyr0Q;ch bo3Dtl0;l2n3Qs1xas instrumen1U;co,la m1F;efoni0Kus;a8cientology,e5ieme2Ymirnoff,np,o3pice gir6quare0Ata1ubaru;rbuc1to34;ks;ny,undgard1;en;a2x pisto1;ls;g1Wrs;few2Minsbur31lesfor03msu2E;adiohead,b8e4o1yana3C;man empi1Xyal 1;b1dutch she4;ank;a3d 1max,vl20;bu1c2Ahot chili peppe2Ylobst2N;ll;ders dige1Ll madrid;c,s;ant3Aizn2Q;a8bs,e5fiz2Ihilip4i3r1;emier 1udenti1D;leagTo2K;nk floyd,zza hut; morrBs;psi2tro1uge0E;br33chi0Tn33;!co;lant2Un1yp16; 2ason27da2P;ld navy,pec,range juli2xf1;am;us;aAb9e6fl,h5i4o1sa,vid3wa;k2tre dame,vart1;is;ia;ke,ntendo,ss0QvZ;l,s;c,st1Otflix,w1; 1sweek;kids on the block,york0D;a,c;nd22s2t1;ional aca2Po,we0U;a,c02d0S;aDcdonalCe9i6lb,o3tv,y1;spa1;ce;b1Tnsanto,ody blu0t1;ley cr1or0T;ue;c2t1;as,subisO;helin,rosoft;dica2rcedes benz,talli1;ca;id,re;ds;cs milk,tt19z24;a3e1g,ittle caesa1P; ore09novo,x1;is,mark,us; 1bour party;pres0Dz boy;atv,fc,kk,lm,m1od1O;art;iffy lu0Roy divisi0Jpmorgan1sa;! cha09;bm,hop,k3n1tv;g,te1;l,rpol;ea;a5ewlett pack1Vi3o1sbc,yundai;me dep1n1P;ot;tac1zbollah;hi;lliburt08sbro;eneral 6hq,ithub,l5mb,o2reen d0Ou1;cci,ns n ros0;ldman sachs,o1;dye1g0H;ar;axo smith kli04encoW;electr0Nm1;oto0Z;a5bi,c barcelo4da,edex,i2leetwood m03o1rito l0G;rd,xcY;at,fa,nancial1restoZ; tim0;na;cebook,nnie mae;b0Asa,u3xxon1; m1m1;ob0J;!rosceptics;aiml0De5isney,o4u1;nkin donu2po0Zran dur1;an;ts;j,w jon0;a,f lepp12ll,peche mode,r spieg02stiny's chi1;ld;aJbc,hFiDloudflaCnn,o3r1;aigsli5eedence clearwater reviv1ossra09;al;c7inba6l4m1o0Est09;ca2p1;aq;st;dplSg1;ate;se;a c1o chanQ;ola;re;a,sco1tigroup;! systems;ev2i1;ck fil a,na daily;r1y;on;d2pital o1rls jr;ne;bury,ill1;ac;aEbc,eBf9l5mw,ni,o1p,rexiteeU;ei3mbardiIston 1;glo1pizza;be;ng;o2ue c1;roV;ckbuster video,omingda1;le; g1g1;oodriL;cht2e ge0rkshire hathaw1;ay;el;cardi,idu,nana republ3s1xt5y5;f,kin robbi1;ns;ic;bYcTdidSerosmith,iRlKmEnheuser busDol,ppleAr6s4u3v2y1;er;is,on;di,todesk;hland o1sociated E;il;b3g2m1;co;os;ys; compu1be0;te1;rs;ch;c,d,erican3t1;!r1;ak; ex1;pre1;ss; 5catel2ta1;ir;! lu1;ce1;nt;jazeera,qae1;da;g,rbnb;as;/dc,a3er,tivision1;! blizz1;ard;demy of scienc0;es;ba",
  "Possessive": "true¦its,my,our0thy;!s",
  "Noun|Verb": "true¦0:9W;1:AA;2:96;3:A3;4:9R;5:A2;6:9K;7:8N;8:7L;9:A8;A:93;B:8D;C:8X;a9Ob8Qc7Id6Re6Gf5Sg5Hh55i4Xj4Uk4Rl4Em40n3Vo3Sp2Squ2Rr21s0Jt02u00vVwGyFzD;ip,oD;ne,om;awn,e6Fie68;aOeMhJiHoErD;ap,e9Oink2;nd0rDuC;kDry,sh5Hth;!shop;ck,nDpe,re,sh;!d,g;e86iD;p,sD;k,p0t2;aDed,lco8W;r,th0;it,lk,rEsDt4ve,x;h,te;!ehou1ra9;aGen5FiFoD;iDmAte,w;ce,d;be,ew,sA;cuum,l4B;pDr7;da5gra6Elo6A;aReQhrPiOoMrGuEwiDy5Z;n,st;nDrn;e,n7O;aGeFiEoDu6;t,ub2;bu5ck4Jgg0m,p;at,k,nd;ck,de,in,nsDp,v7J;f0i8R;ll,ne,p,r4Yss,t94uD;ch,r;ck,de,e,le,me,p,re;e5Wow,u6;ar,e,ll,mp0st,xt;g,lDng2rg7Ps5x;k,ly;a0Sc0Ne0Kh0Fi0Dk0Cl0Am08n06o05pXquaBtKuFwD;ea88iD;ng,pe,t4;bGit,m,ppErD;fa3ge,pri1v2U;lDo6S;e6Py;!je8;aMeLiKoHrEuDy2;dy,ff,mb2;a85eEiDo5Pugg2;ke,ng;am,ss,t4;ckEop,p,rD;e,m;ing,pi2;ck,nk,t4;er,m,p;ck,ff,ge,in,ke,lEmp,nd,p2rDte,y;!e,t;k,l;aJeIiHlGoFrDur,y;ay,e56inDu3;g,k2;ns8Bt;a5Qit;ll,n,r87te;ed,ll;m,n,rk;b,uC;aDee1Tow;ke,p;a5Je4FiDo53;le,rk;eep,iDou4;ce,p,t;ateboa7Ii;de,gnDl2Vnk,p,ze;!al;aGeFiEoDuff2;ck,p,re,w;ft,p,v0;d,i3Ylt0;ck,de,pe,re,ve;aEed,nDrv1It;se,t2N;l,r4t;aGhedu2oBrD;aEeDibb2o3Z;en,w;pe,t4;le,n,r2M;cDfegua72il,mp2;k,rifi3;aZeHhy6LiGoEuD;b,in,le,n,s5X;a6ck,ll,oDpe,u5;f,t;de,ng,ot,p,s1W;aTcSdo,el,fQgPje8lOmMnLo17pJque6sFturn,vDwa6V;eDi27;al,r1;er74oFpe8tEuD;lt,me;!a55;l71rt;air,eaDly,o53;l,t;dezvo2Zt;aDedy;ke,rk;ea1i4G;a6Iist0r5N;act6Yer1Vo71uD;nd,se;a38o6F;ch,s6G;c1Dge,iEke,lly,nDp1Wt1W;ge,k,t;n,se;es6Biv0;a04e00hYiXlToNrEsy4uD;mp,n4rcha1sh;aKeIiHoDu4O;be,ceFdu3fi2grDje8mi1p,te6;amDe6W;!me;ed,ss;ce,de,nt;sDy;er6Cs;cti3i1;iHlFoEp,re,sDuCw0;e,i5Yt;l,p;iDl;ce,sh;nt,s5V;aEce,e32uD;g,mp,n7;ce,nDy;!t;ck,le,n17pe,tNvot;a1oD;ne,tograph;ak,eFnErDt;fu55mA;!c32;!l,r;ckJiInHrFsEtDu1y;ch,e9;s,te;k,tD;!y;!ic;nt,r,se;!a7;bje8ff0il,oErDutli3Qver4B;bAd0ie9;ze;a4ReFoDur1;d,tD;e,i3;ed,gle8tD;!work;aMeKiIoEuD;rd0;ck,d3Rld,nEp,uDve;nt,th;it5EkD;ey;lk,n4Brr5CsDx;s,ta2B;asuBn4UrDss;ge,it;il,nFp,rk3WsEtD;ch,t0;h,k,t0;da5n0oeuvB;aLeJiHoEuD;mp,st;aEbby,ck,g,oDve;k,t;d,n;cDe,ft,mAnIst;en1k;aDc0Pe4vK;ch,d,k,p,se;bFcEnd,p,t4uD;gh,n4;e,k;el,o2U;eEiDno4E;ck,d,ll,ss;el,y;aEo1OuD;i3mp;m,zz;mpJnEr46ssD;ue;c1Rdex,fluGha2k,se2HteDvoi3;nt,rD;e6fa3viD;ew;en3;a8le2A;aJeHiGoEuD;g,nt;l3Ano2Dok,pDr1u1;!e;ghli1Fke,nt,re,t;aDd7lp;d,t;ck,mGndFrEsh,tDu9;ch,e;bo3Xm,ne4Eve6;!le;!m0;aMear,ift,lKossJrFuD;arDe4Alp,n;antee,d;aFiEoDumb2;uCwth;ll,nd,p;de,sp;ip;aBoDue;ss,w;g,in,me,ng,s,te,ze;aZeWiRlNoJrFuD;ck,el,nDss,zz;c38d;aEoDy;st,wn;cDgme,me,nchi1;tuB;cFg,il,ld,rD;ce,e29mDwa31;!at;us;aFe0Vip,oDy;at,ck,od,wD;!er;g,ke,me,re,sh,vo1E;eGgFlEnDre,sh,t,x;an3i0Q;e,m,t0;ht,uB;ld;aEeDn3;d,l;r,tuB;ce,il,ll,rm,vo2W;cho,d7ffe8nMsKxFyeD;!baD;ll;cGerci1hFpDtra8;eriDo0W;en3me9;au6ibA;el,han7u1;caDtima5;pe;count0d,vy;a01eSiMoJrEuDye;b,el,mp,pli2X;aGeFiEoD;ne,p;ft,ll,nk,p,ve;am,ss;ft,g,in;cEd7ubt,wnloD;ad;k,u0E;ge6p,sFt4vD;e,iDor3;de;char7gui1h,liEpD;at4lay,u5;ke;al,bKcJfeIlGmaCposAsEtaD;il;e07iD;gn,re;ay,ega5iD;ght;at,ct;li04rea1;a5ut;b,ma7n3rDte;e,t;a0Eent0Dh06irc2l03oKrFuD;be,e,rDt;b,e,l,ve;aGeFoEuDy;sh;p,ss,wd;dAep;ck,ft,sh;at,de,in,lTmMnFordina5py,re,st,uDv0;gh,nDp2rt;s01t;ceHdu8fli8glomeIsFtDveN;a8rD;a6ol;e9tru8;ct;ntDrn;ra5;bHfoGmFpD;leDouCromi1;me9;aCe9it,u5;rt;at,iD;ne;lap1oD;r,ur;aEiDoud,ub;ck,p;im,w;aEeDip;at,ck,er;iGllen7nErD;ge,m,t;ge,nD;el;n,r;er,re;ke,ll,mp,noe,pGrXsFtEuDve;se,ti0I;alog,ch;h,t;!tuB;re;a03eZiXlToPrHuEyD;pa11;bb2ck2dgEff0mp,rDst,zz;den,n;et;anJeHiFoadEuD;i1sh;ca6;be,d7;ge;aDed;ch,k;ch,d;aFg,mb,nEoDrd0tt2x,ycott;k,st,t;d,e;rd,st;aFeCiDoYur;nk,tz;nd;me;as,d,ke,nd,opsy,tD;!ch,e;aFef,lt,nDt;d,efA;it;r,t;ck,il,lan3nIrFsEtt2;le;e,h;!gDk;aDe;in;!d,g,k;bu1c05dZge,iYlVnTppQrLsIttGucEwaD;rd;tiD;on;aDempt;ck;k,sD;i6ocia5;st;chFmD;!oD;ur;!iD;ve;eEroa4;ch;al;chDg0sw0;or;aEt0;er;rm;d,m,r;dreHvD;an3oD;ca5;te;ce;ss;cDe,he,t;eFoD;rd,u9;nt;nt,ss;se",
  "Actor": "true¦0:7B;1:7G;2:6A;3:7F;4:7O;5:7K;a6Nb62c4Ud4Be41f3Sg3Bh30i2Uj2Qkin2Pl2Km26n1Zo1Sp0Vqu0Tr0JsQtJuHvEw8yo6;gi,ut6;h,ub0;aAe9i8o7r6;estl0it0;m2rk0;fe,nn0t2Bza2H;atherm2ld0;ge earn0it0nder0rri1;eter7i6oyF;ll5Qp,s3Z;an,ina2U;n6s0;c6Uder03;aoisea23e9herapi5iktok0o8r6ut1yco6S;a6endseLo43;d0mp,nscri0Bvel0;ddl0u1G;a0Qchn7en6na4st0;ag0;i3Oo0D;aiXcUeRhPiMki0mu26oJpGquaFtBu7wee6;p0theart;lt2per7r6;f0ge6Iviv1;h6inten0Ist5Ivis1;ero,um2;a8ep7r6;ang0eam0;bro2Nc2Ofa2Nmo2Nsi20;ff0tesm2;tt0;ec7ir2Do6;kesp59u0M;ia5Jt3;l7me6An,rcere6ul;r,ss;di0oi5;n7s6;sy,t0;g0n0;am2ephe1Iow6;girl,m2r2Q;cretInior cit3Fr6;gea4v6;a4it1;hol4Xi7reen6ulpt1;wr2C;e01on;l1nt;aEe9o8u6;l0nn6;er up,ingE;g40le mod3Zof0;a4Zc8fug2Ppo32searQv6;ere4Uolution6;ary;e6luYru22;ptio3T;bbi,dic5Vpp0;arter6e2Z;back;aYeWhSiRlOoKr8sycho7u6;nk,p31;logi5;aGeDiBo6;d9fess1g7ph47s6;pe2Ktitu51;en6ramm0;it1y;igy,uc0;est4Nme mini0Unce6s3E;!ss;a7si6;de4;ch0;ctiti39nk0P;dca0Oet,li6pula50rnst42;c2Itic6;al scie6i2;nti5;a6umb0;nn0y6;er,ma4Lwright;lgrim,one0;a8iloso7otogra7ra6ysi1V;se;ph0;ntom,rmaci5;r6ssi1T;form0s4O;i3El,nel3Yr8st1tr6wn;i6on;arWot;ent4Wi42tn0;ccupa4ffBp8r7ut6;ca5l0B;ac4Iganiz0ig2Fph2;er3t6;i1Jomet6;ri5;ic0spring;aBe9ie4Xo7u6;n,rser3J;b6mad,vi4V;le2Vo4D;i6mesis,phew;ce,ghb1;nny,rr3t1X;aEeDiAo7u6yst1Y;m8si16;der3gul,m7n6th0;arDk;!my;ni7s6;f02s0Jt0;on,st0;chan1Qnt1rcha4;gi9k0n8rtyr,t6y1;e,riar6;ch;ag0iac;ci2stra3I;a7e2Aieutena4o6;rd,s0v0;bor0d7ndlo6ss,urea3Fwy0ym2;rd;!y;!s28;e8o7u6;ggl0;gg0urna2U;st0;c3Hdol,llu3Ummigra4n6; l9c1Qfa4habi42nov3s7ve6;nt1stig3;pe0Nt6;a1Fig3ru0M;aw;airFeBistoAo8u6ygie1K;man6sba2H;!ita8;bo,st6usekN;age,e3P;ri2;ir,r6;m7o6;!ine;it;dress0sty2C;aLeIhostGirl26ladi3oCrand7u6;e5ru;c9daug0Jfa8m7pa6s2Y;!re4;a,o6;th0;hi1B;al7d6lf0;!de3A;ie,k6te26;eep0;!wr6;it0;isha,n6;i6tl04;us;mbl0rden0;aDella,iAo7r6;eela2Nie1P;e,re6ster pare4;be1Hm2r6st0;unn0;an2ZgZlmm17nanci0r6tt0;e6st la2H; marsh2OfigXm2;rm0th0;conoEdDlectriCm8n7x6;amin0cellency,i2A;emy,trepreneur,vironmenta1J;c8p6;er1loye6;e,r;ee;ci2;it1;mi5;aKeBi8ork,ri7u6we02;de,tche2H;ft0v0;ct3eti7plom2Hre6va;ct1;ci2ti2;aDcor3fencCi0InAput9s7tectLvel6;op0;ce1Ge6ign0;rt0;ee,y;iz6;en;em2;c1Ml0;d8nc0redev7ug6;ht0;il;!dy;a06e04fo,hXitizenWlToBr9u6;r3stomer6;! representat6;ive;e3it6;ic;lJmGnAord9rpor1Nu7w6;boy,ork0;n6ri0;ciTte1Q;in3;fidantAgressSs9t6;e0Kr6;ibut1o6;ll0;tab13ul1O;!e;edi2m6pos0rade;a0EeQissi6;on0;leag8on7um6;ni5;el;ue;e6own;an0r6;ic,k;!s;a9e7i6um;ld;erle6f;ad0;ir7nce6plFract0;ll1;m2wI;lebri6o;ty;dBptAr6shi0;e7pe6;nt0;r,t6;ak0;ain;et;aMeLiJlogg0oErBu6;dd0Fild0rgl9siness6;m2p7w6;om2;ers05;ar;i7o6;!k0th0;cklay0de,gadi0;hemi2oge8y6;!frie6;nd;ym2;an;cyc6sR;li5;atbox0ings;by,nk0r6;b0on7te6;nd0;!e07;c04dWge4nQpLrHsFtAu7yatull6;ah;nt7t6;h1oG;!ie;h8t6;e6orney;nda4;ie5le6;te;sis00tron6;aut,om0;chbis8isto7tis6;an,t;crU;hop;ost9p6;ari6rentiS;ti6;on;le;a9cest1im3nou8y6;bo6;dy;nc0;ly5rc6;hi5;mi8v6;entur0is1;er;ni7r6;al;str3;at1;or;counBquaintanArob9t6;ivi5or,re6;ss;st;at;ce;ta4;nt",
  "Adj|Noun": "true¦0:16;a1Db17c0Ud0Re0Mf0Dg0Ah08i06ju05l02mWnUoSpNrIsBt7u4v1watershed;a1ision0Z;gabo4nilla,ria1;b0Vnt;ndergr1pstairs;adua14ou1;nd;a3e1oken,ri0;en,r1;min0rori13;boo,n;age,e5ilv0Flack,o3quat,ta2u1well;bordina0Xper5;b0Lndard;ciali0Yl1vereign;e,ve16;cret,n1ri0;ior;a4e2ou1ubbiL;nd,tiY;ar,bBl0Wnt0p1side11;resent0Vublican;ci0Qsh;a4eriodic0last0Zotenti0r1;emi2incip0o1;!fession0;er,um;rall4st,tie0U;ff1pposi0Hv0;ens0Oi0C;agg01ov1uts;el;a5e3iniatJo1;bi01der07r1;al,t0;di1tr0N;an,um;le,riG;attOi2u1;sh;ber0ght,qC;stice,veniT;de0mpressioYn1;cumbe0Edividu0no0Dsta0Eterim;alf,o1umdrum;bby,melF;en2old,ra1;ph0Bve;er0ious;a7e5i4l3u1;git03t1;ure;uid;ne;llow,m1;aFiL;ir,t,vo1;riOuriO;l3p00x1;c1ecutUpeV;ess;d1iK;er;ar2e1;mographUrivO;k,l2;hiGlassSo2rude,unn1;ing;m5n1operK;creCstitueOte2vertab1;le;mpor1nt;ary;ic,m2p1;anion,lex;er2u1;ni8;ci0;al;e5lank,o4r1;i2u1;te;ef;ttom,urgeois;st;cadem9d6l2ntarct9r1;ab,ct8;e3tern1;at1;ive;rt;oles1ult;ce1;nt;ic",
  "Adj|Past": "true¦0:4Q;1:4C;2:4H;3:4E;a44b3Tc36d2Je29f20g1Wh1Si1Jj1Gkno1Fl1Am15n12o0Xp0Mqu0Kr08sLtEuAv9w4yellow0;a7ea6o4rinkl0;r4u3Y;n,ri0;k31th3;rp0sh0tZ;ari0e1O;n5p4s0;d1li1Rset;cov3derstood,i4;fi0t0;a8e3Rhr7i6ouTr4urn0wi4C;a4imm0ou2G;ck0in0pp0;ed,r0;eat2Qi37;m0nn0r4;get0ni2T;aOcKeIhGimFm0Hoak0pDt7u4;bsid3Ogge44s4;pe4ta2Y;ct0nd0;a8e7i2Eok0r5u4;ff0mp0nn0;ength2Hip4;ed,p0;am0reotyp0;in0t0;eci4ik0oH;al3Efi0;pRul1;a4ock0ut;d0r0;a4c1Jle2t31;l0s3Ut0;a6or5r4;at4e25;ch0;r0tt3;t4ut0;is2Mur1;aEe5o4;tt0;cAdJf2Bg9je2l8m0Knew0p7qu6s4;eTpe2t4;or0ri2;e3Dir0;e1lac0;at0e2Q;i0Rul1;eiv0o4ycl0;mme2Lrd0v3;in0lli0ti2A;a4ot0;li28;aCer30iBlAo9r5u4;mp0zzl0;e6i2Oo4;ce2Fd4lo1Anou30pos0te2v0;uc0;fe1CocCp0Iss0;i2Kli1L;ann0e2CuS;ck0erc0ss0;ck0i2Hr4st0;allLk0;bse7c6pp13rgan2Dver4;lo4whelm0;ok0;cupi0;rv0;aJe5o4;t0uri1A;ed0gle2;a6e5ix0o4ut0ys1N;di1Nt15u26;as0Clt0;n4rk0;ag0ufact0A;e6i5o4;ad0ck0st,v0;cens0m04st0;ft,v4;el0;tt0wn;a5o15u4;dg0s1B;gg0;llumSmpAn4sol1;br0cre1Ldebt0f8jZspir0t5v4;it0olv0;e4ox0Y;gr1n4re23;d0si15;e2l1o1Wuri1;li0o01r4;ov0;a6e1o4um03;ok0r4;ri0Z;mm3rm0;i6r5u4;a1Bid0;a0Ui0Rown;ft0;aAe9i8l6oc0Ir4;a4i0oz0Y;ctHg19m0;avo0Ju4;st3;ni08tt0x0;ar0;d0il0sc4;in1;dCl1mBn9quipp0s8x4;agger1c6p4te0T;a0Se4os0;ct0rie1D;it0;cap0tabliZ;cha0XgFha1As4;ur0;a0Zbarra0N;i0Buc1;aMeDi5r4;a01i0;gni08miniSre2s4;a9c6grun0Ft4;o4re0Hu17;rt0;iplWou4;nt0r4;ag0;bl0;cBdRf9l8p7ra6t5v4;elop0ot0;ail0ermQ;ng0;re07;ay0ight0;e4in0o0M;rr0;ay0enTor1;m5t0z4;ed,zl0;ag0p4;en0;aPeLhIlHo9r6u4;lt4r0stom03;iv1;a5owd0u4;sh0;ck0mp0;d0loAm7n4ok0v3;centr1f5s4troC;id3olid1;us0;b5pl4;ic1;in0;r0ur0;assi9os0utt3;ar5i4;ll0;g0m0;lebr1n6r4;ti4;fi0;tralJ;g0lcul1;aDewild3iCl9o7r5urn4;ed,t;ok4uis0;en;il0r0t4und;tl0;e5i4;nd0;ss0;as0;ffl0k0laMs0tt3;bPcNdKfIg0lFmaz0nDppBrm0ss9u5wa4;rd0;g5thor4;iz0;me4;nt0;o6u4;m0r0;li0re4;ci1;im1ticip1;at0;a5leg0t3;er0;rm0;fe2;ct0;ju5o7va4;nc0;st0;ce4knowledg0;pt0;and5so4;rb0;on0;ed",
  "Singular": "true¦0:5J;1:5H;2:4W;3:4S;4:52;5:57;6:5L;7:56;8:5B;a52b4Lc3Nd35e2Xf2Og2Jh28in24j23k22l1Um1Ln1Ho1Bp0Rqu0Qr0FsZtMuHvCw9x r58yo yo;a9ha3Po3Q;f3i4Rt0Gy9;! arou39;arCeAideo ga2Qo9;cabu4Jl5C;gOr9t;di4Zt1Y;iety,ni4P;nBp30rAs 9;do43s5E;bani1in0;coordinat3Ader9;estima1to24we41; rex,aKeJhHiFoErBuAv9;! show;m2On2rntLto1D;agedy,ib9o4E;e,u9;n0ta46;ni1p2rq3L;c,er,m9;etF;ing9ree26;!y;am,mp3F;ct2le6x return;aNcMeKhor4QiJkHoGpin off,tDuBy9;ll9ner7st4T;ab2X;b9i1n28per bowl,rro1X;st3Ltot0;atAipe2Go1Lrate7udent9;! lo0I;i39u1;ft ser4Lmeo1I;elet5i9;ll,r3V;b38gn2Tte;ab2Jc9min3B;t,urity gua2N;e6ho2Y;bbatic0la3Jndwi0Qpi5;av5eDhetor2iAo9;de6om,w;tAv9;erb2C;e,u0;bDcBf9publ2r10spi1;er9orm3;e6r0;i9ord label;p2Ht0;a1u46;estion mark,ot2F;aPeMhoLiIlGoErAu9yram1F;ddi3HpErpo1Js3J;eBo9;bl3Zs9;pe3Jta1;dic1Rmi1Fp1Qroga8ss relea1F;p9rt0;py;a9ebisci1;q2Dte;cn2eAg9;!gy;!r;ne call,tocoK;anut,dAr9t0yo1;cen3Jsp3K;al,est0;nop4rAt9;e,hog5;adi11i2V;atme0bj3FcBpia1rde0thers,utspok5ve9wn3;n,r9;ti0Pview;cuAe9;an;pi3;arBitAot9umb3;a2Fhi2R;e,ra1;cot2ra8;aFeCiAo9ur0;nopo4p18rni2Nsq1Rti36uld;c,li11n0As9tt5;chief,si34;dAnu,t9;al,i3;al,ic;gna1mm0nd15rsupi0te9yf4;ri0;aDegCiBu9;ddi1n9;ch;me,p09; Be0M;bor14y9; 9er;up;eyno1itt5;el4ourn0;cBdices,itia8ni25sAtel0Lvert9;eb1J;e28titu1;en8i2T;aIeEighDoAu9;man right,s22;me9rmoFsp1Ftb0K;! r9;un; scho0YriY;a9i1N;d9v5; start,pho9;ne;ndful,sh brown,v5ze;aBelat0Ilaci3r9ul4yp1S;an9enadi3id;a1Cd slam,ny;df4r9;l2ni1I;aGeti1HiFlu1oCrAun9;er0;ee market,i9onti3;ga1;l4ur9;so9;me;ePref4;br2mi4;conoFffi7gg,lecto0Rmbas1EnCpidem2s1Zth2venBxAyel9;id;ampZempl0Nte6;i19t;er7terp9;ri9;se;my;eLiEoBr9ump tru0U;agonf4i9;er,ve thru;cAg7i4or,ssi3wn9;side;to0EumenE;aEgniDnn3sAvide9;nd;conte6incen8p9tri11;osi9;ti0C;ta0H;le0X;athBcAf9ni0terre6;ault 05err0;al,im0;!b9;ed;aWeThMiLlJoDr9;edit caBuc9;ib9;le;rd;efficDke,lCmmuniqLnsApi3rr0t0Xus9yo1;in;erv9uI;ato02;ic,lQ;ie6;er7i9oth;e6n2;ty,vil wM;aDeqCick5ocoBr9;istmas car9ysanthemum;ol;la1;ue;ndeli3racteri9;st2;iAllEr9;e0tifica1;liZ;hi3nFpErCt9ucus;erpi9hedr0;ll9;ar;!bohyd9ri3;ra1;it0;aAe,nib0t9;on;l,ry;aMeLiop2leJoHrDu9;nny,r9tterf4;g9i0;la9;ry;eakAi9;ck;fa9throB;st;dy,ro9wl;ugh;mi9;sh;an,l4;nkiArri3;er;ng;cSdMlInFppeti1rDsBtt2utop9;sy;ic;ce6pe9;ct;r9sen0;ay;ecAoma4tiA;ly;do1;i5l9;er7y;gy;en; hominDjAvan9;tage;ec8;ti9;ve;em;cCeAqui9;tt0;ta1;te;iAru0;al;de6;nt",
  "Person|Noun": "true¦a0Eb07c03dWeUfQgOhLjHkiGlFmCnBolive,p7r4s3trini06v1wa0;ng,rd,tts;an,enus,iol0;a,et;ky,onPumm09;ay,e1o0uby;bin,d,se;ed,x;a2e1o0;l,tt04;aLnJ;dYge,tR;at,orm;a0eloW;t0x,ya;!s;a9eo,iH;ng,tP;a2e1o0;lGy;an,w3;de,smi4y;a0erb,iOolBuntR;ll,z0;el;ail,e0iLuy;ne;a1ern,i0lo;elds,nn;ith,n0;ny;a0dEmir,ula,ve;rl;a4e3i1j,ol0;ly;ck,x0;ie;an,ja;i0wn;sy;am,h0liff,rystal;a0in,ristian;mbers,ri0;ty;a4e3i2o,r0ud;an0ook;dy;ll;nedict,rg;k0nks;er;l0rt;fredo,ma",
  "Actor|Verb": "true¦aCb8c5doctor,engineAfool,g3host,judge,m2nerd,p1recruit,scout,ushAvolunteAwi0;mp,tneA;arent,ilot;an,ime;eek,oof,r0uide;adu8oom;ha1o0;ach,nscript,ok;mpion,uffeur;o2u0;lly,tch0;er;ss;ddi1ffili0rchite1;ate;ct",
  "MaleName": "true¦0:H6;1:FZ;2:DS;3:GQ;4:CZ;5:FV;6:GM;7:FP;8:GW;9:ET;A:C2;B:GD;aF8bE1cCQdBMeASfA1g8Yh88i7Uj6Sk6Bl5Mm48n3So3Ip33qu31r26s1Et0Ru0Ov0CwTxSyHzC;aCor0;cChC1karia,nAT;!hDkC;!aF6;!ar7CeF5;aJevgenBSoEuC;en,rFVsCu3FvEF;if,uf;nDs6OusC;ouf,s6N;aCg;s,tC;an,h0;hli,nCrosE1ss09;is,nC;!iBU;avi2ho5;aPeNiDoCyaEL;jcieBJlfgang,odrFutR;lFnC;f8TsC;lCt1;ow;bGey,frEhe4QlC;aE5iCy;am,e,s;ed8iC;d,ed;eAur;i,ndeD2rn2sC;!l9t1;lDyC;l1ne;lDtC;!er;aCHy;aKernDAiFladDoC;jteB0lodymyr;!iC;mFQsDB;cFha0ktBZnceDrgCOvC;a0ek;!nC;t,zo;!e4StBV;lCnC7sily;!entC;in9J;ghE2lCm70nax,ri,sm0;riCyss87;ch,k;aWeRhNiLoGrEuDyC;!l2roEDs1;n6r6E;avD0eCist0oy,um0;ntCRvBKy;bFdAWmCny;!asDmCoharu;aFFie,y;!z;iA6y;mCt4;!my,othy;adEeoDia0SomC;!as;!dor91;!de4;dFrC;enBKrC;anBJeCy;ll,nBI;!dy;dgh,ha,iCnn2req,tsu5V;cDAka;aYcotWeThPiMlobod0oKpenc2tEurDvenAEyCzym1;ed,lvest2;aj,e9V;anFeDuC;!aA;fan17phEQvCwaA;e77ie;!islaCl9;v,w;lom1rBuC;leymaDHta;dDgmu9UlCm1yabonga;as,v8B;!dhart8Yn9;aEeClo75;lCrm0;d1t1;h9Jne,qu1Jun,wn,yne;aDbastiEDk2Yl5Mpp,rgCth,ymoCU;e1Dio;m4n;!tC;!ie,y;eDPlFmEnCq67tosCMul;dCj2UtiA5;e01ro;!iATkeB6mC4u5;!ik,vato9K;aZeUheC8iRoGuDyC;an,ou;b99dDf4peAssC;!elEG;ol00y;an,bLc7MdJel,geIh0lHmGnEry,sDyC;!ce;ar7Ocoe,s;!aCnBU;ld,n;an,eo;a7Ef;l7Jr;e3Eg2n9olfo,riC;go;bBNeDH;cCl9;ar87c86h54kCo;!ey,ie,y;cFeA3gDid,ubByCza;an8Ln06;g85iC;naC6s;ep;ch8Kfa5hHin2je8HlGmFndEoHpha5sDul,wi36yC;an,mo8O;h9Im4;alDSol3O;iD0on;f,ph;ul;e9CinC;cy,t1;aOeLhilJiFrCyoG;aDeC;m,st1;ka85v2O;eDoC;tr;r8GtC;er,ro;!ipCl6H;!p6U;dCLrcy,tC;ar,e9JrC;!o7;b9Udra8So9UscAHtri62ulCv8I;!ie,o7;ctav6Ji2lImHndrBRrGsDtCum6wB;is,to;aDc6k6m0vCwaBE;al79;ma;i,vR;ar,er;aDeksandr,ivC;er,i2;f,v;aNeLguyBiFoCu3O;aDel,j4l0ma0rC;beAm0;h,m;cFels,g5i9EkDlC;es,s;!au,h96l78olaC;!i,y;hCkCol76;ol75;al,d,il,ls1vC;ilAF;hom,tC;e,hC;anCy;!a5i5;aYeViLoGuDyC;l4Nr1;hamDr84staC;fa,p6E;ed,mG;di10e,hamEis4JntDritz,sCussa;es,he;e,y;ad,ed,mC;ad,ed;cGgu5hai,kFlEnDtchC;!e8O;a9Pik;house,o7t1;ae73eC3ha8Iolaj;ah,hDkC;!ey,y;aDeC;al,l;el,l;hDlv3rC;le,ri8Ev4T;di,met;ay0c00gn4hWjd,ks2NlTmadZnSrKsXtDuric7VxC;imilBKwe8B;eHhEi69tCus,y69;!eo,hCia7;ew,i67;eDiC;as,eu,s;us,w;j,o;cHiGkFlEqu8Qsha83tCv3;iCy;!m,n;in,on;el,o7us;a6Yo7us;!elCin,o7us;!l8o;frAEi5Zny,u5;achDcoCik;lm;ai,y;amDdi,e5VmC;oud;adCm6W;ou;aulCi9P;ay;aWeOiMloyd,oJuDyC;le,nd1;cFdEiDkCth2uk;a7e;gi,s,z;ov7Cv6Hw6H;!as,iC;a6Een;g0nn52renDuCvA4we7D;!iS;!zo;am,n4oC;n5r;a9Yevi,la5KnHoFst2thaEvC;eCi;nte;bo;nCpo8V;!a82el,id;!nC;aAy;mEnd1rDsz73urenCwr6K;ce,t;ry,s;ar,beAont;aOeIhalHiFla4onr63rDu5SylC;e,s;istCzysztof;i0oph2;er0ngsl9p,rC;ilA9k,ollos;ed,id;en0iGnDrmCv4Z;it;!dDnCt1;e2Ny;ri4Z;r,th;cp2j4mEna8BrDsp6them,uC;ri;im,l;al,il;a03eXiVoFuC;an,lCst3;en,iC;an,en,o,us;aQeOhKkub4AnIrGsDzC;ef;eDhCi9Wue;!ua;!f,ph;dCge;i,on;!aCny;h,s,th6J;anDnC;!ath6Hie,n72;!nC;!es;!l,sCy;ph;o,qu3;an,mC;!i,m6V;d,ffFns,rCs4;a7JemDmai7QoCry;me,ni1H;i9Dy;!e73rC;ey,y;cKdBkImHrEsDvi2yC;dBs1;on,p2;ed,oDrCv67;e6Qod;d,s61;al,es5Wis1;a,e,oCub;b,v;ob,qu13;aTbNchiMgLke53lija,nuKonut,rIsEtCv0;ai,suC;ki;aDha0i8XmaCsac;el,il;ac,iaC;h,s;a,vinCw3;!g;k,nngu6X;nac1Xor;ka;ai,rahC;im;aReLoIuCyd6;beAgGmFsC;eyDsC;a3e3;in,n;ber5W;h,o;m2raDsse3wC;a5Pie;c49t1K;a0Qct3XiGnDrC;beAman08;dr7VrC;iCy2N;!k,q1R;n0Tt3S;bKlJmza,nIo,rEsDyC;a5KdB;an,s0;lEo67r2IuCv9;hi5Hki,tC;a,o;an,ey;k,s;!im;ib;a08e00iUlenToQrMuCyorgy;iHnFsC;!taC;f,vC;!e,o;n6tC;er,h2;do,lC;herDlC;auCerQ;me;aEegCov2;!g,orC;!io,y;dy,h7C;dfr9nza3XrDttfC;ri6C;an,d47;!n;acoGlEno,oCuseppe;rgiCvan6O;!o,s;be6Ies,lC;es;mo;oFrC;aDha4HrCt;it,y;ld,rd8;ffErgC;!e7iCy;!os;!r9;bElBrCv3;eCla1Nr4Hth,y;th;e,rC;e3YielC;!i4;aXeSiQlOorrest,rCyod2E;aHedFiC;edDtC;s,z;ri18;!d42eri11riC;ck,k;nCs2;cEkC;ie,lC;in,yn;esLisC;!co,z3M;etch2oC;ri0yd;d5lConn;ip;deriFliEng,rC;dinaCg4nan0B;nd8;pe,x;co;bCdi,hd;iEriC;ce,zC;io;an,en,o;benez2dZfrYit0lTmMnJo3rFsteb0th0ugenEvCymBzra;an,eCge4D;ns,re3K;!e;gi,iDnCrol,v3w3;est8ie,st;cCk;!h,k;o0DriCzo;co,qC;ue;aHerGiDmC;aGe3A;lCrh0;!iC;a10o,s;s1y;nu5;beAd1iEliDm2t1viCwood;n,s;ot28s;!as,j5Hot,sC;ha;a3en;!dGg6mFoDua2QwC;a2Pin;arC;do;oZuZ;ie;a04eTiOmitrNoFrag0uEwDylC;an,l0;ay3Hig4D;a3Gdl9nc0st3;minFnDri0ugCvydGy2S;!lF;!a36nCov0;e1Eie,y;go,iDykC;as;cCk;!k;i,y;armuFetDll1mitri7neCon,rk;sh;er,m6riC;ch;id;andLepak,j0lbeAmetri4nIon,rGsEvDwCxt2;ay30ey;en,in;hawn,moC;nd;ek,riC;ck;is,nC;is,y;rt;re;an,le,mKnIrEvC;e,iC;!d;en,iEne0PrCyl;eCin,yl;l45n;n,o,us;!iCny;el,lo;iCon;an,en,on;a0Fe0Ch03iar0lRoJrFuDyrC;il,us;rtC;!is;aEistC;iaCob12;no;ig;dy,lInErC;ey,neliCy;s,us;nEor,rDstaC;nt3;ad;or;by,e,in,l3t1;aHeEiCyde;fCnt,ve;fo0Xt1;menDt4;us;s,t;rFuDyC;!t1;dCs;e,io;enC;ce;aHeGrisC;!toC;phCs;!eC;!r;st2t;d,rCs;b5leC;s,y;cDdrCs6;ic;il;lHmFrC;ey,lDroCy;ll;!o7t1;er1iC;lo;!eb,v3;a09eZiVjorn,laUoSrEuCyr1;ddy,rtKst2;er;aKeFiEuDyC;an,ce,on;ce,no;an,ce;nDtC;!t;dDtC;!on;an,on;dFnC;dDisC;lav;en,on;!foOl9y;bby,gd0rCyd;is;i0Lke;bElDshC;al;al,lL;ek;nIrCshoi;at,nEtC;!raC;m,nd;aDhaCie;rd;rd8;!iDjam3nCs1;ie,y;to;kaMlazs,nHrC;n9rDtC;!holomew;eCy;tt;ey;dCeD;ar,iC;le;ar1Nb1Dd16fon15gust3hm12i0Zja0Yl0Bm07nTputsiSrGsaFugustEveDyCziz;a0kh0;ry;o,us;hi;aMchiKiJjun,mHnEon,tCy0;em,hCie,ur8;ur;aDoC;!ld;ud,v;aCin;an,nd8;!el,ki;baCe;ld;ta;aq;aMdHgel8tCw6;hoFoC;iDnC;!i8y;ne;ny;er7rCy;eDzC;ej;!as,i,j,s,w;!s;s,tolC;iCy;!y;ar,iEmaCos;nu5r;el;ne,r,t;aVbSdBeJfHiGl01onFphonsEt1vC;aPin;on;e,o;so,zo;!sR;!onZrC;ed;c,jaHksFssaHxC;!andC;er,rC;e,os,u;andCei;ar,er,r;ndC;ro;en;eDrecC;ht;rt8;dd3in,n,sC;taC;ir;ni;dDm6;ar;an,en;ad,eC;d,t;in;so;aGi,olErDvC;ik;ian8;f8ph;!o;mCn;!a;dGeFraDuC;!bakr,lfazl;hCm;am;!l;allFel,oulaye,ulC;!lDrahm0;an;ah,o;ah;av,on",
  "Uncountable": "true¦0:2E;1:2L;2:33;a2Ub2Lc29d22e1Rf1Ng1Eh16i11j0Yk0Wl0Rm0Hn0Do0Cp03rZsLt9uran2Jv7w3you gu0E;a5his17i4oo3;d,l;ldlife,ne;rm8t1;apor,ernacul29i3;neg28ol1Otae;eDhBiAo8r4un3yranny;a,gst1B;aff2Oea1Ko4ue nor3;th;o08u3;bleshoot2Ose1Tt;night,othpas1Vwn3;foEsfoE;me off,n;er3und1;e,mod2S;a,nnis;aDcCeBhAi9ki8o7p6t4u3weepstak0;g1Unshi2Hshi;ati08e3;am,el;ace2Keci0;ap,cc1meth2C;n,ttl0;lk;eep,ingl0or1C;lf,na1Gri0;ene1Kisso1C;d0Wfe2l4nd,t3;i0Iurn;m1Ut;abi0e4ic3;e,ke15;c3i01laxa11search;ogni10rea10;a9e8hys7luto,o5re3ut2;amble,mis0s3ten20;en1Zs0L;l3rk;i28l0EyH; 16i28;a24tr0F;nt3ti0M;i0s;bstetri24vercrowd1Qxyg09;a5e4owada3utella;ys;ptu1Ows;il poliZtional securi2;aAe8o5u3;m3s1H;ps;n3o1K;ey,o3;gamy;a3cha0Elancholy,rchandi1Htallurgy;sl0t;chine3g1Aj1Hrs,thema1Q; learn1Cry;aught1e6i5ogi4u3;ck,g12;c,s1M;ce,ghtn18nguis1LteratWv1;ath1isVss;ara0EindergartPn3;icke0Aowled0Y;e3upit1;a3llyfiGwel0G;ns;ce,gnor6mp5n3;forma00ter3;net,sta07;atiSort3rov;an18;a7e6isto09o3ung1;ckey,mework,ne4o3rseradi8spitali2use arrest;ky;s2y;adquarteXre;ir,libut,ppiHs3;hi3te;sh;ene8l6o5r3um,ymnas11;a3eZ;niUss;lf,re;ut3yce0F;en; 3ti0W;edit0Hpo3;ol;aNicFlour,o4urnit3;ure;od,rgive3uri1wl;ness;arCcono0LducaBlectr9n7quip8thi0Pvery6x3;ist4per3;ti0B;en0J;body,o08th07;joy3tertain3;ment;ici2o3;ni0H;tiS;nings,th;emi02i6o4raugh3ynas2;ts;pe,wnstai3;rs;abet0ce,s3;honZrepu3;te;aDelciChAivi07l8o3urrency;al,ld w6mmenta5n3ral,ttIuscoB;fusiHt 3;ed;ry;ar;assi01oth0;es;aos,e3;eMwK;us;d,rO;a8i6lood,owlHread5u3;ntGtt1;er;!th;lliarJs3;on;g3ss;ga3;ge;cKdviJeroGirFmBn6ppeal court,r4spi3thleL;rin;ithmet3sen3;ic;i6y3;o4th3;ing;ne;se;en5n3;es2;ty;ds;craft;bi8d3nau7;yna3;mi6;ce;id,ous3;ti3;cs",
  "Infinitive": "true¦0:9G;1:9T;2:AD;3:90;4:9Z;5:84;6:AH;7:A9;8:92;9:A0;A:AG;B:AI;C:9V;D:8R;E:8O;F:97;G:6H;H:7D;a94b8Hc7Jd68e4Zf4Mg4Gh4Ai3Qj3Nk3Kl3Bm34nou48o2Vp2Equ2Dr1Es0CtZuTvRwI;aOeNiLors5rI;eJiI;ng,te;ak,st3;d5e8TthI;draw,er;a2d,ep;i2ke,nIrn;d1t;aIie;liADniAry;nJpI;ho8Llift;cov1dJear8Hfound8DlIplug,rav82tie,ve94;eaAo3X;erIo;cut,go,staAFvalA3w2G;aSeQhNoMrIu73;aIe72;ffi3Smp3nsI;aBfo7CpI;i8oD;pp3ugh5;aJiJrIwaD;eat5i2;nk;aImA0;ch,se;ck3ilor,keImp1r8L;! paD;a0Ic0He0Fh0Bi0Al08mugg3n07o05p02qu01tUuLwI;aJeeIim;p,t5;ll7Wy;bNccMffLggeCmmKppJrI;mouFpa6Zvi2;o0re6Y;ari0on;er,i4;e7Numb;li9KmJsiIveD;de,st;er9it;aMe8MiKrI;ang3eIi2;ng27w;fIng;f5le;b,gg1rI;t3ve;a4AiA;a4UeJit,l7DoI;il,of;ak,nd;lIot7Kw;icEve;atGeak,i0O;aIi6;m,y;ft,ng,t;aKi6CoJriIun;nk,v6Q;ot,rt5;ke,rp5tt1;eIll,nd,que8Gv1w;!k,m;aven9ul8W;dd5tis1Iy;a0FeKiJoI;am,t,ut;d,p5;a0Ab08c06d05f01group,hea00iZjoi4lXmWnVpTq3MsOtMup,vI;amp,eJiIo3B;sEve;l,rI;e,t;i8rI;ie2ofE;eLiKpo8PtIurfa4;o24rI;aHiBuctu8;de,gn,st;mb3nt;el,hra0lIreseF;a4e71;d1ew,o07;aHe3Fo2;a7eFiIo6Jy;e2nq41ve;mbur0nf38;r0t;inKleBocus,rJuI;el,rbiA;aBeA;an4e;aBu4;ei2k8Bla43oIyc3;gni39nci3up,v1;oot,uI;ff;ct,d,liIp;se,ze;tt3viA;aAenGit,o7;aWerUinpoiFlumm1LoTrLuI;b47ke,niArIt;poDsuI;aFe;eMoI;cKd,fe4XhibEmo7noJpo0sp1tru6vI;e,i6o5L;un4;la3Nu8;aGclu6dJf1occupy,sup0JvI;a6BeF;etermi4TiB;aGllu7rtr5Ksse4Q;cei2fo4NiAmea7plex,sIva6;eve8iCua6;mp1rItrol,ve;a6It6E;bOccuNmEpMutLverIwe;l07sJtu6Yu0wI;helm;ee,h1F;gr5Cnu2Cpa4;era7i4Ipo0;py,r;ey,seItaH;r2ss;aMe0ViJoIultiply;leCu6Pw;micJnIspla4;ce,g3us;!k;iIke,na9;m,ntaH;aPeLiIo0u3N;ke,ng1quIv5;eIi6S;fy;aKnIss5;d,gI;th5;rn,ve;ng2Gu1N;eep,idnJnI;e4Cow;ap;oHuI;gg3xtaI;po0;gno8mVnIrk;cTdRfQgeChPitia7ju8q1CsNtKun6EvI;a6eIo11;nt,rt,st;erJimi6BoxiPrI;odu4u6;aBn,pr03ru6C;iCpi8tIu8;all,il,ruB;abEibE;eCo3Eu0;iIul9;ca7;i7lu6;b5Xmer0pI;aLer4Uin9ly,oJrI;e3Ais6Bo2;rt,se,veI;riA;le,rt;aLeKiIoiCuD;de,jaInd1;ck;ar,iT;mp1ng,pp5raIve;ng5Mss;ath1et,iMle27oLrI;aJeIow;et;b,pp3ze;!ve5A;gg3ve;aTer45i5RlSorMrJuI;lf4Cndrai0r48;eJiIolic;ght5;e0Qsh5;b3XeLfeEgJsI;a3Dee;eIi2;!t;clo0go,shIwa4Z;ad3F;att1ee,i36;lt1st5;a0OdEl0Mm0FnXquip,rWsVtGvTxI;aRcPeDhOiNpJtIu6;ing0Yol;eKi8lIo0un9;aHoI;it,re;ct,di7l;st,t;a3oDu3B;e30lI;a10u6;lt,mi28;alua7oI;ke,l2;chew,pou0tab19;a0u4U;aYcVdTfSgQhan4joy,lPqOrNsuMtKvI;e0YisI;a9i50;er,i4rI;aHenGuC;e,re;iGol0F;ui8;ar9iC;a9eIra2ulf;nd1;or4;ang1oIu8;r0w;irc3lo0ou0ErJuI;mb1;oaGy4D;b3ct;bKer9pI;hasiIow1;ze;aKody,rI;a4oiI;d1l;lm,rk;ap0eBuI;ci40de;rIt;ma0Rn;a0Re04iKo,rIwind3;aw,ed9oI;wn;agno0e,ff1g,mi2Kne,sLvI;eIul9;rIst;ge,t;aWbVcQlod9mant3pNru3TsMtI;iIoDu37;lJngI;uiA;!l;ol2ua6;eJlIo0ro2;a4ea0;n0r0;a2Xe36lKoIu0S;uIv1;ra9;aIo0;im;a3Kur0;b3rm;af5b01cVduBep5fUliTmQnOpMrLsiCtaGvI;eIol2;lop;ch;a20i2;aDiBloIoD;re,y;oIy;te,un4;eJoI;liA;an;mEv1;a4i0Ao06raud,y;ei2iMla8oKrI;ee,yI;!pt;de,mIup3;missi34po0;de,ma7ph1;aJrief,uI;g,nk;rk;mp5rk5uF;a0Dea0h0Ai09l08oKrIurta1G;a2ea7ipp3uI;mb3;ales4e04habEinci6ll03m00nIrro6;cXdUfQju8no7qu1sLtKvI;eIin4;ne,r9y;aHin2Bribu7;er2iLoli2Epi8tJuI;lt,me;itu7raH;in;d1st;eKiJoIroFu0;rm;de,gu8rm;ss;eJoI;ne;mn,n0;eIlu6ur;al,i2;buCe,men4pI;eIi3ly;l,te;eBi6u6;r4xiC;ean0iT;rcumveFte;eJirp,oI;o0p;riAw;ncIre5t1ulk;el;a02eSi6lQoPrKuI;iXrIy;st,y;aLeaKiJoad5;en;ng;stfeLtX;ke;il,l11mba0WrrMth1;eIow;ed;!coQfrie1LgPhMliLqueaKstJtrIwild1;ay;ow;th;e2tt3;a2eJoI;ld;ad;!in,ui3;me;bysEckfi8ff3tI;he;b15c0Rd0Iff0Ggree,l0Cm09n03ppZrXsQttOuMvJwaE;it;eDoI;id;rt;gIto0X;meF;aIeCraB;ch,in;pi8sJtoI;niA;aKeIi04u8;mb3rt,ss;le;il;re;g0Hi0ou0rI;an9i2;eaKly,oiFrI;ai0o2;nt;r,se;aMi0GnJtI;icipa7;eJoIul;un4y;al;ly0;aJu0;se;lga08ze;iKlI;e9oIu6;t,w;gn;ix,oI;rd;a03jNmiKoJsoI;rb;pt,rn;niIt;st1;er;ouJuC;st;rn;cLhie2knowled9quiItiva7;es4re;ce;ge;eQliOoKrJusI;e,tom;ue;mIst;moJpI;any,liA;da7;ma7;te;pt;andPduBet,i6oKsI;coKol2;ve;liArt,uI;nd;sh;de;ct;on",
  "Person": "true¦0:1Q;a29b1Zc1Md1Ee18f15g13h0Ri0Qj0Nk0Jl0Gm09n06o05p00rPsItCusain bolt,v9w4xzibit,y1;anni,oko on2uji,v1;an,es;en,o;a3ednesday adams,i2o1;lfram,o0Q;ll ferrell,z khalifa;lt disn1Qr1;hol,r0G;a2i1oltai06;n dies0Zrginia wo17;lentino rossi,n goG;a4h3i2ripp,u1yra banks;lZpac shakur;ger woods,mba07;eresa may,or;kashi,t1ylor;um,ya1B;a5carlett johanss0h4i3lobodan milosevic,no2ocr1Lpider1uperm0Fwami; m0Em0E;op dogg,w whi1H;egfried,nbad;akespeaTerlock holm1Sia labeouf;ddam hussa16nt1;a cla11ig9;aAe6i5o3u1za;mi,n dmc,paul,sh limbau1;gh;bin hood,d stew16nald1thko;in0Mo;han0Yngo starr,valdo;ese witherspo0i1mbrandt;ll2nh1;old;ey,y;chmaninoff,ffi,iJshid,y roma1H;a4e3i2la16o1uff daddy;cahont0Ie;lar,p19;le,rZ;lm17ris hilt0;leg,prah winfr0Sra;a2e1iles cra1Bostradam0J; yo,l5tt06wmQ;pole0s;a5e4i2o1ubar03;by,lie5net,rriss0N;randa ju1tt romn0M;ly;rl0GssiaB;cklemo1rkov,s0ta hari,ya angelou;re;ady gaga,e1ibera0Pu;bron jam0Xch wale1e;sa;anye west,e3i1obe bryant;d cudi,efer suther1;la0P;ats,sha;a2effers0fk,k rowling,rr tolki1;en;ck the ripp0Mwaharlal nehru,y z;liTnez,ron m7;a7e5i3u1;lk hog5mphrey1sa01;! bog05;l1tl0H;de; m1dwig,nry 4;an;ile selassFlle ber4m3rrison1;! 1;ford;id,mo09;ry;ast0iannis,o1;odwPtye;ergus0lorence nightinga08r1;an1ederic chopN;s,z;ff5m2nya,ustaXzeki1;el;eril lagasse,i1;le zatop1nem;ek;ie;a6e4i2octor w1rake;ho;ck w1ego maradoC;olf;g1mi lovaOnzel washingt0;as;l1nHrth vadR;ai lNt0;a8h5lint0o1thulhu;n1olio;an,fuci1;us;on;aucKop2ristian baMy1;na;in;millo,ptain beefhe4r1;dinal wols2son1;! palmF;ey;art;a8e5hatt,i3oHro1;ck,n1;te;ll g1ng crosby;atB;ck,nazir bhut2rtil,yon1;ce;to;nksy,rack ob1;ama;l 6r3shton kutch2vril lavig8yn ra1;nd;er;chimed2istot1;le;es;capo2paci1;no;ne",
  "Adjective": "true¦0:AI;1:BS;2:BI;3:BA;4:A8;5:84;6:AV;7:AN;8:AF;9:7H;A:BQ;B:AY;C:BC;D:BH;E:9Y;aA2b9Ec8Fd7We79f6Ng6Eh61i4Xj4Wk4Tl4Im41n3Po36p2Oquart7Pr2Ds1Dt14uSvOwFye29;aMeKhIiHoF;man5oFrth7G;dADzy;despreB1n w97s86;acked1UoleF;!sa6;ather1PeFll o70ste1D;!k5;nt1Ist6Ate4;aHeGiFola5T;bBUce versa,gi3Lle;ng67rsa5R;ca1gBSluAV;lt0PnLpHrGsFttermoBL;ef9Ku3;b96ge1; Hb32pGsFtiAH;ca6ide d4R;er,i85;f52to da2;a0Fbeco0Hc0Bd04e02f01gu1XheaBGiXkn4OmUnTopp06pRrNsJtHus0wF;aFiel3K;nt0rra0P;app0eXoF;ld,uS;eHi37o5ApGuF;perv06spec39;e1ok9O;en,ttl0;eFu5;cogn06gul2RlGqu84sF;erv0olv0;at0en33;aFrecede0E;id,rallel0;am0otic0;aFet;rri0tF;ch0;nFq26vers3;sur0terFv7U;eFrupt0;st0;air,inish0orese98;mploy0n7Ov97xpF;ect0lain0;eHisFocume01ue;clFput0;os0;cid0rF;!a8Scov9ha8Jlyi8nea8Gprivileg0sMwF;aFei9I;t9y;hGircumcFonvin2U;is0;aFeck0;lleng0rt0;b20ppea85ssuGttend0uthorF;iz0;mi8;i4Ara;aLeIhoHip 25oGrF;anspare1encha1i2;geth9leADp notch,rpB;rny,ugh6H;ena8DmpGrFs6U;r49tia4;eCo8P;leFst4M;nt0;a0Dc09e07h06i04ki03l01mug,nobbi4XoVpRqueami4XtKuFymb94;bHccinAi generis,pFr5;erFre7N;! dup9b,vi70;du0li7Lp6IsFurb7J;eq9Atanda9X;aKeJi16o2QrGubboFy4Q;rn;aightFin5GungS; fFfF;or7V;adfa9Pri6;lwa6Ftu82;arHeGir6NlendBot Fry;on;c3Qe1S;k5se; call0lImb9phistic16rHuFviV;ndFth1B;proof;dBry;dFub6; o2A;e60ipF;pe4shod;ll0n d7R;g2HnF;ceEg6ist9;am3Se9;co1Zem5lfFn6Are7; suf4Xi43;aGholFient3A;ar5;rlFt4A;et;cr0me,tisfac7F;aOeIheumatoBiGoF;bu8Ztt7Gy3;ghtFv3; 1Sf6X;cJdu8PlInown0pro69sGtF;ard0;is47oF;lu2na1;e1Suc45;alcit8Xe1ondi2;bBci3mpa1;aSePicayu7laOoNrGuF;bl7Tnjabi;eKiIoF;b7VfGmi49pFxi2M;er,ort81;a7uD;maFor,sti7va2;!ry;ciDexis0Ima2CpaB;in55puli8G;cBid;ac2Ynt 3IrFti2;ma40tFv7W;!i3Z;i2YrFss7R;anoBtF; 5XiF;al,s5V;bSffQkPld OnMrLth9utKverF;!aIbMdHhGni75seas,t,wF;ei74rou74;a63e7A;ue;ll;do1Ger,si6A;d3Qg2Aotu5Z; bFbFe on o7g3Uli7;oa80;fashion0school;!ay; gua7XbFha5Uli7;eat;eHligGsF;ce7er0So1C;at0;diFse;a1e1;aOeNiMoGuF;anc0de; moEnHrthFt6V;!eFwe7L;a7Krn;chaGdescri7Iprof30sF;top;la1;ght5;arby,cessa4ighbor5wlyw0xt;k0usiaFv3;ti8;aQeNiLoHuF;dIltiF;facet0p6;deHlGnFot,rbBst;ochro4Xth5;dy;rn,st;ddle ag0nF;dbloZi,or;ag9diocEga,naGrFtropolit4Q;e,ry;ci8;cIgenta,inHj0Fkeshift,mmGnFri4Oscu61ver18;da5Dy;ali4Lo4U;!stream;abEho;aOeLiIoFumberi8;ngFuti1R;stan3RtF;erm,i4H;ghtGteraF;l,ry,te;heart0wei5O;ft JgFss9th3;al,eFi0M;nda4;nguBps0te5;apGind5noF;wi8;ut;ad0itte4uniW;ce co0Hgno6Mll0Cm04nHpso 2UrF;a2releF;va1; ZaYcoWdReQfOgrNhibi4Ri05nMoLsHtFvalu5M;aAeF;nDrdepe2K;a7iGolFuboI;ub6ve1;de,gF;nifica1;rdi5N;a2er;own;eriIiLluenVrF;ar0eq5H;pt,rt;eHiGoFul1O;or;e,reA;fiFpe26termi5E;ni2;mpFnsideCrreA;le2;ccuCdeq5Ene,ppr4J;fFsitu,vitro;ro1;mJpF;arHeGl15oFrop9;li2r11;n2LrfeA;ti3;aGeFi18;d4BnD;tuE;egGiF;c0YteC;al,iF;tiF;ma2;ld;aOelNiLoFuma7;a4meInHrrGsFur5;ti6;if4E;e58o3U; ma3GsF;ick;ghfalut2HspF;an49;li00pf33;i4llow0ndGrdFtM; 05coEworki8;sy,y;aLener44iga3Blob3oKrGuF;il1Nng ho;aFea1Fizzl0;cGtF;ef2Vis;ef2U;ld3Aod;iFuc2D;nf2R;aVeSiQlOoJrF;aGeFil5ug3;q43tf2O;gFnt3S;i6ra1;lk13oHrF; keeps,eFge0Vm9tu41;g0Ei2Ds3R;liF;sh;ag4Mowe4uF;e1or45;e4nF;al,i2;d Gmini7rF;ti6ve1;up;bl0lDmIr Fst pac0ux;oGreacF;hi8;ff;ed,ili0R;aXfVlTmQnOqu3rMthere3veryday,xF;aApIquisi2traHuF;be48lF;ta1;!va2L;edRlF;icF;it;eAstF;whi6; Famor0ough,tiE;rou2sui2;erGiF;ne1;ge1;dFe2Aoq34;er5;ficF;ie1;g9sF;t,ygF;oi8;er;aWeMiHoGrFue;ea4owY;ci6mina1ne,r31ti8ubQ;dact2Jfficult,m,sGverF;ge1se;creGePjoi1paCtF;a1inA;et,te; Nadp0WceMfiLgeneCliJmuEpeIreliAsGvoF;id,ut;pFtitu2ul1L;eCoF;nde1;ca2ghF;tf13;a1ni2;as0;facto;i5ngero0I;ar0Ce09h07i06l05oOrIuF;rmudgeon5stoma4teF;sy;ly;aIeHu1EystalF; cleFli7;ar;epy;fFv17z0;ty;erUgTloSmPnGrpoCunterclVveFy;rt;cLdJgr21jIsHtrF;aFi2;dic0Yry;eq1Yta1;oi1ug3;escenFuN;di8;a1QeFiD;it0;atoDmensuCpF;ass1SulF;so4;ni3ss3;e1niza1;ci1J;ockwiD;rcumspeAvil;eFintzy;e4wy;leGrtaF;in;ba2;diac,ef00;a00ePiLliJoGrFuck nak0;and new,isk,on22;gGldface,naF; fi05fi05;us;nd,tF;he;gGpartisFzarE;an;tiF;me;autifOhiNlLnHsFyoN;iWtselF;li8;eGiFt;gn;aFfi03;th;at0oF;v0w;nd;ul;ckwards,rF;e,rT; priori,b13c0Zd0Tf0Ng0Ihe0Hl09mp6nt06pZrTsQttracti0MuLvIwF;aGkF;wa1B;ke,re;ant garGeraF;ge;de;diIsteEtF;heFoimmu7;nt07;re;to4;hGlFtu2;eep;en;bitIchiv3roHtF;ifiFsy;ci3;ga1;ra4;ry;pFt;aHetizi8rF;oprF;ia2;llFre1;ed,i8;ng;iquFsy;at0e;ed;cohKiJkaHl,oGriFterX;ght;ne,of;li7;ne;ke,ve;olF;ic;ad;ain07gressiIi6rF;eeF;ab6;le;ve;fGraB;id;ectGlF;ue1;ioF;na2; JaIeGvF;erD;pt,qF;ua2;ma1;hoc,infinitum;cuCquiGtu3u2;al;esce1;ra2;erSjeAlPoNrKsGuF;nda1;e1olu2trF;aAuD;se;te;eaGuF;pt;st;aFve;rd;aFe;ze;ct;ra1;nt",
  "Pronoun": "true¦elle,h3i2me,she,th0us,we,you;e0ou;e,m,y;!l,t;e,im",
  "Preposition": "true¦aPbMcLdKexcept,fIinGmid,notwithstandiWoDpXqua,sCt7u4v2w0;/o,hereSith0;! whHin,oW;ersus,i0;a,s a vis;n1p0;!on;like,til;h1ill,oward0;!s;an,ereby,r0;ough0u;!oM;ans,ince,o that,uch G;f1n0ut;!to;!f;! 0to;effect,part;or,r0;om;espite,own,u3;hez,irca;ar1e0oBy;sides,tween;ri7;bo8cross,ft7lo6m4propos,round,s1t0;!op;! 0;a whole,long 0;as;id0ong0;!st;ng;er;ut",
  "SportsTeam": "true¦0:18;1:1E;2:1D;3:14;a1Db15c0Sd0Kfc dallas,g0Ihouston 0Hindiana0Gjacksonville jagua0k0El0Am01new UoRpKqueens parkJreal salt lake,sBt6utah jazz,vancouver whitecaps,w4yW;ashington 4h10;natio1Mredski2wizar0W;ampa bay 7e6o4;ronto 4ttenham hotspur;blue ja0Mrapto0;nnessee tita2xasD;buccanee0ra0K;a8eattle 6porting kansas0Wt4; louis 4oke0V;c1Drams;marine0s4;eah13ounH;cramento Rn 4;antonio spu0diego 4francisco gJjose earthquak1;char08paB; ran07;a9h6ittsburgh 5ortland t4;imbe0rail blaze0;pirat1steele0;il4oenix su2;adelphia 4li1;eagl1philNunE;dr1;akland 4klahoma city thunder,rlando magic;athle0Lrai4;de0;england 8orleans 7york 4;g5je3knYme3red bul0Xy4;anke1;ian3;pelica2sain3;patrio3revolut4;ion;anchEeAi4ontreal impact;ami 8lwaukee b7nnesota 4;t5vi4;kings;imberwolv1wi2;rewe0uc0J;dolphi2heat,marli2;mphis grizz4ts;li1;a6eic5os angeles 4;clippe0dodFlaB;esterV; galaxy,ke0;ansas city 4nF;chiefs,roya0D; pace0polis col3;astr05dynamo,rocke3texa2;olden state warrio0reen bay pac4;ke0;allas 8e4i04od6;nver 6troit 4;lio2pisto2ti4;ge0;broncYnugge3;cowbo5maver4;icZ;ys;arEelLhAincinnati 8leveland 6ol4;orado r4umbus crew sc;api7ocki1;brow2cavalie0guar4in4;dia2;bengaVre4;ds;arlotte horAicago 4;b5cubs,fire,wh4;iteB;ea0ulQ;diff4olina panthe0; city;altimore Alackburn rove0oston 6rooklyn 4uffalo bilN;ne3;ts;cel5red4; sox;tics;rs;oriol1rave2;rizona Ast8tlanta 4;brav1falco2h4;awA;ns;es;on villa,r4;os;c6di4;amondbac4;ks;ardi4;na4;ls",
  "Unit": "true¦a07b04cXdWexVfTgRhePinYjoule0BkMlJmDnan08oCp9quart0Bsq ft,t7volts,w6y2ze3°1µ0;g,s;c,f,n;dVear1o0;ttR; 0s 0;old;att,b;erNon0;!ne02;ascals,e1i0;cXnt00;rcent,tJ;hms,unceY;/s,e4i0m²,²,³;/h,cro2l0;e0liK;!²;grLsR;gCtJ;it1u0;menQx;erPreP;b5elvins,ilo1m0notO;/h,ph,²;!byGgrEmCs;ct0rtzL;aJogrC;allonJb0ig3rB;ps;a0emtEl oz,t4;hrenheit,radG;aby9;eci3m1;aratDe1m0oulombD;²,³;lsius,nti0;gr2lit1m0;et0;er8;am7;b1y0;te5;l,ps;c2tt0;os0;econd1;re0;!s",
  "Noun|Gerund": "true¦0:3O;1:3M;2:3N;3:3D;4:32;5:2V;6:3E;7:3K;8:36;9:3J;A:3B;a3Pb37c2Jd27e23f1Vg1Sh1Mi1Ij1Gk1Dl18m13n11o0Wp0Pques0Sr0EsTtNunderMvKwFyDzB;eroi0oB;ni0o3P;aw2eB;ar2l3;aEed4hispe5i5oCrB;ap8est3i1;n0ErB;ki0r31;i1r2s9tc9;isualizi0oB;lunt1Vti0;stan4ta6;aFeDhin6iCraBy8;c6di0i2vel1M;mi0p8;aBs1;c9si0;l6n2s1;aUcReQhOiMkatKl2Wmo6nowJpeItFuCwB;ea5im37;b35f0FrB;fi0vB;e2Mi2J;aAoryt1KrCuB;d2KfS;etc9ugg3;l3n4;bCi0;ebBi0;oar4;gnBnAt1;a3i0;ip8oB;p8rte2u1;a1r27t1;hCo5reBulp1;a2Qe2;edu3oo3;i3yi0;aKeEi4oCuB;li0n2;oBwi0;fi0;aFcEhear7laxi0nDpor1sB;pon4tructB;r2Iu5;de5;or4yc3;di0so2;p8ti0;aFeacek20laEoCrBublis9;a1Teten4in1oces7;iso2siB;tio2;n2yi0;ckaAin1rB;ki0t1O;fEpeDrganiCvB;erco24ula1;si0zi0;ni0ra1;fe5;avi0QeBur7;gotia1twor6;aDeCi2oB;de3nito5;a2dita1e1ssaA;int0XnBrke1;ifUufactu5;aEeaDiBodAyi0;cen7f1mi1stB;e2i0;r2si0;n4ug9;iCnB;ea4it1;c6l3;ogAuB;dAgg3stif12;ci0llust0VmDnBro2;nova1sp0NterBven1;ac1vie02;agi2plo4;aDea1iCoBun1;l4w3;ki0ri0;nd3rB;roWvB;es1;aCene0Lli4rBui4;ee1ie0N;rde2the5;aHeGiDlCorBros1un4;e0Pmat1;ir1oo4;gh1lCnBs9;anZdi0;i0li0;e3nX;r0Zscina1;a1du01nCxB;erci7plo5;chan1di0ginB;ee5;aLeHiGoub1rCum8wB;el3;aDeCiB;bb3n6vi0;a0Qs7;wi0;rTscoDvi0;ba1coZlBvelo8;eCiB;ve5;ga1;nGti0;aVelebUhSlPoDrBur3yc3;aBos7yi0;f1w3;aLdi0lJmFnBo6pi0ve5;dDsCvinB;ci0;trBul1;uc1;muniDpB;lBo7;ai2;ca1;lBo5;ec1;c9ti0;ap8eaCimToBubT;ni0t9;ni0ri0;aBee5;n1t1;ra1;m8rCs1te5;ri0;vi0;aPeNitMlLoGrDuB;dge1il4llBr8;yi0;an4eat9oadB;cas1;di0;a1mEokB;i0kB;ee8;pi0;bi0;es7oa1;c9i0;gin2lonAt1;gi0;bysit1c6ki0tt3;li0;ki0;bando2cGdverti7gi0pproac9rgDssuCtB;trac1;mi0;ui0;hi0;si0;coun1ti0;ti0;ni0;ng",
  "PhrasalVerb": "true¦0:92;1:96;2:8H;3:8V;4:8A;5:83;6:85;7:98;8:90;9:8G;A:8X;B:8R;C:8U;D:8S;E:70;F:97;G:8Y;H:81;I:7H;J:79;a9Fb7Uc6Rd6Le6Jf5Ig50h4Biron0j47k40l3Em31n2Yo2Wp2Cquiet Hr1Xs0KtZuXvacuu6QwNyammerBzK;ero Dip LonK;e0k0;by,ov9up;aQeMhLiKor0Mrit19;mp0n3Fpe0r5s5;ackAeel Di0S;aLiKn33;gh 3Wrd0;n Dr K;do1in,oJ;it 79k5lk Lrm 69sh Kt83v60;aw3do1o7up;aw3in,oC;rgeBsK;e 2herE;a00eYhViRoQrMuKypP;ckErn K;do1in,oJup;aLiKot0y 30;ckl7Zp F;ck HdK;e 5Y;n7Wp 3Es5K;ck MdLe Kghten 6me0p o0Rre0;aw3ba4do1in,up;e Iy 2;by,oG;ink Lrow K;aw3ba4in,up;ba4ov9up;aKe 77ll62;m 2r 5M;ckBke Llk K;ov9shit,u47;aKba4do1in,leave,o4Dup;ba4ft9pa69w3;a0Vc0Te0Mh0Ii0Fl09m08n07o06p01quar5GtQuOwK;earMiK;ngLtch K;aw3ba4o8K; by;cKi6Bm 2ss0;k 64;aReQiPoNrKud35;aigh2Det75iK;ke 7Sng K;al6Yup;p Krm2F;by,in,oG;c3Ln3Lr 2tc4O;p F;c3Jmp0nd LrKveAy 2O;e Ht 2L;ba4do1up;ar3GeNiMlLrKurB;ead0ingBuc5;a49it 6H;c5ll o3Cn 2;ak Fe1Xll0;a3Bber 2rt0und like;ap 5Vow Duggl5;ash 6Noke0;eep NiKow 6;cLp K;o6Dup;e 68;in,oK;ff,v9;de19gn 4NnKt 6Gz5;gKkE; al6Ale0;aMoKu5W;ot Kut0w 7M;aw3ba4f48oC;c2WdeEk6EveA;e Pll1Nnd Orv5tK; Ktl5J;do1foLin,o7upK;!on;ot,r5Z;aw3ba4do1in,o33up;oCto;al66out0rK;ap65ew 6J;ilAv5;aXeUiSoOuK;b 5Yle0n Kstl5;aLba4do1inKo2Ith4Nu5P;!to;c2Xr8w3;ll Mot LpeAuK;g3Ind17;a2Wf3Po7;ar8in,o7up;ng 68p oKs5;ff,p18;aKelAinEnt0;c6Hd K;o4Dup;c27t0;aZeYiWlToQrOsyc35uK;ll Mn5Kt K;aKba4do1in,oJto47up;pa4Dw3;a3Jdo1in,o21to45up;attleBess KiNop 2;ah2Fon;iLp Kr4Zu1Gwer 6N;do1in,o6Nup;nt0;aLuK;gEmp 6;ce u20y 6D;ck Kg0le 4An 6p5B;oJup;el 5NncilE;c53ir 39n0ss MtLy K;ba4oG; Hc2R;aw3ba4in,oJ;pKw4Y;e4Xt D;aLerd0oK;dAt53;il Hrrow H;aTeQiPoLuK;ddl5ll I;c1FnkeyMp 6uthAve K;aKdo1in,o4Lup;l4Nw3; wi4K;ss0x 2;asur5e3SlLss K;a21up;t 6;ke Ln 6rKs2Ax0;k 6ryA;do,fun,oCsure,up;a02eViQoLuK;ck0st I;aNc4Fg MoKse0;k Kse4D;aft9ba4do1forw37in56o0Zu46;in,oJ;d 6;e NghtMnLsKve 00;ten F;e 2k 2; 2e46;ar8do1in;aMt LvelK; oC;do1go,in,o7up;nEve K;in,oK;pKut;en;c5p 2sh LtchBughAy K;do1o59;in4Po7;eMick Lnock K;do1oCup;oCup;eLy K;in,up;l Ip K;aw3ba4do1f04in,oJto,up;aMoLuK;ic5mpE;ke3St H;c43zz 2;a01eWiToPuK;nLrrKsh 6;y 2;keLt K;ar8do1;r H;lKneErse3K;d Ke 2;ba4dKfast,o0Cup;ear,o1;de Lt K;ba4on,up;aw3o7;aKlp0;d Ml Ir Kt 2;fKof;rom;f11in,o03uW;cPm 2nLsh0ve Kz2P;at,it,to;d Lg KkerP;do1in,o2Tup;do1in,oK;ut,v9;k 2;aZeTive Rloss IoMrLunK; f0S;ab hold,in43ow 2U; Kof 2I;aMb1Mit,oLr8th1IuK;nd9;ff,n,v9;bo7ft9hQw3;aw3bKdo1in,oJrise,up,w3;a4ir2H;ar 6ek0t K;aLb1Fdo1in,oKr8up;ff,n,ut,v9;cLhKl2Fr8t,w3;ead;ross;d aKng 2;bo7;a0Ee07iYlUoQrMuK;ck Ke2N;ar8up;eLighten KownBy 2;aw3oG;eKshe27; 2z5;g 2lMol Krk I;aKwi20;bo7r8;d 6low 2;aLeKip0;sh0;g 6ke0mKrKtten H;e F;gRlPnNrLsKzzle0;h F;e Km 2;aw3ba4up;d0isK;h 2;e Kl 1T;aw3fPin,o7;ht ba4ure0;ePnLsK;s 2;cMd K;fKoG;or;e D;d04l 2;cNll Krm0t1G;aLbKdo1in,o09sho0Eth08victim;a4ehi2O;pa0C;e K;do1oGup;at Kdge0nd 12y5;in,o7up;aOi1HoNrK;aLess 6op KuN;aw3b03in,oC;gBwB; Ile0ubl1B;m 2;a0Ah05l02oOrLut K;aw3ba4do1oCup;ackBeep LoKy0;ss Dwd0;by,do1in,o0Uup;me NoLuntK; o2A;k 6l K;do1oG;aRbQforOin,oNtKu0O;hLoKrue;geth9;rough;ff,ut,v9;th,wK;ard;a4y;paKr8w3;rt;eaLose K;in,oCup;n 6r F;aNeLiK;ll0pE;ck Der Kw F;on,up;t 2;lRncel0rOsMtch LveE; in;o1Nup;h Dt K;doubt,oG;ry LvK;e 08;aw3oJ;l Km H;aLba4do1oJup;ff,n,ut;r8w3;a0Ve0MiteAl0Fo04rQuK;bblNckl05il0Dlk 6ndl05rLsKtMy FzzA;t 00;n 0HsK;t D;e I;ov9;anWeaUiLush K;oGup;ghQng K;aNba4do1forMin,oLuK;nd9p;n,ut;th;bo7lKr8w3;ong;teK;n 2;k K;do1in,o7up;ch0;arTg 6iRn5oPrNssMttlLunce Kx D;aw3ba4;e 6; ar8;e H;do1;k Dt 2;e 2;l 6;do1up;d 2;aPeed0oKurt0;cMw K;aw3ba4do1o7up;ck;k K;in,oC;ck0nk0stA; oQaNef 2lt0nd K;do1ov9up;er;up;r Lt K;do1in,oCup;do1o7;ff,nK;to;ck Pil0nMrgLsK;h D;ainBe D;g DkB; on;in,o7;aw3do1in,oCup;ff,ut;ay;ct FdQir0sk MuctionA; oG;ff;ar8o7;ouK;nd; o7;d K;do1oKup;ff,n;wn;o7up;ut",
  "ProperNoun": "true¦aIbDc8dalhousHe7f5gosford,h4iron maiden,kirby,landsdowne,m2nis,r1s0wembF;herwood,paldiB;iel,othwe1;cgi0ercedes,issy;ll;intBudsB;airview,lorence,ra0;mpt9nco;lmo,uro;a1h0;arlt6es5risti;rl0talina;et4i0;ng;arb3e0;et1nt0rke0;ley;on;ie;bid,jax",
  "Person|Place": "true¦a8d6h4jordan,k3orlando,s1vi0;ctor9rgin9;a0ydney;lvador,mara,ntia4;ent,obe;amil0ous0;ton;arw2ie0;go;lexandr1ust0;in;ia",
  "LastName": "true¦0:BR;1:BF;2:B5;3:BH;4:AX;5:9Y;6:B6;7:BK;8:B0;9:AV;A:AL;B:8Q;C:8G;D:7K;E:BM;F:AH;aBDb9Zc8Wd88e81f7Kg6Wh64i60j5Lk4Vl4Dm39n2Wo2Op25quispe,r1Ls0Pt0Ev03wTxSyKzG;aIhGimmerm6A;aGou,u;ng,o;khar5ytsE;aKeun9BiHoGun;koya32shiBU;!lG;diGmaz;rim,z;maGng;da,g52mo83sGzaC;aChiBV;iao,u;aLeJiHoGright,u;jcA5lff,ng;lGmm0nkl0sniewsC;kiB1liams33s3;bGiss,lt0;b,er,st0;a6Vgn0lHtG;anabe,s3;k0sh,tG;e2Non;aLeKiHoGukD;gt,lk5roby5;dHllalGnogr3Kr1Css0val3S;ba,ob1W;al,ov4;lasHsel8W;lJn dIrgBEsHzG;qu7;ilyEqu7siljE;en b6Aijk,yk;enzueAIverde;aPeix1VhKi2j8ka43oJrIsui,uG;om5UrG;c2n0un1;an,emblA7ynisC;dorAMlst3Km4rrAth;atch0i8UoG;mHrG;are84laci79;ps3sG;en,on;hirDkah9Mnaka,te,varA;a06ch01eYhUiRmOoMtIuHvGzabo;en9Jobod3N;ar7bot4lliv2zuC;aIeHoG;i7Bj4AyanAB;ele,in2FpheBvens25;l8rm0;kol5lovy5re7Tsa,to,uG;ng,sa;iGy72;rn5tG;!h;l71mHnGrbu;at9cla9Egh;moBo7M;aIeGimizu;hu,vchG;en8Luk;la,r1G;gu9infe5YmGoh,pulveA7rra5P;jGyG;on5;evi6iltz,miHneid0roed0uGwarz;be3Elz;dHtG;!t,z;!t;ar4Th8ito,ka4OlJnGr4saCto,unde19v4;ch7dHtGz;a5Le,os;b53e16;as,ihDm4Po0Y;aVeSiPoJuHyG;a6oo,u;bio,iz,sG;so,u;bKc8Fdrigue67ge10j9YmJosevelt,sItHux,wG;e,li6;a9Ch;enb4Usi;a54e4L;erts15i93;bei4JcHes,vGzzo;as,e9;ci,hards12;ag2es,iHut0yG;es,nol5N;s,t0;dImHnGsmu97v6C;tan1;ir7os;ic,u;aUeOhMiJoHrGut8;asad,if6Zochazk27;lishc2GpGrti72u10we76;e3Aov51;cHe45nG;as,to;as70hl0;aGillips;k,m,n6I;a3Hde3Wete0Bna,rJtG;ersHrovGters54;!a,ic;!en,on;eGic,kiBss3;i9ra,tz,z;h86k,padopoulIrk0tHvG;ic,l4N;el,te39;os;bMconn2Ag2TlJnei6PrHsbor6XweBzG;dem7Rturk;ella4DtGwe6N;ega,iz;iGof7Hs8I;vGyn1R;ei9;aSri1;aPeNiJoGune50ym2;rHvGwak;ak4Qik5otn66;odahl,r4S;cholsZeHkolGls4Jx3;ic,ov84;ls1miG;!n1;ils3mG;co4Xec;gy,kaGray2sh,var38;jiGmu9shiG;ma;a07c04eZiWoMuHyeG;rs;lJnIrGssoli6S;atGp03r7C;i,ov4;oz,te58;d0l0;h2lOnNo0RrHsGza1A;er,s;aKeJiIoz5risHtG;e56on;!on;!n7K;au,i9no,t5J;!lA;r1Btgome59;i3El0;cracFhhail5kkeHlG;l0os64;ls1;hmeJiIj30lHn3Krci0ssiGyer2N;!er;n0Po;er,j0;dDti;cartHlG;aughl8e2;hy;dQe7Egnu68i0jer3TkPmNnMrItHyG;er,r;ei,ic,su21thews;iHkDquAroqu8tinG;ez,s;a5Xc,nG;!o;ci5Vn;a5UmG;ad5;ar5e6Kin1;rig77s1;aVeOiLoJuHyG;!nch;k4nGo;d,gu;mbarGpe3Fvr4we;di;!nGu,yana2B;coln,dG;b21holm,strom;bedEfeKhIitn0kaHn8rGw35;oy;!j;m11tG;in1on1;bvGvG;re;iGmmy,ng,rs2Qu,voie,ws3;ne,t1F;aZeYh2iWlUnez50oNrJuHvar2woG;k,n;cerGmar68znets5;a,o34;aHem0isGyeziu;h23t3O;m0sni4Fus3KvG;ch4O;bay57ch,rh0Usk16vaIwalGzl5;czGsC;yk;cIlG;!cGen4K;huk;!ev4ic,s;e8uiveG;rt;eff0kGl4mu9nnun1;ucF;ll0nnedy;hn,llKminsCne,pIrHstra3Qto,ur,yGzl5;a,s0;j0Rls22;l2oG;or;oe;aPenOha6im14oHuG;ng,r4;e32hInHrge32u6vG;anD;es,ss3;anHnsG;en,on,t3;nesGs1R;en,s1;kiBnings,s1;cJkob4EnGrv0E;kDsG;en,sG;en0Ion;ks3obs2A;brahimDglesi5Nke5Fl0Qno07oneIshikHto,vanoG;u,v54;awa;scu;aVeOiNjaltal8oIrist50uG;!aGb0ghAynh;m2ng;a6dz4fIjgaa3Hk,lHpUrGwe,x3X;ak1Gvat;mAt;er,fm3WmG;ann;ggiBtchcock;iJmingw4BnHrGss;nand7re9;deGriks1;rs3;kkiHnG;on1;la,n1;dz4g1lvoQmOns0ZqNrMsJuIwHyG;asFes;kiB;g1ng;anHhiG;mo14;i,ov0J;di6p0r10t;ue;alaG;in1;rs1;aVeorgUheorghe,iSjonRoLrJuGw3;errGnnar3Co,staf3Ctierr7zm2;a,eG;ro;ayli6ee2Lg4iffithGub0;!s;lIme0UnHodGrbachE;e,m2;calvAzale0S;dGubE;bGs0E;erg;aj,i;bs3l,mGordaO;en7;iev3U;gnMlJmaIndFo,rGsFuthi0;cGdn0za;ia;ge;eaHlG;agh0i,o;no;e,on;aVerQiLjeldsted,lKoIrHuG;chs,entAji41ll0;eem2iedm2;ntaGrt8urni0wl0;na;emi6orA;lipIsHtzgeraG;ld;ch0h0;ovG;!ic;hatDnanIrG;arGei9;a,i;deY;ov4;b0rre1D;dKinsJriksIsGvaB;cob3GpGtra3D;inoza,osiQ;en,s3;te8;er,is3warG;ds;aXePiNjurhuMoKrisco15uHvorakG;!oT;arte,boHmitru,nn,rGt3C;and,ic;is;g2he0Omingu7nErd1ItG;to;us;aGcki2Hmitr2Ossanayake,x3;s,z; JbnaIlHmirGrvisFvi,w2;!ov4;gado,ic;th;bo0groot,jo6lHsilGvriA;va;a cruz,e3uG;ca;hl,mcevsCnIt2WviG;dGes,s;ov,s3;ielsGku22;!en;ki;a0Be06hRiobQlarkPoIrGunningh1H;awfo0RivGuz;elli;h1lKntJoIrGs2Nx;byn,reG;a,ia;ke,p0;i,rer2K;em2liB;ns;!e;anu;aOeMiu,oIristGu6we;eGiaG;ns1;i,ng,p9uHwGy;!dH;dGng;huJ;!n,onGu6;!g;kJnIpm2ttHudhGv7;ry;erjee,o14;!d,g;ma,raboG;rty;bJl0Cng4rG;eghetHnG;a,y;ti;an,ota1C;cerAlder3mpbeLrIstGvadi0B;iGro;llo;doHl0Er,t0uGvalho;so;so,zo;ll;a0Fe01hYiXlUoNrKuIyG;rLtyG;qi;chan2rG;ke,ns;ank5iem,oGyant;oks,wG;ne;gdan5nIruya,su,uchaHyKziG;c,n5;rd;darGik;enG;ko;ov;aGond15;nco,zG;ev4;ancFshw16;a08oGuiy2;umGwmG;ik;ckRethov1gu,ktPnNrG;gJisInG;ascoGds1;ni;ha;er,mG;anG;!n;gtGit7nP;ss3;asF;hi;er,hG;am;b4ch,ez,hRiley,kk0ldw8nMrIshHtAu0;es;ir;bInHtlGua;ett;es,i0;ieYosa;dGik;a9yoG;padhyG;ay;ra;k,ng;ic;bb0Acos09d07g04kht05lZnPrLsl2tJyG;aHd8;in;la;chis3kiG;ns3;aImstro6sl2;an;ng;ujo,ya;dJgelHsaG;ri;ovG;!a;ersJov,reG;aGjEws;ss1;en;en,on,s3;on;eksejEiyEmeiIvG;ar7es;ez;da;ev;arwHuilG;ar;al;ams,l0;er;ta;as",
  "Ordinal": "true¦eBf7nin5s3t0zeroE;enDhir1we0;lfCn7;d,t3;e0ixt8;cond,vent7;et0th;e6ie7;i2o0;r0urt3;tie4;ft1rst;ight0lev1;e0h,ie1;en0;th",
  "Cardinal": "true¦bEeBf5mEnine7one,s4t0zero;en,h2rDw0;e0o;lve,n5;irt6ousands,ree;even2ix2;i3o0;r1ur0;!t2;ty;ft0ve;e2y;ight0lev1;!e0y;en;illions",
  "Multiple": "true¦b3hundred,m3qu2se1t0;housand,r2;pt1xt1;adr0int0;illion",
  "City": "true¦0:74;1:61;2:6G;3:6J;4:5S;a68b53c4Id48e44f3Wg3Hh39i31j2Wk2Fl23m1Mn1Co19p0Wq0Ur0Os05tRuQvLwDxiBy9z5;a7h5i4Muri4O;a5e5ongsh0;ng3H;greb,nzib5G;ang2e5okoha3Sunfu;katerin3Hrev0;a5n0Q;m5Hn;arsBeAi6roclBu5;h0xi,zh5P;c7n5;d5nipeg,terth4;hoek,s1L;hi5Zkl3A;l63xford;aw;a8e6i5ladivost5Molgogr6L;en3lni6S;ni22r5;o3saill4N;lenc4Wncouv3Sr3ughn;lan bat1Crumqi,trecht;aFbilisi,eEheDiBo9r7u5;l21n63r5;in,ku;i5ondh62;es51poli;kyo,m2Zron1Pulo5;n,uS;an5jua3l2Tmisoa6Bra3;j4Tshui; hag62ssaloni2H;gucigal26hr0l av1U;briz,i6llinn,mpe56ng5rtu,shk2R;i3Esh0;an,chu1n0p2Eyu0;aEeDh8kopje,owe1Gt7u5;ra5zh4X;ba0Ht;aten is55ockholm,rasbou67uttga2V;an8e6i5;jiazhua1llo1m5Xy0;f50n5;ya1zh4H;gh3Kt4Q;att45o1Vv44;cramen16int ClBn5o paulo,ppo3Rrajevo; 7aa,t5;a 5o domin3E;a3fe,m1M;antonio,die3Cfrancisco,j5ped3Nsalvad0J;o5u0;se;em,t lake ci5Fz25;lou58peters24;a9e8i6o5;me,t59;ga,o5yadh;! de janei3F;cife,ims,nn3Jykjavik;b4Sip4lei2Inc2Pwalpindi;ingdao,u5;ez2i0Q;aFeEhDiCo9r7u6yong5;ya1;eb59ya1;a5etor3M;g52to;rt5zn0; 5la4Co;au prin0Melizabe24sa03;ls3Prae5Atts26;iladelph3Gnom pe1Aoenix;ki1tah tik3E;dua,lerYnaji,r4Ot5;na,r32;ak44des0Km1Mr6s5ttawa;a3Vlo;an,d06;a7ew5ing2Fovosibir1Jyc; 5cast36;del24orlea44taip14;g8iro4Wn5pl2Wshv33v0;ch6ji1t5;es,o1;a1o1;a6o5p4;ya;no,sa0W;aEeCi9o6u5;mb2Ani26sc3Y;gadishu,nt6s5;c13ul;evideo,pelli1Rre2Z;ami,l6n14s5;kolc,sissauga;an,waukee;cca,d5lbour2Mmph41ndo1Cssi3;an,ell2Xi3;cau,drAkass2Sl9n8r5shh4A;aca6ib5rakesh,se2L;or;i1Sy;a4EchFdal0Zi47;mo;id;aDeAi8o6u5vSy2;anMckn0Odhia3;n5s angel26;d2g bea1N;brev2Be3Lma5nz,sb2verpo28;!ss27; ma39i5;c5pzig;est16; p6g5ho2Wn0Cusan24;os;az,la33;aHharFiClaipeBo9rak0Du7y5;iv,o5;to;ala lump4n5;mi1sh0;hi0Hlka2Xpavog4si5wlo2;ce;da;ev,n5rkuk;gst2sha5;sa;k5toum;iv;bHdu3llakuric0Qmpa3Fn6ohsiu1ra5un1Iwaguc0Q;c0Pj;d5o,p4;ah1Ty;a7e6i5ohannesV;l1Vn0;dd36rusalem;ip4k5;ar2H;bad0mph1OnArkutUs7taXz5;mir,tapala5;pa;fah0l6tanb5;ul;am2Zi2H;che2d5;ianap2Mo20;aAe7o5yder2W; chi mi5ms,nolulu;nh;f6lsin5rakli2;ki;ei;ifa,lifax,mCn5rb1Dva3;g8nov01oi;aFdanEenDhCiPlasgBo9raz,u5;a5jr23;dal6ng5yaquil;zh1J;aja2Oupe;ld coa1Bthen5;bu2S;ow;ent;e0Uoa;sk;lw7n5za;dhi5gt1E;nag0U;ay;aisal29es,o8r6ukuya5;ma;ankfu5esno;rt;rt5sh0; wor6ale5;za;th;d5indhov0Pl paso;in5mont2;bur5;gh;aBe8ha0Xisp4o7resd0Lu5;b5esseldorf,nkirk,rb0shanbe;ai,l0I;ha,nggu0rtmu13;hradSl6nv5troit;er;hi;donghIe6k09l5masc1Zr es sala1KugavpiY;i0lU;gu,je2;aJebu,hAleve0Vo5raio02uriti1Q;lo7n6penhag0Ar5;do1Ok;akKst0V;gUm5;bo;aBen8i6ongqi1ristchur5;ch;ang m7ca5ttago1;go;g6n5;ai;du,zho1;ng5ttogr14;ch8sha,zh07;gliari,i9lga8mayenJn6pe town,r5tanO;acCdiff;ber1Ac5;un;ry;ro;aWeNhKirmingh0WoJr9u5;chareTdapeTenos air7r5s0tu0;g5sa;as;es;a9is6usse5;ls;ba6t5;ol;ne;sil8tisla7zzav5;il5;le;va;ia;goZst2;op6ubaneshw5;ar;al;iCl9ng8r5;g6l5n;in;en;aluru,hazi;fa6grade,o horizon5;te;st;ji1rut;ghd0BkFn9ot8r7s6yan n4;ur;el,r07;celo3i,ranquil09;ou;du1g6ja lu5;ka;alo6k5;ok;re;ng;ers5u;field;a05b02cc01ddis aba00gartaZhmedXizawl,lSmPnHqa00rEsBt7uck5;la5;nd;he7l5;an5;ta;ns;h5unci2;dod,gab5;at;li5;ngt2;on;a8c5kaOtwerp;hora6o3;na;ge;h7p5;ol5;is;eim;aravati,m0s5;terd5;am; 7buquerq6eppo,giers,ma5;ty;ue;basrah al qadim5mawsil al jadid5;ah;ab5;ad;la;ba;ra;idj0u dha5;bi;an;lbo6rh5;us;rg",
  "Region": "true¦0:2O;1:2L;2:2U;3:2F;a2Sb2Fc21d1Wes1Vf1Tg1Oh1Ki1Fj1Bk16l13m0Sn09o07pYqVrSsJtEuBverAw6y4zacatec2W;akut0o0Fu4;cat1k09;a5est 4isconsin,yomi1O;bengal,virgin0;rwick3shington4;! dc;acruz,mont;dmurt0t4;ah,tar4; 2Pa12;a6e5laxca1Vripu21u4;scaEva;langa2nnessee,x2J;bas10m4smQtar29;aulip2Hil nadu;a9elang07i7o5taf16u4ylh1J;ff02rr09s1E;me1Gno1Uuth 4;cZdY;ber0c4kkim,naloa;hu1ily;n5rawak,skatchew1xo4;ny; luis potosi,ta catari2;a4hodeA;j4ngp0C;asth1shahi;ingh29u4;e4intana roo;bec,en6retaro;aAe6rince edward4unjab; i4;sl0G;i,n5r4;ak,nambu0F;a0Rnsylv4;an0;ha0Pra4;!na;axa0Zdisha,h4klaho21ntar4reg7ss0Dx0I;io;aLeEo6u4;evo le4nav0X;on;r4tt18va scot0;f9mandy,th4; 4ampton3;c6d5yo4;rk3;ako1O;aroli2;olk;bras1Nva0Dw4; 6foundland4;! and labrad4;or;brunswick,hamp3jers5mexiTyork4;! state;ey;galPyarit;aAeghala0Mi6o4;nta2r4;dov0elos;ch6dlanDn5ss4zor11;issippi,ouri;as geraPneso18;ig1oac1;dhy12harasht0Gine,lac07ni5r4ssachusetts;anhao,i el,ylG;p4toba;ur;anca3e4incoln3ouisI;e4iR;ds;a6e5h4omi;aka06ul2;dah,lant1ntucky,ra01;bardino,lmyk0ns0Qr4;achay,el0nata0X;alis6har4iangxi;kh4;and;co;daho,llino7n4owa;d5gush4;et0;ia2;is;a6ert5i4un1;dalFm0D;ford3;mp3rya2waii;ansu,eorg0lou7oa,u4;an4izhou,jarat;ajuato,gdo4;ng;cester3;lori4uji1;da;sex;ageUe7o5uran4;go;rs4;et;lawaMrby3;aFeaEh9o4rim08umbr0;ahui7l6nnectic5rsi4ventry;ca;ut;i03orado;la;e5hattisgarh,i4uvash0;apRhuahua;chn5rke4;ss0;ya;ra;lGm4;bridge3peche;a9ihar,r8u4;ck4ryat0;ingham3;shi4;re;emen,itish columb0;h0ja cal8lk7s4v7;hkorto4que;st1;an;ar0;iforn0;ia;dygHguascalientes,lBndhr9r5ss4;am;izo2kans5un4;achal 7;as;na;a 4;pradesh;a6ber5t4;ai;ta;ba5s4;ka;ma;ea",
  "Place": "true¦0:4T;1:4V;2:44;3:4B;4:3I;a4Eb3Gc2Td2Ge26f25g1Vh1Ji1Fk1Cl14m0Vn0No0Jp08r04sTtNuLvJw7y5;a5o0Syz;kut1Bngtze;aDeChitBi9o5upatki,ycom2P;ki26o5;d5l1B;b3Ps5;i4to3Y;c0SllowbroCn5;c2Qgh2;by,chur1P;ed0ntw3Gs22;ke6r3St5;erf1f1; is0Gf3V;auxha3Mirgin is0Jost5;ok;laanbaatar,pto5xb3E;n,wn;a9eotihuac43h7ive49o6ru2Nsarskoe selo,u5;l2Dzigo47;nto,rquay,tt2J;am3e 5orn3E;bronx,hamptons;hiti,j mah0Iu1N;aEcotts bluff,eCfo,herbroQoApring9t7u5yd2F;dbu1Wn5;der03set3B;aff1ock2Nr5;atf1oud;hi37w24;ho,uth5; 1Iam1Zwo3E;a5i2O;f2Tt0;int lawrence riv3Pkhal2D;ayleigh,ed7i5oc1Z;chmo1Eo gran4ver5;be1Dfr09si4; s39cliffe,hi2Y;aCe9h8i5ompeii,utn2;c6ne5tcai2T; 2Pc0G;keri13t0;l,x;k,lh2mbr6n5r2J;n1Hzance;oke;cif38pahanaumokuak30r5;k5then0;si4w1K;ak7r6x5;f1l2X;ange county,d,f1inoco;mTw1G;e8i1Uo5;r5tt2N;th5wi0E; 0Sam19;uschwanste1Pw5; eng6a5h2market,po36;rk;la0P;a8co,e6i5uc;dt1Yll0Z;adow5ko0H;lands;chu picchu,gad2Ridsto1Ql8n7ple6r5;kh2; g1Cw11;hatt2Osf2B;ibu,t0ve1Z;a8e7gw,hr,in5owlOynd02;coln memori5dl2C;al;asi4w3;kefr7mbe1On5s,x;ca2Ig5si05;f1l27t0;ont;azan kreml14e6itchen2Gosrae,rasnoyar5ul;sk;ns0Hs1U;ax,cn,lf1n6ps5st;wiN;d5glew0Lverness;ian27ochina;aDeBi6kg,nd,ov5unti2H;d,enweep;gh6llc5;reL;bu03l5;and5;!s;r5yw0C;ef1tf1;libu24mp6r5stings;f1lem,row;stead,t0;aDodavari,r5uelph;avenAe5imsS;at 8en5; 6f1Fwi5;ch;acr3vall1H;brita0Flak3;hur5;st;ng3y villa0W;airhavHco,ra;aAgli9nf17ppi8u7ver6x5;et1Lf1;glad3t0;rope,st0;ng;nt0;rls1Ls5;t 5;e5si4;nd;aCe9fw,ig8o7ryd6u5xb;mfri3nstab00rh2tt0;en;nca18rcKv19wnt0B;by;n6r5vonpo1D;ry;!h2;nu8r5;l6t5;f1moor;ingt0;be;aLdg,eIgk,hClBo5royd0;l6m5rnwa0B;pt0;c7lingw6osse5;um;ood;he0S;earwat0St;a8el6i5uuk;chen itza,mney ro07natSricahua;m0Zt5;enh2;mor5rlottetPth2;ro;dar 5ntervilA;breaks,faZg5;rove;ld9m8r5versh2;lis6rizo pla5;in;le;bLpbellf1;weQ;aZcn,eNingl01kk,lackLolt0r5uckV;aGiAo5;ckt0ok5wns cany0;lyn,s5;i4to5;ne;de;dge6gh5;am,t0;n6t5;own;or5;th;ceb6m5;lNpt0;rid5;ge;bu5pool,wa8;rn;aconsfEdf1lBr9verly7x5;hi5;ll; hi5;lls;wi5;ck; air,l5;ingh2;am;ie5;ld;ltimore,rnsl6tters5;ea;ey;bLct0driadic,frica,ginJlGmFn9rc8s7tl6yleOzor3;es;!ant8;hcroft,ia; de triomphe,t6;adyr,ca8dov9tarct5;ic5; oce5;an;st5;er;ericas,s;be6dersh5hambra,list0;ot;rt0;cou5;rt;bot7i5;ngd0;on;sf1;ord",
  "Country": "true¦0:38;1:2L;2:3B;a2Xb2Ec22d1Ye1Sf1Mg1Ch1Ai14j12k0Zl0Um0Gn05om2pZqat1KrXsKtCu7v5wal4yemTz3;a25imbabwe;es,lis and futu2Y;a3enezue32ietnam;nuatu,tican city;gTk6nited 4ruXs3zbeE; 2Ca,sr;arab emirat0Kkingdom,states3;! of am2Y;!raiV;a8haCimor les0Co7rinidad 5u3;nis0rk3valu;ey,me2Zs and caic1V;and t3t3;oba1L;go,kel10nga;iw2ji3nz2T;ki2V;aDcotl1eCi9lov8o6pa2Dri lanka,u5w3yr0;az3edAitzerl1;il1;d2riname;lomon1Xmal0uth 3;afr2KkMsud2;ak0en0;erra leoFn3;gapo1Yt maart3;en;negLrb0ychellZ;int 3moa,n marino,udi arab0;hele26luc0mart21;epublic of ir0Eom2Euss0w3;an27;a4eIhilippinUitcairn1Mo3uerto riN;l1rtugF;ki2Dl4nama,pua new0Vra3;gu7;au,esti3;ne;aBe9i7or3;folk1Ith4w3;ay; k3ern mariana1D;or0O;caragua,ger3ue;!ia;p3ther1Aw zeal1;al;mib0u3;ru;a7exi6icro0Bo3yanm06;ldova,n3roc5zambA;a4gol0t3;enegro,serrat;co;cAdagasc01l7r5urit4yot3;te;an0i16;shall0Xtin3;ique;a4div3i,ta;es;wi,ys0;ao,ed02;a6e5i3uxembourg;b3echtenste12thu1G;er0ya;ban0Isotho;os,tv0;azakh1Fe4iriba04o3uwait,yrgyz1F;rXsovo;eling0Knya;a3erG;ma16p2;c7nd6r4s3taly,vory coast;le of m2rael;a3el1;n,q;ia,oJ;el1;aiTon3ungary;dur0Ng kong;aBermany,ha0QibraltAre8u3;a6ern5inea3ya0P;! biss3;au;sey;deloupe,m,tema0Q;e3na0N;ce,nl1;ar;bUmb0;a7i6r3;ance,ench 3;guia0Epoly3;nes0;ji,nl1;lklandUroeU;ast tim7cu6gypt,l salv6ngl1quatorial4ritr5st3thiop0;on0; guin3;ea;ad3;or;enmark,jibou5ominica4r con3;go;!n C;ti;aBentral african Ah8o5roat0u4yprRzech3; 9ia;ba,racao;c4lo3morQngo brazzaville,okGsta r04te de ivoiL;mb0;osE;i3ristmasG;le,na;republic;m3naUpe verde,ymanA;bod0ero3;on;aGeDhut2o9r5u3;lgar0r3;kina faso,ma,undi;azil,itish 3unei;virgin3; is3;lands;liv0nai5snia and herzegoviHtswaHuvet3; isl1;and;re;l3n8rmuG;ar3gium,ize;us;h4ngladesh,rbad3;os;am4ra3;in;as;fghaGlDmBn6r4ustr3zerbaij2;al0ia;genti3men0uba;na;dorra,g5t3;arct7igua and barbu3;da;o3uil3;la;er3;ica;b3ger0;an0;ia;ni3;st2;an",
  "FirstName": "true¦aTblair,cQdOfrancoZgabMhinaLilya,jHkClBm6ni4quinn,re3s0;h0umit,yd;ay,e0iloh;a,lby;g9ne;co,ko0;!s;a1el0ina,org6;!okuhF;ds,naia,r1tt0xiB;i,y;ion,lo;ashawn,eif,uca;a3e1ir0rM;an;lsFn0rry;dall,yat5;i,sD;a0essIie,ude;i1m0;ie,mG;me;ta;rie0y;le;arcy,ev0;an,on;as1h0;arl8eyenne;ey,sidy;drien,kira,l4nd1ubr0vi;ey;i,r0;a,e0;a,y;ex2f1o0;is;ie;ei,is",
  "WeekDay": "true¦fri2mon2s1t0wednesd3;hurs1ues1;aturd1und1;!d0;ay0;!s",
  "Month": "true¦dec0february,july,nov0octo1sept0;em0;ber",
  "Date": "true¦ago,on4som4t1week0yesterd5; end,ends;mr1o0;d2morrow;!w;ed0;ay",
  "Duration": "true¦centurAd8h7m5q4se3w1y0;ear8r8;eek0k7;!end,s;ason,c5;tr,uarter;i0onth3;llisecond2nute2;our1r1;ay0ecade0;!s;ies,y",
  "FemaleName": "true¦0:J7;1:JB;2:IJ;3:IK;4:J1;5:IO;6:JS;7:JO;8:HB;9:JK;A:H4;B:I2;C:IT;D:JH;E:IX;F:BA;G:I4;aGTbFLcDRdD0eBMfB4gADh9Ti9Gj8Dk7Cl5Wm48n3Lo3Hp33qu32r29s15t0Eu0Cv02wVxiTyOzH;aLeIineb,oHsof3;e3Sf3la,ra;h2iKlIna,ynH;ab,ep;da,ma;da,h2iHra;nab;aKeJi0FolB7uIvH;et8onDP;i0na;le0sen3;el,gm3Hn,rGLs8W;aoHme0nyi;m5XyAD;aMendDZhiDGiH;dele9lJnH;if48niHo0;e,f47;a,helmi0lHma;a,ow;ka0nB;aNeKiHusa5;ck84kIl8oleAviH;anFenJ4;ky,toriBK;da,lA8rHs0;a,nHoniH9;a,iFR;leHnesH9;nILrH;i1y;g9rHs6xHA;su5te;aYeUhRiNoLrIuHy2;i,la;acJ3iHu0J;c3na,sH;hFta;nHr0F;iFya;aJffaEOnHs6;a,gtiH;ng;!nFSra;aIeHomasi0;a,l9Oo8Ares1;l3ndolwethu;g9Fo88rIssH;!a,ie;eHi,ri7;sa,za;bOlMmKnIrHs6tia0wa0;a60yn;iHya;a,ka,s6;arFe2iHm77ra;!ka;a,iH;a,t6;at6it6;a0Ecarlett,e0AhWiSkye,neza0oQri,tNuIyH;bIGlvi1;ha,mayIJniAsIzH;an3Net8ie,y;anHi7;!a,e,nH;aCe;aIeH;fan4l5Dphan6E;cI5r5;b3fiAAm0LnHphi1;d2ia,ja,ya;er2lJmon1nIobh8QtH;a,i;dy;lETv3;aMeIirHo0risFDy5;a,lDM;ba,e0i5lJrH;iHr6Jyl;!d8Ifa;ia,lDZ;hd,iMki2nJrIu0w0yH;la,ma,na;i,le9on,ron,yn;aIda,ia,nHon;a,on;!ya;k6mH;!aa;lJrItaye82vH;da,inj;e0ife;en1i0ma;anA9bLd5Oh1SiBkKlJmInd2rHs6vannaC;aCi0;ant6i2;lDOma,ome;ee0in8Tu2;in1ri0;a05eZhXiUoHuthDM;bScRghQl8LnPsJwIxH;anB3ie,y;an,e0;aIeHie,lD;ann7ll1marDGtA;!lHnn1;iHyn;e,nH;a,dF;da,i,na;ayy8G;hel67io;bDRerAyn;a,cIkHmas,nFta,ya;ki,o;h8Xki;ea,iannGMoH;da,n1P;an0bJemFgi0iInHta,y0;a8Bee;han86na;a,eH;cHkaC;a,ca;bi0chIe,i0mo0nHquETy0;di,ia;aERelHiB;!e,le;een4ia0;aPeOhMiLoJrHute6A;iHudenCV;scil3LyamvaB;lHrt3;i0ly;a,paluk;ilome0oebe,ylH;is,lis;ggy,nelope,r5t2;ige,m0VnKo5rvaDMtIulH;a,et8in1;ricHt4T;a,e,ia;do2i07;ctav3dIfD3is6ksa0lHphD3umC5yunbileg;a,ga,iv3;eHvAF;l3t8;aWeUiMoIurHy5;!ay,ul;a,eJor,rIuH;f,r;aCeEma;ll1mi;aNcLhariBQkKlaJna,sHta,vi;anHha;ur;!y;a,iDZki;hoGk9YolH;a,e4P;!mh;hir,lHna,risDEsreE;!a,iDDlBV;asuMdLh3i6Dl5nKomi7rgEVtH;aHhal4;lHs6;i1ya;cy,et8;e9iF0ya;nngu2X;a0Ackenz4e02iMoJrignayani,uriDJyH;a,rH;a,iOlNna,tG;bi0i2llBJnH;a,iH;ca,ka,qD9;a,cUdo4ZkaTlOmi,nMrItzi,yH;ar;aJiIlH;anET;am;!l,nB;dy,eHh,n4;nhGrva;aKdJe0iCUlH;iHy;cent,e;red;!gros;!e5;ae5hH;ae5el3Z;ag5DgNi,lKrH;edi7AiIjem,on,yH;em,l;em,sCG;an4iHliCF;nHsCJ;a,da;!an,han;b09cASd07e,g05ha,i04ja,l02n00rLsoum5YtKuIv84xBKyHz4;bell,ra,soBB;d7rH;a,eE;h8Gild1t4;a,cUgQiKjor4l7Un4s6tJwa,yH;!aHbe6Xja9lAE;m,nBL;a,ha,in1;!aJbCGeIja,lDna,sHt63;!a,ol,sa;!l1D;!h,mInH;!a,e,n1;!awit,i;arJeIie,oHr48ueri8;!t;!ry;et46i3B;el4Xi7Cy;dHon,ue5;akranAy;ak,en,iHlo3S;a,ka,nB;a,re,s4te;daHg4;!l3E;alDd4elHge,isDJon0;ei9in1yn;el,le;a0Ne0CiXoQuLyH;d3la,nH;!a,dIe2OnHsCT;!a,e2N;a,sCR;aD4cJel0Pis1lIna,pHz;e,iA;a,u,wa;iHy;a0Se,ja,l2NnB;is,l1UrItt1LuHvel4;el5is1;aKeIi7na,rH;aADi7;lHn1tA;ei;!in1;aTbb9HdSepa,lNnKsJvIzH;!a,be5Ret8z4;!ia;a,et8;!a,dH;a,sHy;ay,ey,i,y;a,iJja,lH;iHy;aA8e;!aH;!nF;ia,ya;!nH;!a,ne;aPda,e0iNjYla,nMoKsJtHx93y5;iHt4;c3t3;e2PlCO;la,nHra;a,ie,o2;a,or1;a,gh,laH;!ni;!h,nH;a,d2e,n5V;cOdon9DiNkes6mi9Gna,rMtJurIvHxmi,y5;ern1in3;a,e5Aie,yn;as6iIoH;nya,ya;fa,s6;a,isA9;a,la;ey,ie,y;a04eZhXiOlASoNrJyH;lHra;a,ee,ie;istHy6I;a,en,iIyH;!na;!e,n5F;nul,ri,urtnB8;aOerNlB7mJrHzzy;a,stH;en,in;!berlImernH;aq;eHi,y;e,y;a,stE;!na,ra;aHei2ongordzol;dij1w5;el7UiKjsi,lJnIrH;a,i,ri;d2na,za;ey,i,lBLs4y;ra,s6;biAcARdiat7MeBAiSlQmPnyakuma1DrNss6NtKviAyH;!e,lH;a,eH;e,i8T;!a6HeIhHi4TlDri0y;ar8Her8Hie,leErBAy;!lyn8Ori0;a,en,iHl5Xoli0yn;!ma,nFs95;a5il1;ei8Mi,lH;e,ie;a,tl6O;a0AeZiWoOuH;anMdLlHst88;es,iH;a8NeHs8X;!n9tH;!a,te;e5Mi3My;a,iA;!anNcelDdMelGhan7VleLni,sIva0yH;a,ce;eHie;fHlDph7Y;a,in1;en,n1;i7y;!a,e,n45;lHng;!i1DlH;!i1C;anNle0nKrJsH;i8JsH;!e,i8I;i,ri;!a,elGif2CnH;a,et8iHy;!e,f2A;a,eJiInH;a,eIiH;e,n1;!t8;cMda,mi,nIque4YsminFvie2y9zH;min7;a7eIiH;ce,e,n1s;!lHs82t0F;e,le;inIk6HlDquelH;in1yn;da,ta;da,lRmPnOo0rNsIvaHwo0zaro;!a0lu,na;aJiIlaHob89;!n9R;do2;belHdo2;!a,e,l3B;a7Ben1i0ma;di2es,gr72ji;a9elBogH;en1;a,e9iHo0se;a0na;aSeOiJoHus7Kyacin2C;da,ll4rten24snH;a,i9U;lImaH;ri;aIdHlaI;a,egard;ry;ath1BiJlInrietArmi9sH;sa,t1A;en2Uga,mi;di;bi2Fil8MlNnMrJsItHwa,yl8M;i5Tt4;n60ti;iHmo51ri53;etH;!te;aCnaC;a,ey,l4;a02eWiRlPoNrKunJwH;enHyne1R;!dolD;ay,el;acieIetHiselB;a,chE;!la;ld1CogooH;sh;adys,enHor3yn2K;a,da,na;aKgi,lIna,ov8EselHta;a,e,le;da,liH;an;!n0;mLnJorgIrH;ald5Si,m3Etrud7;et8i4X;a,eHna;s29vieve;ma;bIle,mHrnet,yG;al5Si5;iIrielH;a,l1;!ja;aTeQiPlorOoz3rH;anJeIiH;da,eB;da,ja;!cH;esIiHoi0P;n1s66;!ca;a,enc3;en,o0;lIn0rnH;anB;ec3ic3;jr,nArKtHy7;emIiHma,oumaA;ha,ma,n;eh;ah,iBrah,za0;cr4Rd0Re0Qi0Pk0Ol07mXn54rUsOtNuMvHwa;aKelIiH;!e,ta;inFyn;!a;!ngel4V;geni1ni47;h5Yien9ta;mLperanKtH;eIhHrel5;er;l31r7;za;a,eralB;iHma,ne4Lyn;cHka,n;a,ka;aPeNiKmH;aHe21ie,y;!li9nuH;elG;lHn1;e7iHy;a,e,ja;lHrald;da,y;!nue5;aWeUiNlMma,no2oKsJvH;a,iH;na,ra;a,ie;iHuiH;se;a,en,ie,y;a0c3da,e,f,nMsJzaH;!betHveA;e,h;aHe,ka;!beH;th;!a,or;anor,nH;!a,i;!in1na;ate1Rta;leEs6;vi;eIiHna,wi0;e,th;l,n;aYeMh3iLjeneKoH;lor5Vminiq4Ln3FrHtt4;a,eEis,la,othHthy;ea,y;ba;an09naCon9ya;anQbPde,eOiMlJmetr3nHsir5M;a,iH;ce,se;a,iIla,orHphi9;es,is;a,l6F;dHrdH;re;!d5Ena;!b2ForaCraC;a,d2nH;!a,e;hl3i0l0GmNnLphn1rIvi1WyH;le,na;a,by,cIia,lH;a,en1;ey,ie;a,et8iH;!ca,el1Aka,z;arHia;is;a0Re0Nh04i02lUoJristIynH;di,th3;al,i0;lPnMrIurH;tn1D;aJd2OiHn2Ori9;!nH;a,e,n1;!l4;cepci5Cn4sH;tanHuelo;ce,za;eHleE;en,t8;aJeoIotH;il54;!pat2;ir7rJudH;et8iH;a,ne;a,e,iH;ce,sZ;a2er2ndH;i,y;aReNloe,rH;isJyH;stH;al;sy,tH;a1Sen,iHy;an1e,n1;deJlseIrH;!i7yl;a,y;li9;nMrH;isKlImH;ai9;a,eHot8;n1t8;!sa;d2elGtH;al,elG;cIlH;es8i47;el3ilH;e,ia,y;itlYlXmilWndVrMsKtHy5;aIeIhHri0;er1IleErDy;ri0;a38sH;a37ie;a,iOlLmeJolIrH;ie,ol;!e,in1yn;lHn;!a,la;a,eIie,otHy;a,ta;ne,y;na,s1X;a0Ii0I;a,e,l1;isAl4;in,yn;a0Ke02iZlXoUrH;andi7eRiJoIyH;an0nn;nwDoke;an3HdgMgiLtH;n31tH;!aInH;ey,i,y;ny;d,t8;etH;!t7;an0e,nH;da,na;bbi7glarIlo07nH;iAn4;ka;ancHythe;a,he;an1Clja0nHsm3M;iAtH;ou;aWcVlinUniArPssOtJulaCvH;!erlH;ey,y;hJsy,tH;e,iHy7;e,na;!anH;ie,y;!ie;nItHyl;ha,ie;adIiH;ce;et8i9;ay,da;ca,ky;!triH;ce,z;rbJyaH;rmH;aa;a2o2ra;a2Ub2Od25g21i1Sj5l18m0Zn0Boi,r06sWtVuPvOwa,yIzH;ra,u0;aKes6gJlIn,seH;!l;in;un;!nH;a,na;a,i2K;drLguJrIsteH;ja;el3;stH;in1;a,ey,i,y;aahua,he0;hIi2Gja,miAs2DtrH;id;aMlIraqHt21;at;eIi7yH;!n;e,iHy;gh;!nH;ti;iJleIo6piA;ta;en,n1t8;aHelG;!n1J;a01dje5eZgViTjRnKohito,toHya;inet8nH;el5ia;te;!aKeIiHmJ;e,ka;!mHtt7;ar4;!belIliHmU;sa;!l1;a,eliH;ca;ka,sHta;a,sa;elHie;a,iH;a,ca,n1qH;ue;!tH;a,te;!bImHstasiMya;ar3;el;aLberKeliJiHy;e,l3naH;!ta;a,ja;!ly;hGiIl3nB;da;a,ra;le;aWba,ePiMlKthJyH;a,c3sH;a,on,sa;ea;iHys0N;e,s0M;a,cIn1sHza;a,e,ha,on,sa;e,ia,ja;c3is6jaKksaKna,sJxH;aHia;!nd2;ia,saH;nd2;ra;ia;i0nIyH;ah,na;a,is,naCoud;la;c6da,leEmNnLsH;haClH;inHyY;g,n;!h;a,o,slH;ey;ee;en;at6g4nIusH;ti0;es;ie;aWdiTelMrH;eJiH;anMenH;a,e,ne;an0;na;!aLeKiIyH;nn;a,n1;a,e;!ne;!iH;de;e,lDsH;on;yn;!lH;i9yn;ne;aKbIiHrL;!e,gaK;ey,i7y;!e;gaH;il;dKliyJradhIs6;ha;ya;ah;a,ya",
  "Honorific": "true¦director1field marsh2lieutenant1rear0sergeant major,vice0; admir1; gener0;al",
  "Adj|Gerund": "true¦0:3F;1:3H;2:31;3:2X;4:35;5:33;6:3C;7:2Z;8:36;9:29;a33b2Tc2Bd1Te1If19g12h0Zi0Rl0Nm0Gnu0Fo0Ap04rYsKtEuBvAw1Ayiel3;ar6e08;nBpA;l1Rs0B;fol3n1Zsett2;aEeDhrBi4ouc7rAwis0;e0Bif2oub2us0yi1;ea1SiA;l2vi1;l2mp0rr1J;nt1Vxi1;aMcreec7enten2NhLkyrocke0lo0Vmi2oJpHtDuBweA;e0Ul2;pp2ArA;gi1pri5roun3;aBea8iAri2Hun9;mula0r4;gge4rA;t2vi1;ark2eAraw2;e3llb2F;aAot7;ki1ri1;i9oc29;dYtisf6;aEeBive0oAus7;a4l2;assu4defi9fres7ig9juve07mai9s0vAwar3;ea2italiAol1G;si1zi1;gi1ll6mb2vi1;a6eDier23lun1VrAun2C;eBoA;mi5vo1Z;ce3s5vai2;n3rpleA;xi1;ffCpWutBverAwi1;arc7lap04p0Pri3whel8;goi1l6st1J;en3sA;et0;m2Jrtu4;aEeDiCoBuAyst0L;mb2;t1Jvi1;s5tiga0;an1Rl0n3smeri26;dAtu4;de9;aCeaBiAo0U;fesa0Tvi1;di1ni1;c1Fg19s0;llumiGmFnArri0R;cDfurHsCtBviA;go23ti1;e1Oimi21oxica0rig0V;pi4ul0;orpo20r0K;po5;na0;eaBorr02umilA;ia0;li1rtwar8;lFrA;atiDipCoBuelA;i1li1;undbrea10wi1;pi1;f6ng;a4ea8;a3etc7it0lEoCrBulfA;il2;ee1FighXust1L;rAun3;ebo3thco8;aCoA;a0wA;e4i1;mi1tte4;lectrJmHnExA;aCci0hBis0pA;an3lo3;aOila1B;c0spe1A;ab2coura0CdBergi13ga0Clive9ric7s02tA;hral2i0J;ea4u4;barras5er09pA;owe4;if6;aQeIiBrA;if0;sAzz6;aEgDhearCsen0tA;rAur11;ac0es5;te9;us0;ppoin0r8;biliGcDfi9gra3ligh0mBpres5sAvasG;erE;an3ea9orA;ali0L;a6eiBli9rA;ea5;vi1;ta0;maPri1s7un0zz2;aPhMlo5oAripp2ut0;mGnArrespon3;cer9fDspi4tA;inBrA;as0ibu0ol2;ui1;lic0u5;ni1;fDmCpA;eAromi5;l2ti1;an3;or0;aAil2;llenAnAr8;gi1;l8ptAri1;iva0;aff2eGin3lFoDrBuA;d3st2;eathtaAui5;ki1;gg2i2o8ri1unA;ci1;in3;co8wiA;lAtc7;de4;bsorVcOgonMlJmHnno6ppea2rFsA;pi4su4toA;nBun3;di1;is7;hi1;res0;li1;aFu5;si1;ar8lu4;ri1;mi1;iAzi1;zi1;cAhi1;eleDomA;moBpan6;yi1;da0;ra0;ti1;bi1;ng",
  "Comparable": "true¦0:3C;1:3Q;2:3F;a3Tb3Cc33d2Te2Mf2Ag1Wh1Li1Fj1Ek1Bl13m0Xn0So0Rp0Iqu0Gr07sHtCug0vAw4y3za0Q;el10ouN;ary,e6hi5i3ry;ck0Cde,l3n1ry,se;d,y;ny,te;a3i3R;k,ry;a3erda2ulgar;gue,in,st;a6en2Xhi5i4ouZr3;anqu2Cen1ue;dy,g36me0ny;ck,rs28;ll,me,rt,wd3I;aRcaPeOhMiLkin0BlImGoEpDt6u4w3;eet,ift;b3dd0Wperfi21rre28;sta26t21;a8e7iff,r4u3;pUr1;a4ict,o3;ng;ig2Vn0N;a1ep,rn;le,rk,te0;e1Si2Vright0;ci1Yft,l3on,re;emn,id;a3el0;ll,rt;e4i3y;g2Mm0Z;ek,nd2T;ck24l0mp1L;a3iRrill,y;dy,l01rp;ve0Jxy;n1Jr3;ce,y;d,fe,int0l1Hv0V;a8e6i5o3ude;mantic,o19sy,u3;gh;pe,t1P;a3d,mo0A;dy,l;gg4iFndom,p3re,w;id;ed;ai2i3;ck,et;hoAi1Fl9o8r5u3;ny,r3;e,p11;egna2ic4o3;fouSud;ey,k0;liXor;ain,easa2;ny;dd,i0ld,ranL;aive,e5i4o3u14;b0Sisy,rm0Ysy;bb0ce,mb0R;a3r1w;r,t;ad,e5ild,o4u3;nda12te;ist,o1;a4ek,l3;low;s0ty;a8e7i6o3ucky;f0Jn4o15u3ve0w10y0N;d,sy;e0g;ke0l,mp,tt0Eve0;e1Qwd;me,r3te;ge;e4i3;nd;en;ol0ui19;cy,ll,n3;secu6t3;e3ima4;llege2rmedia3;te;re;aAe7i6o5u3;ge,m3ng1C;bYid;me0t;gh,l0;a3fXsita2;dy,rWv3;en0y;nd13ppy,r3;d3sh;!y;aFenEhCiBlAoofy,r3;a8e6i5o3ue0Z;o3ss;vy;m,s0;at,e3y;dy,n;nd,y;ad,ib,ooD;a2d1;a3o3;st0;tDuiS;u1y;aCeebBi9l8o6r5u3;ll,n3r0N;!ny;aCesh,iend0;a3nd,rmD;my;at,ir7;erce,nan3;ci9;le;r,ul3;ty;a6erie,sse4v3xtre0B;il;nti3;al;r4s3;tern,y;ly,th0;appZe9i5ru4u3;mb;nk;r5vi4z3;zy;ne;e,ty;a3ep,n9;d3f,r;!ly;agey,h8l7o5r4u3;dd0r0te;isp,uel;ar3ld,mmon,st0ward0zy;se;evKou1;e3il0;ap,e3;sy;aHiFlCoAr5u3;ff,r0sy;ly;a6i3oad;g4llia2;nt;ht;sh,ve;ld,un3;cy;a4o3ue;nd,o1;ck,nd;g,tt3;er;d,ld,w1;dy;bsu6ng5we3;so3;me;ry;rd",
  "Adverb": "true¦a08b05d00eYfSheQinPjustOkinda,likewiZmMnJoEpCquite,r9s5t2u0very,well;ltima01p0; to,wards5;h1iny bit,o0wiO;o,t6;en,us;eldom,o0uch;!me1rt0; of;how,times,w0C;a1e0;alS;ndomRth05;ar excellenEer0oint blank; Lhaps;f3n0utright;ce0ly;! 0;ag05moX; courGten;ewJo0; longWt 0;onHwithstand9;aybe,eanwhiNore0;!ovT;! aboX;deed,steY;lla,n0;ce;or3u0;ck1l9rther0;!moK;ing; 0evK;exampCgood,suH;n mas0vI;se;e0irect2; 2fini0;te0;ly;juAtrop;ackward,y 0;far,no0; means,w; GbroFd nauseam,gEl7ny5part,s4t 2w0;ay,hi0;le;be7l0mo7wor7;arge,ea6; soon,i4;mo0way;re;l 3mo2ongsi1ready,so,togeth0ways;er;de;st;b1t0;hat;ut;ain;ad;lot,posteriori",
  "Conjunction": "true¦aXbTcReNhowMiEjust00noBo9p8supposing,t5wh0yet;e1il0o3;e,st;n1re0thN; if,by,vM;evL;h0il,o;erefOo0;!uU;lus,rovided th9;r0therwiM;! not; mattEr,w0;! 0;since,th4w7;f4n0; 0asmuch;as mIcaForder t0;h0o;at;! 0;only,t0w0;hen;!ev3;ith2ven0;! 0;if,tB;er;o0uz;s,z;e0ut,y the time;cau1f0;ore;se;lt3nd,s 0;far1if,m0soon1t2;uch0; as;hou0;gh",
  "Currency": "true¦$,aud,bQcOdJeurIfHgbp,hkd,iGjpy,kElDp8r7s3usd,x2y1z0¢,£,¥,ден,лв,руб,฿,₡,₨,€,₭,﷼;lotyQł;en,uanP;af,of;h0t5;e0il5;k0q0;elK;oubleJp,upeeJ;e2ound st0;er0;lingG;n0soF;ceEnies;empi7i7;n,r0wanzaCyatC;!onaBw;ls,nr;ori7ranc9;!os;en3i2kk,o0;b0ll2;ra5;me4n0rham4;ar3;e0ny;nt1;aht,itcoin0;!s",
  "Determiner": "true¦aBboth,d9e6few,le5mu8neiDplenty,s4th2various,wh0;at0ich0;evC;a0e4is,ose;!t;everal,ome;!ast,s;a1l0very;!se;ch;e0u;!s;!n0;!o0y;th0;er",
  "Adj|Present": "true¦a07b04cVdQeNfJhollIidRlEmCnarrIoBp9qua8r7s3t2uttFw0;aKet,ro0;ng,u08;endChin;e2hort,l1mooth,our,pa9tray,u0;re,speU;i2ow;cu6da02leSpaN;eplica01i02;ck;aHerfePr0;eseUime,omV;bscu1pen,wn;atu0e3odeH;re;a2e1ive,ow0;er;an;st,y;ow;a2i1oul,r0;ee,inge;rm;iIke,ncy,st;l1mpty,x0;emHpress;abo4ic7;amp,e2i1oub0ry,ull;le;ffu9re6;fu8libe0;raE;alm,l5o0;mpleCn3ol,rr1unterfe0;it;e0u7;ct;juga8sum7;ea1o0;se;n,r;ankru1lu0;nt;pt;li2pproxi0rticula1;ma0;te;ght",
  "Person|Adj": "true¦b3du2earnest,frank,mi2r0san1woo1;an0ich,u1;dy;sty;ella,rown",
  "Modal": "true¦c5lets,m4ought3sh1w0;ill,o5;a0o4;ll,nt;! to,a;ight,ust;an,o0;uld",
  "Verb": "true¦born,cannot,gonna,has,keep tabs,msg",
  "Person|Verb": "true¦b8ch7dr6foster,gra5ja9lan4ma2ni9ollie,p1rob,s0wade;kip,pike,t5ue;at,eg,ier2;ck,r0;k,shal;ce;ce,nt;ew;ase,u1;iff,l1ob,u0;ck;aze,ossom",
  "Person|Date": "true¦a2j0sep;an0une;!uary;p0ugust,v0;ril"
};
const BASE = 36;
const seq = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const cache = seq.split("").reduce(function(h2, c2, i2) {
  h2[c2] = i2;
  return h2;
}, {});
const toAlphaCode = function(n2) {
  if (seq[n2] !== void 0) {
    return seq[n2];
  }
  let places2 = 1;
  let range = BASE;
  let s2 = "";
  for (; n2 >= range; n2 -= range, places2++, range *= BASE) {
  }
  while (places2--) {
    const d2 = n2 % BASE;
    s2 = String.fromCharCode((d2 < 10 ? 48 : 55) + d2) + s2;
    n2 = (n2 - d2) / BASE;
  }
  return s2;
};
const fromAlphaCode = function(s2) {
  if (cache[s2] !== void 0) {
    return cache[s2];
  }
  let n2 = 0;
  let places2 = 1;
  let range = BASE;
  let pow = 1;
  for (; places2 < s2.length; n2 += range, places2++, range *= BASE) {
  }
  for (let i2 = s2.length - 1; i2 >= 0; i2--, pow *= BASE) {
    let d2 = s2.charCodeAt(i2) - 48;
    if (d2 > 10) {
      d2 -= 7;
    }
    n2 += d2 * pow;
  }
  return n2;
};
const encoding = {
  toAlphaCode,
  fromAlphaCode
};
const symbols = function(t2) {
  const reSymbol = new RegExp("([0-9A-Z]+):([0-9A-Z]+)");
  for (let i2 = 0; i2 < t2.nodes.length; i2++) {
    const m2 = reSymbol.exec(t2.nodes[i2]);
    if (!m2) {
      t2.symCount = i2;
      break;
    }
    t2.syms[encoding.fromAlphaCode(m2[1])] = encoding.fromAlphaCode(m2[2]);
  }
  t2.nodes = t2.nodes.slice(t2.symCount, t2.nodes.length);
};
const indexFromRef = function(trie, ref, index2) {
  const dnode = encoding.fromAlphaCode(ref);
  if (dnode < trie.symCount) {
    return trie.syms[dnode];
  }
  return index2 + dnode + 1 - trie.symCount;
};
const toArray$2 = function(trie) {
  const all2 = [];
  const crawl = (index2, pref) => {
    let node = trie.nodes[index2];
    if (node[0] === "!") {
      all2.push(pref);
      node = node.slice(1);
    }
    const matches2 = node.split(/([A-Z0-9,]+)/g);
    for (let i2 = 0; i2 < matches2.length; i2 += 2) {
      const str = matches2[i2];
      const ref = matches2[i2 + 1];
      if (!str) {
        continue;
      }
      const have = pref + str;
      if (ref === "," || ref === void 0) {
        all2.push(have);
        continue;
      }
      const newIndex = indexFromRef(trie, ref, index2);
      crawl(newIndex, have);
    }
  };
  crawl(0, "");
  return all2;
};
const unpack$1 = function(str) {
  const trie = {
    nodes: str.split(";"),
    syms: [],
    symCount: 0
  };
  if (str.match(":")) {
    symbols(trie);
  }
  return toArray$2(trie);
};
const unpack = function(str) {
  if (!str) {
    return {};
  }
  const obj = str.split("|").reduce((h2, s2) => {
    const arr = s2.split("¦");
    h2[arr[0]] = arr[1];
    return h2;
  }, {});
  const all2 = {};
  Object.keys(obj).forEach(function(cat) {
    const arr = unpack$1(obj[cat]);
    if (cat === "true") {
      cat = true;
    }
    for (let i2 = 0; i2 < arr.length; i2++) {
      const k2 = arr[i2];
      if (all2.hasOwnProperty(k2) === true) {
        if (Array.isArray(all2[k2]) === false) {
          all2[k2] = [all2[k2], cat];
        } else {
          all2[k2].push(cat);
        }
      } else {
        all2[k2] = cat;
      }
    }
  });
  return all2;
};
const prp = ["Possessive", "Pronoun"];
const misc$5 = {
  // numbers
  "20th century fox": "Organization",
  "7 eleven": "Organization",
  "motel 6": "Organization",
  g8: "Organization",
  vh1: "Organization",
  "76ers": "SportsTeam",
  "49ers": "SportsTeam",
  q1: "Date",
  q2: "Date",
  q3: "Date",
  q4: "Date",
  km2: "Unit",
  m2: "Unit",
  dm2: "Unit",
  cm2: "Unit",
  mm2: "Unit",
  mile2: "Unit",
  in2: "Unit",
  yd2: "Unit",
  ft2: "Unit",
  m3: "Unit",
  dm3: "Unit",
  cm3: "Unit",
  in3: "Unit",
  ft3: "Unit",
  yd3: "Unit",
  // ampersands
  "at&t": "Organization",
  "black & decker": "Organization",
  "h & m": "Organization",
  "johnson & johnson": "Organization",
  "procter & gamble": "Organization",
  "ben & jerry's": "Organization",
  "&": "Conjunction",
  //pronouns
  i: ["Pronoun", "Singular"],
  he: ["Pronoun", "Singular"],
  she: ["Pronoun", "Singular"],
  it: ["Pronoun", "Singular"],
  they: ["Pronoun", "Plural"],
  we: ["Pronoun", "Plural"],
  was: ["Copula", "PastTense"],
  is: ["Copula", "PresentTense"],
  are: ["Copula", "PresentTense"],
  am: ["Copula", "PresentTense"],
  were: ["Copula", "PastTense"],
  // possessive pronouns
  her: prp,
  his: prp,
  hers: prp,
  their: prp,
  theirs: prp,
  themselves: prp,
  your: prp,
  our: prp,
  ours: prp,
  my: prp,
  its: prp,
  // misc
  vs: ["Conjunction", "Abbreviation"],
  if: ["Condition", "Preposition"],
  closer: "Comparative",
  closest: "Superlative",
  much: "Adverb",
  may: "Modal",
  // irregular conjugations with two forms
  babysat: "PastTense",
  blew: "PastTense",
  drank: "PastTense",
  drove: "PastTense",
  forgave: "PastTense",
  skiied: "PastTense",
  spilt: "PastTense",
  stung: "PastTense",
  swam: "PastTense",
  swung: "PastTense",
  guaranteed: "PastTense",
  shrunk: "PastTense",
  // support 'near', 'nears', 'nearing'
  nears: "PresentTense",
  nearing: "Gerund",
  neared: "PastTense",
  no: ["Negative", "Expression"]
  // '-': 'Preposition', //june - july
  // there: 'There'
};
const frozenLex = {
  "20th century fox": "Organization",
  "7 eleven": "Organization",
  "motel 6": "Organization",
  "excuse me": "Expression",
  "financial times": "Organization",
  "guns n roses": "Organization",
  "la z boy": "Organization",
  "labour party": "Organization",
  "new kids on the block": "Organization",
  "new york times": "Organization",
  "the guess who": "Organization",
  "thin lizzy": "Organization",
  "prime minister": "Actor",
  "free market": "Singular",
  "lay up": "Singular",
  "living room": "Singular",
  "living rooms": "Plural",
  "spin off": "Singular",
  "appeal court": "Uncountable",
  "cold war": "Uncountable",
  "gene pool": "Uncountable",
  "machine learning": "Uncountable",
  "nail polish": "Uncountable",
  "time off": "Uncountable",
  "take part": "Infinitive",
  "bill gates": "Person",
  "doctor who": "Person",
  "dr who": "Person",
  "he man": "Person",
  "iron man": "Person",
  "kid cudi": "Person",
  "run dmc": "Person",
  "rush limbaugh": "Person",
  "snow white": "Person",
  "tiger woods": "Person",
  "brand new": "Adjective",
  "en route": "Adjective",
  "left wing": "Adjective",
  "off guard": "Adjective",
  "on board": "Adjective",
  "part time": "Adjective",
  "right wing": "Adjective",
  "so called": "Adjective",
  "spot on": "Adjective",
  "straight forward": "Adjective",
  "super duper": "Adjective",
  "tip top": "Adjective",
  "top notch": "Adjective",
  "up to date": "Adjective",
  "win win": "Adjective",
  "brooklyn nets": "SportsTeam",
  "chicago bears": "SportsTeam",
  "houston astros": "SportsTeam",
  "houston dynamo": "SportsTeam",
  "houston rockets": "SportsTeam",
  "houston texans": "SportsTeam",
  "minnesota twins": "SportsTeam",
  "orlando magic": "SportsTeam",
  "san antonio spurs": "SportsTeam",
  "san diego chargers": "SportsTeam",
  "san diego padres": "SportsTeam",
  "iron maiden": "ProperNoun",
  "isle of man": "Country",
  "united states": "Country",
  "united states of america": "Country",
  "prince edward island": "Region",
  "cedar breaks": "Place",
  "cedar falls": "Place",
  "point blank": "Adverb",
  "tiny bit": "Adverb",
  "by the time": "Conjunction",
  "no matter": "Conjunction",
  "civil wars": "Plural",
  "credit cards": "Plural",
  "default rates": "Plural",
  "free markets": "Plural",
  "head starts": "Plural",
  "home runs": "Plural",
  "lay ups": "Plural",
  "phone calls": "Plural",
  "press releases": "Plural",
  "record labels": "Plural",
  "soft serves": "Plural",
  "student loans": "Plural",
  "tax returns": "Plural",
  "tv shows": "Plural",
  "video games": "Plural",
  "took part": "PastTense",
  "takes part": "PresentTense",
  "taking part": "Gerund",
  "taken part": "Participle",
  "light bulb": "Noun",
  "rush hour": "Noun",
  "fluid ounce": "Unit",
  "the rolling stones": "Organization"
};
const emoticons = [
  ":(",
  ":)",
  ":P",
  ":p",
  ":O",
  ";(",
  ";)",
  ";P",
  ";p",
  ";O",
  ":3",
  ":|",
  ":/",
  ":\\",
  ":$",
  ":*",
  ":@",
  ":-(",
  ":-)",
  ":-P",
  ":-p",
  ":-O",
  ":-3",
  ":-|",
  ":-/",
  ":-\\",
  ":-$",
  ":-*",
  ":-@",
  ":^(",
  ":^)",
  ":^P",
  ":^p",
  ":^O",
  ":^3",
  ":^|",
  ":^/",
  ":^\\",
  ":^$",
  ":^*",
  ":^@",
  "):",
  "(:",
  "$:",
  "*:",
  ")-:",
  "(-:",
  "$-:",
  "*-:",
  ")^:",
  "(^:",
  "$^:",
  "*^:",
  "<3",
  "</3",
  "<\\3",
  "=("
];
const suffixes$3 = {
  a: [
    [/(antenn|formul|nebul|vertebr|vit)a$/i, "$1ae"],
    [/ia$/i, "ia"]
  ],
  e: [
    [/(kn|l|w)ife$/i, "$1ives"],
    [/(hive)$/i, "$1s"],
    [/([m|l])ouse$/i, "$1ice"],
    [/([m|l])ice$/i, "$1ice"]
  ],
  f: [
    [/^(dwar|handkerchie|hoo|scar|whar)f$/i, "$1ves"],
    [/^((?:ca|e|ha|(?:our|them|your)?se|she|wo)l|lea|loa|shea|thie)f$/i, "$1ves"]
  ],
  i: [[/(octop|vir)i$/i, "$1i"]],
  m: [[/([ti])um$/i, "$1a"]],
  n: [[/^(oxen)$/i, "$1"]],
  o: [[/(al|ad|at|er|et|ed)o$/i, "$1oes"]],
  s: [
    [/(ax|test)is$/i, "$1es"],
    [/(alias|status)$/i, "$1es"],
    [/sis$/i, "ses"],
    [/(bu)s$/i, "$1ses"],
    [/(sis)$/i, "ses"],
    [/^(?!talis|.*hu)(.*)man$/i, "$1men"],
    [/(octop|vir|radi|nucle|fung|cact|stimul)us$/i, "$1i"]
  ],
  x: [
    [/(matr|vert|ind|cort)(ix|ex)$/i, "$1ices"],
    [/^(ox)$/i, "$1en"]
  ],
  y: [[/([^aeiouy]|qu)y$/i, "$1ies"]],
  z: [[/(quiz)$/i, "$1zes"]]
};
const addE = /([xsz]|ch|sh)$/;
const trySuffix = function(str) {
  const c2 = str[str.length - 1];
  if (suffixes$3.hasOwnProperty(c2) === true) {
    for (let i2 = 0; i2 < suffixes$3[c2].length; i2 += 1) {
      const reg = suffixes$3[c2][i2][0];
      if (reg.test(str) === true) {
        return str.replace(reg, suffixes$3[c2][i2][1]);
      }
    }
  }
  return null;
};
const pluralize = function(str = "", model2) {
  const { irregularPlurals: irregularPlurals2, uncountable: uncountable2 } = model2.two;
  if (uncountable2.hasOwnProperty(str)) {
    return str;
  }
  if (irregularPlurals2.hasOwnProperty(str)) {
    return irregularPlurals2[str];
  }
  const plural2 = trySuffix(str);
  if (plural2 !== null) {
    return plural2;
  }
  if (addE.test(str)) {
    return str + "es";
  }
  return str + "s";
};
const hasSwitch = /\|/;
const lexicon = misc$5;
const switches = {};
const tmpModel$1 = { two: { irregularPlurals, uncountable: {} } };
Object.keys(lexData).forEach((tag2) => {
  const wordsObj = unpack(lexData[tag2]);
  if (!hasSwitch.test(tag2)) {
    Object.keys(wordsObj).forEach((w) => {
      lexicon[w] = tag2;
    });
    return;
  }
  Object.keys(wordsObj).forEach((w) => {
    switches[w] = tag2;
    if (tag2 === "Noun|Verb") {
      const plural2 = pluralize(w, tmpModel$1);
      switches[plural2] = "Plural|Verb";
    }
  });
});
emoticons.forEach((str) => lexicon[str] = "Emoticon");
delete lexicon[""];
delete lexicon[null];
delete lexicon[" "];
const n = "Singular";
const noun$1 = {
  beforeTags: {
    Determiner: n,
    //the date
    Possessive: n,
    //his date
    Acronym: n,
    //u.s. state
    // ProperNoun:n,
    Noun: n,
    //nasa funding
    Adjective: n,
    //whole bottles
    // Verb:true, //save storm victims
    PresentTense: n,
    //loves hiking
    Gerund: n,
    //uplifting victims
    PastTense: n,
    //saved storm victims
    Infinitive: n,
    //profess love
    Date: n,
    //9pm show
    Ordinal: n,
    //first date
    Demonym: n
    //dutch map
  },
  afterTags: {
    Value: n,
    //date nine  -?
    Modal: n,
    //date would
    Copula: n,
    //fear is
    PresentTense: n,
    //babysitting sucks
    PastTense: n,
    //babysitting sucked
    // Noun:n, //talking therapy, planning process
    Demonym: n,
    //american touch
    Actor: n
    //dance therapist
  },
  // ownTags: { ProperNoun: n },
  beforeWords: {
    the: n,
    //the brands
    with: n,
    //with cakes
    without: n,
    //
    // was:n, //was time  -- was working
    // is:n, //
    of: n,
    //of power
    for: n,
    //for rats
    any: n,
    //any rats
    all: n,
    //all tips
    on: n,
    //on time
    // thing-ish verbs
    cut: n,
    //cut spending
    cuts: n,
    //cut spending
    increase: n,
    // increase funding
    decrease: n,
    //
    raise: n,
    //
    drop: n,
    //
    // give: n,//give parents
    save: n,
    //
    saved: n,
    //
    saves: n,
    //
    make: n,
    //
    makes: n,
    //
    made: n,
    //
    minus: n,
    //minus laughing
    plus: n,
    //
    than: n,
    //more than age
    another: n,
    //
    versus: n,
    //
    neither: n,
    //
    about: n,
    //about claims
    // strong adjectives
    favorite: n,
    //
    best: n,
    //
    daily: n,
    //
    weekly: n,
    //
    linear: n,
    //
    binary: n,
    //
    mobile: n,
    //
    lexical: n,
    //
    technical: n,
    //
    computer: n,
    //
    scientific: n,
    //
    security: n,
    //
    government: n,
    //
    popular: n,
    //
    formal: n,
    no: n,
    //no worries
    more: n,
    //more details
    one: n,
    //one flood
    let: n,
    //let fear
    her: n,
    //her boots
    his: n,
    //
    their: n,
    //
    our: n,
    //
    us: n,
    //served us drinks
    sheer: n,
    monthly: n,
    yearly: n,
    current: n,
    previous: n,
    upcoming: n,
    last: n,
    next: n,
    main: n,
    initial: n,
    final: n,
    beginning: n,
    end: n,
    top: n,
    bottom: n,
    future: n,
    past: n,
    major: n,
    minor: n,
    side: n,
    central: n,
    peripheral: n,
    public: n,
    private: n
  },
  afterWords: {
    of: n,
    //date of birth (preposition)
    system: n,
    aid: n,
    method: n,
    utility: n,
    tool: n,
    reform: n,
    therapy: n,
    philosophy: n,
    room: n,
    authority: n,
    says: n,
    said: n,
    wants: n,
    wanted: n,
    is: n,
    did: n,
    do: n,
    can: n,
    //parents can
    wise: n
    //service-wise
    // they: n,//snakes they
  }
};
const v = "Infinitive";
const verb = {
  beforeTags: {
    Modal: v,
    //would date
    Adverb: v,
    //quickly date
    Negative: v,
    //not date
    Plural: v
    //characters drink
    // ProperNoun: vb,//google thought
  },
  afterTags: {
    Determiner: v,
    //flash the
    Adverb: v,
    //date quickly
    Possessive: v,
    //date his
    Reflexive: v,
    //resolve yourself
    // Noun:true, //date spencer
    Preposition: v,
    //date around, dump onto, grumble about
    // Conjunction: v, // dip to, dip through
    Cardinal: v,
    //cut 3 squares
    Comparative: v,
    //feel greater
    Superlative: v
    //feel greatest
  },
  beforeWords: {
    i: v,
    //i date
    we: v,
    //we date
    you: v,
    //you date
    they: v,
    //they date
    to: v,
    //to date
    please: v,
    //please check
    will: v,
    //will check
    have: v,
    had: v,
    would: v,
    could: v,
    should: v,
    do: v,
    did: v,
    does: v,
    can: v,
    must: v,
    us: v,
    me: v,
    let: v,
    even: v,
    when: v,
    help: v,
    //help combat
    // them: v,
    he: v,
    she: v,
    it: v,
    being: v,
    // prefixes
    bi: v,
    co: v,
    contra: v,
    de: v,
    inter: v,
    intra: v,
    mis: v,
    pre: v,
    out: v,
    counter: v,
    nobody: v,
    somebody: v,
    anybody: v,
    everybody: v
    // un: v,
    // over: v,
    // under: v,
  },
  afterWords: {
    the: v,
    //echo the
    me: v,
    //date me
    you: v,
    //date you
    him: v,
    //loves him
    us: v,
    //cost us
    her: v,
    //
    his: v,
    //
    them: v,
    //
    they: v,
    //
    it: v,
    //hope it
    himself: v,
    herself: v,
    itself: v,
    myself: v,
    ourselves: v,
    themselves: v,
    something: v,
    anything: v,
    a: v,
    //covers a
    an: v,
    //covers an
    // from: v, //ranges from
    up: v,
    //serves up
    down: v,
    //serves up
    by: v,
    // in: v, //bob in
    out: v,
    // on: v,
    off: v,
    under: v,
    what: v,
    //look what
    // when: v,//starts when
    // for:true, //settled for
    all: v,
    //shiver all night
    // conjunctions
    to: v,
    //dip to
    because: v,
    //
    although: v,
    //
    // after: v,
    // before: v,//
    how: v,
    //
    otherwise: v,
    //
    together: v,
    //fit together
    though: v,
    //
    into: v,
    //
    yet: v,
    //
    more: v,
    //kill more
    here: v,
    // look here
    there: v,
    //
    away: v
    //float away
  }
};
const clue$7 = {
  beforeTags: Object.assign({}, verb.beforeTags, noun$1.beforeTags, {}),
  afterTags: Object.assign({}, verb.afterTags, noun$1.afterTags, {}),
  beforeWords: Object.assign({}, verb.beforeWords, noun$1.beforeWords, {}),
  afterWords: Object.assign({}, verb.afterWords, noun$1.afterWords, {})
};
const jj$2 = "Adjective";
const adj$1 = {
  beforeTags: {
    Determiner: jj$2,
    //the detailed
    // Copula: jj, //is detailed
    Possessive: jj$2,
    //spencer's detailed
    Hyphenated: jj$2
    //rapidly-changing
  },
  afterTags: {
    // Noun: jj, //detailed plan, overwhelming evidence
    Adjective: jj$2
    //intoxicated little
  },
  beforeWords: {
    seem: jj$2,
    //seem prepared
    seemed: jj$2,
    seems: jj$2,
    feel: jj$2,
    //feel prepared
    feels: jj$2,
    felt: jj$2,
    stay: jj$2,
    appear: jj$2,
    appears: jj$2,
    appeared: jj$2,
    also: jj$2,
    over: jj$2,
    //over cooked
    under: jj$2,
    too: jj$2,
    //too insulting
    it: jj$2,
    //find it insulting
    but: jj$2,
    //nothing but frustrating
    still: jj$2,
    //still scared
    // adverbs that are adjective-ish
    really: jj$2,
    //really damaged
    quite: jj$2,
    well: jj$2,
    very: jj$2,
    truly: jj$2,
    how: jj$2,
    //how slow
    deeply: jj$2,
    hella: jj$2,
    // always: jj,
    // never: jj,
    profoundly: jj$2,
    extremely: jj$2,
    so: jj$2,
    badly: jj$2,
    mostly: jj$2,
    totally: jj$2,
    awfully: jj$2,
    rather: jj$2,
    nothing: jj$2,
    //nothing secret,
    something: jj$2,
    //something wrong
    anything: jj$2,
    not: jj$2,
    //not swell
    me: jj$2,
    //called me swell
    is: jj$2,
    face: jj$2,
    //faces shocking revelations
    faces: jj$2,
    faced: jj$2,
    look: jj$2,
    looks: jj$2,
    looked: jj$2,
    reveal: jj$2,
    reveals: jj$2,
    revealed: jj$2,
    sound: jj$2,
    sounded: jj$2,
    sounds: jj$2,
    remains: jj$2,
    remained: jj$2,
    prove: jj$2,
    //would prove shocking
    proves: jj$2,
    proved: jj$2,
    becomes: jj$2,
    stays: jj$2,
    tastes: jj$2,
    taste: jj$2,
    smells: jj$2,
    smell: jj$2,
    gets: jj$2,
    //gets shocking snowfall
    grows: jj$2,
    as: jj$2,
    rings: jj$2,
    radiates: jj$2,
    conveys: jj$2,
    convey: jj$2,
    conveyed: jj$2,
    of: jj$2
    // 'smacks of': jj,
    // 'reeks of': jj,
  },
  afterWords: {
    too: jj$2,
    //insulting too
    also: jj$2,
    //insulting too
    or: jj$2,
    //insulting or
    enough: jj$2,
    //cool enough
    as: jj$2
    //as shocking as
    //about: jj, //cool about
  }
};
const g$1 = "Gerund";
const gerund = {
  beforeTags: {
    // Verb: g, // loves shocking
    Adverb: g$1,
    //quickly shocking
    Preposition: g$1,
    //by insulting
    Conjunction: g$1
    //to insulting
  },
  afterTags: {
    Adverb: g$1,
    //shocking quickly
    Possessive: g$1,
    //shocking spencer's
    Person: g$1,
    //telling spencer
    Pronoun: g$1,
    //shocking him
    Determiner: g$1,
    //shocking the
    Copula: g$1,
    //shocking is
    Preposition: g$1,
    //dashing by, swimming in
    Conjunction: g$1,
    //insulting to
    Comparative: g$1
    //growing shorter
  },
  beforeWords: {
    been: g$1,
    keep: g$1,
    //keep going
    continue: g$1,
    //
    stop: g$1,
    //
    am: g$1,
    //am watching
    be: g$1,
    //be timing
    me: g$1,
    //got me thinking
    // action-words
    began: g$1,
    start: g$1,
    starts: g$1,
    started: g$1,
    stops: g$1,
    stopped: g$1,
    help: g$1,
    helps: g$1,
    avoid: g$1,
    avoids: g$1,
    love: g$1,
    //love painting
    loves: g$1,
    loved: g$1,
    hate: g$1,
    hates: g$1,
    hated: g$1
    // was:g,//was working
    // is:g,
    // be:g,
  },
  afterWords: {
    you: g$1,
    //telling you
    me: g$1,
    //
    her: g$1,
    //
    him: g$1,
    //
    his: g$1,
    //
    them: g$1,
    //
    their: g$1,
    // fighting their
    it: g$1,
    //dumping it
    this: g$1,
    //running this
    there: g$1,
    // swimming there
    on: g$1,
    // landing on
    about: g$1,
    // talking about
    for: g$1,
    // paying for
    up: g$1,
    //speeding up
    down: g$1
    //
  }
};
const g2 = "Gerund";
const jj$1 = "Adjective";
const clue$6 = {
  beforeTags: Object.assign({}, adj$1.beforeTags, gerund.beforeTags, {
    // Copula: jj,
    Imperative: g2,
    //recommend living in
    Infinitive: jj$1,
    //say charming things
    // PresentTense: g,
    Plural: g2
    //kids cutting
  }),
  afterTags: Object.assign({}, adj$1.afterTags, gerund.afterTags, {
    Noun: jj$1
    //shocking ignorance
    // Plural: jj, //shocking lies
  }),
  beforeWords: Object.assign({}, adj$1.beforeWords, gerund.beforeWords, {
    is: jj$1,
    are: g2,
    //is overflowing: JJ, are overflowing : VB ??
    was: jj$1,
    of: jj$1,
    //of varying
    suggest: g2,
    suggests: g2,
    suggested: g2,
    recommend: g2,
    recommends: g2,
    recommended: g2,
    imagine: g2,
    imagines: g2,
    imagined: g2,
    consider: g2,
    considered: g2,
    considering: g2,
    resist: g2,
    resists: g2,
    resisted: g2,
    avoid: g2,
    avoided: g2,
    avoiding: g2,
    except: jj$1,
    accept: jj$1,
    assess: g2,
    explore: g2,
    fear: g2,
    fears: g2,
    appreciate: g2,
    question: g2,
    help: g2,
    embrace: g2,
    with: jj$1
    //filled with daring
  }),
  afterWords: Object.assign({}, adj$1.afterWords, gerund.afterWords, {
    to: g2,
    not: g2,
    //trying not to car
    the: g2
    //sweeping the country
  })
};
const misc$4 = {
  beforeTags: {
    Determiner: void 0,
    //the premier university
    Cardinal: "Noun",
    //1950 convertable
    PhrasalVerb: "Adjective"
    //starts out fine
  },
  afterTags: {
    // Pronoun: 'Noun'//as an adult i
  }
};
const clue$5 = {
  beforeTags: Object.assign({}, adj$1.beforeTags, noun$1.beforeTags, misc$4.beforeTags),
  afterTags: Object.assign({}, adj$1.afterTags, noun$1.afterTags, misc$4.afterTags),
  beforeWords: Object.assign({}, adj$1.beforeWords, noun$1.beforeWords, {
    // are representative
    are: "Adjective",
    is: "Adjective",
    was: "Adjective",
    be: "Adjective",
    // phrasals
    off: "Adjective",
    //start off fine
    out: "Adjective"
    //comes out fine
  }),
  afterWords: Object.assign({}, adj$1.afterWords, noun$1.afterWords)
};
const past$1 = "PastTense";
const jj = "Adjective";
const adjPast = {
  beforeTags: {
    Adverb: past$1,
    //quickly detailed
    Pronoun: past$1,
    //he detailed
    ProperNoun: past$1,
    //toronto closed
    Auxiliary: past$1,
    Noun: past$1
    //eye closed  -- i guess.
  },
  afterTags: {
    Possessive: past$1,
    //hooked him
    Pronoun: past$1,
    //hooked me
    Determiner: past$1,
    //hooked the
    Adverb: past$1,
    //cooked perfectly
    Comparative: past$1,
    //closed higher
    Date: past$1,
    // alleged thursday
    Gerund: past$1
    //left dancing
  },
  beforeWords: {
    be: past$1,
    //be hooked vs be embarrassed
    who: past$1,
    //who lost
    get: jj,
    //get charged
    had: past$1,
    has: past$1,
    have: past$1,
    been: past$1,
    it: past$1,
    //it intoxicated him
    as: past$1,
    //as requested
    for: jj,
    //for discounted items
    more: jj,
    //more broken promises
    always: jj
  },
  afterWords: {
    by: past$1,
    //damaged by
    back: past$1,
    //charged back
    out: past$1,
    //charged out
    in: past$1,
    //crowded in
    up: past$1,
    //heated up
    down: past$1,
    //hammered down
    before: past$1,
    //
    after: past$1,
    //
    for: past$1,
    //settled for
    the: past$1,
    //settled the
    with: past$1,
    //obsessed with
    as: past$1,
    //known as
    on: past$1,
    //focused on
    at: past$1,
    //recorded at
    between: past$1,
    //settled between
    to: past$1,
    //dedicated to
    into: past$1,
    //pumped into
    us: past$1,
    //charged us
    them: past$1,
    //charged us
    his: past$1,
    //shared his
    her: past$1,
    //
    their: past$1,
    //
    our: past$1,
    //
    me: past$1,
    //
    about: jj
  }
};
const adjPast$1 = {
  beforeTags: Object.assign({}, adj$1.beforeTags, adjPast.beforeTags),
  afterTags: Object.assign({}, adj$1.afterTags, adjPast.afterTags),
  beforeWords: Object.assign({}, adj$1.beforeWords, adjPast.beforeWords),
  afterWords: Object.assign({}, adj$1.afterWords, adjPast.afterWords)
};
const misc$3 = {
  afterTags: {
    Noun: "Adjective",
    //ruling party
    Conjunction: void 0
    //clean and excellent
  }
};
const clue$4 = {
  beforeTags: Object.assign({}, adj$1.beforeTags, verb.beforeTags, {
    // always clean
    Adverb: void 0,
    Negative: void 0
  }),
  afterTags: Object.assign({}, adj$1.afterTags, verb.afterTags, misc$3.afterTags),
  beforeWords: Object.assign({}, adj$1.beforeWords, verb.beforeWords, {
    // have seperate contracts
    have: void 0,
    had: void 0,
    not: void 0,
    //went wrong, got wrong
    went: "Adjective",
    goes: "Adjective",
    got: "Adjective",
    // be sure
    be: "Adjective"
  }),
  afterWords: Object.assign({}, adj$1.afterWords, verb.afterWords, {
    to: void 0,
    //slick to the touch
    as: "Adjective"
    //pale as
  })
};
const misc$2 = {
  beforeTags: {
    Copula: "Gerund",
    PastTense: "Gerund",
    PresentTense: "Gerund",
    Infinitive: "Gerund"
  },
  afterTags: {
    Value: "Gerund"
    //maintaining 500
  },
  beforeWords: {
    are: "Gerund",
    were: "Gerund",
    be: "Gerund",
    no: "Gerund",
    without: "Gerund",
    //are you playing
    you: "Gerund",
    we: "Gerund",
    they: "Gerund",
    he: "Gerund",
    she: "Gerund",
    //stop us playing
    us: "Gerund",
    them: "Gerund"
  },
  afterWords: {
    // offering the
    the: "Gerund",
    this: "Gerund",
    that: "Gerund",
    //got me thinking
    me: "Gerund",
    us: "Gerund",
    them: "Gerund"
  }
};
const clue$3 = {
  beforeTags: Object.assign({}, gerund.beforeTags, noun$1.beforeTags, misc$2.beforeTags),
  afterTags: Object.assign({}, gerund.afterTags, noun$1.afterTags, misc$2.afterTags),
  beforeWords: Object.assign({}, gerund.beforeWords, noun$1.beforeWords, misc$2.beforeWords),
  afterWords: Object.assign({}, gerund.afterWords, noun$1.afterWords, misc$2.afterWords)
};
const nn$1 = "Singular";
const vb$1 = "Infinitive";
const clue$2 = {
  beforeTags: Object.assign({}, verb.beforeTags, noun$1.beforeTags, {
    // Noun: undefined
    Adjective: nn$1,
    //great name
    Particle: nn$1
    //brought under control
  }),
  afterTags: Object.assign({}, verb.afterTags, noun$1.afterTags, {
    ProperNoun: vb$1,
    Gerund: vb$1,
    Adjective: vb$1,
    Copula: nn$1
  }),
  beforeWords: Object.assign({}, verb.beforeWords, noun$1.beforeWords, {
    // is time
    is: nn$1,
    was: nn$1,
    //balance of power
    of: nn$1,
    have: null
    //have cash
  }),
  afterWords: Object.assign({}, verb.afterWords, noun$1.afterWords, {
    // for: vb,//work for
    instead: vb$1,
    // that: nn,//subject that was
    // for: vb,//work for
    about: vb$1,
    //talk about
    his: vb$1,
    //shot his
    her: vb$1,
    //
    to: null,
    by: null,
    in: null
  })
};
const p$2 = "Person";
const person$1 = {
  beforeTags: {
    Honorific: p$2,
    Person: p$2
    // Preposition: p, //with sue
  },
  afterTags: {
    Person: p$2,
    ProperNoun: p$2,
    Verb: p$2
    //bob could
    // Modal:true, //bob could
    // Copula:true, //bob is
    // PresentTense:true, //bob seems
  },
  beforeWords: {
    hi: p$2,
    hey: p$2,
    yo: p$2,
    dear: p$2,
    hello: p$2
  },
  afterWords: {
    // person-usually verbs
    said: p$2,
    says: p$2,
    told: p$2,
    tells: p$2,
    feels: p$2,
    felt: p$2,
    seems: p$2,
    thinks: p$2,
    thought: p$2,
    spends: p$2,
    spendt: p$2,
    plays: p$2,
    played: p$2,
    sing: p$2,
    sang: p$2,
    learn: p$2,
    learned: p$2,
    wants: p$2,
    wanted: p$2
    // and:true, //sue and jeff
  }
};
const m$1 = "Month";
const p$1 = "Person";
const month = {
  beforeTags: {
    Date: m$1,
    Value: m$1
  },
  afterTags: {
    Date: m$1,
    Value: m$1
  },
  beforeWords: {
    by: m$1,
    in: m$1,
    on: m$1,
    during: m$1,
    after: m$1,
    before: m$1,
    between: m$1,
    until: m$1,
    til: m$1,
    sometime: m$1,
    of: m$1,
    //5th of april
    this: m$1,
    //this april
    next: m$1,
    last: m$1,
    previous: m$1,
    following: m$1,
    with: p$1
    // for: p,
  },
  afterWords: {
    sometime: m$1,
    in: m$1,
    of: m$1,
    until: m$1,
    the: m$1
    //june the 4th
  }
};
const personDate = {
  beforeTags: Object.assign({}, person$1.beforeTags, month.beforeTags),
  afterTags: Object.assign({}, person$1.afterTags, month.afterTags),
  beforeWords: Object.assign({}, person$1.beforeWords, month.beforeWords),
  afterWords: Object.assign({}, person$1.afterWords, month.afterWords)
};
const clue$1 = {
  beforeTags: Object.assign({}, noun$1.beforeTags, person$1.beforeTags),
  afterTags: Object.assign({}, noun$1.afterTags, person$1.afterTags),
  beforeWords: Object.assign({}, noun$1.beforeWords, person$1.beforeWords, { i: "Infinitive", we: "Infinitive" }),
  afterWords: Object.assign({}, noun$1.afterWords, person$1.afterWords)
};
const clues$3 = {
  beforeTags: Object.assign({}, noun$1.beforeTags, person$1.beforeTags, verb.beforeTags),
  afterTags: Object.assign({}, noun$1.afterTags, person$1.afterTags, verb.afterTags),
  beforeWords: Object.assign({}, noun$1.beforeWords, person$1.beforeWords, verb.beforeWords),
  afterWords: Object.assign({}, noun$1.afterWords, person$1.afterWords, verb.afterWords)
};
const p = "Place";
const place = {
  beforeTags: {
    Place: p
  },
  afterTags: {
    Place: p,
    Abbreviation: p
  },
  beforeWords: {
    in: p,
    by: p,
    near: p,
    from: p,
    to: p
  },
  afterWords: {
    in: p,
    by: p,
    near: p,
    from: p,
    to: p,
    government: p,
    council: p,
    region: p,
    city: p
  }
};
const clue = {
  beforeTags: Object.assign({}, place.beforeTags, person$1.beforeTags),
  afterTags: Object.assign({}, place.afterTags, person$1.afterTags),
  beforeWords: Object.assign({}, place.beforeWords, person$1.beforeWords),
  afterWords: Object.assign({}, place.afterWords, person$1.afterWords)
};
const clues$2 = {
  beforeTags: Object.assign({}, person$1.beforeTags, adj$1.beforeTags),
  afterTags: Object.assign({}, person$1.afterTags, adj$1.afterTags),
  beforeWords: Object.assign({}, person$1.beforeWords, adj$1.beforeWords),
  afterWords: Object.assign({}, person$1.afterWords, adj$1.afterWords)
};
const un = "Unit";
const clues$1 = {
  beforeTags: { Value: un },
  afterTags: {},
  beforeWords: {
    per: un,
    every: un,
    each: un,
    square: un,
    //square km
    cubic: un,
    sq: un,
    metric: un
    //metric ton
  },
  afterWords: {
    per: un,
    squared: un,
    cubed: un,
    long: un
    //foot long
  }
};
const clues = {
  "Actor|Verb": clue$7,
  "Adj|Gerund": clue$6,
  "Adj|Noun": clue$5,
  "Adj|Past": adjPast$1,
  "Adj|Present": clue$4,
  "Noun|Verb": clue$2,
  "Noun|Gerund": clue$3,
  "Person|Noun": clue$1,
  "Person|Date": personDate,
  "Person|Verb": clues$3,
  "Person|Place": clue,
  "Person|Adj": clues$2,
  "Unit|Noun": clues$1
};
const copy = (obj, more) => {
  const res = Object.keys(obj).reduce((h2, k2) => {
    h2[k2] = obj[k2] === "Infinitive" ? "PresentTense" : "Plural";
    return h2;
  }, {});
  return Object.assign(res, more);
};
clues["Plural|Verb"] = {
  beforeWords: copy(clues["Noun|Verb"].beforeWords, {
    had: "Plural",
    //had tears
    have: "Plural"
  }),
  afterWords: copy(clues["Noun|Verb"].afterWords, {
    his: "PresentTense",
    her: "PresentTense",
    its: "PresentTense",
    in: null,
    to: null,
    is: "PresentTense",
    //the way it works is
    by: "PresentTense"
    //it works by
  }),
  beforeTags: copy(clues["Noun|Verb"].beforeTags, {
    Conjunction: "PresentTense",
    //and changes
    Noun: void 0,
    //the century demands
    ProperNoun: "PresentTense"
    //john plays
  }),
  afterTags: copy(clues["Noun|Verb"].afterTags, {
    Gerund: "Plural",
    //ice caps disappearing
    Noun: "PresentTense",
    //changes gears
    Value: "PresentTense"
    //changes seven gears
  })
};
const Adj$2 = "Adjective";
const Inf$1 = "Infinitive";
const Pres$1 = "PresentTense";
const Sing$1 = "Singular";
const Past$1 = "PastTense";
const Avb = "Adverb";
const Plrl = "Plural";
const Actor$1 = "Actor";
const Vb = "Verb";
const Noun$2 = "Noun";
const Prop = "ProperNoun";
const Last$1 = "LastName";
const Modal = "Modal";
const Place = "Place";
const Prt = "Participle";
const suffixPatterns = [
  null,
  null,
  {
    //2-letter
    ea: Sing$1,
    ia: Noun$2,
    ic: Adj$2,
    ly: Avb,
    "'n": Vb,
    "'t": Vb
  },
  {
    //3-letter
    oed: Past$1,
    ued: Past$1,
    xed: Past$1,
    " so": Avb,
    "'ll": Modal,
    "'re": "Copula",
    azy: Adj$2,
    eer: Noun$2,
    end: Vb,
    ped: Past$1,
    ffy: Adj$2,
    ify: Inf$1,
    ing: "Gerund",
    ize: Inf$1,
    ibe: Inf$1,
    lar: Adj$2,
    mum: Adj$2,
    nes: Pres$1,
    nny: Adj$2,
    // oid: Adj,
    ous: Adj$2,
    que: Adj$2,
    ger: Noun$2,
    ber: Noun$2,
    rol: Sing$1,
    sis: Sing$1,
    ogy: Sing$1,
    oid: Sing$1,
    ian: Sing$1,
    zes: Pres$1,
    eld: Past$1,
    ken: Prt,
    //awoken
    ven: Prt,
    //woven
    ten: Prt,
    //brighten
    ect: Inf$1,
    ict: Inf$1,
    // ide: Inf,
    ign: Inf$1,
    oze: Inf$1,
    ful: Adj$2,
    bal: Adj$2,
    ton: Noun$2,
    pur: Place
  },
  {
    //4-letter
    amed: Past$1,
    aped: Past$1,
    ched: Past$1,
    lked: Past$1,
    rked: Past$1,
    reed: Past$1,
    nded: Past$1,
    mned: Adj$2,
    cted: Past$1,
    dged: Past$1,
    ield: Sing$1,
    akis: Last$1,
    cede: Inf$1,
    chuk: Last$1,
    czyk: Last$1,
    ects: Pres$1,
    iend: Sing$1,
    ends: Vb,
    enko: Last$1,
    ette: Sing$1,
    iary: Sing$1,
    wner: Sing$1,
    //owner
    fies: Pres$1,
    fore: Avb,
    gate: Inf$1,
    gone: Adj$2,
    ices: Plrl,
    ints: Plrl,
    ruct: Inf$1,
    ines: Plrl,
    ions: Plrl,
    ners: Plrl,
    pers: Plrl,
    lers: Plrl,
    less: Adj$2,
    llen: Adj$2,
    made: Adj$2,
    nsen: Last$1,
    oses: Pres$1,
    ould: Modal,
    some: Adj$2,
    sson: Last$1,
    ians: Plrl,
    // tage: Inf,
    tion: Sing$1,
    tage: Noun$2,
    ique: Sing$1,
    tive: Adj$2,
    tors: Noun$2,
    vice: Sing$1,
    lier: Sing$1,
    fier: Sing$1,
    wned: Past$1,
    gent: Sing$1,
    tist: Actor$1,
    pist: Actor$1,
    rist: Actor$1,
    mist: Actor$1,
    yist: Actor$1,
    vist: Actor$1,
    ists: Actor$1,
    lite: Sing$1,
    site: Sing$1,
    rite: Sing$1,
    mite: Sing$1,
    bite: Sing$1,
    mate: Sing$1,
    date: Sing$1,
    ndal: Sing$1,
    vent: Sing$1,
    uist: Actor$1,
    gist: Actor$1,
    note: Sing$1,
    cide: Sing$1,
    //homicide
    ence: Sing$1,
    //absence
    wide: Adj$2,
    //nationwide
    // side: Adj,//alongside
    vide: Inf$1,
    //provide
    ract: Inf$1,
    duce: Inf$1,
    pose: Inf$1,
    eive: Inf$1,
    lyze: Inf$1,
    lyse: Inf$1,
    iant: Adj$2,
    nary: Adj$2,
    ghty: Adj$2,
    uent: Adj$2,
    erer: Actor$1,
    //caterer
    bury: Place,
    dorf: Noun$2,
    esty: Noun$2,
    wych: Place,
    dale: Place,
    folk: Place,
    vale: Place,
    abad: Place,
    sham: Place,
    wick: Place,
    view: Place
  },
  {
    //5-letter
    elist: Actor$1,
    holic: Sing$1,
    phite: Sing$1,
    tized: Past$1,
    urned: Past$1,
    eased: Past$1,
    ances: Plrl,
    bound: Adj$2,
    ettes: Plrl,
    fully: Avb,
    ishes: Pres$1,
    ities: Plrl,
    marek: Last$1,
    nssen: Last$1,
    ology: Noun$2,
    osome: Sing$1,
    tment: Sing$1,
    ports: Plrl,
    rough: Adj$2,
    tches: Pres$1,
    tieth: "Ordinal",
    tures: Plrl,
    wards: Avb,
    where: Avb,
    archy: Noun$2,
    pathy: Noun$2,
    opoly: Noun$2,
    embly: Noun$2,
    phate: Noun$2,
    ndent: Sing$1,
    scent: Sing$1,
    onist: Actor$1,
    anist: Actor$1,
    alist: Actor$1,
    olist: Actor$1,
    icist: Actor$1,
    ounce: Inf$1,
    iable: Adj$2,
    borne: Adj$2,
    gnant: Adj$2,
    inant: Adj$2,
    igent: Adj$2,
    atory: Adj$2,
    // ctory: Adj,
    rient: Sing$1,
    dient: Sing$1,
    maker: Actor$1,
    burgh: Place,
    mouth: Place,
    ceter: Place,
    ville: Place,
    hurst: Place,
    stead: Place,
    endon: Place,
    brook: Place,
    shire: Place,
    worth: Noun$2,
    field: Prop,
    ridge: Place
  },
  {
    //6-letter
    auskas: Last$1,
    parent: Sing$1,
    cedent: Sing$1,
    ionary: Sing$1,
    cklist: Sing$1,
    brooke: Place,
    keeper: Actor$1,
    logist: Actor$1,
    teenth: "Value",
    worker: Actor$1,
    master: Actor$1,
    writer: Actor$1,
    brough: Place,
    cester: Place,
    ington: Place,
    cliffe: Place,
    ingham: Place
  },
  {
    //7-letter
    chester: Place,
    logists: Actor$1,
    opoulos: Last$1,
    borough: Place,
    sdottir: Last$1
    //swedish female
  }
];
const Adj$1 = "Adjective";
const Noun$1 = "Noun";
const Verb$1 = "Verb";
const prefixPatterns = [
  null,
  null,
  {
    // 2-letter
  },
  {
    // 3-letter
    neo: Noun$1,
    bio: Noun$1,
    // pre: Noun,
    "de-": Verb$1,
    "re-": Verb$1,
    "un-": Verb$1,
    "ex-": Noun$1
  },
  {
    // 4-letter
    anti: Noun$1,
    auto: Noun$1,
    faux: Adj$1,
    hexa: Noun$1,
    kilo: Noun$1,
    mono: Noun$1,
    nano: Noun$1,
    octa: Noun$1,
    poly: Noun$1,
    semi: Adj$1,
    tele: Noun$1,
    "pro-": Adj$1,
    "mis-": Verb$1,
    "dis-": Verb$1,
    "pre-": Adj$1
    //hmm
  },
  {
    // 5-letter
    anglo: Noun$1,
    centi: Noun$1,
    ethno: Noun$1,
    ferro: Noun$1,
    grand: Noun$1,
    hepta: Noun$1,
    hydro: Noun$1,
    intro: Noun$1,
    macro: Noun$1,
    micro: Noun$1,
    milli: Noun$1,
    nitro: Noun$1,
    penta: Noun$1,
    quasi: Adj$1,
    radio: Noun$1,
    tetra: Noun$1,
    "omni-": Adj$1,
    "post-": Adj$1
  },
  {
    // 6-letter
    pseudo: Adj$1,
    "extra-": Adj$1,
    "hyper-": Adj$1,
    "inter-": Adj$1,
    "intra-": Adj$1,
    "deca-": Adj$1
    // 'trans-': Noun,
  },
  {
    // 7-letter
    electro: Noun$1
  }
];
const Adj = "Adjective";
const Inf = "Infinitive";
const Pres = "PresentTense";
const Sing = "Singular";
const Past = "PastTense";
const Adverb = "Adverb";
const Exp = "Expression";
const Actor = "Actor";
const Verb = "Verb";
const Noun = "Noun";
const Last = "LastName";
const endsWith = {
  a: [
    [/.[aeiou]na$/, Noun, "tuna"],
    [/.[oau][wvl]ska$/, Last],
    [/.[^aeiou]ica$/, Sing, "harmonica"],
    [/^([hyj]a+)+$/, Exp, "haha"]
    //hahah
  ],
  c: [[/.[^aeiou]ic$/, Adj]],
  d: [
    //==-ed==
    //double-consonant
    [/[aeiou](pp|ll|ss|ff|gg|tt|rr|bb|nn|mm)ed$/, Past, "popped"],
    //double-vowel
    [/.[aeo]{2}[bdgmnprvz]ed$/, Past, "rammed"],
    //-hed
    [/.[aeiou][sg]hed$/, Past, "gushed"],
    //-rd
    [/.[aeiou]red$/, Past, "hired"],
    [/.[aeiou]r?ried$/, Past, "hurried"],
    // ard
    [/[^aeiou]ard$/, Sing, "steward"],
    // id
    [/[aeiou][^aeiou]id$/, Adj, ""],
    [/.[vrl]id$/, Adj, "livid"],
    // ===== -ed ======
    //-led
    [/..led$/, Past, "hurled"],
    //-sed
    [/.[iao]sed$/, Past, ""],
    [/[aeiou]n?[cs]ed$/, Past, ""],
    //-med
    [/[aeiou][rl]?[mnf]ed$/, Past, ""],
    //-ked
    [/[aeiou][ns]?c?ked$/, Past, "bunked"],
    //-gned
    [/[aeiou]gned$/, Past],
    //-ged
    [/[aeiou][nl]?ged$/, Past],
    //-ted
    [/.[tdbwxyz]ed$/, Past],
    [/[^aeiou][aeiou][tvx]ed$/, Past],
    //-ied
    [/.[cdflmnprstv]ied$/, Past, "emptied"]
  ],
  e: [
    [/.[lnr]ize$/, Inf, "antagonize"],
    [/.[^aeiou]ise$/, Inf, "antagonise"],
    [/.[aeiou]te$/, Inf, "bite"],
    [/.[^aeiou][ai]ble$/, Adj, "fixable"],
    [/.[^aeiou]eable$/, Adj, "maleable"],
    [/.[ts]ive$/, Adj, "festive"],
    [/[a-z]-like$/, Adj, "woman-like"]
  ],
  h: [
    [/.[^aeiouf]ish$/, Adj, "cornish"],
    [/.v[iy]ch$/, Last, "..ovich"],
    [/^ug?h+$/, Exp, "ughh"],
    [/^uh[ -]?oh$/, Exp, "uhoh"],
    [/[a-z]-ish$/, Adj, "cartoon-ish"]
  ],
  i: [[/.[oau][wvl]ski$/, Last, "polish-male"]],
  k: [
    [/^(k){2}$/, Exp, "kkkk"]
    //kkkk
  ],
  l: [
    [/.[gl]ial$/, Adj, "familial"],
    [/.[^aeiou]ful$/, Adj, "fitful"],
    [/.[nrtumcd]al$/, Adj, "natal"],
    [/.[^aeiou][ei]al$/, Adj, "familial"]
  ],
  m: [
    [/.[^aeiou]ium$/, Sing, "magnesium"],
    [/[^aeiou]ism$/, Sing, "schism"],
    [/^[hu]m+$/, Exp, "hmm"],
    [/^\d+ ?[ap]m$/, "Date", "3am"]
  ],
  n: [
    [/.[lsrnpb]ian$/, Adj, "republican"],
    [/[^aeiou]ician$/, Actor, "musician"],
    [/[aeiou][ktrp]in'$/, "Gerund", "cookin'"]
    // 'cookin', 'hootin'
  ],
  o: [
    [/^no+$/, Exp, "noooo"],
    [/^(yo)+$/, Exp, "yoo"],
    [/^wo{2,}[pt]?$/, Exp, "woop"]
    //woo
  ],
  r: [
    [/.[bdfklmst]ler$/, "Noun"],
    [/[aeiou][pns]er$/, Sing],
    [/[^i]fer$/, Inf],
    [/.[^aeiou][ao]pher$/, Actor],
    [/.[lk]er$/, "Noun"],
    [/.ier$/, "Comparative"]
  ],
  t: [
    [/.[di]est$/, "Superlative"],
    [/.[icldtgrv]ent$/, Adj],
    [/[aeiou].*ist$/, Adj],
    [/^[a-z]et$/, Verb]
  ],
  s: [
    [/.[^aeiou]ises$/, Pres],
    [/.[rln]ates$/, Pres],
    [/.[^z]ens$/, Verb],
    [/.[lstrn]us$/, Sing],
    [/.[aeiou]sks$/, Pres],
    [/.[aeiou]kes$/, Pres],
    [/[aeiou][^aeiou]is$/, Sing],
    [/[a-z]'s$/, Noun],
    [/^yes+$/, Exp]
    //yessss
  ],
  v: [
    [/.[^aeiou][ai][kln]ov$/, Last]
    //east-europe
  ],
  y: [
    [/.[cts]hy$/, Adj],
    [/.[st]ty$/, Adj],
    [/.[tnl]ary$/, Adj],
    [/.[oe]ry$/, Sing],
    [/[rdntkbhs]ly$/, Adverb],
    [/.(gg|bb|zz)ly$/, Adj],
    [/...lly$/, Adverb],
    [/.[gk]y$/, Adj],
    [/[bszmp]{2}y$/, Adj],
    [/.[ai]my$/, Adj],
    [/[ea]{2}zy$/, Adj],
    [/.[^aeiou]ity$/, Sing]
  ]
};
const vb = "Verb";
const nn = "Noun";
const neighbours$1 = {
  // looking at the previous word's tags:
  leftTags: [
    ["Adjective", nn],
    ["Possessive", nn],
    ["Determiner", nn],
    ["Adverb", vb],
    ["Pronoun", vb],
    ["Value", nn],
    ["Ordinal", nn],
    ["Modal", vb],
    ["Superlative", nn],
    ["Demonym", nn],
    ["Honorific", "Person"]
    //dr. Smith
  ],
  // looking at the previous word:
  leftWords: [
    ["i", vb],
    ["first", nn],
    ["it", vb],
    ["there", vb],
    ["not", vb],
    ["because", nn],
    ["if", nn],
    ["but", nn],
    ["who", vb],
    ["this", nn],
    ["his", nn],
    ["when", nn],
    ["you", vb],
    ["very", "Adjective"],
    ["old", nn],
    ["never", vb],
    ["before", nn],
    ["a", nn],
    ["the", nn],
    ["been", vb]
  ],
  // looking at the next word's tags:
  rightTags: [
    ["Copula", nn],
    ["PastTense", nn],
    ["Conjunction", nn],
    ["Modal", nn]
  ],
  // looking at the next word:
  rightWords: [
    ["there", vb],
    ["me", vb],
    ["man", "Adjective"],
    // ['only', vb],
    ["him", vb],
    ["it", vb],
    //relaunch it
    ["were", nn],
    ["took", nn],
    ["himself", vb],
    ["went", nn],
    ["who", nn],
    ["jr", "Person"]
  ]
};
const data = {
  "Comparative": {
    "fwd": "3:ser,ier¦1er:h,t,f,l,n¦1r:e¦2er:ss,or,om",
    "both": "3er:ver,ear,alm¦3ner:hin¦3ter:lat¦2mer:im¦2er:ng,rm,mb¦2ber:ib¦2ger:ig¦1er:w,p,k,d¦ier:y",
    "rev": "1:tter,yer¦2:uer,ver,ffer,oner,eler,ller,iler,ster,cer,uler,sher,ener,gher,aner,adder,nter,eter,rter,hter,rner,fter¦3:oser,ooler,eafer,user,airer,bler,maler,tler,eater,uger,rger,ainer,urer,ealer,icher,pler,emner,icter,nser,iser¦4:arser,viner,ucher,rosser,somer,ndomer,moter,oother,uarer,hiter¦5:nuiner,esser,emier¦ar:urther",
    "ex": "worse:bad¦better:good¦4er:fair,gray,poor¦1urther:far¦3ter:fat,hot,wet¦3der:mad,sad¦3er:shy,fun¦4der:glad¦:¦4r:cute,dire,fake,fine,free,lame,late,pale,rare,ripe,rude,safe,sore,tame,wide¦5r:eerie,stale"
  },
  "Gerund": {
    "fwd": "1:nning,tting,rring,pping,eing,mming,gging,dding,bbing,kking¦2:eking,oling,eling,eming¦3:velling,siting,uiting,fiting,loting,geting,ialing,celling¦4:graming",
    "both": "1:aing,iing,fing,xing,ying,oing,hing,wing¦2:tzing,rping,izzing,bting,mning,sping,wling,rling,wding,rbing,uping,lming,wning,mping,oning,lting,mbing,lking,fting,hting,sking,gning,pting,cking,ening,nking,iling,eping,ering,rting,rming,cting,lping,ssing,nting,nding,lding,sting,rning,rding,rking¦3:belling,siping,toming,yaking,uaking,oaning,auling,ooping,aiding,naping,euring,tolling,uzzing,ganing,haning,ualing,halling,iasing,auding,ieting,ceting,ouling,voring,ralling,garing,joring,oaming,oaking,roring,nelling,ooring,uelling,eaming,ooding,eaping,eeting,ooting,ooming,xiting,keting,ooking,ulling,airing,oaring,biting,outing,oiting,earing,naling,oading,eeding,ouring,eaking,aiming,illing,oining,eaning,onging,ealing,aining,eading¦4:thoming,melling,aboring,ivoting,weating,dfilling,onoring,eriting,imiting,tialling,rgining,otoring,linging,winging,lleting,louding,spelling,mpelling,heating,feating,opelling,choring,welling,ymaking,ctoring,calling,peating,iloring,laiting,utoring,uditing,mmaking,loating,iciting,waiting,mbating,voiding,otalling,nsoring,nselling,ocusing,itoring,eloping¦5:rselling,umpeting,atrolling,treating,tselling,rpreting,pringing,ummeting,ossoming,elmaking,eselling,rediting,totyping,onmaking,rfeiting,ntrolling¦5e:chmaking,dkeeping,severing,erouting,ecreting,ephoning,uthoring,ravening,reathing,pediting,erfering,eotyping,fringing,entoring,ombining,ompeting¦4e:emaking,eething,twining,rruling,chuting,xciting,rseding,scoping,edoring,pinging,lunging,agining,craping,pleting,eleting,nciting,nfining,ncoding,tponing,ecoding,writing,esaling,nvening,gnoring,evoting,mpeding,rvening,dhering,mpiling,storing,nviting,ploring¦3e:tining,nuring,saking,miring,haling,ceding,xuding,rining,nuting,laring,caring,miling,riding,hoking,piring,lading,curing,uading,noting,taping,futing,paring,hading,loding,siring,guring,vading,voking,during,niting,laning,caping,luting,muting,ruding,ciding,juring,laming,caling,hining,uoting,liding,ciling,duling,tuting,puting,cuting,coring,uiding,tiring,turing,siding,rading,enging,haping,buting,lining,taking,anging,haring,uiring,coming,mining,moting,suring,viding,luding¦2e:tring,zling,uging,oging,gling,iging,vring,fling,lging,obing,psing,pling,ubing,cling,dling,wsing,iking,rsing,dging,kling,ysing,tling,rging,eging,nsing,uning,osing,uming,using,ibing,bling,aging,ising,asing,ating¦2ie:rlying¦1e:zing,uing,cing,ving",
    "rev": "ying:ie¦1ing:se,ke,te,we,ne,re,de,pe,me,le,c,he¦2ing:ll,ng,dd,ee,ye,oe,rg,us¦2ning:un¦2ging:og,ag,ug,ig,eg¦2ming:um¦2bing:ub,ab,eb,ob¦3ning:lan,can,hin,pin,win¦3ring:cur,lur,tir,tar,pur,car¦3ing:ait,del,eel,fin,eat,oat,eem,lel,ool,ein,uin¦3ping:rop,rap,top,uip,wap,hip,hop,lap,rip,cap¦3ming:tem,wim,rim,kim,lim¦3ting:mat,cut,pot,lit,lot,hat,set,pit,put¦3ding:hed,bed,bid¦3king:rek¦3ling:cil,pel¦3bing:rib¦4ning:egin¦4ing:isit,ruit,ilot,nsit,dget,rkel,ival,rcel¦4ring:efer,nfer¦4ting:rmit,mmit,ysit,dmit,emit,bmit,tfit,gret¦4ling:evel,xcel,ivel¦4ding:hred¦5ing:arget,posit,rofit¦5ring:nsfer¦5ting:nsmit,orget,cquit¦5ling:ancel,istil",
    "ex": "3:adding,eating,aiming,aiding,airing,outing,gassing,setting,getting,putting,cutting,winning,sitting,betting,mapping,tapping,letting,bidding,hitting,tanning,netting,popping,fitting,capping,lapping,barring,banning,vetting,topping,rotting,tipping,potting,wetting,pitting,dipping,budding,hemming,pinning,jetting,kidding,padding,podding,sipping,wedding,bedding,donning,warring,penning,gutting,cueing,wadding,petting,ripping,napping,matting,tinning,binning,dimming,hopping,mopping,nodding,panning,rapping,ridding,sinning¦4:selling,falling,calling,waiting,editing,telling,rolling,heating,boating,hanging,beating,coating,singing,tolling,felling,polling,discing,seating,voiding,gelling,yelling,baiting,reining,ruining,seeking,spanning,stepping,knitting,emitting,slipping,quitting,dialing,omitting,clipping,shutting,skinning,abutting,flipping,trotting,cramming,fretting,suiting¦5:bringing,treating,spelling,stalling,trolling,expelling,rivaling,wringing,deterring,singeing,befitting,refitting¦6:enrolling,distilling,scrolling,strolling,caucusing,travelling¦7:installing,redefining,stencilling,recharging,overeating,benefiting,unraveling,programing¦9:reprogramming¦is:being¦2e:using,aging,owing¦3e:making,taking,coming,noting,hiring,filing,coding,citing,doping,baking,coping,hoping,lading,caring,naming,voting,riding,mining,curing,lining,ruling,typing,boring,dining,firing,hiding,piling,taping,waning,baling,boning,faring,honing,wiping,luring,timing,wading,piping,fading,biting,zoning,daring,waking,gaming,raking,ceding,tiring,coking,wining,joking,paring,gaping,poking,pining,coring,liming,toting,roping,wiring,aching¦4e:writing,storing,eroding,framing,smoking,tasting,wasting,phoning,shaking,abiding,braking,flaking,pasting,priming,shoring,sloping,withing,hinging¦5e:defining,refining,renaming,swathing,fringing,reciting¦1ie:dying,tying,lying,vying¦7e:sunbathing"
  },
  "Participle": {
    "fwd": "1:mt¦2:llen¦3:iven,aken¦:ne¦y:in",
    "both": "1:wn¦2:me,aten¦3:seen,bidden,isen¦4:roven,asten¦3l:pilt¦3d:uilt¦2e:itten¦1im:wum¦1eak:poken¦1ine:hone¦1ose:osen¦1in:gun¦1ake:woken¦ear:orn¦eal:olen¦eeze:ozen¦et:otten¦ink:unk¦ing:ung",
    "rev": "2:un¦oken:eak¦ought:eek¦oven:eave¦1ne:o¦1own:ly¦1den:de¦1in:ay¦2t:am¦2n:ee¦3en:all¦4n:rive,sake,take¦5n:rgive",
    "ex": "2:been¦3:seen,run¦4:given,taken¦5:shaken¦2eak:broken¦1ive:dove¦2y:flown¦3e:hidden,ridden¦1eek:sought¦1ake:woken¦1eave:woven"
  },
  "PastTense": {
    "fwd": "1:tted,wed,gged,nned,een,rred,pped,yed,bbed,oed,dded,rd,wn,mmed¦2:eed,nded,et,hted,st,oled,ut,emed,eled,lded,ken,rt,nked,apt,ant,eped,eked¦3:eared,eat,eaded,nelled,ealt,eeded,ooted,eaked,eaned,eeted,mited,bid,uit,ead,uited,ealed,geted,velled,ialed,belled¦4:ebuted,hined,comed¦y:ied¦ome:ame¦ear:ore¦ind:ound¦ing:ung,ang¦ep:pt¦ink:ank,unk¦ig:ug¦all:ell¦ee:aw¦ive:ave¦eeze:oze¦old:eld¦ave:ft¦ake:ook¦ell:old¦ite:ote¦ide:ode¦ine:one¦in:un,on¦eal:ole¦im:am¦ie:ay¦and:ood¦1ise:rose¦1eak:roke¦1ing:rought¦1ive:rove¦1el:elt¦1id:bade¦1et:got¦1y:aid¦1it:sat¦3e:lid¦3d:pent",
    "both": "1:aed,fed,xed,hed¦2:sged,xted,wled,rped,lked,kied,lmed,lped,uped,bted,rbed,rked,wned,rled,mped,fted,mned,mbed,zzed,omed,ened,cked,gned,lted,sked,ued,zed,nted,ered,rted,rmed,ced,sted,rned,ssed,rded,pted,ved,cted¦3:cled,eined,siped,ooned,uked,ymed,jored,ouded,ioted,oaned,lged,asped,iged,mured,oided,eiled,yped,taled,moned,yled,lit,kled,oaked,gled,naled,fled,uined,oared,valled,koned,soned,aided,obed,ibed,meted,nicked,rored,micked,keted,vred,ooped,oaded,rited,aired,auled,filled,ouled,ooded,ceted,tolled,oited,bited,aped,tled,vored,dled,eamed,nsed,rsed,sited,owded,pled,sored,rged,osed,pelled,oured,psed,oated,loned,aimed,illed,eured,tred,ioned,celled,bled,wsed,ooked,oiled,itzed,iked,iased,onged,ased,ailed,uned,umed,ained,auded,nulled,ysed,eged,ised,aged,oined,ated,used,dged,doned¦4:ntied,efited,uaked,caded,fired,roped,halled,roked,himed,culed,tared,lared,tuted,uared,routed,pited,naked,miled,houted,helled,hared,cored,caled,tired,peated,futed,ciled,called,tined,moted,filed,sided,poned,iloted,honed,lleted,huted,ruled,cured,named,preted,vaded,sured,talled,haled,peded,gined,nited,uided,ramed,feited,laked,gured,ctored,unged,pired,cuted,voked,eloped,ralled,rined,coded,icited,vided,uaded,voted,mined,sired,noted,lined,nselled,luted,jured,fided,puted,piled,pared,olored,cided,hoked,enged,tured,geoned,cotted,lamed,uiled,waited,udited,anged,luded,mired,uired,raded¦5:modelled,izzled,eleted,umpeted,ailored,rseded,treated,eduled,ecited,rammed,eceded,atrolled,nitored,basted,twined,itialled,ncited,gnored,ploded,xcited,nrolled,namelled,plored,efeated,redited,ntrolled,nfined,pleted,llided,lcined,eathed,ibuted,lloted,dhered,cceded¦3ad:sled¦2aw:drew¦2ot:hot¦2ke:made¦2ow:hrew,grew¦2ose:hose¦2d:ilt¦2in:egan¦1un:ran¦1ink:hought¦1ick:tuck¦1ike:ruck¦1eak:poke,nuck¦1it:pat¦1o:did¦1ow:new¦1ake:woke¦go:went",
    "rev": "3:rst,hed,hut,cut,set¦4:tbid¦5:dcast,eread,pread,erbid¦ought:uy,eek¦1ied:ny,ly,dy,ry,fy,py,vy,by,ty,cy¦1ung:ling,ting,wing¦1pt:eep¦1ank:rink¦1ore:bear,wear¦1ave:give¦1oze:reeze¦1ound:rind,wind¦1ook:take,hake¦1aw:see¦1old:sell¦1ote:rite¦1ole:teal¦1unk:tink¦1am:wim¦1ay:lie¦1ood:tand¦1eld:hold¦2d:he,ge,re,le,leed,ne,reed,be,ye,lee,pe,we¦2ed:dd,oy,or,ey,gg,rr,us,ew,to¦2ame:ecome,rcome¦2ped:ap¦2ged:ag,og,ug,eg¦2bed:ub,ab,ib,ob¦2lt:neel¦2id:pay¦2ang:pring¦2ove:trive¦2med:um¦2ode:rride¦2at:ysit¦3ted:mit,hat,mat,lat,pot,rot,bat¦3ed:low,end,tow,und,ond,eem,lay,cho,dow,xit,eld,ald,uld,law,lel,eat,oll,ray,ank,fin,oam,out,how,iek,tay,haw,ait,vet,say,cay,bow¦3d:ste,ede,ode,ete,ree,ude,ame,oke,ote,ime,ute,ade¦3red:lur,cur,pur,car¦3ped:hop,rop,uip,rip,lip,tep,top¦3ded:bed,rod,kid¦3ade:orbid¦3led:uel¦3ned:lan,can,kin,pan,tun¦3med:rim,lim¦4ted:quit,llot¦4ed:pear,rrow,rand,lean,mand,anel,pand,reet,link,abel,evel,imit,ceed,ruit,mind,peal,veal,hool,head,pell,well,mell,uell,band,hear,weak¦4led:nnel,qual,ebel,ivel¦4red:nfer,efer,sfer¦4n:sake,trew¦4d:ntee¦4ded:hred¦4ned:rpin¦5ed:light,nceal,right,ndear,arget,hread,eight,rtial,eboot¦5d:edite,nvite¦5ted:egret¦5led:ravel",
    "ex": "2:been,upped¦3:added,aged,aided,aimed,aired,bid,died,dyed,egged,erred,eyed,fit,gassed,hit,lied,owed,pent,pied,tied,used,vied,oiled,outed,banned,barred,bet,canned,cut,dipped,donned,ended,feed,inked,jarred,let,manned,mowed,netted,padded,panned,pitted,popped,potted,put,set,sewn,sowed,tanned,tipped,topped,vowed,weed,bowed,jammed,binned,dimmed,hopped,mopped,nodded,pinned,rigged,sinned,towed,vetted¦4:ached,baked,baled,boned,bored,called,caned,cared,ceded,cited,coded,cored,cubed,cured,dared,dined,edited,exited,faked,fared,filed,fined,fired,fuelled,gamed,gelled,hired,hoped,joked,lined,mined,named,noted,piled,poked,polled,pored,pulled,reaped,roamed,rolled,ruled,seated,shed,sided,timed,tolled,toned,voted,waited,walled,waned,winged,wiped,wired,zoned,yelled,tamed,lubed,roped,faded,mired,caked,honed,banged,culled,heated,raked,welled,banded,beat,cast,cooled,cost,dealt,feared,folded,footed,handed,headed,heard,hurt,knitted,landed,leaked,leapt,linked,meant,minded,molded,neared,needed,peaked,plodded,plotted,pooled,quit,read,rooted,sealed,seeded,seeped,shipped,shunned,skimmed,slammed,sparred,stemmed,stirred,suited,thinned,twinned,swayed,winked,dialed,abutted,blotted,fretted,healed,heeded,peeled,reeled¦5:basted,cheated,equalled,eroded,exiled,focused,opined,pleated,primed,quoted,scouted,shored,sloped,smoked,sniped,spelled,spouted,routed,staked,stored,swelled,tasted,treated,wasted,smelled,dwelled,honored,prided,quelled,eloped,scared,coveted,sweated,breaded,cleared,debuted,deterred,freaked,modeled,pleaded,rebutted,speeded¦6:anchored,defined,endured,impaled,invited,refined,revered,strolled,cringed,recast,thrust,unfolded¦7:authored,combined,competed,conceded,convened,excreted,extruded,redefined,restored,secreted,rescinded,welcomed¦8:expedited,infringed¦9:interfered,intervened,persevered¦10:contravened¦eat:ate¦is:was¦go:went¦are:were¦3d:bent,lent,rent,sent¦3e:bit,fled,hid,lost¦3ed:bled,bred¦2ow:blew,grew¦1uy:bought¦2tch:caught¦1o:did¦1ive:dove,gave¦2aw:drew¦2ed:fed¦2y:flew,laid,paid,said¦1ight:fought¦1et:got¦2ve:had¦1ang:hung¦2ad:led¦2ght:lit¦2ke:made¦2et:met¦1un:ran¦1ise:rose¦1it:sat¦1eek:sought¦1each:taught¦1ake:woke,took¦1eave:wove¦2ise:arose¦1ear:bore,tore,wore¦1ind:bound,found,wound¦2eak:broke¦2ing:brought,wrung¦1ome:came¦2ive:drove¦1ig:dug¦1all:fell¦2el:felt¦4et:forgot¦1old:held¦2ave:left¦1ing:rang,sang¦1ide:rode¦1ink:sank¦1ee:saw¦2ine:shone¦4e:slid¦1ell:sold,told¦4d:spent¦2in:spun¦1in:won"
  },
  "PresentTense": {
    "fwd": "1:oes¦1ve:as",
    "both": "1:xes¦2:zzes,ches,shes,sses¦3:iases¦2y:llies,plies¦1y:cies,bies,ties,vies,nies,pies,dies,ries,fies¦:s",
    "rev": "1ies:ly¦2es:us,go,do¦3es:cho,eto",
    "ex": "2:does,goes¦3:gasses¦5:focuses¦is:are¦3y:relies¦2y:flies¦2ve:has"
  },
  "Superlative": {
    "fwd": "1st:e¦1est:l,m,f,s¦1iest:cey¦2est:or,ir¦3est:ver",
    "both": "4:east¦5:hwest¦5lest:erful¦4est:weet,lgar,tter,oung¦4most:uter¦3est:ger,der,rey,iet,ong,ear¦3test:lat¦3most:ner¦2est:pt,ft,nt,ct,rt,ht¦2test:it¦2gest:ig¦1est:b,k,n,p,h,d,w¦iest:y",
    "rev": "1:ttest,nnest,yest¦2:sest,stest,rmest,cest,vest,lmest,olest,ilest,ulest,ssest,imest,uest¦3:rgest,eatest,oorest,plest,allest,urest,iefest,uelest,blest,ugest,amest,yalest,ealest,illest,tlest,itest¦4:cerest,eriest,somest,rmalest,ndomest,motest,uarest,tiffest¦5:leverest,rangest¦ar:urthest¦3ey:riciest",
    "ex": "best:good¦worst:bad¦5est:great¦4est:fast,full,fair,dull¦3test:hot,wet,fat¦4nest:thin¦1urthest:far¦3est:gay,shy,ill¦4test:neat¦4st:late,wide,fine,safe,cute,fake,pale,rare,rude,sore,ripe,dire¦6st:severe"
  },
  "AdjToNoun": {
    "fwd": "1:tistic,eable,lful,sful,ting,tty¦2:onate,rtable,geous,ced,seful,ctful¦3:ortive,ented¦arity:ear¦y:etic¦fulness:begone¦1ity:re¦1y:tiful,gic¦2ity:ile,imous,ilous,ime¦2ion:ated¦2eness:iving¦2y:trious¦2ation:iring¦2tion:vant¦3ion:ect¦3ce:mant,mantic¦3tion:irable¦3y:est,estic¦3m:mistic,listic¦3ess:ning¦4n:utious¦4on:rative,native,vative,ective¦4ce:erant",
    "both": "1:king,wing¦2:alous,ltuous,oyful,rdous¦3:gorous,ectable,werful,amatic¦4:oised,usical,agical,raceful,ocused,lined,ightful¦5ness:stful,lding,itous,nuous,ulous,otous,nable,gious,ayful,rvous,ntous,lsive,peful,entle,ciful,osive,leful,isive,ncise,reful,mious¦5ty:ivacious¦5ties:ubtle¦5ce:ilient,adiant,atient¦5cy:icient¦5sm:gmatic¦5on:sessive,dictive¦5ity:pular,sonal,eative,entic¦5sity:uminous¦5ism:conic¦5nce:mperate¦5ility:mitable¦5ment:xcited¦5n:bitious¦4cy:brant,etent,curate¦4ility:erable,acable,icable,ptable¦4ty:nacious,aive,oyal,dacious¦4n:icious¦4ce:vient,erent,stent,ndent,dient,quent,ident¦4ness:adic,ound,hing,pant,sant,oing,oist,tute¦4icity:imple¦4ment:fined,mused¦4ism:otic¦4ry:dantic¦4ity:tund,eral¦4edness:hand¦4on:uitive¦4lity:pitable¦4sm:eroic,namic¦4sity:nerous¦3th:arm¦3ility:pable,bable,dable,iable¦3cy:hant,nant,icate¦3ness:red,hin,nse,ict,iet,ite,oud,ind,ied,rce¦3ion:lute¦3ity:ual,gal,volous,ial¦3ce:sent,fensive,lant,gant,gent,lent,dant¦3on:asive¦3m:fist,sistic,iastic¦3y:terious,xurious,ronic,tastic¦3ur:amorous¦3e:tunate¦3ation:mined¦3sy:rteous¦3ty:ain¦3ry:ave¦3ment:azed¦2ness:de,on,ue,rn,ur,ft,rp,pe,om,ge,rd,od,ay,ss,er,ll,oy,ap,ht,ld,ad,rt¦2inousness:umous¦2ity:neous,ene,id,ane¦2cy:bate,late¦2ation:ized¦2ility:oble,ible¦2y:odic¦2e:oving,aring¦2s:ost¦2itude:pt¦2dom:ee¦2ance:uring¦2tion:reet¦2ion:oted¦2sion:ending¦2liness:an¦2or:rdent¦1th:ung¦1e:uable¦1ness:w,h,k,f¦1ility:mble¦1or:vent¦1ement:ging¦1tiquity:ncient¦1ment:hed¦verty:or¦ength:ong¦eat:ot¦pth:ep¦iness:y",
    "rev": "",
    "ex": "5:forceful,humorous¦8:charismatic¦13:understanding¦5ity:active¦11ness:adventurous,inquisitive,resourceful¦8on:aggressive,automatic,perceptive¦7ness:amorous,fatuous,furtive,ominous,serious¦5ness:ample,sweet¦12ness:apprehensive,cantankerous,contemptuous,ostentatious¦13ness:argumentative,conscientious¦9ness:assertive,facetious,imperious,inventive,oblivious,rapacious,receptive,seditious,whimsical¦10ness:attractive,expressive,impressive,loquacious,salubrious,thoughtful¦3edom:boring¦4ness:calm,fast,keen,tame¦8ness:cheerful,gracious,specious,spurious,timorous,unctuous¦5sity:curious¦9ion:deliberate¦8ion:desperate¦6e:expensive¦7ce:fragrant¦3y:furious¦9ility:ineluctable¦6ism:mystical¦8ity:physical,proactive,sensitive,vertical¦5cy:pliant¦7ity:positive¦9ity:practical¦12ism:professional¦6ce:prudent¦3ness:red¦6cy:vagrant¦3dom:wise"
  }
};
const checkEx = function(str, ex = {}) {
  if (ex.hasOwnProperty(str)) {
    return ex[str];
  }
  return null;
};
const checkSame = function(str, same = []) {
  for (let i2 = 0; i2 < same.length; i2 += 1) {
    if (str.endsWith(same[i2])) {
      return str;
    }
  }
  return null;
};
const checkRules = function(str, fwd, both = {}) {
  fwd = fwd || {};
  let max2 = str.length - 1;
  for (let i2 = max2; i2 >= 1; i2 -= 1) {
    let size = str.length - i2;
    let suff = str.substring(size, str.length);
    if (fwd.hasOwnProperty(suff) === true) {
      return str.slice(0, size) + fwd[suff];
    }
    if (both.hasOwnProperty(suff) === true) {
      return str.slice(0, size) + both[suff];
    }
  }
  if (fwd.hasOwnProperty("")) {
    return str += fwd[""];
  }
  if (both.hasOwnProperty("")) {
    return str += both[""];
  }
  return null;
};
const convert = function(str = "", model2 = {}) {
  let out2 = checkEx(str, model2.ex);
  out2 = out2 || checkSame(str, model2.same);
  out2 = out2 || checkRules(str, model2.fwd, model2.both);
  out2 = out2 || str;
  return out2;
};
const flipObj = function(obj) {
  return Object.entries(obj).reduce((h2, a2) => {
    h2[a2[1]] = a2[0];
    return h2;
  }, {});
};
const reverse = function(model2 = {}) {
  return {
    reversed: true,
    // keep these two
    both: flipObj(model2.both),
    ex: flipObj(model2.ex),
    // swap this one in
    fwd: model2.rev || {}
  };
};
const prefix$2 = /^([0-9]+)/;
const toObject = function(txt) {
  let obj = {};
  txt.split("¦").forEach((str) => {
    let [key, vals] = str.split(":");
    vals = (vals || "").split(",");
    vals.forEach((val) => {
      obj[val] = key;
    });
  });
  return obj;
};
const growObject = function(key = "", val = "") {
  val = String(val);
  let m2 = val.match(prefix$2);
  if (m2 === null) {
    return val;
  }
  let num = Number(m2[1]) || 0;
  let pre = key.substring(0, num);
  let full = pre + val.replace(prefix$2, "");
  return full;
};
const unpackOne = function(str) {
  let obj = toObject(str);
  return Object.keys(obj).reduce((h2, k2) => {
    h2[k2] = growObject(k2, obj[k2]);
    return h2;
  }, {});
};
const uncompress = function(model2 = {}) {
  if (typeof model2 === "string") {
    model2 = JSON.parse(model2);
  }
  model2.fwd = unpackOne(model2.fwd || "");
  model2.both = unpackOne(model2.both || "");
  model2.rev = unpackOne(model2.rev || "");
  model2.ex = unpackOne(model2.ex || "");
  return model2;
};
const fromPast = uncompress(data.PastTense);
const fromPresent = uncompress(data.PresentTense);
const fromGerund = uncompress(data.Gerund);
const fromParticiple = uncompress(data.Participle);
const toPast$3 = reverse(fromPast);
const toPresent$2 = reverse(fromPresent);
const toGerund$2 = reverse(fromGerund);
const toParticiple = reverse(fromParticiple);
const toComparative$1 = uncompress(data.Comparative);
const toSuperlative$1 = uncompress(data.Superlative);
const fromComparative$1 = reverse(toComparative$1);
const fromSuperlative$1 = reverse(toSuperlative$1);
const adjToNoun = uncompress(data.AdjToNoun);
const models = {
  fromPast,
  fromPresent,
  fromGerund,
  fromParticiple,
  toPast: toPast$3,
  toPresent: toPresent$2,
  toGerund: toGerund$2,
  toParticiple,
  // adjectives
  toComparative: toComparative$1,
  toSuperlative: toSuperlative$1,
  fromComparative: fromComparative$1,
  fromSuperlative: fromSuperlative$1,
  adjToNoun
};
const regexNormal = [
  //web tags
  [/^[\w.]+@[\w.]+\.[a-z]{2,3}$/, "Email"],
  [/^(https?:\/\/|www\.)+\w+\.[a-z]{2,3}/, "Url", "http.."],
  [/^[a-z0-9./].+\.(com|net|gov|org|ly|edu|info|biz|dev|ru|jp|de|in|uk|br|io|ai)/, "Url", ".com"],
  // timezones
  [/^[PMCE]ST$/, "Timezone", "EST"],
  //names
  [/^ma?c'[a-z]{3}/, "LastName", "mc'neil"],
  [/^o'[a-z]{3}/, "LastName", "o'connor"],
  [/^ma?cd[aeiou][a-z]{3}/, "LastName", "mcdonald"],
  //slang things
  [/^(lol)+[sz]$/, "Expression", "lol"],
  [/^wo{2,}a*h?$/, "Expression", "wooah"],
  [/^(hee?){2,}h?$/, "Expression", "hehe"],
  [/^(un|de|re)\\-[a-z\u00C0-\u00FF]{2}/, "Verb", "un-vite"],
  // m/h
  [/^(m|k|cm|km)\/(s|h|hr)$/, "Unit", "5 k/m"],
  // μg/g
  [/^(ug|ng|mg)\/(l|m3|ft3)$/, "Unit", "ug/L"],
  // love/hate
  [new RegExp("[^:/]\\/\\p{Letter}", "u"), "SlashedTerm", "love/hate"]
];
const regexText = [
  // #coolguy
  [new RegExp("^#[\\p{Number}_]*\\p{Letter}", "u"), "HashTag"],
  // can't be all numbers
  // @spencermountain
  [/^@\w{2,}$/, "AtMention"],
  // period-ones acronyms - f.b.i.
  [/^([A-Z]\.){2}[A-Z]?/i, ["Acronym", "Noun"], "F.B.I"],
  //ascii-only
  // ending-apostrophes
  [/.{3}[lkmnp]in['‘’‛‵′`´]$/, "Gerund", "chillin'"],
  [/.{4}s['‘’‛‵′`´]$/, "Possessive", "flanders'"],
  //from https://www.regextester.com/106421
  // [/^([\u00a9\u00ae\u2319-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/, 'Emoji', 'emoji-range']
  // unicode character range
  [/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u, "Emoji", "emoji-class"]
];
const regexNumbers = [
  [/^@1?[0-9](am|pm)$/i, "Time", "3pm"],
  [/^@1?[0-9]:[0-9]{2}(am|pm)?$/i, "Time", "3:30pm"],
  [/^'[0-9]{2}$/, "Year"],
  // times
  [/^[012]?[0-9](:[0-5][0-9])(:[0-5][0-9])$/, "Time", "3:12:31"],
  [/^[012]?[0-9](:[0-5][0-9])?(:[0-5][0-9])? ?(am|pm)$/i, "Time", "1:12pm"],
  [/^[012]?[0-9](:[0-5][0-9])(:[0-5][0-9])? ?(am|pm)?$/i, "Time", "1:12:31pm"],
  //can remove?
  // iso-dates
  [/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}/i, "Date", "iso-date"],
  [/^[0-9]{1,4}-[0-9]{1,2}-[0-9]{1,4}$/, "Date", "iso-dash"],
  [/^[0-9]{1,4}\/[0-9]{1,2}\/([0-9]{4}|[0-9]{2})$/, "Date", "iso-slash"],
  [/^[0-9]{1,4}\.[0-9]{1,2}\.[0-9]{1,4}$/, "Date", "iso-dot"],
  [/^[0-9]{1,4}-[a-z]{2,9}-[0-9]{1,4}$/i, "Date", "12-dec-2019"],
  // timezones
  [/^utc ?[+-]?[0-9]+$/, "Timezone", "utc-9"],
  [/^(gmt|utc)[+-][0-9]{1,2}$/i, "Timezone", "gmt-3"],
  //phone numbers
  [/^[0-9]{3}-[0-9]{4}$/, "PhoneNumber", "421-0029"],
  [/^(\+?[0-9][ -])?[0-9]{3}[ -]?[0-9]{3}-[0-9]{4}$/, "PhoneNumber", "1-800-"],
  //money
  //like $5.30
  [new RegExp("^[-+]?\\p{Currency_Symbol}[-+]?[0-9]+(,[0-9]{3})*(\\.[0-9]+)?([kmb]|bn)?\\+?$", "u"), ["Money", "Value"], "$5.30"],
  //like 5.30$
  [new RegExp("^[-+]?[0-9]+(,[0-9]{3})*(\\.[0-9]+)?\\p{Currency_Symbol}\\+?$", "u"), ["Money", "Value"], "5.30£"],
  //like
  [/^[-+]?[$£]?[0-9]([0-9,.])+(usd|eur|jpy|gbp|cad|aud|chf|cny|hkd|nzd|kr|rub)$/i, ["Money", "Value"], "$400usd"],
  //numbers
  // 50 | -50 | 3.23  | 5,999.0  | 10+
  [/^[-+]?[0-9]+(,[0-9]{3})*(\.[0-9]+)?\+?$/, ["Cardinal", "NumericValue"], "5,999"],
  [/^[-+]?[0-9]+(,[0-9]{3})*(\.[0-9]+)?(st|nd|rd|r?th)$/, ["Ordinal", "NumericValue"], "53rd"],
  // .73th
  [/^\.[0-9]+\+?$/, ["Cardinal", "NumericValue"], ".73th"],
  //percent
  [/^[-+]?[0-9]+(,[0-9]{3})*(\.[0-9]+)?%\+?$/, ["Percent", "Cardinal", "NumericValue"], "-4%"],
  [/^\.[0-9]+%$/, ["Percent", "Cardinal", "NumericValue"], ".3%"],
  //fraction
  [/^[0-9]{1,4}\/[0-9]{1,4}(st|nd|rd|th)?s?$/, ["Fraction", "NumericValue"], "2/3rds"],
  //range
  [/^[0-9.]{1,3}[a-z]{0,2}[-–—][0-9]{1,3}[a-z]{0,2}$/, ["Value", "NumberRange"], "3-4"],
  //time-range
  [/^[0-9]{1,2}(:[0-9][0-9])?(am|pm)? ?[-–—] ?[0-9]{1,2}(:[0-9][0-9])?(am|pm)$/, ["Time", "NumberRange"], "3-4pm"],
  //number with unit
  [/^[0-9.]+([a-z°]{1,4})$/, "NumericValue", "9km"]
];
const orgWords = [
  "academy",
  "administration",
  "agence",
  "agences",
  "agencies",
  "agency",
  "airlines",
  "airways",
  "army",
  "assoc",
  "associates",
  "association",
  "assurance",
  "authority",
  "autorite",
  "aviation",
  "bank",
  "banque",
  "board",
  "boys",
  "brands",
  "brewery",
  "brotherhood",
  "brothers",
  "bureau",
  "cafe",
  "co",
  "caisse",
  "capital",
  "care",
  "cathedral",
  "center",
  "centre",
  "chemicals",
  "choir",
  "chronicle",
  "church",
  "circus",
  "clinic",
  "clinique",
  "club",
  "co",
  "coalition",
  "coffee",
  "collective",
  "college",
  "commission",
  "committee",
  "communications",
  "community",
  "company",
  "comprehensive",
  "computers",
  "confederation",
  "conference",
  "conseil",
  "consulting",
  "containers",
  "corporation",
  "corps",
  "corp",
  "council",
  "crew",
  "data",
  "departement",
  "department",
  "departments",
  "design",
  "development",
  "directorate",
  "division",
  "drilling",
  "education",
  "eglise",
  "electric",
  "electricity",
  "energy",
  "ensemble",
  "enterprise",
  "enterprises",
  "entertainment",
  "estate",
  "etat",
  "faculty",
  "faction",
  "federation",
  "financial",
  "fm",
  "foundation",
  "fund",
  "gas",
  "gazette",
  "girls",
  "government",
  "group",
  "guild",
  "herald",
  "holdings",
  "hospital",
  "hotel",
  "hotels",
  "inc",
  "industries",
  "institut",
  "institute",
  "institutes",
  "insurance",
  "international",
  "interstate",
  "investment",
  "investments",
  "investors",
  "journal",
  "laboratory",
  "labs",
  "llc",
  "ltd",
  "limited",
  "machines",
  "magazine",
  "management",
  "marine",
  "marketing",
  "markets",
  "media",
  "memorial",
  "ministere",
  "ministry",
  "military",
  "mobile",
  "motor",
  "motors",
  "musee",
  "museum",
  "news",
  "observatory",
  "office",
  "oil",
  "optical",
  "orchestra",
  "organization",
  "partners",
  "partnership",
  "petrol",
  "petroleum",
  "pharmacare",
  "pharmaceutical",
  "pharmaceuticals",
  "pizza",
  "plc",
  "police",
  "politburo",
  "polytechnic",
  "post",
  "power",
  "press",
  "productions",
  "quartet",
  "radio",
  "reserve",
  "resources",
  "restaurant",
  "restaurants",
  "savings",
  "school",
  "securities",
  "service",
  "services",
  "societe",
  "subsidiary",
  "society",
  "sons",
  // 'standard',
  "subcommittee",
  "syndicat",
  "systems",
  "telecommunications",
  "telegraph",
  "television",
  "times",
  "tribunal",
  "tv",
  "union",
  "university",
  "utilities",
  "workers"
].reduce((h2, str) => {
  h2[str] = true;
  return h2;
}, {});
const placeWords = [
  // geology
  "atoll",
  "basin",
  "bay",
  "beach",
  "bluff",
  "bog",
  "camp",
  "canyon",
  "canyons",
  "cape",
  "cave",
  "caves",
  // 'cliff',
  "cliffs",
  "coast",
  "cove",
  "coves",
  "crater",
  "crossing",
  "creek",
  "desert",
  "dune",
  "dunes",
  "downs",
  "estates",
  "escarpment",
  "estuary",
  "falls",
  "fjord",
  "fjords",
  "forest",
  "forests",
  "glacier",
  "gorge",
  "gorges",
  "grove",
  "gulf",
  "gully",
  "highland",
  "heights",
  "hollow",
  "hill",
  "hills",
  "inlet",
  "island",
  "islands",
  "isthmus",
  "junction",
  "knoll",
  "lagoon",
  "lake",
  "lakeshore",
  "marsh",
  "marshes",
  "mount",
  "mountain",
  "mountains",
  "narrows",
  "peninsula",
  "plains",
  "plateau",
  "pond",
  "rapids",
  "ravine",
  "reef",
  "reefs",
  "ridge",
  // 'river delta',
  "river",
  "rivers",
  "sandhill",
  "shoal",
  "shore",
  "shoreline",
  "shores",
  "strait",
  "straits",
  "springs",
  "stream",
  "swamp",
  "tombolo",
  "trail",
  "trails",
  "trench",
  "valley",
  "vallies",
  "village",
  "volcano",
  "waterfall",
  "watershed",
  "wetland",
  "woods",
  "acres",
  // districts
  "burough",
  "county",
  "district",
  "municipality",
  "prefecture",
  "province",
  "region",
  "reservation",
  "state",
  "territory",
  "borough",
  "metropolis",
  "downtown",
  "uptown",
  "midtown",
  "city",
  "town",
  "township",
  "hamlet",
  "country",
  "kingdom",
  "enclave",
  "neighbourhood",
  "neighborhood",
  "kingdom",
  "ward",
  "zone",
  // 'range',
  //building/ complex
  "airport",
  "amphitheater",
  "arch",
  "arena",
  "auditorium",
  "bar",
  "barn",
  "basilica",
  "battlefield",
  "bridge",
  "building",
  "castle",
  "centre",
  "coliseum",
  "cineplex",
  "complex",
  "dam",
  "farm",
  "field",
  "fort",
  "garden",
  "gardens",
  // 'grounds',
  "gymnasium",
  "hall",
  "house",
  "levee",
  "library",
  "manor",
  "memorial",
  "monument",
  "museum",
  "gallery",
  "palace",
  "pillar",
  "pits",
  // 'pit',
  // 'place',
  // 'point',
  // 'room',
  "plantation",
  "playhouse",
  "quarry",
  // 'ruins',
  "sportsfield",
  "sportsplex",
  "stadium",
  // 'statue',
  "terrace",
  "terraces",
  "theater",
  "tower",
  "park",
  "parks",
  "site",
  "ranch",
  "raceway",
  "sportsplex",
  // 'sports centre',
  // 'sports field',
  // 'soccer complex',
  // 'soccer centre',
  // 'sports complex',
  // 'civic centre',
  // roads
  "ave",
  "st",
  "street",
  "rd",
  "road",
  "lane",
  "landing",
  "crescent",
  "cr",
  "way",
  "tr",
  "terrace",
  "avenue"
].reduce((h2, str) => {
  h2[str] = true;
  return h2;
}, {});
const rules$1 = [
  [/([^v])ies$/i, "$1y"],
  [/(ise)s$/i, "$1"],
  //promises
  [/(kn|[^o]l|w)ives$/i, "$1ife"],
  [/^((?:ca|e|ha|(?:our|them|your)?se|she|wo)l|lea|loa|shea|thie)ves$/i, "$1f"],
  [/^(dwar|handkerchie|hoo|scar|whar)ves$/i, "$1f"],
  [/(antenn|formul|nebul|vertebr|vit)ae$/i, "$1a"],
  [/(octop|vir|radi|nucle|fung|cact|stimul)(i)$/i, "$1us"],
  [/(buffal|tomat|tornad)(oes)$/i, "$1o"],
  [/(ause)s$/i, "$1"],
  //causes
  [/(ease)s$/i, "$1"],
  //diseases
  [/(ious)es$/i, "$1"],
  //geniouses
  [/(ouse)s$/i, "$1"],
  //houses
  [/(ose)s$/i, "$1"],
  //roses
  [/(..ase)s$/i, "$1"],
  [/(..[aeiu]s)es$/i, "$1"],
  [/(vert|ind|cort)(ices)$/i, "$1ex"],
  [/(matr|append)(ices)$/i, "$1ix"],
  [/([xo]|ch|ss|sh)es$/i, "$1"],
  [/men$/i, "man"],
  [/(n)ews$/i, "$1ews"],
  [/([ti])a$/i, "$1um"],
  [/([^aeiouy]|qu)ies$/i, "$1y"],
  [/(s)eries$/i, "$1eries"],
  [/(m)ovies$/i, "$1ovie"],
  [/(cris|ax|test)es$/i, "$1is"],
  [/(alias|status)es$/i, "$1"],
  [/(ss)$/i, "$1"],
  [/(ic)s$/i, "$1"],
  [/s$/i, ""]
];
const invertObj = function(obj) {
  return Object.keys(obj).reduce((h2, k2) => {
    h2[obj[k2]] = k2;
    return h2;
  }, {});
};
const toSingular = function(str, model2) {
  const { irregularPlurals: irregularPlurals2 } = model2.two;
  const invert = invertObj(irregularPlurals2);
  if (invert.hasOwnProperty(str)) {
    return invert[str];
  }
  for (let i2 = 0; i2 < rules$1.length; i2++) {
    if (rules$1[i2][0].test(str) === true) {
      str = str.replace(rules$1[i2][0], rules$1[i2][1]);
      return str;
    }
  }
  return str;
};
const all$2 = function(str, model2) {
  const arr = [str];
  const p2 = pluralize(str, model2);
  if (p2 !== str) {
    arr.push(p2);
  }
  const s2 = toSingular(str, model2);
  if (s2 !== str) {
    arr.push(s2);
  }
  return arr;
};
const nouns$2 = { toPlural: pluralize, toSingular, all: all$2 };
let guessVerb = {
  Gerund: ["ing"],
  Actor: ["erer"],
  Infinitive: [
    "ate",
    "ize",
    "tion",
    "rify",
    "then",
    "ress",
    "ify",
    "age",
    "nce",
    "ect",
    "ise",
    "ine",
    "ish",
    "ace",
    "ash",
    "ure",
    "tch",
    "end",
    "ack",
    "and",
    "ute",
    "ade",
    "ock",
    "ite",
    "ase",
    "ose",
    "use",
    "ive",
    "int",
    "nge",
    "lay",
    "est",
    "ain",
    "ant",
    "ent",
    "eed",
    "er",
    "le",
    "unk",
    "ung",
    "upt",
    "en"
  ],
  PastTense: ["ept", "ed", "lt", "nt", "ew", "ld"],
  PresentTense: [
    "rks",
    "cks",
    "nks",
    "ngs",
    "mps",
    "tes",
    "zes",
    "ers",
    "les",
    "acks",
    "ends",
    "ands",
    "ocks",
    "lays",
    "eads",
    "lls",
    "els",
    "ils",
    "ows",
    "nds",
    "ays",
    "ams",
    "ars",
    "ops",
    "ffs",
    "als",
    "urs",
    "lds",
    "ews",
    "ips",
    "es",
    "ts",
    "ns"
  ],
  Participle: ["ken", "wn"]
};
guessVerb = Object.keys(guessVerb).reduce((h2, k2) => {
  guessVerb[k2].forEach((a2) => h2[a2] = k2);
  return h2;
}, {});
const getTense$1 = function(str) {
  const three = str.substring(str.length - 3);
  if (guessVerb.hasOwnProperty(three) === true) {
    return guessVerb[three];
  }
  const two = str.substring(str.length - 2);
  if (guessVerb.hasOwnProperty(two) === true) {
    return guessVerb[two];
  }
  const one = str.substring(str.length - 1);
  if (one === "s") {
    return "PresentTense";
  }
  return null;
};
const toParts = function(str, model2) {
  let prefix2 = "";
  let prefixes2 = {};
  if (model2.one && model2.one.prefixes) {
    prefixes2 = model2.one.prefixes;
  }
  let [verb2, particle] = str.split(/ /);
  if (particle && prefixes2[verb2] === true) {
    prefix2 = verb2;
    verb2 = particle;
    particle = "";
  }
  return {
    prefix: prefix2,
    verb: verb2,
    particle
  };
};
const copulaMap = {
  are: "be",
  were: "be",
  been: "be",
  is: "be",
  am: "be",
  was: "be",
  be: "be",
  being: "be"
};
const toInfinitive$1 = function(str, model2, tense) {
  const { fromPast: fromPast2, fromPresent: fromPresent2, fromGerund: fromGerund2, fromParticiple: fromParticiple2 } = model2.two.models;
  const { prefix: prefix2, verb: verb2, particle } = toParts(str, model2);
  let inf = "";
  if (!tense) {
    tense = getTense$1(str);
  }
  if (copulaMap.hasOwnProperty(str)) {
    inf = copulaMap[str];
  } else if (tense === "Participle") {
    inf = convert(verb2, fromParticiple2);
  } else if (tense === "PastTense") {
    inf = convert(verb2, fromPast2);
  } else if (tense === "PresentTense") {
    inf = convert(verb2, fromPresent2);
  } else if (tense === "Gerund") {
    inf = convert(verb2, fromGerund2);
  } else {
    return str;
  }
  if (particle) {
    inf += " " + particle;
  }
  if (prefix2) {
    inf = prefix2 + " " + inf;
  }
  return inf;
};
const parse$3 = (inf) => {
  if (/ /.test(inf)) {
    return inf.split(/ /);
  }
  return [inf, ""];
};
const conjugate = function(inf, model2) {
  const { toPast: toPast2, toPresent: toPresent2, toGerund: toGerund2, toParticiple: toParticiple2 } = model2.two.models;
  if (inf === "be") {
    return {
      Infinitive: inf,
      Gerund: "being",
      PastTense: "was",
      PresentTense: "is"
    };
  }
  const [str, particle] = parse$3(inf);
  const found = {
    Infinitive: str,
    PastTense: convert(str, toPast2),
    PresentTense: convert(str, toPresent2),
    Gerund: convert(str, toGerund2),
    FutureTense: "will " + str
  };
  let pastPrt = convert(str, toParticiple2);
  if (pastPrt !== inf && pastPrt !== found.PastTense) {
    const lex = model2.one.lexicon || {};
    if (lex[pastPrt] === "Participle" || lex[pastPrt] === "Adjective") {
      if (inf === "play") {
        pastPrt = "played";
      }
      found.Participle = pastPrt;
    }
  }
  if (particle) {
    Object.keys(found).forEach((k2) => {
      found[k2] += " " + particle;
    });
  }
  return found;
};
const all$1 = function(str, model2) {
  const res = conjugate(str, model2);
  delete res.FutureTense;
  return Object.values(res).filter((s2) => s2);
};
const verbs$3 = {
  toInfinitive: toInfinitive$1,
  conjugate,
  all: all$1
};
const toSuperlative = function(adj2, model2) {
  const mod = model2.two.models.toSuperlative;
  return convert(adj2, mod);
};
const toComparative = function(adj2, model2) {
  const mod = model2.two.models.toComparative;
  return convert(adj2, mod);
};
const fromComparative = function(adj2, model2) {
  const mod = model2.two.models.fromComparative;
  return convert(adj2, mod);
};
const fromSuperlative = function(adj2, model2) {
  const mod = model2.two.models.fromSuperlative;
  return convert(adj2, mod);
};
const toNoun = function(adj2, model2) {
  const mod = model2.two.models.adjToNoun;
  return convert(adj2, mod);
};
const suffixLoop$1 = function(str = "", suffixes2 = []) {
  const len = str.length;
  const max2 = len <= 6 ? len - 1 : 6;
  for (let i2 = max2; i2 >= 1; i2 -= 1) {
    const suffix = str.substring(len - i2, str.length);
    if (suffixes2[suffix.length].hasOwnProperty(suffix) === true) {
      const pre = str.slice(0, len - i2);
      const post = suffixes2[suffix.length][suffix];
      return pre + post;
    }
  }
  return null;
};
const s = "ically";
const ical = /* @__PURE__ */ new Set([
  "analyt" + s,
  //analytical
  "chem" + s,
  // chemical
  "class" + s,
  //classical
  "clin" + s,
  // clinical
  "crit" + s,
  // critical
  "ecolog" + s,
  // ecological
  "electr" + s,
  // electrical
  "empir" + s,
  // empirical
  "frant" + s,
  // frantical
  "grammat" + s,
  // grammatical
  "ident" + s,
  // identical
  "ideolog" + s,
  // ideological
  "log" + s,
  // logical
  "mag" + s,
  //magical
  "mathemat" + s,
  // mathematical
  "mechan" + s,
  // mechanical
  "med" + s,
  // medical
  "method" + s,
  // methodical
  "method" + s,
  // methodical
  "mus" + s,
  // musical
  "phys" + s,
  // physical
  "phys" + s,
  // physical
  "polit" + s,
  // political
  "pract" + s,
  // practical
  "rad" + s,
  //radical
  "satir" + s,
  // satirical
  "statist" + s,
  // statistical
  "techn" + s,
  // technical
  "technolog" + s,
  // technological
  "theoret" + s,
  // theoretical
  "typ" + s,
  // typical
  "vert" + s,
  // vertical
  "whims" + s
  // whimsical
]);
const suffixes$2 = [
  null,
  {},
  { "ly": "" },
  {
    "ily": "y",
    "bly": "ble",
    "ply": "ple"
  },
  {
    "ally": "al",
    "rply": "rp"
  },
  {
    "ually": "ual",
    "ially": "ial",
    "cally": "cal",
    "eally": "eal",
    "rally": "ral",
    "nally": "nal",
    "mally": "mal",
    "eeply": "eep",
    "eaply": "eap"
  },
  {
    ically: "ic"
  }
];
const noAdj = /* @__PURE__ */ new Set([
  "early",
  "only",
  "hourly",
  "daily",
  "weekly",
  "monthly",
  "yearly",
  "mostly",
  "duly",
  "unduly",
  "especially",
  "undoubtedly",
  "conversely",
  "namely",
  "exceedingly",
  "presumably",
  "accordingly",
  "overly",
  "best",
  "latter",
  "little",
  "long",
  "low"
]);
const exceptions$2 = {
  wholly: "whole",
  fully: "full",
  truly: "true",
  gently: "gentle",
  singly: "single",
  customarily: "customary",
  idly: "idle",
  publically: "public",
  quickly: "quick",
  superbly: "superb",
  cynically: "cynical",
  well: "good"
  // -?
};
const toAdjective = function(str) {
  if (!str.endsWith("ly")) {
    return null;
  }
  if (ical.has(str)) {
    return str.replace(/ically/, "ical");
  }
  if (noAdj.has(str)) {
    return null;
  }
  if (exceptions$2.hasOwnProperty(str)) {
    return exceptions$2[str];
  }
  return suffixLoop$1(str, suffixes$2) || str;
};
const suffixes$1 = [
  null,
  {
    y: "ily"
  },
  {
    ly: "ly",
    //unchanged
    ic: "ically"
  },
  {
    ial: "ially",
    ual: "ually",
    tle: "tly",
    ble: "bly",
    ple: "ply",
    ary: "arily"
  },
  {},
  {},
  {}
];
const exceptions$1 = {
  cool: "cooly",
  whole: "wholly",
  full: "fully",
  good: "well",
  idle: "idly",
  public: "publicly",
  single: "singly",
  special: "especially"
};
const toAdverb = function(str) {
  if (exceptions$1.hasOwnProperty(str)) {
    return exceptions$1[str];
  }
  let adv2 = suffixLoop$1(str, suffixes$1);
  if (!adv2) {
    adv2 = str + "ly";
  }
  return adv2;
};
const all = function(str, model2) {
  let arr = [str];
  arr.push(toSuperlative(str, model2));
  arr.push(toComparative(str, model2));
  arr.push(toAdverb(str));
  arr = arr.filter((s2) => s2);
  arr = new Set(arr);
  return Array.from(arr);
};
const adjectives$1 = {
  toSuperlative,
  toComparative,
  toAdverb,
  toNoun,
  fromAdverb: toAdjective,
  fromSuperlative,
  fromComparative,
  all
};
const transform = {
  noun: nouns$2,
  verb: verbs$3,
  adjective: adjectives$1
};
const byTag = {
  // add plural forms of singular nouns
  Singular: (word, lex, methods2, model2) => {
    const already = model2.one.lexicon;
    const plural2 = methods2.two.transform.noun.toPlural(word, model2);
    if (!already[plural2]) {
      lex[plural2] = lex[plural2] || "Plural";
    }
  },
  // 'lawyer', 'manager' plural forms
  Actor: (word, lex, methods2, model2) => {
    const already = model2.one.lexicon;
    const plural2 = methods2.two.transform.noun.toPlural(word, model2);
    if (!already[plural2]) {
      lex[plural2] = lex[plural2] || ["Plural", "Actor"];
    }
  },
  // superlative/ comparative forms for adjectives
  Comparable: (word, lex, methods2, model2) => {
    const already = model2.one.lexicon;
    const { toSuperlative: toSuperlative2, toComparative: toComparative2 } = methods2.two.transform.adjective;
    const sup = toSuperlative2(word, model2);
    if (!already[sup]) {
      lex[sup] = lex[sup] || "Superlative";
    }
    const comp = toComparative2(word, model2);
    if (!already[comp]) {
      lex[comp] = lex[comp] || "Comparative";
    }
    lex[word] = "Adjective";
  },
  // 'german' -> 'germans'
  Demonym: (word, lex, methods2, model2) => {
    const plural2 = methods2.two.transform.noun.toPlural(word, model2);
    lex[plural2] = lex[plural2] || ["Demonym", "Plural"];
  },
  // conjugate all forms of these verbs
  Infinitive: (word, lex, methods2, model2) => {
    const already = model2.one.lexicon;
    const all2 = methods2.two.transform.verb.conjugate(word, model2);
    Object.entries(all2).forEach((a2) => {
      if (!already[a2[1]] && !lex[a2[1]] && a2[0] !== "FutureTense") {
        lex[a2[1]] = a2[0];
      }
    });
  },
  // 'walk up' should conjugate, too
  PhrasalVerb: (word, lex, methods2, model2) => {
    const already = model2.one.lexicon;
    lex[word] = ["PhrasalVerb", "Infinitive"];
    const _multi = model2.one._multiCache;
    const [inf, rest] = word.split(" ");
    if (!already[inf]) {
      lex[inf] = lex[inf] || "Infinitive";
    }
    const all2 = methods2.two.transform.verb.conjugate(inf, model2);
    delete all2.FutureTense;
    Object.entries(all2).forEach((a2) => {
      if (a2[0] === "Actor" || a2[1] === "") {
        return;
      }
      if (!lex[a2[1]] && !already[a2[1]]) {
        lex[a2[1]] = a2[0];
      }
      _multi[a2[1]] = 2;
      const str = a2[1] + " " + rest;
      lex[str] = lex[str] || [a2[0], "PhrasalVerb"];
    });
  },
  // expand 'million'
  Multiple: (word, lex) => {
    lex[word] = ["Multiple", "Cardinal"];
    lex[word + "th"] = ["Multiple", "Ordinal"];
    lex[word + "ths"] = ["Multiple", "Fraction"];
  },
  // expand number-words
  Cardinal: (word, lex) => {
    lex[word] = ["TextValue", "Cardinal"];
  },
  // 'millionth'
  Ordinal: (word, lex) => {
    lex[word] = ["TextValue", "Ordinal"];
    lex[word + "s"] = ["TextValue", "Fraction"];
  },
  // 'thames'
  Place: (word, lex) => {
    lex[word] = ["Place", "ProperNoun"];
  },
  // 'ontario'
  Region: (word, lex) => {
    lex[word] = ["Region", "ProperNoun"];
  }
};
const expand$1 = function(words2, world2) {
  const { methods: methods2, model: model2 } = world2;
  const lex = {};
  const _multi = {};
  Object.keys(words2).forEach((word) => {
    const tag2 = words2[word];
    word = word.toLowerCase().trim();
    word = word.replace(/'s\b/, "");
    const split2 = word.split(/ /);
    if (split2.length > 1) {
      if (_multi[split2[0]] === void 0 || split2.length > _multi[split2[0]]) {
        _multi[split2[0]] = split2.length;
      }
    }
    if (byTag.hasOwnProperty(tag2) === true) {
      byTag[tag2](word, lex, methods2, model2);
    }
    lex[word] = lex[word] || tag2;
  });
  delete lex[""];
  delete lex[null];
  delete lex[" "];
  return { lex, _multi };
};
const splitOn = function(terms, i2) {
  const isNum = /^[0-9]+$/;
  const term = terms[i2];
  if (!term) {
    return false;
  }
  const maybeDate = /* @__PURE__ */ new Set(["may", "april", "august", "jan"]);
  if (term.normal === "like" || maybeDate.has(term.normal)) {
    return false;
  }
  if (term.tags.has("Place") || term.tags.has("Date")) {
    return false;
  }
  if (terms[i2 - 1]) {
    const lastTerm = terms[i2 - 1];
    if (lastTerm.tags.has("Date") || maybeDate.has(lastTerm.normal)) {
      return false;
    }
    if (lastTerm.tags.has("Adjective") || term.tags.has("Adjective")) {
      return false;
    }
  }
  const str = term.normal;
  if (str.length === 1 || str.length === 2 || str.length === 4) {
    if (isNum.test(str)) {
      return false;
    }
  }
  return true;
};
const quickSplit = function(document) {
  const splitHere = /[,:;]/;
  const arr = [];
  document.forEach((terms) => {
    let start2 = 0;
    terms.forEach((term, i2) => {
      if (splitHere.test(term.post) && splitOn(terms, i2 + 1)) {
        arr.push(terms.slice(start2, i2 + 1));
        start2 = i2 + 1;
      }
    });
    if (start2 < terms.length) {
      arr.push(terms.slice(start2, terms.length));
    }
  });
  return arr;
};
const isPlural$3 = {
  e: ["mice", "louse", "antennae", "formulae", "nebulae", "vertebrae", "vitae"],
  i: ["tia", "octopi", "viri", "radii", "nuclei", "fungi", "cacti", "stimuli"],
  n: ["men"],
  t: ["feet"]
};
const exceptions = /* @__PURE__ */ new Set([
  // 'formulas',
  // 'umbrellas',
  // 'gorillas',
  // 'koalas',
  "israelis",
  "menus",
  "logos"
]);
const notPlural$1 = [
  "bus",
  "mas",
  //christmas
  "was",
  // 'las',
  "ias",
  //alias
  "xas",
  "vas",
  "cis",
  //probocis
  "lis",
  "nis",
  //tennis
  "ois",
  "ris",
  "sis",
  //thesis
  "tis",
  //mantis, testis
  "xis",
  "aus",
  "cus",
  "eus",
  //nucleus
  "fus",
  //doofus
  "gus",
  //fungus
  "ius",
  //radius
  "lus",
  //stimulus
  "nus",
  "das",
  "ous",
  "pus",
  //octopus
  "rus",
  //virus
  "sus",
  //census
  "tus",
  //status,cactus
  "xus",
  "aos",
  //chaos
  "igos",
  "ados",
  //barbados
  "ogos",
  "'s",
  "ss"
];
const looksPlural = function(str) {
  if (!str || str.length <= 3) {
    return false;
  }
  if (exceptions.has(str)) {
    return true;
  }
  const end2 = str[str.length - 1];
  if (isPlural$3.hasOwnProperty(end2)) {
    return isPlural$3[end2].find((suff) => str.endsWith(suff));
  }
  if (end2 !== "s") {
    return false;
  }
  if (notPlural$1.find((suff) => str.endsWith(suff))) {
    return false;
  }
  return true;
};
const methods$1 = {
  two: {
    quickSplit,
    expandLexicon: expand$1,
    transform,
    looksPlural
  }
};
const expandIrregulars = function(model2) {
  const { irregularPlurals: irregularPlurals2 } = model2.two;
  const { lexicon: lexicon2 } = model2.one;
  Object.entries(irregularPlurals2).forEach((a2) => {
    lexicon2[a2[0]] = lexicon2[a2[0]] || "Singular";
    lexicon2[a2[1]] = lexicon2[a2[1]] || "Plural";
  });
  return model2;
};
const tmpModel = {
  one: { lexicon: {} },
  two: { models }
};
const switchDefaults = {
  // 'pilot'
  "Actor|Verb": "Actor",
  //
  // 'amusing'
  "Adj|Gerund": "Adjective",
  //+conjugations
  // 'standard'
  "Adj|Noun": "Adjective",
  // 'boiled'
  "Adj|Past": "Adjective",
  //+conjugations
  // 'smooth'
  "Adj|Present": "Adjective",
  //+conjugations
  // 'box'
  "Noun|Verb": "Singular",
  //+conjugations (no-present)
  //'singing'
  "Noun|Gerund": "Gerund",
  //+conjugations
  // 'hope'
  "Person|Noun": "Noun",
  // 'April'
  "Person|Date": "Month",
  // 'rob'
  "Person|Verb": "FirstName",
  //+conjugations
  // 'victoria'
  "Person|Place": "Person",
  // 'rusty'
  "Person|Adj": "Comparative",
  // 'boxes'
  "Plural|Verb": "Plural",
  //(these are already derivative)
  // 'miles'
  "Unit|Noun": "Noun"
};
const expandLexicon = function(words2, model2) {
  const world2 = { model: model2, methods: methods$1 };
  const { lex, _multi } = methods$1.two.expandLexicon(words2, world2);
  Object.assign(model2.one.lexicon, lex);
  Object.assign(model2.one._multiCache, _multi);
  return model2;
};
const addUncountables = function(words2, model2) {
  Object.keys(words2).forEach((k2) => {
    if (words2[k2] === "Uncountable") {
      model2.two.uncountable[k2] = true;
      words2[k2] = "Uncountable";
    }
  });
  return model2;
};
const expandVerb = function(str, words2, doPresent) {
  const obj = conjugate(str, tmpModel);
  words2[obj.PastTense] = words2[obj.PastTense] || "PastTense";
  words2[obj.Gerund] = words2[obj.Gerund] || "Gerund";
  if (doPresent === true) {
    words2[obj.PresentTense] = words2[obj.PresentTense] || "PresentTense";
  }
};
const expandAdjective = function(str, words2, model2) {
  const sup = toSuperlative(str, model2);
  words2[sup] = words2[sup] || "Superlative";
  const comp = toComparative(str, model2);
  words2[comp] = words2[comp] || "Comparative";
};
const expandNoun = function(str, words2, model2) {
  const plur = pluralize(str, model2);
  words2[plur] = words2[plur] || "Plural";
};
const expandVariable = function(switchWords, model2) {
  const words2 = {};
  const lex = model2.one.lexicon;
  Object.keys(switchWords).forEach((w) => {
    const name = switchWords[w];
    words2[w] = switchDefaults[name];
    if (name === "Noun|Verb" || name === "Person|Verb" || name === "Actor|Verb") {
      expandVerb(w, lex, false);
    }
    if (name === "Adj|Present") {
      expandVerb(w, lex, true);
      expandAdjective(w, lex, model2);
    }
    if (name === "Person|Adj") {
      expandAdjective(w, lex, model2);
    }
    if (name === "Adj|Gerund" || name === "Noun|Gerund") {
      const inf = toInfinitive$1(w, tmpModel, "Gerund");
      if (!lex[inf]) {
        words2[inf] = "Infinitive";
      }
    }
    if (name === "Noun|Gerund" || name === "Adj|Noun" || name === "Person|Noun") {
      expandNoun(w, lex, model2);
    }
    if (name === "Adj|Past") {
      const inf = toInfinitive$1(w, tmpModel, "PastTense");
      if (!lex[inf]) {
        words2[inf] = "Infinitive";
      }
    }
  });
  model2 = expandLexicon(words2, model2);
  return model2;
};
const expand = function(model2) {
  model2 = expandLexicon(model2.one.lexicon, model2);
  model2 = addUncountables(model2.one.lexicon, model2);
  model2 = expandVariable(model2.two.switches, model2);
  model2 = expandIrregulars(model2);
  return model2;
};
let model$1 = {
  one: {
    _multiCache: {},
    lexicon,
    frozenLex
  },
  two: {
    irregularPlurals,
    models,
    suffixPatterns,
    prefixPatterns,
    endsWith,
    neighbours: neighbours$1,
    regexNormal,
    regexText,
    regexNumbers,
    switches,
    clues,
    uncountable: {},
    orgWords,
    placeWords
  }
};
model$1 = expand(model$1);
const byPunctuation = function(terms, i2, model2, world2) {
  const setTag2 = world2.methods.one.setTag;
  if (terms.length >= 3) {
    const hasColon = /:/;
    const post = terms[0].post;
    if (post.match(hasColon)) {
      const nextTerm = terms[1];
      if (nextTerm.tags.has("Value") || nextTerm.tags.has("Email") || nextTerm.tags.has("PhoneNumber")) {
        return;
      }
      setTag2([terms[0]], "Expression", world2, null, `2-punct-colon''`);
    }
  }
};
const byHyphen = function(terms, i2, model2, world2) {
  const setTag2 = world2.methods.one.setTag;
  if (terms[i2].post === "-" && terms[i2 + 1]) {
    setTag2([terms[i2], terms[i2 + 1]], "Hyphenated", world2, null, `1-punct-hyphen''`);
  }
};
const prefix$1 = /^(under|over|mis|re|un|dis|semi)-?/;
const tagSwitch = function(terms, i2, model2) {
  const switches2 = model2.two.switches;
  const term = terms[i2];
  if (switches2.hasOwnProperty(term.normal)) {
    term.switch = switches2[term.normal];
    return;
  }
  if (prefix$1.test(term.normal)) {
    const stem = term.normal.replace(prefix$1, "");
    if (stem.length > 3 && switches2.hasOwnProperty(stem)) {
      term.switch = switches2[stem];
    }
  }
};
var define_process_env_default$2 = {};
const log = (term, tag2, reason = "") => {
  const yellow = (str) => "\x1B[33m\x1B[3m" + str + "\x1B[0m";
  const i2 = (str) => "\x1B[3m" + str + "\x1B[0m";
  const word = term.text || "[" + term.implicit + "]";
  if (typeof tag2 !== "string" && tag2.length > 2) {
    tag2 = tag2.slice(0, 2).join(", #") + " +";
  }
  tag2 = typeof tag2 !== "string" ? tag2.join(", #") : tag2;
  console.log(` ${yellow(word).padEnd(24)} \x1B[32m→\x1B[0m #${tag2.padEnd(22)}  ${i2(reason)}`);
};
const fastTag = function(term, tag2, reason) {
  if (!tag2 || tag2.length === 0) {
    return;
  }
  if (term.frozen === true) {
    return;
  }
  const env2 = typeof process === "undefined" || !define_process_env_default$2 ? self.env || {} : define_process_env_default$2;
  if (env2 && env2.DEBUG_TAGS) {
    log(term, tag2, reason);
  }
  term.tags = term.tags || /* @__PURE__ */ new Set();
  if (typeof tag2 === "string") {
    term.tags.add(tag2);
  } else {
    tag2.forEach((tg) => term.tags.add(tg));
  }
};
const uncountable = [
  "Acronym",
  "Abbreviation",
  "ProperNoun",
  "Uncountable",
  "Possessive",
  "Pronoun",
  "Activity",
  "Honorific",
  "Month"
];
const setPluralSingular = function(term) {
  if (!term.tags.has("Noun") || term.tags.has("Plural") || term.tags.has("Singular")) {
    return;
  }
  if (uncountable.find((tag2) => term.tags.has(tag2))) {
    return;
  }
  if (looksPlural(term.normal)) {
    fastTag(term, "Plural", "3-plural-guess");
  } else {
    fastTag(term, "Singular", "3-singular-guess");
  }
};
const setTense = function(term) {
  const tags = term.tags;
  if (tags.has("Verb") && tags.size === 1) {
    const guess = getTense$1(term.normal);
    if (guess) {
      fastTag(term, guess, "3-verb-tense-guess");
    }
  }
};
const fillTags = function(terms, i2, model2) {
  const term = terms[i2];
  const tags = Array.from(term.tags);
  for (let k2 = 0; k2 < tags.length; k2 += 1) {
    if (model2.one.tagSet[tags[k2]]) {
      const toAdd = model2.one.tagSet[tags[k2]].parents;
      fastTag(term, toAdd, ` -inferred by #${tags[k2]}`);
    }
  }
  setPluralSingular(term);
  setTense(term);
};
const titleCase$1 = new RegExp("^\\p{Lu}[\\p{Ll}'’]", "u");
const hasNumber = /[0-9]/;
const notProper = ["Date", "Month", "WeekDay", "Unit", "Expression"];
const hasIVX = /[IVX]/;
const romanNumeral = /^[IVXLCDM]{2,}$/;
const romanNumValid = /^M{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;
const nope = {
  li: true,
  dc: true,
  md: true,
  dm: true,
  ml: true
};
const checkCase = function(terms, i2, model2) {
  const term = terms[i2];
  term.index = term.index || [0, 0];
  const index2 = term.index[1];
  const str = term.text || "";
  if (index2 !== 0 && titleCase$1.test(str) === true && hasNumber.test(str) === false) {
    if (notProper.find((tag2) => term.tags.has(tag2))) {
      return null;
    }
    if (term.pre.match(/["']$/)) {
      return null;
    }
    if (term.normal === "the") {
      return null;
    }
    fillTags(terms, i2, model2);
    if (!term.tags.has("Noun") && !term.frozen) {
      term.tags.clear();
    }
    fastTag(term, "ProperNoun", "2-titlecase");
    return true;
  }
  if (str.length >= 2 && romanNumeral.test(str) && hasIVX.test(str) && romanNumValid.test(str) && !nope[term.normal]) {
    fastTag(term, "RomanNumeral", "2-xvii");
    return true;
  }
  return null;
};
const suffixLoop = function(str = "", suffixes2 = []) {
  const len = str.length;
  let max2 = 7;
  if (len <= max2) {
    max2 = len - 1;
  }
  for (let i2 = max2; i2 > 1; i2 -= 1) {
    const suffix = str.substring(len - i2, len);
    if (suffixes2[suffix.length].hasOwnProperty(suffix) === true) {
      const tag2 = suffixes2[suffix.length][suffix];
      return tag2;
    }
  }
  return null;
};
const tagBySuffix = function(terms, i2, model2) {
  const term = terms[i2];
  if (term.tags.size === 0) {
    let tag2 = suffixLoop(term.normal, model2.two.suffixPatterns);
    if (tag2 !== null) {
      fastTag(term, tag2, "2-suffix");
      term.confidence = 0.7;
      return true;
    }
    if (term.implicit) {
      tag2 = suffixLoop(term.implicit, model2.two.suffixPatterns);
      if (tag2 !== null) {
        fastTag(term, tag2, "2-implicit-suffix");
        term.confidence = 0.7;
        return true;
      }
    }
  }
  return null;
};
const hasApostrophe = /['‘’‛‵′`´]/;
const doRegs = function(str, regs) {
  for (let i2 = 0; i2 < regs.length; i2 += 1) {
    if (regs[i2][0].test(str) === true) {
      return regs[i2];
    }
  }
  return null;
};
const doEndsWith = function(str = "", byEnd2) {
  const char = str[str.length - 1];
  if (byEnd2.hasOwnProperty(char) === true) {
    const regs = byEnd2[char] || [];
    for (let r2 = 0; r2 < regs.length; r2 += 1) {
      if (regs[r2][0].test(str) === true) {
        return regs[r2];
      }
    }
  }
  return null;
};
const checkRegex = function(terms, i2, model2, world2) {
  const setTag2 = world2.methods.one.setTag;
  const { regexText: regexText2, regexNormal: regexNormal2, regexNumbers: regexNumbers2, endsWith: endsWith2 } = model2.two;
  const term = terms[i2];
  const normal = term.machine || term.normal;
  let text2 = term.text;
  if (hasApostrophe.test(term.post) && !hasApostrophe.test(term.pre)) {
    text2 += term.post.trim();
  }
  let arr = doRegs(text2, regexText2) || doRegs(normal, regexNormal2);
  if (!arr && /[0-9]/.test(normal)) {
    arr = doRegs(normal, regexNumbers2);
  }
  if (!arr && term.tags.size === 0) {
    arr = doEndsWith(normal, endsWith2);
  }
  if (arr) {
    setTag2([term], arr[1], world2, null, `2-regex-'${arr[2] || arr[0]}'`);
    term.confidence = 0.6;
    return true;
  }
  return null;
};
const prefixLoop = function(str = "", prefixes2 = []) {
  const len = str.length;
  let max2 = 7;
  if (max2 > len - 3) {
    max2 = len - 3;
  }
  for (let i2 = max2; i2 > 2; i2 -= 1) {
    const prefix2 = str.substring(0, i2);
    if (prefixes2[prefix2.length].hasOwnProperty(prefix2) === true) {
      const tag2 = prefixes2[prefix2.length][prefix2];
      return tag2;
    }
  }
  return null;
};
const checkPrefix = function(terms, i2, model2) {
  const term = terms[i2];
  if (term.tags.size === 0) {
    const tag2 = prefixLoop(term.normal, model2.two.prefixPatterns);
    if (tag2 !== null) {
      fastTag(term, tag2, "2-prefix");
      term.confidence = 0.5;
      return true;
    }
  }
  return null;
};
const min = 1400;
const max = 2100;
const dateWords = /* @__PURE__ */ new Set([
  "in",
  "on",
  "by",
  "until",
  "for",
  "to",
  "during",
  "throughout",
  "through",
  "within",
  "before",
  "after",
  "of",
  "this",
  "next",
  "last",
  "circa",
  "around",
  "post",
  "pre",
  "budget",
  "classic",
  "plan",
  "may"
]);
const seemsGood = function(term) {
  if (!term) {
    return false;
  }
  const str = term.normal || term.implicit;
  if (dateWords.has(str)) {
    return true;
  }
  if (term.tags.has("Date") || term.tags.has("Month") || term.tags.has("WeekDay") || term.tags.has("Year")) {
    return true;
  }
  if (term.tags.has("ProperNoun")) {
    return true;
  }
  return false;
};
const seemsOkay = function(term) {
  if (!term) {
    return false;
  }
  if (term.tags.has("Ordinal")) {
    return true;
  }
  if (term.tags.has("Cardinal") && term.normal.length < 3) {
    return true;
  }
  if (term.normal === "is" || term.normal === "was") {
    return true;
  }
  return false;
};
const seemsFine = function(term) {
  return term && (term.tags.has("Date") || term.tags.has("Month") || term.tags.has("WeekDay") || term.tags.has("Year"));
};
const tagYear = function(terms, i2) {
  const term = terms[i2];
  if (term.tags.has("NumericValue") && term.tags.has("Cardinal") && term.normal.length === 4) {
    const num = Number(term.normal);
    if (num && !isNaN(num)) {
      if (num > min && num < max) {
        const lastTerm = terms[i2 - 1];
        const nextTerm = terms[i2 + 1];
        if (seemsGood(lastTerm) || seemsGood(nextTerm)) {
          return fastTag(term, "Year", "2-tagYear");
        }
        if (num >= 1920 && num < 2025) {
          if (seemsOkay(lastTerm) || seemsOkay(nextTerm)) {
            return fastTag(term, "Year", "2-tagYear-close");
          }
          if (seemsFine(terms[i2 - 2]) || seemsFine(terms[i2 + 2])) {
            return fastTag(term, "Year", "2-tagYear-far");
          }
          if (lastTerm && (lastTerm.tags.has("Determiner") || lastTerm.tags.has("Possessive"))) {
            if (nextTerm && nextTerm.tags.has("Noun") && !nextTerm.tags.has("Plural")) {
              return fastTag(term, "Year", "2-tagYear-noun");
            }
          }
        }
      }
    }
  }
  return null;
};
const verbType = function(terms, i2, model2, world2) {
  const setTag2 = world2.methods.one.setTag;
  const term = terms[i2];
  const types = ["PastTense", "PresentTense", "Auxiliary", "Modal", "Particle"];
  if (term.tags.has("Verb")) {
    const type = types.find((typ) => term.tags.has(typ));
    if (!type) {
      setTag2([term], "Infinitive", world2, null, `2-verb-type''`);
    }
  }
};
const oneLetterAcronym = /^[A-Z]('s|,)?$/;
const isUpperCase = /^[A-Z-]+$/;
const upperThenS = /^[A-Z]+s$/;
const periodAcronym = /([A-Z]\.)+[A-Z]?,?$/;
const noPeriodAcronym = /[A-Z]{2,}('s|,)?$/;
const lowerCaseAcronym = /([a-z]\.)+[a-z]\.?$/;
const oneLetterWord = {
  I: true,
  A: true
};
const places$1 = {
  la: true,
  ny: true,
  us: true,
  dc: true,
  gb: true
};
const isNoPeriodAcronym = function(term, model2) {
  let str = term.text;
  if (isUpperCase.test(str) === false) {
    if (str.length > 3 && upperThenS.test(str) === true) {
      str = str.replace(/s$/, "");
    } else {
      return false;
    }
  }
  if (str.length > 5) {
    return false;
  }
  if (oneLetterWord.hasOwnProperty(str)) {
    return false;
  }
  if (model2.one.lexicon.hasOwnProperty(term.normal)) {
    return false;
  }
  if (periodAcronym.test(str) === true) {
    return true;
  }
  if (lowerCaseAcronym.test(str) === true) {
    return true;
  }
  if (oneLetterAcronym.test(str) === true) {
    return true;
  }
  if (noPeriodAcronym.test(str) === true) {
    return true;
  }
  return false;
};
const isAcronym = function(terms, i2, model2) {
  const term = terms[i2];
  if (term.tags.has("RomanNumeral") || term.tags.has("Acronym") || term.frozen) {
    return null;
  }
  if (isNoPeriodAcronym(term, model2)) {
    term.tags.clear();
    fastTag(term, ["Acronym", "Noun"], "3-no-period-acronym");
    if (places$1[term.normal] === true) {
      fastTag(term, "Place", "3-place-acronym");
    }
    if (upperThenS.test(term.text) === true) {
      fastTag(term, "Plural", "3-plural-acronym");
    }
    return true;
  }
  if (!oneLetterWord.hasOwnProperty(term.text) && oneLetterAcronym.test(term.text)) {
    term.tags.clear();
    fastTag(term, ["Acronym", "Noun"], "3-one-letter-acronym");
    return true;
  }
  if (term.tags.has("Organization") && term.text.length <= 3) {
    fastTag(term, "Acronym", "3-org-acronym");
    return true;
  }
  if (term.tags.has("Organization") && isUpperCase.test(term.text) && term.text.length <= 6) {
    fastTag(term, "Acronym", "3-titlecase-acronym");
    return true;
  }
  return null;
};
const lookAtWord = function(term, words2) {
  if (!term) {
    return null;
  }
  const found = words2.find((a2) => term.normal === a2[0]);
  if (found) {
    return found[1];
  }
  return null;
};
const lookAtTag = function(term, tags) {
  if (!term) {
    return null;
  }
  const found = tags.find((a2) => term.tags.has(a2[0]));
  if (found) {
    return found[1];
  }
  return null;
};
const neighbours = function(terms, i2, model2) {
  const { leftTags, leftWords, rightWords, rightTags } = model2.two.neighbours;
  const term = terms[i2];
  if (term.tags.size === 0) {
    let tag2 = null;
    tag2 = tag2 || lookAtWord(terms[i2 - 1], leftWords);
    tag2 = tag2 || lookAtWord(terms[i2 + 1], rightWords);
    tag2 = tag2 || lookAtTag(terms[i2 - 1], leftTags);
    tag2 = tag2 || lookAtTag(terms[i2 + 1], rightTags);
    if (tag2) {
      fastTag(term, tag2, "3-[neighbour]");
      fillTags(terms, i2, model2);
      terms[i2].confidence = 0.2;
      return true;
    }
  }
  return null;
};
const isTitleCase$2 = (str) => new RegExp("^\\p{Lu}[\\p{Ll}'’]", "u").test(str);
const isOrg = function(term, i2, yelling) {
  if (!term) {
    return false;
  }
  if (term.tags.has("FirstName") || term.tags.has("Place")) {
    return false;
  }
  if (term.tags.has("ProperNoun") || term.tags.has("Organization") || term.tags.has("Acronym")) {
    return true;
  }
  if (!yelling && isTitleCase$2(term.text)) {
    if (i2 === 0) {
      return term.tags.has("Singular");
    }
    return true;
  }
  return false;
};
const tagOrgs$1 = function(terms, i2, world2, yelling) {
  const orgWords2 = world2.model.two.orgWords;
  const setTag2 = world2.methods.one.setTag;
  const term = terms[i2];
  const str = term.machine || term.normal;
  if (orgWords2[str] === true && isOrg(terms[i2 - 1], i2 - 1, yelling)) {
    setTag2([terms[i2]], "Organization", world2, null, "3-[org-word]");
    for (let t2 = i2; t2 >= 0; t2 -= 1) {
      if (isOrg(terms[t2], t2, yelling)) {
        setTag2([terms[t2]], "Organization", world2, null, "3-[org-word]");
      } else {
        break;
      }
    }
  }
  return null;
};
const isTitleCase$1 = (str) => new RegExp("^\\p{Lu}[\\p{Ll}'’]", "u").test(str);
const isPossessive$1 = /'s$/;
const placeCont = /* @__PURE__ */ new Set([
  "athletic",
  "city",
  "community",
  "eastern",
  "federal",
  "financial",
  "great",
  "historic",
  "historical",
  "local",
  "memorial",
  "municipal",
  "national",
  "northern",
  "provincial",
  "southern",
  "state",
  "western",
  "spring",
  "pine",
  "sunset",
  "view",
  "oak",
  "maple",
  "spruce",
  "cedar",
  "willow"
]);
const noBefore = /* @__PURE__ */ new Set(["center", "centre", "way", "range", "bar", "bridge", "field", "pit"]);
const isPlace = function(term, i2, yelling) {
  if (!term) {
    return false;
  }
  const tags = term.tags;
  if (tags.has("Organization") || tags.has("Possessive") || isPossessive$1.test(term.normal)) {
    return false;
  }
  if (tags.has("ProperNoun") || tags.has("Place")) {
    return true;
  }
  if (!yelling && isTitleCase$1(term.text)) {
    if (i2 === 0) {
      return tags.has("Singular");
    }
    return true;
  }
  return false;
};
const tagOrgs = function(terms, i2, world2, yelling) {
  const placeWords2 = world2.model.two.placeWords;
  const setTag2 = world2.methods.one.setTag;
  const term = terms[i2];
  const str = term.machine || term.normal;
  if (placeWords2[str] === true) {
    for (let n2 = i2 - 1; n2 >= 0; n2 -= 1) {
      if (placeCont.has(terms[n2].normal)) {
        continue;
      }
      if (isPlace(terms[n2], n2, yelling)) {
        setTag2(terms.slice(n2, i2 + 1), "Place", world2, null, "3-[place-of-foo]");
        continue;
      }
      break;
    }
    if (noBefore.has(str)) {
      return false;
    }
    for (let n2 = i2 + 1; n2 < terms.length; n2 += 1) {
      if (isPlace(terms[n2], n2, yelling)) {
        setTag2(terms.slice(i2, n2 + 1), "Place", world2, null, "3-[foo-place]");
        return true;
      }
      if (terms[n2].normal === "of" || placeCont.has(terms[n2].normal)) {
        continue;
      }
      break;
    }
  }
  return null;
};
const nounFallback = function(terms, i2, model2) {
  let isEmpty = false;
  const tags = terms[i2].tags;
  if (tags.size === 0) {
    isEmpty = true;
  } else if (tags.size === 1) {
    if (tags.has("Hyphenated") || tags.has("HashTag") || tags.has("Prefix") || tags.has("SlashedTerm")) {
      isEmpty = true;
    }
  }
  if (isEmpty) {
    fastTag(terms[i2], "Noun", "3-[fallback]");
    fillTags(terms, i2, model2);
    terms[i2].confidence = 0.1;
  }
};
const isTitleCase = /^[A-Z][a-z]/;
const isCapital = (terms, i2) => {
  if (terms[i2].tags.has("ProperNoun") && isTitleCase.test(terms[i2].text)) {
    return "Noun";
  }
  return null;
};
const isAlone = (terms, i2, tag2) => {
  if (i2 === 0 && !terms[1]) {
    return tag2;
  }
  return null;
};
const isEndNoun = function(terms, i2) {
  if (!terms[i2 + 1] && terms[i2 - 1] && terms[i2 - 1].tags.has("Determiner")) {
    return "Noun";
  }
  return null;
};
const isStart = function(terms, i2, tag2) {
  if (i2 === 0 && terms.length > 3) {
    return tag2;
  }
  return null;
};
const adhoc = {
  "Adj|Gerund": (terms, i2) => {
    return isCapital(terms, i2);
  },
  "Adj|Noun": (terms, i2) => {
    return isCapital(terms, i2) || isEndNoun(terms, i2);
  },
  "Actor|Verb": (terms, i2) => {
    return isCapital(terms, i2);
  },
  "Adj|Past": (terms, i2) => {
    return isCapital(terms, i2);
  },
  "Adj|Present": (terms, i2) => {
    return isCapital(terms, i2);
  },
  "Noun|Gerund": (terms, i2) => {
    return isCapital(terms, i2);
  },
  "Noun|Verb": (terms, i2) => {
    return i2 > 0 && isCapital(terms, i2) || isAlone(terms, i2, "Infinitive");
  },
  "Plural|Verb": (terms, i2) => {
    return isCapital(terms, i2) || isAlone(terms, i2, "PresentTense") || isStart(terms, i2, "Plural");
  },
  "Person|Noun": (terms, i2) => {
    return isCapital(terms, i2);
  },
  "Person|Verb": (terms, i2) => {
    if (i2 !== 0) {
      return isCapital(terms, i2);
    }
    return null;
  },
  "Person|Adj": (terms, i2) => {
    if (i2 === 0 && terms.length > 1) {
      return "Person";
    }
    return isCapital(terms, i2) ? "Person" : null;
  }
};
var define_process_env_default$1 = {};
const env = typeof process === "undefined" || !define_process_env_default$1 ? self.env || {} : define_process_env_default$1;
const prefix = /^(under|over|mis|re|un|dis|semi)-?/;
const checkWord = (term, obj) => {
  if (!term || !obj) {
    return null;
  }
  const str = term.normal || term.implicit;
  let found = null;
  if (obj.hasOwnProperty(str)) {
    found = obj[str];
  }
  if (found && env.DEBUG_TAGS) {
    console.log(`
  \x1B[2m\x1B[3m     ↓ - '${str}' \x1B[0m`);
  }
  return found;
};
const checkTag = (term, obj = {}, tagSet) => {
  if (!term || !obj) {
    return null;
  }
  const tags = Array.from(term.tags).sort((a2, b) => {
    const numA = tagSet[a2] ? tagSet[a2].parents.length : 0;
    const numB = tagSet[b] ? tagSet[b].parents.length : 0;
    return numA > numB ? -1 : 1;
  });
  let found = tags.find((tag2) => obj[tag2]);
  if (found && env.DEBUG_TAGS) {
    console.log(`  \x1B[2m\x1B[3m      ↓ - '${term.normal || term.implicit}' (#${found})  \x1B[0m`);
  }
  found = obj[found];
  return found;
};
const pickTag = function(terms, i2, clues2, model2) {
  if (!clues2) {
    return null;
  }
  const beforeIndex = terms[i2 - 1]?.text !== "also" ? i2 - 1 : Math.max(0, i2 - 2);
  const tagSet = model2.one.tagSet;
  let tag2 = checkWord(terms[i2 + 1], clues2.afterWords);
  tag2 = tag2 || checkWord(terms[beforeIndex], clues2.beforeWords);
  tag2 = tag2 || checkTag(terms[beforeIndex], clues2.beforeTags, tagSet);
  tag2 = tag2 || checkTag(terms[i2 + 1], clues2.afterTags, tagSet);
  return tag2;
};
const doSwitches = function(terms, i2, world2) {
  const model2 = world2.model;
  const setTag2 = world2.methods.one.setTag;
  const { switches: switches2, clues: clues2 } = model2.two;
  const term = terms[i2];
  let str = term.normal || term.implicit || "";
  if (prefix.test(str) && !switches2[str]) {
    str = str.replace(prefix, "");
  }
  if (term.switch) {
    const form = term.switch;
    if (term.tags.has("Acronym") || term.tags.has("PhrasalVerb")) {
      return;
    }
    let tag2 = pickTag(terms, i2, clues2[form], model2);
    if (adhoc[form]) {
      tag2 = adhoc[form](terms, i2) || tag2;
    }
    if (tag2) {
      setTag2([term], tag2, world2, null, `3-[switch] (${form})`);
      fillTags(terms, i2, model2);
    } else if (env.DEBUG_TAGS) {
      console.log(`
 -> X  - '${str}'  : (${form})  `);
    }
  }
};
const beside = {
  there: true,
  //go there
  this: true,
  //try this
  it: true,
  //do it
  him: true,
  her: true,
  us: true
  //tell us
};
const imperative$1 = function(terms, world2) {
  const setTag2 = world2.methods.one.setTag;
  const multiWords = world2.model.one._multiCache || {};
  const t2 = terms[0];
  const isRight = t2.switch === "Noun|Verb" || t2.tags.has("Infinitive");
  if (isRight && terms.length >= 2) {
    if (terms.length < 4 && !beside[terms[1].normal]) {
      return;
    }
    if (!t2.tags.has("PhrasalVerb") && multiWords.hasOwnProperty(t2.normal)) {
      return;
    }
    const nextNoun = terms[1].tags.has("Noun") || terms[1].tags.has("Determiner");
    if (nextNoun) {
      const soonVerb = terms.slice(1, 3).some((term) => term.tags.has("Verb"));
      if (!soonVerb || t2.tags.has("#PhrasalVerb")) {
        setTag2([t2], "Imperative", world2, null, "3-[imperative]");
      }
    }
  }
};
const ignoreCase = function(terms) {
  if (terms.filter((t2) => !t2.tags.has("ProperNoun")).length <= 3) {
    return false;
  }
  const lowerCase = /^[a-z]/;
  return terms.every((t2) => !lowerCase.test(t2.text));
};
const firstPass = function(docs, model2, world2) {
  docs.forEach((terms) => {
    byPunctuation(terms, 0, model2, world2);
  });
};
const secondPass = function(terms, model2, world2, isYelling) {
  for (let i2 = 0; i2 < terms.length; i2 += 1) {
    if (terms[i2].frozen === true) {
      continue;
    }
    tagSwitch(terms, i2, model2);
    if (isYelling === false) {
      checkCase(terms, i2, model2);
    }
    tagBySuffix(terms, i2, model2);
    checkRegex(terms, i2, model2, world2);
    checkPrefix(terms, i2, model2);
    tagYear(terms, i2);
  }
};
const thirdPass = function(terms, model2, world2, isYelling) {
  for (let i2 = 0; i2 < terms.length; i2 += 1) {
    let found = isAcronym(terms, i2, model2);
    fillTags(terms, i2, model2);
    found = found || neighbours(terms, i2, model2);
    found = found || nounFallback(terms, i2, model2);
  }
  for (let i2 = 0; i2 < terms.length; i2 += 1) {
    if (terms[i2].frozen === true) {
      continue;
    }
    tagOrgs$1(terms, i2, world2, isYelling);
    tagOrgs(terms, i2, world2, isYelling);
    doSwitches(terms, i2, world2);
    verbType(terms, i2, model2, world2);
    byHyphen(terms, i2, model2, world2);
  }
  imperative$1(terms, world2);
};
const preTagger = function(view) {
  const { methods: methods2, model: model2, world: world2 } = view;
  const docs = view.docs;
  firstPass(docs, model2, world2);
  const document = methods2.two.quickSplit(docs);
  for (let n2 = 0; n2 < document.length; n2 += 1) {
    const terms = document[n2];
    const isYelling = ignoreCase(terms);
    secondPass(terms, model2, world2, isYelling);
    thirdPass(terms, model2, world2, isYelling);
  }
  return document;
};
const toRoot$2 = {
  // 'spencer's' -> 'spencer'
  "Possessive": (term) => {
    let str = term.machine || term.normal || term.text;
    str = str.replace(/'s$/, "");
    return str;
  },
  // 'drinks' -> 'drink'
  "Plural": (term, world2) => {
    const str = term.machine || term.normal || term.text;
    return world2.methods.two.transform.noun.toSingular(str, world2.model);
  },
  // ''
  "Copula": () => {
    return "is";
  },
  // 'walked' -> 'walk'
  "PastTense": (term, world2) => {
    const str = term.machine || term.normal || term.text;
    return world2.methods.two.transform.verb.toInfinitive(str, world2.model, "PastTense");
  },
  // 'walking' -> 'walk'
  "Gerund": (term, world2) => {
    const str = term.machine || term.normal || term.text;
    return world2.methods.two.transform.verb.toInfinitive(str, world2.model, "Gerund");
  },
  // 'walks' -> 'walk'
  "PresentTense": (term, world2) => {
    const str = term.machine || term.normal || term.text;
    if (term.tags.has("Infinitive")) {
      return str;
    }
    return world2.methods.two.transform.verb.toInfinitive(str, world2.model, "PresentTense");
  },
  // 'quieter' -> 'quiet'
  "Comparative": (term, world2) => {
    const str = term.machine || term.normal || term.text;
    return world2.methods.two.transform.adjective.fromComparative(str, world2.model);
  },
  // 'quietest' -> 'quiet'
  "Superlative": (term, world2) => {
    const str = term.machine || term.normal || term.text;
    return world2.methods.two.transform.adjective.fromSuperlative(str, world2.model);
  },
  // 'suddenly' -> 'sudden'
  "Adverb": (term, world2) => {
    const { fromAdverb } = world2.methods.two.transform.adjective;
    const str = term.machine || term.normal || term.text;
    return fromAdverb(str);
  }
};
const getRoot$1 = function(view) {
  const world2 = view.world;
  const keys = Object.keys(toRoot$2);
  view.docs.forEach((terms) => {
    for (let i2 = 0; i2 < terms.length; i2 += 1) {
      const term = terms[i2];
      for (let k2 = 0; k2 < keys.length; k2 += 1) {
        if (term.tags.has(keys[k2])) {
          const fn = toRoot$2[keys[k2]];
          const root = fn(term, world2);
          if (term.normal !== root) {
            term.root = root;
          }
          break;
        }
      }
    }
  });
};
const mapping$1 = {
  // adverbs
  // 'Comparative': 'RBR',
  // 'Superlative': 'RBS',
  Adverb: "RB",
  // adjectives
  Comparative: "JJR",
  Superlative: "JJS",
  Adjective: "JJ",
  TO: "Conjunction",
  // verbs
  Modal: "MD",
  Auxiliary: "MD",
  Gerund: "VBG",
  //throwing
  PastTense: "VBD",
  //threw
  Participle: "VBN",
  //thrown
  PresentTense: "VBZ",
  //throws
  Infinitive: "VB",
  //throw
  Particle: "RP",
  //phrasal particle
  Verb: "VB",
  // throw
  // pronouns
  Pronoun: "PRP",
  // misc
  Cardinal: "CD",
  Conjunction: "CC",
  Determiner: "DT",
  Preposition: "IN",
  // 'Determiner': 'WDT',
  // 'Expression': 'FW',
  QuestionWord: "WP",
  Expression: "UH",
  //nouns
  Possessive: "POS",
  ProperNoun: "NNP",
  Person: "NNP",
  Place: "NNP",
  Organization: "NNP",
  Singular: "NN",
  Plural: "NNS",
  Noun: "NN",
  There: "EX"
  //'there'
  // 'Adverb':'WRB',
  // 'Noun':'PDT', //predeterminer
  // 'Noun':'SYM', //symbol
  // 'Noun':'NFP', //
  //  WDT 	Wh-determiner
  // 	WP 	Wh-pronoun
  // 	WP$ 	Possessive wh-pronoun
  // 	WRB 	Wh-adverb
};
const toPenn = function(term) {
  if (term.tags.has("ProperNoun") && term.tags.has("Plural")) {
    return "NNPS";
  }
  if (term.tags.has("Possessive") && term.tags.has("Pronoun")) {
    return "PRP$";
  }
  if (term.normal === "there") {
    return "EX";
  }
  if (term.normal === "to") {
    return "TO";
  }
  const arr = term.tagRank || [];
  for (let i2 = 0; i2 < arr.length; i2 += 1) {
    if (mapping$1.hasOwnProperty(arr[i2])) {
      return mapping$1[arr[i2]];
    }
  }
  return null;
};
const pennTag = function(view) {
  view.compute("tagRank");
  view.docs.forEach((terms) => {
    terms.forEach((term) => {
      term.penn = toPenn(term);
    });
  });
};
const compute$3 = { preTagger, root: getRoot$1, penn: pennTag };
const entity = ["Person", "Place", "Organization"];
const nouns$1 = {
  Noun: {
    not: ["Verb", "Adjective", "Adverb", "Value", "Determiner"]
  },
  Singular: {
    is: "Noun",
    not: ["Plural", "Uncountable"]
  },
  // 'Canada'
  ProperNoun: {
    is: "Noun"
  },
  Person: {
    is: "Singular",
    also: ["ProperNoun"],
    not: ["Place", "Organization", "Date"]
  },
  FirstName: {
    is: "Person"
  },
  MaleName: {
    is: "FirstName",
    not: ["FemaleName", "LastName"]
  },
  FemaleName: {
    is: "FirstName",
    not: ["MaleName", "LastName"]
  },
  LastName: {
    is: "Person",
    not: ["FirstName"]
  },
  // 'dr.'
  Honorific: {
    is: "Person",
    not: ["FirstName", "LastName", "Value"]
  },
  Place: {
    is: "Singular",
    not: ["Person", "Organization"]
  },
  Country: {
    is: "Place",
    also: ["ProperNoun"],
    not: ["City"]
  },
  City: {
    is: "Place",
    also: ["ProperNoun"],
    not: ["Country"]
  },
  // 'california'
  Region: {
    is: "Place",
    also: ["ProperNoun"]
  },
  Address: {
    // is: 'Place',
  },
  Organization: {
    is: "ProperNoun",
    not: ["Person", "Place"]
  },
  SportsTeam: {
    is: "Organization"
  },
  School: {
    is: "Organization"
  },
  Company: {
    is: "Organization"
  },
  Plural: {
    is: "Noun",
    not: ["Singular", "Uncountable"]
  },
  // 'gravity'
  Uncountable: {
    is: "Noun"
  },
  // 'it'
  Pronoun: {
    is: "Noun",
    not: entity
  },
  // 'swimmer'
  Actor: {
    is: "Noun",
    not: ["Place", "Organization"]
  },
  // walking
  Activity: {
    is: "Noun",
    not: ["Person", "Place"]
  },
  // kilometres
  Unit: {
    is: "Noun",
    not: entity
  },
  // canadian
  Demonym: {
    is: "Noun",
    also: ["ProperNoun"],
    not: entity
  },
  // [spencer's] hat
  Possessive: {
    is: "Noun"
  },
  // 'yourself'
  Reflexive: {
    is: "Pronoun"
  }
};
const verbs$2 = {
  Verb: {
    not: ["Noun", "Adjective", "Adverb", "Value", "Expression"]
  },
  // 'he [walks]'
  PresentTense: {
    is: "Verb",
    not: ["PastTense", "FutureTense"]
  },
  // 'will [walk]'
  Infinitive: {
    is: "PresentTense",
    not: ["Gerund"]
  },
  // '[walk] now!'
  Imperative: {
    is: "Verb",
    not: ["PastTense", "Gerund", "Copula"]
  },
  // walking
  Gerund: {
    is: "PresentTense",
    not: ["Copula"]
  },
  // walked
  PastTense: {
    is: "Verb",
    not: ["PresentTense", "Gerund", "FutureTense"]
  },
  // will walk
  FutureTense: {
    is: "Verb",
    not: ["PresentTense", "PastTense"]
  },
  // is/was
  Copula: {
    is: "Verb"
  },
  // '[could] walk'
  Modal: {
    is: "Verb",
    not: ["Infinitive"]
  },
  // 'awaken'
  Participle: {
    is: "PastTense"
  },
  // '[will have had] walked'
  Auxiliary: {
    is: "Verb",
    not: ["PastTense", "PresentTense", "Gerund", "Conjunction"]
  },
  // 'walk out'
  PhrasalVerb: {
    is: "Verb"
  },
  // 'walk [out]'
  Particle: {
    is: "PhrasalVerb",
    not: ["PastTense", "PresentTense", "Copula", "Gerund"]
  },
  // 'walked by'
  Passive: {
    is: "Verb"
  }
};
const values = {
  Value: {
    not: ["Verb", "Adjective", "Adverb"]
  },
  Ordinal: {
    is: "Value",
    not: ["Cardinal"]
  },
  Cardinal: {
    is: "Value",
    not: ["Ordinal"]
  },
  Fraction: {
    is: "Value",
    not: ["Noun"]
  },
  Multiple: {
    is: "TextValue"
  },
  RomanNumeral: {
    is: "Cardinal",
    not: ["TextValue"]
  },
  TextValue: {
    is: "Value",
    not: ["NumericValue"]
  },
  NumericValue: {
    is: "Value",
    not: ["TextValue"]
  },
  Money: {
    is: "Cardinal"
  },
  Percent: {
    is: "Value"
  }
};
const dates$1 = {
  Date: {
    not: ["Verb", "Adverb", "Adjective"]
  },
  Month: {
    is: "Date",
    also: ["Noun"],
    not: ["Year", "WeekDay", "Time"]
  },
  WeekDay: {
    is: "Date",
    also: ["Noun"]
  },
  Year: {
    is: "Date",
    not: ["RomanNumeral"]
  },
  FinancialQuarter: {
    is: "Date",
    not: "Fraction"
  },
  // 'easter'
  Holiday: {
    is: "Date",
    also: ["Noun"]
  },
  // 'summer'
  Season: {
    is: "Date"
  },
  Timezone: {
    is: "Date",
    also: ["Noun"],
    not: ["ProperNoun"]
  },
  Time: {
    is: "Date",
    not: ["AtMention"]
  },
  // 'months'
  Duration: {
    is: "Date",
    also: ["Noun"]
  }
};
const anything = ["Noun", "Verb", "Adjective", "Adverb", "Value", "QuestionWord"];
const misc$1 = {
  Adjective: {
    not: ["Noun", "Verb", "Adverb", "Value"]
  },
  Comparable: {
    is: "Adjective"
  },
  Comparative: {
    is: "Adjective"
  },
  Superlative: {
    is: "Adjective",
    not: ["Comparative"]
  },
  NumberRange: {},
  Adverb: {
    not: ["Noun", "Verb", "Adjective", "Value"]
  },
  Determiner: {
    not: ["Noun", "Verb", "Adjective", "Adverb", "QuestionWord", "Conjunction"]
    //allow 'a' to be a Determiner/Value
  },
  Conjunction: {
    not: anything
  },
  Preposition: {
    not: ["Noun", "Verb", "Adjective", "Adverb", "QuestionWord", "Determiner"]
  },
  QuestionWord: {
    not: ["Determiner"]
  },
  Currency: {
    is: "Noun"
  },
  Expression: {
    not: ["Noun", "Adjective", "Verb", "Adverb"]
  },
  Abbreviation: {},
  Url: {
    not: ["HashTag", "PhoneNumber", "Verb", "Adjective", "Value", "AtMention", "Email", "SlashedTerm"]
  },
  PhoneNumber: {
    not: ["HashTag", "Verb", "Adjective", "Value", "AtMention", "Email"]
  },
  HashTag: {},
  AtMention: {
    is: "Noun",
    not: ["HashTag", "Email"]
  },
  Emoji: {
    not: ["HashTag", "Verb", "Adjective", "Value", "AtMention"]
  },
  Emoticon: {
    not: ["HashTag", "Verb", "Adjective", "Value", "AtMention", "SlashedTerm"]
  },
  SlashedTerm: {
    not: ["Emoticon", "Url", "Value"]
  },
  Email: {
    not: ["HashTag", "Verb", "Adjective", "Value", "AtMention"]
  },
  Acronym: {
    not: ["Plural", "RomanNumeral", "Pronoun", "Date"]
  },
  Negative: {
    not: ["Noun", "Adjective", "Value", "Expression"]
  },
  Condition: {
    not: ["Verb", "Adjective", "Noun", "Value"]
  },
  // existential 'there'
  There: {
    not: ["Verb", "Adjective", "Noun", "Value", "Conjunction", "Preposition"]
  },
  // 'co-wrote'
  Prefix: {
    not: ["Abbreviation", "Acronym", "ProperNoun"]
  },
  // hard-nosed, bone-headed
  Hyphenated: {}
};
const allTags = Object.assign({}, nouns$1, verbs$2, values, dates$1, misc$1);
const preTag = {
  compute: compute$3,
  methods: methods$1,
  model: model$1,
  tags: allTags,
  hooks: ["preTagger"]
};
const postPunct = /[,)"';:\-–—.…]/;
const setContraction = function(m2, suffix) {
  if (!m2.found) {
    return;
  }
  const terms = m2.termList();
  for (let i2 = 0; i2 < terms.length - 1; i2++) {
    const t2 = terms[i2];
    if (postPunct.test(t2.post)) {
      return;
    }
  }
  terms[0].implicit = terms[0].normal;
  terms[0].text += suffix;
  terms[0].normal += suffix;
  terms.slice(1).forEach((t2) => {
    t2.implicit = t2.normal;
    t2.text = "";
    t2.normal = "";
  });
  for (let i2 = 0; i2 < terms.length - 1; i2++) {
    terms[i2].post = terms[i2].post.replace(/ /, "");
  }
};
const contract = function() {
  const doc = this.not("@hasContraction");
  let m2 = doc.match("(we|they|you) are");
  setContraction(m2, `'re`);
  m2 = doc.match("(he|she|they|it|we|you) will");
  setContraction(m2, `'ll`);
  m2 = doc.match("(he|she|they|it|we) is");
  setContraction(m2, `'s`);
  m2 = doc.match("#Person is");
  setContraction(m2, `'s`);
  m2 = doc.match("#Person would");
  setContraction(m2, `'d`);
  m2 = doc.match("(is|was|had|would|should|could|do|does|have|has|can) not");
  setContraction(m2, `n't`);
  m2 = doc.match("(i|we|they) have");
  setContraction(m2, `'ve`);
  m2 = doc.match("(would|should|could) have");
  setContraction(m2, `'ve`);
  m2 = doc.match("i am");
  setContraction(m2, `'m`);
  m2 = doc.match("going to");
  return this;
};
const titleCase = new RegExp("^\\p{Lu}[\\p{Ll}'’]", "u");
const toTitleCase = function(str = "") {
  str = str.replace(/^ *[a-z\u00C0-\u00FF]/, (x) => x.toUpperCase());
  return str;
};
const api$j = function(View2) {
  class Contractions extends View2 {
    constructor(document, pointer, groups) {
      super(document, pointer, groups);
      this.viewType = "Contraction";
    }
    /** i've -> 'i have' */
    expand() {
      this.docs.forEach((terms) => {
        const isTitleCase2 = titleCase.test(terms[0].text);
        terms.forEach((t2, i2) => {
          t2.text = t2.implicit || "";
          delete t2.implicit;
          if (i2 < terms.length - 1 && t2.post === "") {
            t2.post += " ";
          }
          t2.dirty = true;
        });
        if (isTitleCase2) {
          terms[0].text = toTitleCase(terms[0].text);
        }
      });
      this.compute("normal");
      return this;
    }
  }
  View2.prototype.contractions = function() {
    const m2 = this.match("@hasContraction+");
    return new Contractions(this.document, m2.pointer);
  };
  View2.prototype.contract = contract;
};
const insertContraction = function(document, point, words2) {
  const [n2, w] = point;
  if (!words2 || words2.length === 0) {
    return;
  }
  words2 = words2.map((word, i2) => {
    word.implicit = word.text;
    word.machine = word.text;
    word.pre = "";
    word.post = "";
    word.text = "";
    word.normal = "";
    word.index = [n2, w + i2];
    return word;
  });
  if (words2[0]) {
    words2[0].pre = document[n2][w].pre;
    words2[words2.length - 1].post = document[n2][w].post;
    words2[0].text = document[n2][w].text;
    words2[0].normal = document[n2][w].normal;
  }
  document[n2].splice(w, 1, ...words2);
};
const hasContraction$1 = /'/;
const hasWords = /* @__PURE__ */ new Set([
  "been",
  //the meeting's been ..
  "become"
  //my son's become
]);
const isWords = /* @__PURE__ */ new Set([
  "what",
  //it's what
  "how",
  //it's how
  "when",
  "if",
  //it's if
  "too"
]);
const adjLike$1 = /* @__PURE__ */ new Set(["too", "also", "enough"]);
const isOrHas = (terms, i2) => {
  for (let o2 = i2 + 1; o2 < terms.length; o2 += 1) {
    const t2 = terms[o2];
    if (hasWords.has(t2.normal)) {
      return "has";
    }
    if (isWords.has(t2.normal)) {
      return "is";
    }
    if (t2.tags.has("Gerund")) {
      return "is";
    }
    if (t2.tags.has("Determiner")) {
      return "is";
    }
    if (t2.tags.has("Adjective")) {
      return "is";
    }
    if (t2.switch === "Adj|Past") {
      if (terms[o2 + 1]) {
        if (adjLike$1.has(terms[o2 + 1].normal)) {
          return "is";
        }
        if (terms[o2 + 1].tags.has("Preposition")) {
          return "is";
        }
      }
    }
    if (t2.tags.has("PastTense")) {
      if (terms[o2 + 1] && terms[o2 + 1].normal === "for") {
        return "is";
      }
      return "has";
    }
  }
  return "is";
};
const apostropheS$1 = function(terms, i2) {
  const before2 = terms[i2].normal.split(hasContraction$1)[0];
  if (before2 === "let") {
    return [before2, "us"];
  }
  if (before2 === "there") {
    const t2 = terms[i2 + 1];
    if (t2 && t2.tags.has("Plural")) {
      return [before2, "are"];
    }
  }
  if (isOrHas(terms, i2) === "has") {
    return [before2, "has"];
  }
  return [before2, "is"];
};
const hasContraction = /'/;
const hadWords = /* @__PURE__ */ new Set([
  "better",
  //had better
  "done",
  //had done
  "before",
  // he'd _ before
  "it",
  // he'd _ it
  "had"
  //she'd had -> she would have..
]);
const wouldWords = /* @__PURE__ */ new Set([
  "have",
  // 'i'd have' -> i would have..
  "be"
  //' she'd be'
]);
const hadOrWould = (terms, i2) => {
  for (let o2 = i2 + 1; o2 < terms.length; o2 += 1) {
    const t2 = terms[o2];
    if (hadWords.has(t2.normal)) {
      return "had";
    }
    if (wouldWords.has(t2.normal)) {
      return "would";
    }
    if (t2.tags.has("PastTense") || t2.switch === "Adj|Past") {
      return "had";
    }
    if (t2.tags.has("PresentTense") || t2.tags.has("Infinitive")) {
      return "would";
    }
    if (t2.tags.has("#Determiner")) {
      return "had";
    }
    if (t2.tags.has("Adjective")) {
      return "would";
    }
  }
  return false;
};
const _apostropheD = function(terms, i2) {
  const before2 = terms[i2].normal.split(hasContraction)[0];
  if (before2 === "how" || before2 === "what") {
    return [before2, "did"];
  }
  if (hadOrWould(terms, i2) === "had") {
    return [before2, "had"];
  }
  return [before2, "would"];
};
const lastNoun$1 = function(terms, i2) {
  for (let n2 = i2 - 1; n2 >= 0; n2 -= 1) {
    if (terms[n2].tags.has("Noun") || terms[n2].tags.has("Pronoun") || terms[n2].tags.has("Plural") || terms[n2].tags.has("Singular")) {
      return terms[n2];
    }
  }
  return null;
};
const apostropheT = function(terms, i2) {
  if (terms[i2].normal === "ain't" || terms[i2].normal === "aint") {
    if (terms[i2 + 1] && terms[i2 + 1].normal === "never") {
      return ["have"];
    }
    const noun2 = lastNoun$1(terms, i2);
    if (noun2) {
      if (noun2.normal === "we" || noun2.normal === "they") {
        return ["are", "not"];
      }
      if (noun2.normal === "i") {
        return ["am", "not"];
      }
      if (noun2.tags && noun2.tags.has("Plural")) {
        return ["are", "not"];
      }
    }
    return ["is", "not"];
  }
  const before2 = terms[i2].normal.replace(/n't/, "");
  return [before2, "not"];
};
const banList = {
  that: true,
  there: true,
  let: true,
  here: true,
  everywhere: true
};
const beforePossessive = {
  in: true,
  //in sunday's
  by: true,
  //by sunday's
  for: true
  //for sunday's
};
const adjLike = /* @__PURE__ */ new Set(["too", "also", "enough", "about"]);
const nounLike = /* @__PURE__ */ new Set(["is", "are", "did", "were", "could", "should", "must", "had", "have"]);
const isPossessive = (terms, i2) => {
  const term = terms[i2];
  if (banList.hasOwnProperty(term.machine || term.normal)) {
    return false;
  }
  if (term.tags.has("Possessive")) {
    return true;
  }
  if (term.tags.has("QuestionWord")) {
    return false;
  }
  if (term.normal === `he's` || term.normal === `she's`) {
    return false;
  }
  const nextTerm = terms[i2 + 1];
  if (!nextTerm) {
    return true;
  }
  if (term.normal === `it's`) {
    if (nextTerm.tags.has("#Noun")) {
      return true;
    }
    return false;
  }
  if (nextTerm.switch == "Noun|Gerund") {
    const next2 = terms[i2 + 2];
    if (!next2) {
      if (term.tags.has("Actor") || term.tags.has("ProperNoun")) {
        return true;
      }
      return false;
    }
    if (next2.tags.has("Copula")) {
      return true;
    }
    if (next2.normal === "on" || next2.normal === "in") {
      return false;
    }
    return false;
  }
  if (nextTerm.tags.has("Verb")) {
    if (nextTerm.tags.has("Infinitive")) {
      return true;
    }
    if (nextTerm.tags.has("Gerund")) {
      return false;
    }
    if (nextTerm.tags.has("PresentTense")) {
      return true;
    }
    return false;
  }
  if (nextTerm.switch === "Adj|Noun") {
    const twoTerm = terms[i2 + 2];
    if (!twoTerm) {
      return false;
    }
    if (nounLike.has(twoTerm.normal)) {
      return true;
    }
    if (adjLike.has(twoTerm.normal)) {
      return false;
    }
  }
  if (nextTerm.tags.has("Noun")) {
    const nextStr = nextTerm.machine || nextTerm.normal;
    if (nextStr === "here" || nextStr === "there" || nextStr === "everywhere") {
      return false;
    }
    if (nextTerm.tags.has("Possessive")) {
      return false;
    }
    if (nextTerm.tags.has("ProperNoun") && !term.tags.has("ProperNoun")) {
      return false;
    }
    return true;
  }
  if (terms[i2 - 1] && beforePossessive[terms[i2 - 1].normal] === true) {
    return true;
  }
  if (nextTerm.tags.has("Adjective")) {
    const twoTerm = terms[i2 + 2];
    if (!twoTerm) {
      return false;
    }
    if (twoTerm.tags.has("Noun") && !twoTerm.tags.has("Pronoun")) {
      const str = nextTerm.normal;
      if (str === "above" || str === "below" || str === "behind") {
        return false;
      }
      return true;
    }
    if (twoTerm.switch === "Noun|Verb") {
      return true;
    }
    return false;
  }
  if (nextTerm.tags.has("Value")) {
    return true;
  }
  return false;
};
const byApostrophe = /'/;
const reIndex = function(terms) {
  terms.forEach((t2, i2) => {
    if (t2.index) {
      t2.index[1] = i2;
    }
  });
};
const reTag = function(terms, view, start2, len) {
  const tmp = view.update();
  tmp.document = [terms];
  let end2 = start2 + len;
  if (start2 > 0) {
    start2 -= 1;
  }
  if (terms[end2]) {
    end2 += 1;
  }
  tmp.ptrs = [[0, start2, end2]];
  tmp.compute(["freeze", "lexicon", "preTagger", "unfreeze"]);
  reIndex(terms);
};
const byEnd = {
  // how'd
  d: (terms, i2) => _apostropheD(terms, i2),
  // we ain't
  t: (terms, i2) => apostropheT(terms, i2),
  // bob's
  s: (terms, i2, world2) => {
    if (isPossessive(terms, i2)) {
      return world2.methods.one.setTag([terms[i2]], "Possessive", world2, null, "2-contraction");
    }
    return apostropheS$1(terms, i2);
  }
};
const toDocs = function(words2, view) {
  const doc = view.fromText(words2.join(" "));
  doc.compute("id");
  return doc.docs[0];
};
const contractionTwo$1 = (view) => {
  const { world: world2, document } = view;
  document.forEach((terms, n2) => {
    for (let i2 = terms.length - 1; i2 >= 0; i2 -= 1) {
      if (terms[i2].implicit) {
        continue;
      }
      let after2 = null;
      if (byApostrophe.test(terms[i2].normal) === true) {
        after2 = terms[i2].normal.split(byApostrophe)[1];
      }
      let words2 = null;
      if (byEnd.hasOwnProperty(after2)) {
        words2 = byEnd[after2](terms, i2, world2);
      }
      if (words2) {
        words2 = toDocs(words2, view);
        insertContraction(document, [n2, i2], words2);
        reTag(document[n2], view, i2, words2.length);
        continue;
      }
    }
  });
};
const compute$2 = { contractionTwo: contractionTwo$1 };
const contractionTwo = {
  compute: compute$2,
  api: api$j,
  hooks: ["contractionTwo"]
};
const adj = [
  // all fell apart
  { match: "[(all|both)] #Determiner #Noun", group: 0, tag: "Noun", reason: "all-noun" },
  //sometimes not-adverbs
  { match: "#Copula [(just|alone)]$", group: 0, tag: "Adjective", reason: "not-adverb" },
  //jack is guarded
  { match: "#Singular is #Adverb? [#PastTense$]", group: 0, tag: "Adjective", reason: "is-filled" },
  // smoked poutine is
  { match: "[#PastTense] #Singular is", group: 0, tag: "Adjective", reason: "smoked-poutine" },
  // baked onions are
  { match: "[#PastTense] #Plural are", group: 0, tag: "Adjective", reason: "baked-onions" },
  // well made
  { match: "well [#PastTense]", group: 0, tag: "Adjective", reason: "well-made" },
  // is f*ed up
  { match: "#Copula [fucked up?]", group: 0, tag: "Adjective", reason: "swears-adjective" },
  //jack seems guarded
  { match: "#Singular (seems|appears) #Adverb? [#PastTense$]", group: 0, tag: "Adjective", reason: "seems-filled" },
  // jury is out - preposition ➔ adjective
  { match: "#Copula #Adjective? [(out|in|through)]$", group: 0, tag: "Adjective", reason: "still-out" },
  // shut the door
  { match: "^[#Adjective] (the|your) #Noun", group: 0, notIf: "(all|even)", tag: "Infinitive", reason: "shut-the" },
  // the said card
  { match: "the [said] #Noun", group: 0, tag: "Adjective", reason: "the-said-card" },
  // faith-based, much-appreciated, soft-boiled
  { match: "[#Hyphenated (#Hyphenated && #PastTense)] (#Noun|#Conjunction)", group: 0, tag: "Adjective", notIf: "#Adverb", reason: "faith-based" },
  //self-driving
  { match: "[#Hyphenated (#Hyphenated && #Gerund)] (#Noun|#Conjunction)", group: 0, tag: "Adjective", notIf: "#Adverb", reason: "self-driving" },
  //dammed-up
  { match: "[#PastTense (#Hyphenated && #PhrasalVerb)] (#Noun|#Conjunction)", group: 0, tag: "Adjective", reason: "dammed-up" },
  //two-fold
  { match: "(#Hyphenated && #Value) fold", tag: "Adjective", reason: "two-fold" },
  //must-win
  { match: "must (#Hyphenated && #Infinitive)", tag: "Adjective", reason: "must-win" },
  // vacuum-sealed
  { match: `(#Hyphenated && #Infinitive) #Hyphenated`, tag: "Adjective", notIf: "#PhrasalVerb", reason: "vacuum-sealed" },
  { match: "too much", tag: "Adverb Adjective", reason: "bit-4" },
  { match: "a bit much", tag: "Determiner Adverb Adjective", reason: "bit-3" },
  // adjective-prefixes - 'un skilled'
  { match: "[(un|contra|extra|inter|intra|macro|micro|mid|mis|mono|multi|pre|sub|tri|ex)] #Adjective", group: 0, tag: ["Adjective", "Prefix"], reason: "un-skilled" }
];
const adverbAdj = `(dark|bright|flat|light|soft|pale|dead|dim|faux|little|wee|sheer|most|near|good|extra|all)`;
const noLy = "(hard|fast|late|early|high|right|deep|close|direct)";
const advAdj = [
  // kinda sparkly
  { match: `#Adverb [#Adverb] (and|or|then)`, group: 0, tag: "Adjective", reason: "kinda-sparkly-and" },
  // dark green
  { match: `[${adverbAdj}] #Adjective`, group: 0, tag: "Adverb", reason: "dark-green" },
  // far too
  { match: `#Copula [far too] #Adjective`, group: 0, tag: "Adverb", reason: "far-too" },
  // was still in
  { match: `#Copula [still] (in|#Gerund|#Adjective)`, group: 0, tag: "Adverb", reason: "was-still-walking" },
  // studies hard
  { match: `#Plural ${noLy}`, tag: "#PresentTense #Adverb", reason: "studies-hard" },
  // shops direct
  {
    match: `#Verb [${noLy}] !#Noun?`,
    group: 0,
    notIf: "(#Copula|get|got|getting|become|became|becoming|feel|feels|feeling|#Determiner|#Preposition)",
    tag: "Adverb",
    reason: "shops-direct"
  },
  // studies a lot
  { match: `[#Plural] a lot`, tag: "PresentTense", reason: "studies-a-lot" }
];
const gerundAdj = [
  //a staggering cost
  // { match: '(a|an) [#Gerund]', group: 0, tag: 'Adjective', reason: 'a|an' },
  //as amusing as
  { match: "as [#Gerund] as", group: 0, tag: "Adjective", reason: "as-gerund-as" },
  // more amusing than
  { match: "more [#Gerund] than", group: 0, tag: "Adjective", reason: "more-gerund-than" },
  // very amusing
  { match: "(so|very|extremely) [#Gerund]", group: 0, tag: "Adjective", reason: "so-gerund" },
  // found it amusing
  { match: "(found|found) it #Adverb? [#Gerund]", group: 0, tag: "Adjective", reason: "found-it-gerund" },
  // a bit amusing
  { match: "a (little|bit|wee) bit? [#Gerund]", group: 0, tag: "Adjective", reason: "a-bit-gerund" },
  // looking annoying
  {
    match: "#Gerund [#Gerund]",
    group: 0,
    tag: "Adjective",
    notIf: "(impersonating|practicing|considering|assuming)",
    reason: "looking-annoying"
  },
  // looked amazing
  {
    match: "(looked|look|looks) #Adverb? [%Adj|Gerund%]",
    group: 0,
    tag: "Adjective",
    notIf: "(impersonating|practicing|considering|assuming)",
    reason: "looked-amazing"
  },
  // were really amazing
  // { match: '(looked|look|looks) #Adverb [%Adj|Gerund%]', group: 0, tag: 'Adjective', notIf: '(impersonating|practicing|considering|assuming)', reason: 'looked-amazing' },
  // developing a
  { match: "[%Adj|Gerund%] #Determiner", group: 0, tag: "Gerund", reason: "developing-a" },
  // world's leading manufacturer
  { match: "#Possessive [%Adj|Gerund%] #Noun", group: 0, tag: "Adjective", reason: "leading-manufacturer" },
  // meaning alluring
  { match: "%Noun|Gerund% %Adj|Gerund%", tag: "Gerund #Adjective", reason: "meaning-alluring" },
  // face shocking revelations
  {
    match: "(face|embrace|reveal|stop|start|resume) %Adj|Gerund%",
    tag: "#PresentTense #Adjective",
    reason: "face-shocking"
  },
  // are enduring symbols
  { match: "(are|were) [%Adj|Gerund%] #Plural", group: 0, tag: "Adjective", reason: "are-enduring-symbols" }
];
const nounAdj = [
  //the above is clear
  { match: "#Determiner [#Adjective] #Copula", group: 0, tag: "Noun", reason: "the-adj-is" },
  //real evil is
  { match: "#Adjective [#Adjective] #Copula", group: 0, tag: "Noun", reason: "adj-adj-is" },
  //his fine
  { match: "(his|its) [%Adj|Noun%]", group: 0, tag: "Noun", notIf: "#Hyphenated", reason: "his-fine" },
  //is all
  { match: "#Copula #Adverb? [all]", group: 0, tag: "Noun", reason: "is-all" },
  // have fun
  { match: `(have|had) [#Adjective] #Preposition .`, group: 0, tag: "Noun", reason: "have-fun" },
  // brewing giant
  { match: `#Gerund (giant|capital|center|zone|application)`, tag: "Noun", reason: "brewing-giant" },
  // in an instant
  { match: `#Preposition (a|an) [#Adjective]$`, group: 0, tag: "Noun", reason: "an-instant" },
  // no golden would
  { match: `no [#Adjective] #Modal`, group: 0, tag: "Noun", reason: "no-golden" },
  // brand new
  { match: `[brand #Gerund?] new`, group: 0, tag: "Adverb", reason: "brand-new" },
  // some kind
  { match: `(#Determiner|#Comparative|new|different) [kind]`, group: 0, tag: "Noun", reason: "some-kind" },
  // her favourite sport
  { match: `#Possessive [%Adj|Noun%] #Noun`, group: 0, tag: "Adjective", reason: "her-favourite" },
  // must-win
  { match: `must && #Hyphenated .`, tag: "Adjective", reason: "must-win" },
  // the present
  {
    match: `#Determiner [#Adjective]$`,
    tag: "Noun",
    notIf: "(this|that|#Comparative|#Superlative)",
    reason: "the-south"
  },
  //are that crazy.
  // company-wide
  {
    match: `(#Noun && #Hyphenated) (#Adjective && #Hyphenated)`,
    tag: "Adjective",
    notIf: "(this|that|#Comparative|#Superlative)",
    reason: "company-wide"
  },
  // the poor were
  {
    match: `#Determiner [#Adjective] (#Copula|#Determiner)`,
    notIf: "(#Comparative|#Superlative)",
    group: 0,
    tag: "Noun",
    reason: "the-poor"
  },
  // professional bodybuilder
  {
    match: `[%Adj|Noun%] #Noun`,
    notIf: "(#Pronoun|#ProperNoun)",
    group: 0,
    tag: "Adjective",
    reason: "stable-foundations"
  }
];
const adjVerb = [
  // amusing his aunt
  // { match: '[#Adjective] #Possessive #Noun', group: 0, tag: 'Verb', reason: 'gerund-his-noun' },
  // loving you
  // { match: '[#Adjective] (us|you)', group: 0, tag: 'Gerund', reason: 'loving-you' },
  // slowly stunning
  { match: "(slowly|quickly) [#Adjective]", group: 0, tag: "Verb", reason: "slowly-adj" },
  // does mean
  { match: "does (#Adverb|not)? [#Adjective]", group: 0, tag: "PresentTense", reason: "does-mean" },
  // okay by me
  { match: "[(fine|okay|cool|ok)] by me", group: 0, tag: "Adjective", reason: "okay-by-me" },
  // i mean
  { match: "i (#Adverb|do)? not? [mean]", group: 0, tag: "PresentTense", reason: "i-mean" },
  //will secure our
  { match: "will #Adjective", tag: "Auxiliary Infinitive", reason: "will-adj" },
  //he disguised the thing
  { match: "#Pronoun [#Adjective] #Determiner #Adjective? #Noun", group: 0, tag: "Verb", reason: "he-adj-the" },
  //is eager to go
  { match: "#Copula [%Adj|Present%] to #Verb", group: 0, tag: "Verb", reason: "adj-to" },
  //is done well
  { match: "#Copula [#Adjective] (well|badly|quickly|slowly)", group: 0, tag: "Verb", reason: "done-well" },
  // rude and insulting
  { match: "#Adjective and [#Gerund] !#Preposition?", group: 0, tag: "Adjective", reason: "rude-and-x" },
  // were over cooked
  { match: "#Copula #Adverb? (over|under) [#PastTense]", group: 0, tag: "Adjective", reason: "over-cooked" },
  // was bland and overcooked
  { match: "#Copula #Adjective+ (and|or) [#PastTense]$", group: 0, tag: "Adjective", reason: "bland-and-overcooked" },
  // got tired of
  { match: "got #Adverb? [#PastTense] of", group: 0, tag: "Adjective", reason: "got-tired-of" },
  //felt loved
  {
    match: "(seem|seems|seemed|appear|appeared|appears|feel|feels|felt|sound|sounds|sounded) (#Adverb|#Adjective)? [#PastTense]",
    group: 0,
    tag: "Adjective",
    reason: "felt-loved"
  },
  // seem confused
  { match: "(seem|feel|seemed|felt) [#PastTense #Particle?]", group: 0, tag: "Adjective", reason: "seem-confused" },
  // a bit confused
  { match: "a (bit|little|tad) [#PastTense #Particle?]", group: 0, tag: "Adjective", reason: "a-bit-confused" },
  // do not be embarrassed
  { match: "not be [%Adj|Past% #Particle?]", group: 0, tag: "Adjective", reason: "do-not-be-confused" },
  // is just right
  { match: "#Copula just [%Adj|Past% #Particle?]", group: 0, tag: "Adjective", reason: "is-just-right" },
  // as pale as
  { match: "as [#Infinitive] as", group: 0, tag: "Adjective", reason: "as-pale-as" },
  //failed and oppressive
  { match: "[%Adj|Past%] and #Adjective", group: 0, tag: "Adjective", reason: "faled-and-oppressive" },
  // or heightened emotion
  {
    match: "or [#PastTense] #Noun",
    group: 0,
    tag: "Adjective",
    notIf: "(#Copula|#Pronoun)",
    reason: "or-heightened-emotion"
  },
  // became involved
  { match: "(become|became|becoming|becomes) [#Verb]", group: 0, tag: "Adjective", reason: "become-verb" },
  // their declared intentions
  { match: "#Possessive [#PastTense] #Noun", group: 0, tag: "Adjective", reason: "declared-intentions" },
  // is he cool
  { match: "#Copula #Pronoun [%Adj|Present%]", group: 0, tag: "Adjective", reason: "is-he-cool" },
  // is crowded with
  {
    match: "#Copula [%Adj|Past%] with",
    group: 0,
    tag: "Adjective",
    notIf: "(associated|worn|baked|aged|armed|bound|fried|loaded|mixed|packed|pumped|filled|sealed)",
    reason: "is-crowded-with"
  },
  // is empty$
  { match: "#Copula #Adverb? [%Adj|Present%]$", group: 0, tag: "Adjective", reason: "was-empty$" }
];
const adv = [
  //still good
  { match: "[still] #Adjective", group: 0, tag: "Adverb", reason: "still-advb" },
  //still make
  { match: "[still] #Verb", group: 0, tag: "Adverb", reason: "still-verb" },
  // so hot
  { match: "[so] #Adjective", group: 0, tag: "Adverb", reason: "so-adv" },
  // way hotter
  { match: "[way] #Comparative", group: 0, tag: "Adverb", reason: "way-adj" },
  // way too hot
  { match: "[way] #Adverb #Adjective", group: 0, tag: "Adverb", reason: "way-too-adj" },
  // all singing
  { match: "[all] #Verb", group: 0, tag: "Adverb", reason: "all-verb" },
  // sing like an angel
  { match: "#Verb  [like]", group: 0, notIf: "(#Modal|#PhrasalVerb)", tag: "Adverb", reason: "verb-like" },
  //barely even walk
  { match: "(barely|hardly) even", tag: "Adverb", reason: "barely-even" },
  //even held
  { match: "[even] #Verb", group: 0, tag: "Adverb", reason: "even-walk" },
  //even worse
  { match: "[even] #Comparative", group: 0, tag: "Adverb", reason: "even-worse" },
  // even the greatest
  { match: "[even] (#Determiner|#Possessive)", group: 0, tag: "#Adverb", reason: "even-the" },
  // even left
  { match: "even left", tag: "#Adverb #Verb", reason: "even-left" },
  // way over
  { match: "[way] #Adjective", group: 0, tag: "#Adverb", reason: "way-over" },
  //cheering hard - dropped -ly's
  {
    match: "#PresentTense [(hard|quick|bright|slow|fast|backwards|forwards)]",
    notIf: "#Copula",
    group: 0,
    tag: "Adverb",
    reason: "lazy-ly"
  },
  // much appreciated
  { match: "[much] #Adjective", group: 0, tag: "Adverb", reason: "bit-1" },
  // is well
  { match: "#Copula [#Adverb]$", group: 0, tag: "Adjective", reason: "is-well" },
  // a bit cold
  { match: "a [(little|bit|wee) bit?] #Adjective", group: 0, tag: "Adverb", reason: "a-bit-cold" },
  // super strong
  { match: `[(super|pretty)] #Adjective`, group: 0, tag: "Adverb", reason: "super-strong" },
  // become overly weakened
  { match: "(become|fall|grow) #Adverb? [#PastTense]", group: 0, tag: "Adjective", reason: "overly-weakened" },
  // a completely beaten man
  { match: "(a|an) #Adverb [#Participle] #Noun", group: 0, tag: "Adjective", reason: "completely-beaten" },
  //a close
  { match: "#Determiner #Adverb? [close]", group: 0, tag: "Adjective", reason: "a-close" },
  //walking close
  { match: "#Gerund #Adverb? [close]", group: 0, tag: "Adverb", notIf: "(getting|becoming|feeling)", reason: "being-close" },
  // a blown motor
  { match: "(the|those|these|a|an) [#Participle] #Noun", group: 0, tag: "Adjective", reason: "blown-motor" },
  // charged back
  { match: "(#PresentTense|#PastTense) [back]", group: 0, tag: "Adverb", notIf: "(#PhrasalVerb|#Copula)", reason: "charge-back" },
  // send around
  { match: "#Verb [around]", group: 0, tag: "Adverb", notIf: "#PhrasalVerb", reason: "send-around" },
  // later say
  { match: "[later] #PresentTense", group: 0, tag: "Adverb", reason: "later-say" },
  // the well
  { match: "#Determiner [well] !#PastTense?", group: 0, tag: "Noun", reason: "the-well" },
  // high enough
  { match: "#Adjective [enough]", group: 0, tag: "Adverb", reason: "high-enough" }
];
const dates = [
  // ==== Holiday ====
  { match: "#Holiday (day|eve)", tag: "Holiday", reason: "holiday-day" },
  //5th of March
  { match: "#Value of #Month", tag: "Date", reason: "value-of-month" },
  //5 March
  { match: "#Cardinal #Month", tag: "Date", reason: "cardinal-month" },
  //march 5 to 7
  { match: "#Month #Value to #Value", tag: "Date", reason: "value-to-value" },
  //march the 12th
  { match: "#Month the #Value", tag: "Date", reason: "month-the-value" },
  //june 7
  { match: "(#WeekDay|#Month) #Value", tag: "Date", reason: "date-value" },
  //7 june
  { match: "#Value (#WeekDay|#Month)", tag: "Date", reason: "value-date" },
  //may twenty five
  { match: "(#TextValue && #Date) #TextValue", tag: "Date", reason: "textvalue-date" },
  // 'aug 20-21'
  { match: `#Month #NumberRange`, tag: "Date", reason: "aug 20-21" },
  // wed march 5th
  { match: `#WeekDay #Month #Ordinal`, tag: "Date", reason: "week mm-dd" },
  // aug 5th 2021
  { match: `#Month #Ordinal #Cardinal`, tag: "Date", reason: "mm-dd-yyy" },
  // === timezones ===
  // china standard time
  { match: `(#Place|#Demonmym|#Time) (standard|daylight|central|mountain)? time`, tag: "Timezone", reason: "std-time" },
  // eastern time
  {
    match: `(eastern|mountain|pacific|central|atlantic) (standard|daylight|summer)? time`,
    tag: "Timezone",
    reason: "eastern-time"
  },
  // 5pm central
  { match: `#Time [(eastern|mountain|pacific|central|est|pst|gmt)]`, group: 0, tag: "Timezone", reason: "5pm-central" },
  // central european time
  { match: `(central|western|eastern) european time`, tag: "Timezone", reason: "cet" }
];
const ambigDates = [
  // ==== WeekDay ====
  // sun the 5th
  { match: "[sun] the #Ordinal", tag: "WeekDay", reason: "sun-the-5th" },
  //sun feb 2
  { match: "[sun] #Date", group: 0, tag: "WeekDay", reason: "sun-feb" },
  //1pm next sun
  { match: "#Date (on|this|next|last|during)? [sun]", group: 0, tag: "WeekDay", reason: "1pm-sun" },
  //this sat
  { match: `(in|by|before|during|on|until|after|of|within|all) [sat]`, group: 0, tag: "WeekDay", reason: "sat" },
  { match: `(in|by|before|during|on|until|after|of|within|all) [wed]`, group: 0, tag: "WeekDay", reason: "wed" },
  { match: `(in|by|before|during|on|until|after|of|within|all) [march]`, group: 0, tag: "Month", reason: "march" },
  //sat november
  { match: "[sat] #Date", group: 0, tag: "WeekDay", reason: "sat-feb" },
  // ==== Month ====
  //all march
  { match: `#Preposition [(march|may)]`, group: 0, tag: "Month", reason: "in-month" },
  //this march
  { match: `(this|next|last) (march|may) !#Infinitive?`, tag: "#Date #Month", reason: "this-month" },
  // march 5th
  { match: `(march|may) the? #Value`, tag: "#Month #Date #Date", reason: "march-5th" },
  // 5th of march
  { match: `#Value of? (march|may)`, tag: "#Date #Date #Month", reason: "5th-of-march" },
  // march and feb
  { match: `[(march|may)] .? #Date`, group: 0, tag: "Month", reason: "march-and-feb" },
  // feb to march
  { match: `#Date .? [(march|may)]`, group: 0, tag: "Month", reason: "feb-and-march" },
  //quickly march
  { match: `#Adverb [(march|may)]`, group: 0, tag: "Verb", reason: "quickly-march" },
  //march quickly
  { match: `[(march|may)] #Adverb`, group: 0, tag: "Verb", reason: "march-quickly" },
  //12 am
  { match: `#Value (am|pm)`, tag: "Time", reason: "2-am" }
];
const infNouns = "(feel|sense|process|rush|side|bomb|bully|challenge|cover|crush|dump|exchange|flow|function|issue|lecture|limit|march|process)";
const noun = [
  //'more' is not always an adverb
  // any more
  { match: "(the|any) [more]", group: 0, tag: "Singular", reason: "more-noun" },
  // more players
  { match: "[more] #Noun", group: 0, tag: "Adjective", reason: "more-noun" },
  // rights of man
  { match: "(right|rights) of .", tag: "Noun", reason: "right-of" },
  // a bit
  { match: "a [bit]", group: 0, tag: "Singular", reason: "bit-2" },
  // a must
  { match: "a [must]", group: 0, tag: "Singular", reason: "must-2" },
  // we all
  { match: "(we|us) [all]", group: 0, tag: "Noun", reason: "we all" },
  // due to weather
  { match: "due to [#Verb]", group: 0, tag: "Noun", reason: "due-to" },
  //some pressing issues
  { match: "some [#Verb] #Plural", group: 0, tag: "Noun", reason: "determiner6" },
  // my first thought
  { match: "#Possessive #Ordinal [#PastTense]", group: 0, tag: "Noun", reason: "first-thought" },
  //the nice swim
  {
    match: "(the|this|those|these) #Adjective [%Verb|Noun%]",
    group: 0,
    tag: "Noun",
    notIf: "#Copula",
    reason: "the-adj-verb"
  },
  // the truly nice swim
  { match: "(the|this|those|these) #Adverb #Adjective [#Verb]", group: 0, tag: "Noun", reason: "determiner4" },
  //the wait to vote
  { match: "the [#Verb] #Preposition .", group: 0, tag: "Noun", reason: "determiner1" },
  //a sense of
  { match: "(a|an|the) [#Verb] of", group: 0, tag: "Noun", reason: "the-verb-of" },
  //the threat of force
  { match: "#Determiner #Noun of [#Verb]", group: 0, tag: "Noun", notIf: "#Gerund", reason: "noun-of-noun" },
  // ended in ruins
  {
    match: "#PastTense #Preposition [#PresentTense]",
    group: 0,
    notIf: "#Gerund",
    tag: "Noun",
    reason: "ended-in-ruins"
  },
  //'u' as pronoun
  { match: "#Conjunction [u]", group: 0, tag: "Pronoun", reason: "u-pronoun-2" },
  { match: "[u] #Verb", group: 0, tag: "Pronoun", reason: "u-pronoun-1" },
  //the western line
  {
    match: "#Determiner [(western|eastern|northern|southern|central)] #Noun",
    group: 0,
    tag: "Noun",
    reason: "western-line"
  },
  //air-flow
  { match: "(#Singular && @hasHyphen) #PresentTense", tag: "Noun", reason: "hyphen-verb" },
  //is no walk
  { match: "is no [#Verb]", group: 0, tag: "Noun", reason: "is-no-verb" },
  //do so
  { match: "do [so]", group: 0, tag: "Noun", reason: "so-noun" },
  // what the hell
  { match: "#Determiner [(shit|damn|hell)]", group: 0, tag: "Noun", reason: "swears-noun" },
  // go to shit
  { match: "to [(shit|hell)]", group: 0, tag: "Noun", reason: "to-swears" },
  // the staff were
  { match: "(the|these) [#Singular] (were|are)", group: 0, tag: "Plural", reason: "singular-were" },
  // a comdominium, or simply condo
  { match: `a #Noun+ or #Adverb+? [#Verb]`, group: 0, tag: "Noun", reason: "noun-or-noun" },
  // walk the walk
  {
    match: "(the|those|these|a|an) #Adjective? [#PresentTense #Particle?]",
    group: 0,
    tag: "Noun",
    notIf: "(seem|appear|include|#Gerund|#Copula)",
    reason: "det-inf"
  },
  // { match: '(the|those|these|a|an) #Adjective? [#PresentTense #Particle?]', group: 0, tag: 'Noun', notIf: '(#Gerund|#Copula)', reason: 'det-pres' },
  // ==== Actor ====
  //Aircraft designer
  { match: "#Noun #Actor", tag: "Actor", notIf: "(#Person|#Pronoun)", reason: "thing-doer" },
  //lighting designer
  { match: "#Gerund #Actor", tag: "Actor", reason: "gerund-doer" },
  // captain sanders
  // { match: '[#Actor+] #ProperNoun', group: 0, tag: 'Honorific', reason: 'sgt-kelly' },
  // co-founder
  { match: `co #Singular`, tag: "Actor", reason: "co-noun" },
  // co-founder
  {
    match: `[#Noun+] #Actor`,
    group: 0,
    tag: "Actor",
    notIf: "(#Honorific|#Pronoun|#Possessive)",
    reason: "air-traffic-controller"
  },
  // fine-artist
  {
    match: `(urban|cardiac|cardiovascular|respiratory|medical|clinical|visual|graphic|creative|dental|exotic|fine|certified|registered|technical|virtual|professional|amateur|junior|senior|special|pharmaceutical|theoretical)+ #Noun? #Actor`,
    tag: "Actor",
    reason: "fine-artist"
  },
  // dance coach
  {
    match: `#Noun+ (coach|chef|king|engineer|fellow|personality|boy|girl|man|woman|master)`,
    tag: "Actor",
    reason: "dance-coach"
  },
  // chief design officer
  { match: `chief . officer`, tag: "Actor", reason: "chief-x-officer" },
  // chief of police
  { match: `chief of #Noun+`, tag: "Actor", reason: "chief-of-police" },
  // president of marketing
  { match: `senior? vice? president of #Noun+`, tag: "Actor", reason: "president-of" },
  // ==== Singular ====
  //the sun
  { match: "#Determiner [sun]", group: 0, tag: "Singular", reason: "the-sun" },
  //did a 900, paid a 20
  { match: "#Verb (a|an) [#Value]$", group: 0, tag: "Singular", reason: "did-a-value" },
  //'the can'
  { match: "the [(can|will|may)]", group: 0, tag: "Singular", reason: "the can" },
  // ==== Possessive ====
  //spencer kelly's
  { match: "#FirstName #Acronym? (#Possessive && #LastName)", tag: "Possessive", reason: "name-poss" },
  //Super Corp's fundraiser
  { match: "#Organization+ #Possessive", tag: "Possessive", reason: "org-possessive" },
  //Los Angeles's fundraiser
  { match: "#Place+ #Possessive", tag: "Possessive", reason: "place-possessive" },
  // Ptolemy's experiments
  { match: "#Possessive #PresentTense #Particle?", notIf: "(#Gerund|her)", tag: "Noun", reason: "possessive-verb" },
  // anna's eating vs anna's eating lunch
  // my presidents house
  { match: "(my|our|their|her|his|its) [(#Plural && #Actor)] #Noun", tag: "Possessive", reason: "my-dads" },
  // 10th of a second
  { match: "#Value of a [second]", group: 0, unTag: "Value", tag: "Singular", reason: "10th-of-a-second" },
  // 10 seconds
  { match: "#Value [seconds]", group: 0, unTag: "Value", tag: "Plural", reason: "10-seconds" },
  // in time
  { match: "in [#Infinitive]", group: 0, tag: "Singular", reason: "in-age" },
  // a minor in
  { match: "a [#Adjective] #Preposition", group: 0, tag: "Noun", reason: "a-minor-in" },
  //the repairer said
  { match: "#Determiner [#Singular] said", group: 0, tag: "Actor", reason: "the-actor-said" },
  //the euro sense
  {
    match: `#Determiner #Noun [${infNouns}] !(#Preposition|to|#Adverb)?`,
    group: 0,
    tag: "Noun",
    reason: "the-noun-sense"
  },
  // photographs of a computer are
  { match: "[#PresentTense] (of|by|for) (a|an|the) #Noun #Copula", group: 0, tag: "Plural", reason: "photographs-of" },
  // fight and win
  { match: "#Infinitive and [%Noun|Verb%]", group: 0, tag: "Infinitive", reason: "fight and win" },
  // peace and flowers and love
  { match: "#Noun and [#Verb] and #Noun", group: 0, tag: "Noun", reason: "peace-and-flowers" },
  // the 1992 classic
  { match: "the #Cardinal [%Adj|Noun%]", group: 0, tag: "Noun", reason: "the-1992-classic" },
  // the premier university
  { match: "#Copula the [%Adj|Noun%] #Noun", group: 0, tag: "Adjective", reason: "the-premier-university" },
  // scottish - i ate me sandwich
  { match: "i #Verb [me] #Noun", group: 0, tag: "Possessive", reason: "scottish-me" },
  // dance music
  {
    match: "[#PresentTense] (music|class|lesson|night|party|festival|league|ceremony)",
    group: 0,
    tag: "Noun",
    reason: "dance-music"
  },
  // wit it
  { match: "[wit] (me|it)", group: 0, tag: "Presposition", reason: "wit-me" },
  //left-her-boots, shoved her hand
  { match: "#PastTense #Possessive [#Verb]", group: 0, tag: "Noun", notIf: "(saw|made)", reason: "left-her-boots" },
  //35 signs
  { match: "#Value [%Plural|Verb%]", group: 0, tag: "Plural", notIf: "(one|1|a|an)", reason: "35-signs" },
  //had time
  { match: "had [#PresentTense]", group: 0, tag: "Noun", notIf: "(#Gerund|come|become)", reason: "had-time" },
  //instant access
  { match: "%Adj|Noun% %Noun|Verb%", tag: "#Adjective #Noun", notIf: "#ProperNoun #Noun", reason: "instant-access" },
  // a representative to
  { match: "#Determiner [%Adj|Noun%] #Conjunction", group: 0, tag: "Noun", reason: "a-rep-to" },
  // near death experiences, ambitious sales targets
  {
    match: "#Adjective #Noun [%Plural|Verb%]$",
    group: 0,
    tag: "Plural",
    notIf: "#Pronoun",
    reason: "near-death-experiences"
  },
  // your guild colors
  { match: "#Possessive #Noun [%Plural|Verb%]$", group: 0, tag: "Plural", reason: "your-guild-colors" }
];
const gerundNouns = [
  // the planning processes
  { match: "(this|that|the|a|an) [#Gerund #Infinitive]", group: 0, tag: "Singular", reason: "the-planning-process" },
  // the paving stones
  { match: "(that|the) [#Gerund #PresentTense]", group: 0, ifNo: "#Copula", tag: "Plural", reason: "the-paving-stones" },
  // this swimming
  // { match: '(this|that|the) [#Gerund]', group: 0, tag: 'Noun', reason: 'this-gerund' },
  // the remaining claims
  { match: "#Determiner [#Gerund] #Noun", group: 0, tag: "Adjective", reason: "the-gerund-noun" },
  // i think tipping sucks
  { match: `#Pronoun #Infinitive [#Gerund] #PresentTense`, group: 0, tag: "Noun", reason: "tipping-sucks" },
  // early warning
  { match: "#Adjective [#Gerund]", group: 0, tag: "Noun", notIf: "(still|even|just)", reason: "early-warning" },
  //walking is cool
  { match: "[#Gerund] #Adverb? not? #Copula", group: 0, tag: "Activity", reason: "gerund-copula" },
  //are doing is
  { match: "#Copula [(#Gerund|#Activity)] #Copula", group: 0, tag: "Gerund", reason: "are-doing-is" },
  //walking should be fun
  { match: "[#Gerund] #Modal", group: 0, tag: "Activity", reason: "gerund-modal" },
  // finish listening
  // { match: '#Infinitive [#Gerund]', group: 0, tag: 'Activity', reason: 'finish-listening' },
  // the ruling party
  // responsibility for setting
  { match: "#Singular for [%Noun|Gerund%]", group: 0, tag: "Gerund", reason: "noun-for-gerund" },
  // better for training
  { match: "#Comparative (for|at) [%Noun|Gerund%]", group: 0, tag: "Gerund", reason: "better-for-gerund" },
  // keep the touching
  { match: "#PresentTense the [#Gerund]", group: 0, tag: "Noun", reason: "keep-the-touching" }
];
const presNouns = [
  // do the dance
  { match: "#Infinitive (this|that|the) [#Infinitive]", group: 0, tag: "Noun", reason: "do-this-dance" },
  //running-a-show
  { match: "#Gerund #Determiner [#Infinitive]", group: 0, tag: "Noun", reason: "running-a-show" },
  //the-only-reason
  { match: "#Determiner (only|further|just|more|backward) [#Infinitive]", group: 0, tag: "Noun", reason: "the-only-reason" },
  // a stream runs
  { match: "(the|this|a|an) [#Infinitive] #Adverb? #Verb", group: 0, tag: "Noun", reason: "determiner5" },
  //a nice deal
  { match: "#Determiner #Adjective #Adjective? [#Infinitive]", group: 0, tag: "Noun", reason: "a-nice-inf" },
  // the mexican train
  { match: "#Determiner #Demonym [#PresentTense]", group: 0, tag: "Noun", reason: "mexican-train" },
  //next career move
  { match: "#Adjective #Noun+ [#Infinitive] #Copula", group: 0, tag: "Noun", reason: "career-move" },
  // at some point
  { match: "at some [#Infinitive]", group: 0, tag: "Noun", reason: "at-some-inf" },
  // goes to sleep
  { match: "(go|goes|went) to [#Infinitive]", group: 0, tag: "Noun", reason: "goes-to-verb" },
  //a close watch on
  { match: "(a|an) #Adjective? #Noun [#Infinitive] (#Preposition|#Noun)", group: 0, notIf: "from", tag: "Noun", reason: "a-noun-inf" },
  //a tv show
  { match: "(a|an) #Noun [#Infinitive]$", group: 0, tag: "Noun", reason: "a-noun-inf2" },
  //is mark hughes
  // { match: '#Copula [#Infinitive] #Noun', group: 0, tag: 'Noun', reason: 'is-pres-noun' },
  // good wait staff
  // { match: '#Adjective [#Infinitive] #Noun', group: 0, tag: 'Noun', reason: 'good-wait-staff' },
  // running for congress
  { match: "#Gerund #Adjective? for [#Infinitive]", group: 0, tag: "Noun", reason: "running-for" },
  // running to work
  // { match: '#Gerund #Adjective to [#Infinitive]', group: 0, tag: 'Noun', reason: 'running-to' },
  // about love
  { match: "about [#Infinitive]", group: 0, tag: "Singular", reason: "about-love" },
  // singers on stage
  { match: "#Plural on [#Infinitive]", group: 0, tag: "Noun", reason: "on-stage" },
  // any charge
  { match: "any [#Infinitive]", group: 0, tag: "Noun", reason: "any-charge" },
  // no doubt
  { match: "no [#Infinitive]", group: 0, tag: "Noun", reason: "no-doubt" },
  // number of seats
  { match: "number of [#PresentTense]", group: 0, tag: "Noun", reason: "number-of-x" },
  // teaches/taught
  { match: "(taught|teaches|learns|learned) [#PresentTense]", group: 0, tag: "Noun", reason: "teaches-x" },
  // use reverse
  { match: "(try|use|attempt|build|make) [#Verb #Particle?]", notIf: "(#Copula|#Noun|sure|fun|up)", group: 0, tag: "Noun", reason: "do-verb" },
  //make sure of
  // checkmate is
  { match: "^[#Infinitive] (is|was)", group: 0, tag: "Noun", reason: "checkmate-is" },
  // get much sleep
  { match: "#Infinitive much [#Infinitive]", group: 0, tag: "Noun", reason: "get-much" },
  // cause i gotta
  { match: "[cause] #Pronoun #Verb", group: 0, tag: "Conjunction", reason: "cause-cuz" },
  // the cardio dance party
  { match: "the #Singular [#Infinitive] #Noun", group: 0, tag: "Noun", notIf: "#Pronoun", reason: "cardio-dance" },
  // that should smoke
  { match: "#Determiner #Modal [#Noun]", group: 0, tag: "PresentTense", reason: "should-smoke" },
  //this rocks
  { match: "this [#Plural]", group: 0, tag: "PresentTense", notIf: "(#Preposition|#Date)", reason: "this-verbs" },
  //voice that rocks
  { match: "#Noun that [#Plural]", group: 0, tag: "PresentTense", notIf: "(#Preposition|#Pronoun|way)", reason: "voice-that-rocks" },
  //that leads to
  { match: "that [#Plural] to", group: 0, tag: "PresentTense", notIf: "#Preposition", reason: "that-leads-to" },
  //let him glue
  {
    match: "(let|make|made) (him|her|it|#Person|#Place|#Organization)+ [#Singular] (a|an|the|it)",
    group: 0,
    tag: "Infinitive",
    reason: "let-him-glue"
  },
  // assign all tasks
  { match: "#Verb (all|every|each|most|some|no) [#PresentTense]", notIf: "#Modal", group: 0, tag: "Noun", reason: "all-presentTense" },
  // PresentTense/Noun ambiguities
  // big dreams, critical thinking
  // have big dreams
  { match: "(had|have|#PastTense) #Adjective [#PresentTense]", group: 0, tag: "Noun", notIf: "better", reason: "adj-presentTense" },
  // excellent answer spencer
  // { match: '^#Adjective [#PresentTense]', group: 0, tag: 'Noun', reason: 'start adj-presentTense' },
  // one big reason
  { match: "#Value #Adjective [#PresentTense]", group: 0, tag: "Noun", notIf: "#Copula", reason: "one-big-reason" },
  // won widespread support
  { match: "#PastTense #Adjective+ [#PresentTense]", group: 0, tag: "Noun", notIf: "(#Copula|better)", reason: "won-wide-support" },
  // many poses
  { match: "(many|few|several|couple) [#PresentTense]", group: 0, tag: "Noun", notIf: "#Copula", reason: "many-poses" },
  // very big dreams
  { match: "#Determiner #Adverb #Adjective [%Noun|Verb%]", group: 0, tag: "Noun", notIf: "#Copula", reason: "very-big-dream" },
  // from start to finish
  { match: "from #Noun to [%Noun|Verb%]", group: 0, tag: "Noun", reason: "start-to-finish" },
  // for comparison or contrast
  { match: "(for|with|of) #Noun (and|or|not) [%Noun|Verb%]", group: 0, tag: "Noun", notIf: "#Pronoun", reason: "for-food-and-gas" },
  // adorable little store
  { match: "#Adjective #Adjective [#PresentTense]", group: 0, tag: "Noun", notIf: "#Copula", reason: "adorable-little-store" },
  // of basic training
  // { match: '#Preposition #Adjective [#PresentTense]', group: 0, tag: 'Noun', reason: 'of-basic-training' },
  // justifiying higher costs
  { match: "#Gerund #Adverb? #Comparative [#PresentTense]", group: 0, tag: "Noun", notIf: "#Copula", reason: "higher-costs" },
  { match: "(#Noun && @hasComma) #Noun (and|or) [#PresentTense]", group: 0, tag: "Noun", notIf: "#Copula", reason: "noun-list" },
  // any questions for
  { match: "(many|any|some|several) [#PresentTense] for", group: 0, tag: "Noun", reason: "any-verbs-for" },
  // to facilitate gas exchange with
  { match: `to #PresentTense #Noun [#PresentTense] #Preposition`, group: 0, tag: "Noun", reason: "gas-exchange" },
  // waited until release
  { match: `#PastTense (until|as|through|without) [#PresentTense]`, group: 0, tag: "Noun", reason: "waited-until-release" },
  // selling like hot cakes
  { match: `#Gerund like #Adjective? [#PresentTense]`, group: 0, tag: "Plural", reason: "like-hot-cakes" },
  // some valid reason
  { match: `some #Adjective [#PresentTense]`, group: 0, tag: "Noun", reason: "some-reason" },
  // for some reason
  { match: `for some [#PresentTense]`, group: 0, tag: "Noun", reason: "for-some-reason" },
  // same kind of shouts
  { match: `(same|some|the|that|a) kind of [#PresentTense]`, group: 0, tag: "Noun", reason: "some-kind-of" },
  // a type of shout
  { match: `(same|some|the|that|a) type of [#PresentTense]`, group: 0, tag: "Noun", reason: "some-type-of" },
  // doing better for fights
  { match: `#Gerund #Adjective #Preposition [#PresentTense]`, group: 0, tag: "Noun", reason: "doing-better-for-x" },
  // get better aim
  { match: `(get|got|have) #Comparative [#PresentTense]`, group: 0, tag: "Noun", reason: "got-better-aim" },
  // whose name was
  { match: "whose [#PresentTense] #Copula", group: 0, tag: "Noun", reason: "whos-name-was" },
  // give up on reason
  { match: `#PhrasalVerb #Particle #Preposition [#PresentTense]`, group: 0, tag: "Noun", reason: "given-up-on-x" },
  //there are reasons
  { match: "there (are|were) #Adjective? [#PresentTense]", group: 0, tag: "Plural", reason: "there-are" },
  // 30 trains
  { match: "#Value [#PresentTense] of", group: 0, notIf: "(one|1|#Copula|#Infinitive)", tag: "Plural", reason: "2-trains" },
  // compromises are possible
  { match: "[#PresentTense] (are|were) #Adjective", group: 0, tag: "Plural", reason: "compromises-are-possible" },
  // hope i helped
  { match: "^[(hope|guess|thought|think)] #Pronoun #Verb", group: 0, tag: "Infinitive", reason: "suppose-i" },
  //pursue its dreams
  // { match: '#PresentTense #Possessive [#PresentTense]', notIf: '#Gerund', group: 0, tag: 'Plural', reason: 'pursue-its-dreams' },
  // our unyielding support
  { match: "#Possessive #Adjective [#Verb]", group: 0, tag: "Noun", notIf: "#Copula", reason: "our-full-support" },
  // tastes good
  { match: "[(tastes|smells)] #Adverb? #Adjective", group: 0, tag: "PresentTense", reason: "tastes-good" },
  // are you playing golf
  // { match: '^are #Pronoun [#Noun]', group: 0, notIf: '(here|there)', tag: 'Verb', reason: 'are-you-x' },
  // ignoring commute
  { match: "#Copula #Gerund [#PresentTense] !by?", group: 0, tag: "Noun", notIf: "going", reason: "ignoring-commute" },
  // noun-pastTense variables
  { match: "#Determiner #Adjective? [(shed|thought|rose|bid|saw|spelt)]", group: 0, tag: "Noun", reason: "noun-past" },
  // 'verb-to'
  // how to watch
  { match: "how to [%Noun|Verb%]", group: 0, tag: "Infinitive", reason: "how-to-noun" },
  // which boost it
  { match: "which [%Noun|Verb%] #Noun", group: 0, tag: "Infinitive", reason: "which-boost-it" },
  // asking questions
  { match: "#Gerund [%Plural|Verb%]", group: 0, tag: "Plural", reason: "asking-questions" },
  // ready to stream
  { match: "(ready|available|difficult|hard|easy|made|attempt|try) to [%Noun|Verb%]", group: 0, tag: "Infinitive", reason: "ready-to-noun" },
  // bring to market
  { match: "(bring|went|go|drive|run|bike) to [%Noun|Verb%]", group: 0, tag: "Noun", reason: "bring-to-noun" },
  // can i sleep, would you look
  { match: "#Modal #Noun [%Noun|Verb%]", group: 0, tag: "Infinitive", reason: "would-you-look" },
  // is just spam
  { match: "#Copula just [#Infinitive]", group: 0, tag: "Noun", reason: "is-just-spam" },
  // request copies
  { match: "^%Noun|Verb% %Plural|Verb%", tag: "Imperative #Plural", reason: "request-copies" },
  // homemade pickles and drinks
  { match: "#Adjective #Plural and [%Plural|Verb%]", group: 0, tag: "#Plural", reason: "pickles-and-drinks" },
  // the 1968 film
  { match: "#Determiner #Year [#Verb]", group: 0, tag: "Noun", reason: "the-1968-film" },
  // the break up
  { match: "#Determiner [#PhrasalVerb #Particle]", group: 0, tag: "Noun", reason: "the-break-up" },
  // the individual goals
  { match: "#Determiner [%Adj|Noun%] #Noun", group: 0, tag: "Adjective", notIf: "(#Pronoun|#Possessive|#ProperNoun)", reason: "the-individual-goals" },
  // work or prepare
  { match: "[%Noun|Verb%] or #Infinitive", group: 0, tag: "Infinitive", reason: "work-or-prepare" },
  // to give thanks
  { match: "to #Infinitive [#PresentTense]", group: 0, tag: "Noun", notIf: "(#Gerund|#Copula|help)", reason: "to-give-thanks" },
  // kills me
  { match: "[#Noun] me", group: 0, tag: "Verb", reason: "kills-me" },
  // removes wrinkles
  { match: "%Plural|Verb% %Plural|Verb%", tag: "#PresentTense #Plural", reason: "removes-wrinkles" }
];
const money = [
  { match: "#Money and #Money #Currency?", tag: "Money", reason: "money-and-money" },
  // 6 dollars and 5 cents
  { match: "#Value #Currency [and] #Value (cents|ore|centavos|sens)", group: 0, tag: "money", reason: "and-5-cents" },
  // maybe currencies
  { match: "#Value (mark|rand|won|rub|ore)", tag: "#Money #Currency", reason: "4-mark" },
  // 3 pounds
  { match: "a pound", tag: "#Money #Unit", reason: "a-pound" },
  { match: "#Value (pound|pounds)", tag: "#Money #Unit", reason: "4-pounds" }
];
const fractions = [
  // half a penny
  { match: "[(half|quarter)] of? (a|an)", group: 0, tag: "Fraction", reason: "millionth" },
  // nearly half
  { match: "#Adverb [half]", group: 0, tag: "Fraction", reason: "nearly-half" },
  // half the
  { match: "[half] the", group: 0, tag: "Fraction", reason: "half-the" },
  // and a half
  { match: "#Cardinal and a half", tag: "Fraction", reason: "and-a-half" },
  // two-halves
  { match: "#Value (halves|halfs|quarters)", tag: "Fraction", reason: "two-halves" },
  // ---ordinals as fractions---
  // a fifth
  { match: "a #Ordinal", tag: "Fraction", reason: "a-quarter" },
  // seven fifths
  { match: "[#Cardinal+] (#Fraction && /s$/)", tag: "Fraction", reason: "seven-fifths" },
  // doc.match('(#Fraction && /s$/)').lookBefore('#Cardinal+$').tag('Fraction')
  // one third of ..
  { match: "[#Cardinal+ #Ordinal] of .", group: 0, tag: "Fraction", reason: "ordinal-of" },
  // 100th of
  { match: "[(#NumericValue && #Ordinal)] of .", group: 0, tag: "Fraction", reason: "num-ordinal-of" },
  // a twenty fifth
  { match: "(a|one) #Cardinal?+ #Ordinal", tag: "Fraction", reason: "a-ordinal" },
  // //  '3 out of 5'
  { match: "#Cardinal+ out? of every? #Cardinal", tag: "Fraction", reason: "out-of" }
];
const numbers$1 = [
  // ==== Ambiguous numbers ====
  // 'second'
  { match: `#Cardinal [second]`, tag: "Unit", reason: "one-second" },
  //'a/an' can mean 1 - "a hour"
  {
    match: "!once? [(a|an)] (#Duration|hundred|thousand|million|billion|trillion)",
    group: 0,
    tag: "Value",
    reason: "a-is-one"
  },
  // ==== PhoneNumber ====
  //1 800 ...
  { match: "1 #Value #PhoneNumber", tag: "PhoneNumber", reason: "1-800-Value" },
  //(454) 232-9873
  { match: "#NumericValue #PhoneNumber", tag: "PhoneNumber", reason: "(800) PhoneNumber" },
  // ==== Currency ====
  // chinese yuan
  { match: "#Demonym #Currency", tag: "Currency", reason: "demonym-currency" },
  // ten bucks
  { match: "#Value [(buck|bucks|grand)]", group: 0, tag: "Currency", reason: "value-bucks" },
  // ==== Money ====
  { match: "[#Value+] #Currency", group: 0, tag: "Money", reason: "15 usd" },
  // ==== Ordinal ====
  { match: "[second] #Noun", group: 0, tag: "Ordinal", reason: "second-noun" },
  // ==== Units ====
  //5 yan
  { match: "#Value+ [#Currency]", group: 0, tag: "Unit", reason: "5-yan" },
  { match: "#Value [(foot|feet)]", group: 0, tag: "Unit", reason: "foot-unit" },
  //5 kg.
  { match: "#Value [#Abbreviation]", group: 0, tag: "Unit", reason: "value-abbr" },
  { match: "#Value [k]", group: 0, tag: "Unit", reason: "value-k" },
  { match: "#Unit an hour", tag: "Unit", reason: "unit-an-hour" },
  // ==== Magnitudes ====
  //minus 7
  { match: "(minus|negative) #Value", tag: "Value", reason: "minus-value" },
  //seven point five
  { match: "#Value (point|decimal) #Value", tag: "Value", reason: "value-point-value" },
  //quarter million
  { match: "#Determiner [(half|quarter)] #Ordinal", group: 0, tag: "Value", reason: "half-ordinal" },
  // thousand and two
  { match: `#Multiple+ and #Value`, tag: "Value", reason: "magnitude-and-value" },
  // ambiguous units like 'gb'
  // { match: '#Value square? [(kb|mb|gb|tb|ml|pt|qt|tbl|tbsp|km|cm|mm|mi|ft|yd|kg|hg|mg|oz|lb|mph|pa|miles|yard|yards|pound|pounds)]', group: 0, tag: 'Unit', reason: '12-gb' },
  // 5 miles per hour
  { match: "#Value #Unit [(per|an) (hr|hour|sec|second|min|minute)]", group: 0, tag: "Unit", reason: "12-miles-per-second" },
  // 5 square miles
  { match: "#Value [(square|cubic)] #Unit", group: 0, tag: "Unit", reason: "square-miles" }
  // 5) The expenses
  // { match: '^[#Value] (#Determiner|#Gerund)', group: 0, tag: 'Expression', unTag: 'Value', reason: 'numbered-list' },
];
const person = [
  // ==== FirstNames ====
  //is foo Smith
  { match: "#Copula [(#Noun|#PresentTense)] #LastName", group: 0, tag: "FirstName", reason: "copula-noun-lastname" },
  //pope francis
  {
    match: "(sister|pope|brother|father|aunt|uncle|grandpa|grandfather|grandma) #ProperNoun",
    tag: "Person",
    reason: "lady-titlecase",
    safe: true
  },
  // ==== Nickname ====
  // Dwayne 'the rock' Johnson
  { match: "#FirstName [#Determiner #Noun] #LastName", group: 0, tag: "Person", reason: "first-noun-last" },
  {
    match: "#ProperNoun (b|c|d|e|f|g|h|j|k|l|m|n|o|p|q|r|s|t|u|v|w|x|y|z) #ProperNoun",
    tag: "Person",
    reason: "titlecase-acronym-titlecase",
    safe: true
  },
  { match: "#Acronym #LastName", tag: "Person", reason: "acronym-lastname", safe: true },
  { match: "#Person (jr|sr|md)", tag: "Person", reason: "person-honorific" },
  //remove single 'mr'
  { match: "#Honorific #Acronym", tag: "Person", reason: "Honorific-TitleCase" },
  { match: "#Person #Person the? #RomanNumeral", tag: "Person", reason: "roman-numeral" },
  { match: "#FirstName [/^[^aiurck]$/]", group: 0, tag: ["Acronym", "Person"], reason: "john-e" },
  //j.k Rowling
  { match: "#Noun van der? #Noun", tag: "Person", reason: "van der noun", safe: true },
  //king of spain
  { match: "(king|queen|prince|saint|lady) of #Noun", tag: "Person", reason: "king-of-noun", safe: true },
  //lady Florence
  { match: "(prince|lady) #Place", tag: "Person", reason: "lady-place" },
  //saint Foo
  { match: "(king|queen|prince|saint) #ProperNoun", tag: "Person", notIf: "#Place", reason: "saint-foo" },
  // al sharpton
  { match: "al (#Person|#ProperNoun)", tag: "Person", reason: "al-borlen", safe: true },
  //ferdinand de almar
  { match: "#FirstName de #Noun", tag: "Person", reason: "bill-de-noun" },
  //Osama bin Laden
  { match: "#FirstName (bin|al) #Noun", tag: "Person", reason: "bill-al-noun" },
  //John L. Foo
  { match: "#FirstName #Acronym #ProperNoun", tag: "Person", reason: "bill-acronym-title" },
  //Andrew Lloyd Webber
  { match: "#FirstName #FirstName #ProperNoun", tag: "Person", reason: "bill-firstname-title" },
  //Mr Foo
  { match: "#Honorific #FirstName? #ProperNoun", tag: "Person", reason: "dr-john-Title" },
  //peter the great
  { match: "#FirstName the #Adjective", tag: "Person", reason: "name-the-great" },
  // dick van dyke
  { match: "#ProperNoun (van|al|bin) #ProperNoun", tag: "Person", reason: "title-van-title", safe: true },
  //jose de Sucre
  { match: "#ProperNoun (de|du) la? #ProperNoun", tag: "Person", notIf: "#Place", reason: "title-de-title" },
  //Jani K. Smith
  { match: "#Singular #Acronym #LastName", tag: "#FirstName #Person .", reason: "title-acro-noun", safe: true },
  //Foo Ford
  { match: "[#ProperNoun] #Person", group: 0, tag: "Person", reason: "proper-person", safe: true },
  // john keith jones
  {
    match: "#Person [#ProperNoun #ProperNoun]",
    group: 0,
    tag: "Person",
    notIf: "#Possessive",
    reason: "three-name-person",
    safe: true
  },
  //John Foo
  {
    match: "#FirstName #Acronym? [#ProperNoun]",
    group: 0,
    tag: "LastName",
    notIf: "#Possessive",
    reason: "firstname-titlecase"
  },
  // john stewart
  { match: "#FirstName [#FirstName]", group: 0, tag: "LastName", reason: "firstname-firstname" },
  //Joe K. Sombrero
  { match: "#FirstName #Acronym #Noun", tag: "Person", reason: "n-acro-noun", safe: true },
  //Anthony de Marco
  { match: "#FirstName [(de|di|du|van|von)] #Person", group: 0, tag: "LastName", reason: "de-firstname" },
  // baker jenna smith
  // { match: '[#Actor+] #Person', group: 0, tag: 'Person', reason: 'baker-sam-smith' },
  // sergeant major Harold
  {
    match: "[(lieutenant|corporal|sergeant|captain|qeen|king|admiral|major|colonel|marshal|president|queen|king)+] #ProperNoun",
    group: 0,
    tag: "Honorific",
    reason: "seargeant-john"
  },
  // ==== Honorics ====
  {
    match: "[(private|general|major|rear|prime|field|count|miss)] #Honorific? #Person",
    group: 0,
    tag: ["Honorific", "Person"],
    reason: "ambg-honorifics"
  },
  // dr john foobar
  {
    match: "#Honorific #FirstName [#Singular]",
    group: 0,
    tag: "LastName",
    notIf: "#Possessive",
    reason: "dr-john-foo",
    safe: true
  },
  //his-excellency
  {
    match: "[(his|her) (majesty|honour|worship|excellency|honorable)] #Person",
    group: 0,
    tag: "Honorific",
    reason: "his-excellency"
  },
  // Lieutenant colonel
  { match: "#Honorific #Actor", tag: "Honorific", reason: "Lieutenant colonel" },
  // first lady, second admiral
  { match: "(first|second|third|1st|2nd|3rd) #Actor", tag: "Honorific", reason: "first lady" },
  // Louis IV
  { match: "#Person #RomanNumeral", tag: "Person", reason: "louis-IV" }
];
const personName = [
  // ebenezer scrooge
  {
    match: "#FirstName #Noun$",
    tag: ". #LastName",
    notIf: "(#Possessive|#Organization|#Place|#Pronoun|@hasTitleCase)",
    reason: "firstname-noun"
  },
  // ===person-date===
  { match: "%Person|Date% #Acronym? #ProperNoun", tag: "Person", reason: "jan-thierson" },
  // ===person-noun===
  //Cliff Clavin
  { match: "%Person|Noun% #Acronym? #ProperNoun", tag: "Person", reason: "switch-person", safe: true },
  // olive garden
  { match: "%Person|Noun% #Organization", tag: "Organization", reason: "olive-garden" },
  // ===person-verb===
  // ollie faroo
  { match: "%Person|Verb% #Acronym? #ProperNoun", tag: "Person", reason: "verb-propernoun", ifNo: "#Actor" },
  // chuck will ...
  {
    match: `[%Person|Verb%] (will|had|has|said|says|told|did|learned|wants|wanted)`,
    group: 0,
    tag: "Person",
    reason: "person-said"
  },
  // ===person-place===
  //sydney harbour
  {
    match: `[%Person|Place%] (harbor|harbour|pier|town|city|place|dump|landfill)`,
    group: 0,
    tag: "Place",
    reason: "sydney-harbour"
  },
  // east sydney
  { match: `(west|east|north|south) [%Person|Place%]`, group: 0, tag: "Place", reason: "east-sydney" },
  // ===person-adjective===
  // rusty smith
  // { match: `${personAdj} #Person`, tag: 'Person', reason: 'randy-smith' },
  // rusty a. smith
  // { match: `${personAdj} #Acronym? #ProperNoun`, tag: 'Person', reason: 'rusty-smith' },
  // very rusty
  // { match: `#Adverb [${personAdj}]`, group: 0, tag: 'Adjective', reason: 'really-rich' },
  // ===person-verb===
  // would wade
  { match: `#Modal [%Person|Verb%]`, group: 0, tag: "Verb", reason: "would-mark" },
  // really wade
  { match: `#Adverb [%Person|Verb%]`, group: 0, tag: "Verb", reason: "really-mark" },
  // drew closer
  { match: `[%Person|Verb%] (#Adverb|#Comparative)`, group: 0, tag: "Verb", reason: "drew-closer" },
  // wade smith
  { match: `%Person|Verb% #Person`, tag: "Person", reason: "rob-smith" },
  // wade m. Cooper
  { match: `%Person|Verb% #Acronym #ProperNoun`, tag: "Person", reason: "rob-a-smith" },
  // will go
  { match: "[will] #Verb", group: 0, tag: "Modal", reason: "will-verb" },
  // will Pharell
  { match: "(will && @isTitleCase) #ProperNoun", tag: "Person", reason: "will-name" },
  // jack layton won
  {
    match: "(#FirstName && !#Possessive) [#Singular] #Verb",
    group: 0,
    safe: true,
    tag: "LastName",
    reason: "jack-layton"
  },
  // sherwood anderson told
  { match: "^[#Singular] #Person #Verb", group: 0, safe: true, tag: "Person", reason: "sherwood-anderson" },
  // bought a warhol
  { match: "(a|an) [#Person]$", group: 0, unTag: "Person", reason: "a-warhol" }
];
const verbs$1 = [
  //sometimes adverbs - 'pretty good','well above'
  {
    match: "#Copula (pretty|dead|full|well|sure) (#Adjective|#Noun)",
    tag: "#Copula #Adverb #Adjective",
    reason: "sometimes-adverb"
  },
  //i better ..
  { match: "(#Pronoun|#Person) (had|#Adverb)? [better] #PresentTense", group: 0, tag: "Modal", reason: "i-better" },
  // adj -> gerund
  // like
  { match: "(#Modal|i|they|we|do) not? [like]", group: 0, tag: "PresentTense", reason: "modal-like" },
  // ==== Tense ====
  //he left
  { match: "#Noun #Adverb? [left]", group: 0, tag: "PastTense", reason: "left-verb" },
  // ==== Copula ====
  //will be running (not copula)
  { match: "will #Adverb? not? #Adverb? [be] #Gerund", group: 0, tag: "Copula", reason: "will-be-copula" },
  //for more complex forms, just tag 'be'
  { match: "will #Adverb? not? #Adverb? [be] #Adjective", group: 0, tag: "Copula", reason: "be-copula" },
  // ==== Infinitive ====
  //march to
  { match: "[march] (up|down|back|toward)", notIf: "#Date", group: 0, tag: "Infinitive", reason: "march-to" },
  //must march
  { match: "#Modal [march]", group: 0, tag: "Infinitive", reason: "must-march" },
  // may be
  { match: `[may] be`, group: 0, tag: "Verb", reason: "may-be" },
  // subject to
  { match: `[(subject|subjects|subjected)] to`, group: 0, tag: "Verb", reason: "subject to" },
  // subject to
  { match: `[home] to`, group: 0, tag: "PresentTense", reason: "home to" },
  // === misc==
  // side with
  // { match: '[(side|fool|monkey)] with', group: 0, tag: 'Infinitive', reason: 'fool-with' },
  // open the door
  { match: "[open] #Determiner", group: 0, tag: "Infinitive", reason: "open-the" },
  //were being run
  { match: `(were|was) being [#PresentTense]`, group: 0, tag: "PastTense", reason: "was-being" },
  //had been broken
  { match: `(had|has|have) [been /en$/]`, group: 0, tag: "Auxiliary Participle", reason: "had-been-broken" },
  //had been smoked
  { match: `(had|has|have) [been /ed$/]`, group: 0, tag: "Auxiliary PastTense", reason: "had-been-smoked" },
  //were being run
  { match: `(had|has) #Adverb? [been] #Adverb? #PastTense`, group: 0, tag: "Auxiliary", reason: "had-been-adj" },
  //had to walk
  { match: `(had|has) to [#Noun] (#Determiner|#Possessive)`, group: 0, tag: "Infinitive", reason: "had-to-noun" },
  // have read
  { match: `have [#PresentTense]`, group: 0, tag: "PastTense", notIf: "(come|gotten)", reason: "have-read" },
  // does that work
  { match: `(does|will|#Modal) that [work]`, group: 0, tag: "PastTense", reason: "does-that-work" },
  // sounds fun
  { match: `[(sound|sounds)] #Adjective`, group: 0, tag: "PresentTense", reason: "sounds-fun" },
  // look good
  { match: `[(look|looks)] #Adjective`, group: 0, tag: "PresentTense", reason: "looks-good" },
  // stops thinking
  { match: `[(start|starts|stop|stops|begin|begins)] #Gerund`, group: 0, tag: "Verb", reason: "starts-thinking" },
  // have read
  { match: `(have|had) read`, tag: "Modal #PastTense", reason: "read-read" },
  //were under cooked
  {
    match: `(is|was|were) [(under|over) #PastTense]`,
    group: 0,
    tag: "Adverb Adjective",
    reason: "was-under-cooked"
  },
  // damn them
  { match: "[shit] (#Determiner|#Possessive|them)", group: 0, tag: "Verb", reason: "swear1-verb" },
  { match: "[damn] (#Determiner|#Possessive|them)", group: 0, tag: "Verb", reason: "swear2-verb" },
  { match: "[fuck] (#Determiner|#Possessive|them)", group: 0, tag: "Verb", reason: "swear3-verb" },
  // jobs that fit
  { match: "#Plural that %Noun|Verb%", tag: ". #Preposition #Infinitive", reason: "jobs-that-work" },
  // works for me
  { match: "[works] for me", group: 0, tag: "PresentTense", reason: "works-for-me" },
  // as we please
  { match: "as #Pronoun [please]", group: 0, tag: "Infinitive", reason: "as-we-please" },
  // verb-prefixes - 'co write'
  { match: "[(co|mis|de|inter|intra|pre|re|un|out|under|over|counter)] #Verb", group: 0, tag: ["Verb", "Prefix"], notIf: "(#Copula|#PhrasalVerb)", reason: "co-write" },
  // dressed and left
  { match: "#PastTense and [%Adj|Past%]", group: 0, tag: "PastTense", reason: "dressed-and-left" },
  // melted and fallen
  { match: "[%Adj|Past%] and #PastTense", group: 0, tag: "PastTense", reason: "dressed-and-left" },
  // is he stoked
  { match: "#Copula #Pronoun [%Adj|Past%]", group: 0, tag: "Adjective", reason: "is-he-stoked" },
  // to dream of
  { match: "to [%Noun|Verb%] #Preposition", group: 0, tag: "Infinitive", reason: "to-dream-of" }
];
const auxiliary = [
  // ==== Auxiliary ====
  // have been
  { match: `will (#Adverb|not)+? [have] (#Adverb|not)+? #Verb`, group: 0, tag: "Auxiliary", reason: "will-have-vb" },
  //was walking
  { match: `[#Copula] (#Adverb|not)+? (#Gerund|#PastTense)`, group: 0, tag: "Auxiliary", reason: "copula-walking" },
  //would walk
  { match: `[(#Modal|did)+] (#Adverb|not)+? #Verb`, group: 0, tag: "Auxiliary", reason: "modal-verb" },
  //would have had
  { match: `#Modal (#Adverb|not)+? [have] (#Adverb|not)+? [had] (#Adverb|not)+? #Verb`, group: 0, tag: "Auxiliary", reason: "would-have" },
  //support a splattering of auxillaries before a verb
  { match: `[(has|had)] (#Adverb|not)+? #PastTense`, group: 0, tag: "Auxiliary", reason: "had-walked" },
  // will walk
  { match: "[(do|does|did|will|have|had|has|got)] (not|#Adverb)+? #Verb", group: 0, tag: "Auxiliary", reason: "have-had" },
  // about to go
  { match: "[about to] #Adverb? #Verb", group: 0, tag: ["Auxiliary", "Verb"], reason: "about-to" },
  //would be walking
  { match: `#Modal (#Adverb|not)+? [be] (#Adverb|not)+? #Verb`, group: 0, tag: "Auxiliary", reason: "would-be" },
  //had been walking
  { match: `[(#Modal|had|has)] (#Adverb|not)+? [been] (#Adverb|not)+? #Verb`, group: 0, tag: "Auxiliary", reason: "had-been" },
  // was being driven
  { match: "[(be|being|been)] #Participle", group: 0, tag: "Auxiliary", reason: "being-driven" },
  // may want
  { match: "[may] #Adverb? #Infinitive", group: 0, tag: "Auxiliary", reason: "may-want" },
  // was being walked
  { match: "#Copula (#Adverb|not)+? [(be|being|been)] #Adverb+? #PastTense", group: 0, tag: "Auxiliary", reason: "being-walked" },
  // will be walked
  { match: "will [be] #PastTense", group: 0, tag: "Auxiliary", reason: "will-be-x" },
  // been walking
  { match: "[(be|been)] (#Adverb|not)+? #Gerund", group: 0, tag: "Auxiliary", reason: "been-walking" },
  // used to walk
  { match: "[used to] #PresentTense", group: 0, tag: "Auxiliary", reason: "used-to-walk" },
  // was going to walk
  { match: "#Copula (#Adverb|not)+? [going to] #Adverb+? #PresentTense", group: 0, tag: "Auxiliary", reason: "going-to-walk" },
  // tell me
  { match: "#Imperative [(me|him|her)]", group: 0, tag: "Reflexive", reason: "tell-him" },
  // there is no x
  { match: "(is|was) #Adverb? [no]", group: 0, tag: "Negative", reason: "is-no" },
  // been told
  { match: "[(been|had|became|came)] #PastTense", group: 0, notIf: "#PhrasalVerb", tag: "Auxiliary", reason: "been-told" },
  // being born
  { match: "[(being|having|getting)] #Verb", group: 0, tag: "Auxiliary", reason: "being-born" },
  // be walking
  { match: "[be] #Gerund", group: 0, tag: "Auxiliary", reason: "be-walking" },
  // better go
  { match: "[better] #PresentTense", group: 0, tag: "Modal", notIf: "(#Copula|#Gerund)", reason: "better-go" },
  // even better
  { match: "even better", tag: "Adverb #Comparative", reason: "even-better" }
];
const phrasal = [
  // ==== Phrasal ====
  //'foo-up'
  { match: "(#Verb && @hasHyphen) up", tag: "PhrasalVerb", reason: "foo-up" },
  { match: "(#Verb && @hasHyphen) off", tag: "PhrasalVerb", reason: "foo-off" },
  { match: "(#Verb && @hasHyphen) over", tag: "PhrasalVerb", reason: "foo-over" },
  { match: "(#Verb && @hasHyphen) out", tag: "PhrasalVerb", reason: "foo-out" },
  // walk in on
  {
    match: "[#Verb (in|out|up|down|off|back)] (on|in)",
    notIf: "#Copula",
    tag: "PhrasalVerb Particle",
    reason: "walk-in-on"
  },
  // went on for
  { match: "(lived|went|crept|go) [on] for", group: 0, tag: "PhrasalVerb", reason: "went-on" },
  // the curtains come down
  { match: "#Verb (up|down|in|on|for)$", tag: "PhrasalVerb #Particle", notIf: "#PhrasalVerb", reason: "come-down$" },
  // got me thinking
  // { match: '(got|had) me [#Noun]', group: 0, tag: 'Verb', reason: 'got-me-gerund' },
  // help stop
  { match: "help [(stop|end|make|start)]", group: 0, tag: "Infinitive", reason: "help-stop" },
  // work in the office
  { match: "#PhrasalVerb (in && #Particle) #Determiner", tag: "#Verb #Preposition #Determiner", unTag: "PhrasalVerb", reason: "work-in-the" },
  // start listening
  { match: "[(stop|start|finish|help)] #Gerund", group: 0, tag: "Infinitive", reason: "start-listening" },
  // mis-fired
  // { match: '[(mis)] #Verb', group: 0, tag: 'Verb', reason: 'mis-firedsa' },
  //back it up
  {
    match: "#Verb (him|her|it|us|himself|herself|itself|everything|something) [(up|down)]",
    group: 0,
    tag: "Adverb",
    reason: "phrasal-pronoun-advb"
  }
];
const notIf = "(i|we|they)";
const imperative = [
  // do not go
  { match: "^do not? [#Infinitive #Particle?]", notIf, group: 0, tag: "Imperative", reason: "do-eat" },
  // please go
  { match: "^please do? not? [#Infinitive #Particle?]", group: 0, tag: "Imperative", reason: "please-go" },
  // just go
  { match: "^just do? not? [#Infinitive #Particle?]", group: 0, tag: "Imperative", reason: "just-go" },
  // do it better
  { match: "^[#Infinitive] it #Comparative", notIf, group: 0, tag: "Imperative", reason: "do-it-better" },
  // do it again
  { match: "^[#Infinitive] it (please|now|again|plz)", notIf, group: 0, tag: "Imperative", reason: "do-it-please" },
  // go quickly.
  { match: "^[#Infinitive] (#Adjective|#Adverb)$", group: 0, tag: "Imperative", notIf: "(so|such|rather|enough)", reason: "go-quickly" },
  // turn down the noise
  { match: "^[#Infinitive] (up|down|over) #Determiner", group: 0, tag: "Imperative", reason: "turn-down" },
  // eat my shorts
  { match: "^[#Infinitive] (your|my|the|a|an|any|each|every|some|more|with|on)", group: 0, notIf: "like", tag: "Imperative", reason: "eat-my-shorts" },
  // tell him the story
  { match: "^[#Infinitive] (him|her|it|us|me|there)", group: 0, tag: "Imperative", reason: "tell-him" },
  // avoid loud noises
  { match: "^[#Infinitive] #Adjective #Noun$", group: 0, tag: "Imperative", reason: "avoid-loud-noises" },
  // call and reserve
  { match: "^[#Infinitive] (#Adjective|#Adverb)? and #Infinitive", group: 0, tag: "Imperative", reason: "call-and-reserve" },
  // one-word imperatives
  { match: "^(go|stop|wait|hurry) please?$", tag: "Imperative", reason: "go" },
  // somebody call
  { match: "^(somebody|everybody) [#Infinitive]", group: 0, tag: "Imperative", reason: "somebody-call" },
  // let's leave
  { match: "^let (us|me) [#Infinitive]", group: 0, tag: "Imperative", reason: "lets-leave" },
  // shut the door
  { match: "^[(shut|close|open|start|stop|end|keep)] #Determiner #Noun", group: 0, tag: "Imperative", reason: "shut-the-door" },
  // turn off the light
  { match: "^[#PhrasalVerb #Particle] #Determiner #Noun", group: 0, tag: "Imperative", reason: "turn-off-the-light" },
  // go to toronto
  { match: "^[go] to .", group: 0, tag: "Imperative", reason: "go-to-toronto" },
  // would you recommend
  { match: "^#Modal you [#Infinitive]", group: 0, tag: "Imperative", reason: "would-you-" },
  // never say
  { match: "^never [#Infinitive]", group: 0, tag: "Imperative", reason: "never-stop" },
  // come have a drink
  { match: "^come #Infinitive", tag: "Imperative", notIf: "on", reason: "come-have" },
  // come and have a drink
  { match: "^come and? #Infinitive", tag: "Imperative . Imperative", notIf: "#PhrasalVerb", reason: "come-and-have" },
  // stay away
  { match: "^stay (out|away|back)", tag: "Imperative", reason: "stay-away" },
  // stay cool
  { match: "^[(stay|be|keep)] #Adjective", group: 0, tag: "Imperative", reason: "stay-cool" },
  // keep it silent
  { match: "^[keep it] #Adjective", group: 0, tag: "Imperative", reason: "keep-it-cool" },
  // don't be late
  { match: "^do not [#Infinitive]", group: 0, tag: "Imperative", reason: "do-not-be" },
  // allow yourself
  { match: "[#Infinitive] (yourself|yourselves)", group: 0, tag: "Imperative", reason: "allow-yourself" },
  // look what
  { match: "[#Infinitive] what .", group: 0, tag: "Imperative", reason: "look-what" },
  // continue playing
  { match: "^[#Infinitive] #Gerund", group: 0, tag: "Imperative", reason: "keep-playing" },
  // go to it
  { match: "^[#Infinitive] (to|for|into|toward|here|there)", group: 0, tag: "Imperative", reason: "go-to" },
  // relax and unwind
  { match: "^[#Infinitive] (and|or) #Infinitive", group: 0, tag: "Imperative", reason: "inf-and-inf" },
  // commit to
  { match: "^[%Noun|Verb%] to", group: 0, tag: "Imperative", reason: "commit-to" },
  // maintain eye contact
  { match: "^[#Infinitive] #Adjective? #Singular #Singular", group: 0, tag: "Imperative", reason: "maintain-eye-contact" },
  // don't forget to clean
  { match: "do not (forget|omit|neglect) to [#Infinitive]", group: 0, tag: "Imperative", reason: "do-not-forget" },
  // pay attention
  { match: "^[(ask|wear|pay|look|help|show|watch|act|fix|kill|stop|start|turn|try|win)] #Noun", group: 0, tag: "Imperative", reason: "pay-attention" }
];
const adjGerund = [
  // that were growing
  { match: "(that|which) were [%Adj|Gerund%]", group: 0, tag: "Gerund", reason: "that-were-growing" },
  // was dissapointing
  // { match: '#Copula [%Adj|Gerund%]$', group: 0, tag: 'Adjective', reason: 'was-disappointing$' },
  // repairing crubling roads
  { match: "#Gerund [#Gerund] #Plural", group: 0, tag: "Adjective", reason: "hard-working-fam" }
  // { match: '(that|which) were [%Adj|Gerund%]', group: 0, tag: 'Gerund', reason: 'that-were-growing' },
];
const passive$1 = [
  // got walked, was walked, were walked
  { match: "(got|were|was|is|are|am) (#PastTense|#Participle)", tag: "Passive", reason: "got-walked" },
  // was being walked
  { match: "(was|were|is|are|am) being (#PastTense|#Participle)", tag: "Passive", reason: "was-being" },
  // had been walked, have been eaten
  { match: "(had|have|has) been (#PastTense|#Participle)", tag: "Passive", reason: "had-been" },
  // will be cleaned
  { match: "will be being? (#PastTense|#Participle)", tag: "Passive", reason: "will-be-cleaned" },
  // suffered by the country
  { match: "#Noun [(#PastTense|#Participle)] by (the|a) #Noun", group: 0, tag: "Passive", reason: "suffered-by" }
];
const matches$1 = [
  // u r cool
  { match: "u r", tag: "#Pronoun #Copula", reason: "u r" },
  { match: "#Noun [(who|whom)]", group: 0, tag: "Determiner", reason: "captain-who" },
  // ==== Conditions ====
  // had he survived,
  { match: "[had] #Noun+ #PastTense", group: 0, tag: "Condition", reason: "had-he" },
  // were he to survive
  { match: "[were] #Noun+ to #Infinitive", group: 0, tag: "Condition", reason: "were-he" },
  // some sort of
  { match: "some sort of", tag: "Adjective Noun Conjunction", reason: "some-sort-of" },
  // some of
  // { match: 'some of', tag: 'Noun Conjunction', reason: 'some-of' },
  // of some sort
  { match: "of some sort", tag: "Conjunction Adjective Noun", reason: "of-some-sort" },
  // such skill
  { match: "[such] (a|an|is)? #Noun", group: 0, tag: "Determiner", reason: "such-skill" },
  // another one
  // { match: '[another] (#Noun|#Value)', group: 0, tag: 'Adjective', reason: 'another-one' },
  // right after
  { match: "[right] (before|after|in|into|to|toward)", group: 0, tag: "#Adverb", reason: "right-into" },
  // at about
  { match: "#Preposition [about]", group: 0, tag: "Adjective", reason: "at-about" },
  // are ya
  { match: "(are|#Modal|see|do|for) [ya]", group: 0, tag: "Pronoun", reason: "are-ya" },
  // long live
  { match: "[long live] .", group: 0, tag: "#Adjective #Infinitive", reason: "long-live" },
  // plenty of
  { match: "[plenty] of", group: 0, tag: "#Uncountable", reason: "plenty-of" },
  // 'there' as adjective
  { match: "(always|nearly|barely|practically) [there]", group: 0, tag: "Adjective", reason: "always-there" },
  // existential 'there'
  // there she is
  { match: "[there] (#Adverb|#Pronoun)? #Copula", group: 0, tag: "There", reason: "there-is" },
  // is there food
  { match: "#Copula [there] .", group: 0, tag: "There", reason: "is-there" },
  // should there
  { match: "#Modal #Adverb? [there]", group: 0, tag: "There", reason: "should-there" },
  // do you
  { match: "^[do] (you|we|they)", group: 0, tag: "QuestionWord", reason: "do-you" },
  // does he
  { match: "^[does] (he|she|it|#ProperNoun)", group: 0, tag: "QuestionWord", reason: "does-he" },
  // the person who
  { match: "#Determiner #Noun+ [who] #Verb", group: 0, tag: "Preposition", reason: "the-x-who" },
  // the person which
  { match: "#Determiner #Noun+ [which] #Verb", group: 0, tag: "Preposition", reason: "the-x-which" },
  // a while
  { match: "a [while]", group: 0, tag: "Noun", reason: "a-while" },
  // guess who
  { match: "guess who", tag: "#Infinitive #QuestionWord", reason: "guess-who" },
  // swear words
  { match: "[fucking] !#Verb", group: 0, tag: "#Gerund", reason: "f-as-gerund" }
];
const orgs = [
  // Foo University
  // { match: `#Noun ${orgMap}`, tag: 'Organization', safe: true, reason: 'foo-university' },
  // // University of Toronto
  // { match: `${orgMap} of #Place`, tag: 'Organization', safe: true, reason: 'university-of-foo' },
  // // foo regional health authority
  // { match: `${orgMap} (health|local|regional)+ authority`, tag: 'Organization', reason: 'regional-health' },
  // // foo stock exchange
  // { match: `${orgMap} (stock|mergantile)+ exchange`, tag: 'Organization', reason: 'stock-exchange' },
  // // foo news service
  // { match: `${orgMap} (daily|evening|local)+ news service?`, tag: 'Organization', reason: 'foo-news' },
  //University of Foo
  { match: "university of #Place", tag: "Organization", reason: "university-of-Foo" },
  //John & Joe's
  { match: "#Noun (&|n) #Noun", tag: "Organization", reason: "Noun-&-Noun" },
  // teachers union of Ontario
  { match: "#Organization of the? #ProperNoun", tag: "Organization", reason: "org-of-place", safe: true },
  //walmart USA
  { match: "#Organization #Country", tag: "Organization", reason: "org-country" },
  //organization
  { match: "#ProperNoun #Organization", tag: "Organization", notIf: "#FirstName", reason: "titlecase-org" },
  //FitBit Inc
  { match: "#ProperNoun (ltd|co|inc|dept|assn|bros)", tag: "Organization", reason: "org-abbrv" },
  // the OCED
  { match: "the [#Acronym]", group: 0, tag: "Organization", reason: "the-acronym", safe: true },
  // government of india
  { match: "government of the? [#Place+]", tag: "Organization", reason: "government-of-x" },
  // school board
  { match: "(health|school|commerce) board", tag: "Organization", reason: "school-board" },
  // special comittee
  {
    match: "(nominating|special|conference|executive|steering|central|congressional) committee",
    tag: "Organization",
    reason: "special-comittee"
  },
  // global trade union
  {
    match: "(world|global|international|national|#Demonym) #Organization",
    tag: "Organization",
    reason: "global-org"
  },
  // schools
  { match: "#Noun+ (public|private) school", tag: "School", reason: "noun-public-school" },
  // new york yankees
  { match: "#Place+ #SportsTeam", tag: "SportsTeam", reason: "place-sportsteam" },
  // 'manchester united'
  {
    match: "(dc|atlanta|minnesota|manchester|newcastle|sheffield) united",
    tag: "SportsTeam",
    reason: "united-sportsteam"
  },
  // 'toronto fc'
  { match: "#Place+ fc", tag: "SportsTeam", reason: "fc-sportsteam" },
  // baltimore quilting club
  {
    match: "#Place+ #Noun{0,2} (club|society|group|team|committee|commission|association|guild|crew)",
    tag: "Organization",
    reason: "place-noun-society"
  }
];
const places = [
  // ==== Region ====
  // West Norforlk
  { match: "(west|north|south|east|western|northern|southern|eastern)+ #Place", tag: "Region", reason: "west-norfolk" },
  //some us-state acronyms (exlude: al, in, la, mo, hi, me, md, ok..)
  {
    match: "#City [(al|ak|az|ar|ca|ct|dc|fl|ga|id|il|nv|nh|nj|ny|oh|pa|sc|tn|tx|ut|vt|pr)]",
    group: 0,
    tag: "Region",
    reason: "us-state"
  },
  // portland oregon
  { match: "portland [or]", group: 0, tag: "Region", reason: "portland-or" },
  //words removed from preTagger/placeWords
  {
    match: "#ProperNoun+ (cliff|place|range|pit|place|point|room|grounds|ruins)",
    tag: "Place",
    reason: "foo-point"
  },
  // in Foo California
  { match: "in [#ProperNoun] #Place", group: 0, tag: "Place", reason: "propernoun-place" },
  // Address
  {
    match: "#Value #Noun (st|street|rd|road|crescent|cr|way|tr|terrace|avenue|ave)",
    tag: "Address",
    reason: "address-st"
  },
  // port dover
  { match: "(port|mount|mt) #ProperName", tag: "Place", reason: "port-name" }
  // generic 'oak ridge' names
  // { match: '(oak|maple|spruce|pine|cedar|willow|green|sunset|sunrise) #Place', tag: 'Place', reason: 'tree-name' },
  // generic 'sunset view' names
  // { match: '() #Place', tag: 'Place', reason: 'tree-name' },
  // Sports Arenas and Complexs
  // {
  //   match:
  //     '(#Place+|#Place|#ProperNoun) (memorial|athletic|community|financial)? (sportsplex|stadium|sports centre|sports field|soccer complex|soccer centre|sports complex|civic centre|centre|arena|gardens|complex|coliseum|auditorium|place|building)',
  //   tag: 'Place',
  //   reason: 'sport-complex',
  // },
];
const conjunctions = [
  // ==== Conjunctions ====
  { match: "[so] #Noun", group: 0, tag: "Conjunction", reason: "so-conj" },
  //how he is driving
  {
    match: "[(who|what|where|why|how|when)] #Noun #Copula #Adverb? (#Verb|#Adjective)",
    group: 0,
    tag: "Conjunction",
    reason: "how-he-is-x"
  },
  // when he
  { match: "#Copula [(who|what|where|why|how|when)] #Noun", group: 0, tag: "Conjunction", reason: "when-he" },
  // says that he..
  { match: "#Verb [that] #Pronoun", group: 0, tag: "Conjunction", reason: "said-that-he" },
  // things that are required
  { match: "#Noun [that] #Copula", group: 0, tag: "Conjunction", reason: "that-are" },
  // things that seem cool
  { match: "#Noun [that] #Verb #Adjective", group: 0, tag: "Conjunction", reason: "that-seem" },
  // wasn't that wide..
  { match: "#Noun #Copula not? [that] #Adjective", group: 0, tag: "Adverb", reason: "that-adj" },
  // ==== Prepositions ====
  //all students
  { match: "#Verb #Adverb? #Noun [(that|which)]", group: 0, tag: "Preposition", reason: "that-prep" },
  //work, which has been done.
  { match: "@hasComma [which] (#Pronoun|#Verb)", group: 0, tag: "Preposition", reason: "which-copula" },
  //folks like her
  { match: "#Noun [like] #Noun", group: 0, tag: "Preposition", reason: "noun-like" },
  //like the time
  { match: "^[like] #Determiner", group: 0, tag: "Preposition", reason: "like-the" },
  //a day like this
  { match: "a #Noun [like] (#Noun|#Determiner)", group: 0, tag: "Preposition", reason: "a-noun-like" },
  // really like
  { match: "#Adverb [like]", group: 0, tag: "Verb", reason: "really-like" },
  // nothing like
  { match: "(not|nothing|never) [like]", group: 0, tag: "Preposition", reason: "nothing-like" },
  // treat them like
  { match: "#Infinitive #Pronoun [like]", group: 0, tag: "Preposition", reason: "treat-them-like" },
  // ==== Questions ====
  // where
  // why
  // when
  // who
  // whom
  // whose
  // what
  // which
  //the word 'how many'
  // { match: '^(how|which)', tag: 'QuestionWord', reason: 'how-question' },
  // how-he, when the
  { match: "[#QuestionWord] (#Pronoun|#Determiner)", group: 0, tag: "Preposition", reason: "how-he" },
  // when stolen
  { match: "[#QuestionWord] #Participle", group: 0, tag: "Preposition", reason: "when-stolen" },
  // how is
  { match: "[how] (#Determiner|#Copula|#Modal|#PastTense)", group: 0, tag: "QuestionWord", reason: "how-is" },
  // children who dance
  { match: "#Plural [(who|which|when)] .", group: 0, tag: "Preposition", reason: "people-who" }
];
const expressions = [
  //swear-words as non-expression POS
  { match: "holy (shit|fuck|hell)", tag: "Expression", reason: "swears-expression" },
  // well..
  { match: "^[(well|so|okay|now)] !#Adjective?", group: 0, tag: "Expression", reason: "well-" },
  // well..
  { match: "^come on", tag: "Expression", reason: "come-on" },
  // sorry
  { match: "(say|says|said) [sorry]", group: 0, tag: "Expression", reason: "say-sorry" },
  // ok,
  { match: "^(ok|alright|shoot|hell|anyways)", tag: "Expression", reason: "ok-" },
  // c'mon marge..
  // { match: '^[come on] #Noun', group: 0, tag: 'Expression', reason: 'come-on' },
  // say,
  { match: "^(say && @hasComma)", tag: "Expression", reason: "say-" },
  { match: "^(like && @hasComma)", tag: "Expression", reason: "like-" },
  // dude we should
  { match: "^[(dude|man|girl)] #Pronoun", group: 0, tag: "Expression", reason: "dude-i" }
];
const matches = [].concat(
  // order matters top-matches can get overwritten
  passive$1,
  adj,
  advAdj,
  gerundAdj,
  nounAdj,
  adv,
  ambigDates,
  dates,
  noun,
  gerundNouns,
  presNouns,
  money,
  fractions,
  numbers$1,
  person,
  personName,
  verbs$1,
  adjVerb,
  auxiliary,
  phrasal,
  imperative,
  adjGerund,
  matches$1,
  orgs,
  places,
  conjunctions,
  expressions
);
const model = {
  two: {
    matches
  }
};
let net$1 = null;
const postTagger = function(view) {
  const { world: world2 } = view;
  const { model: model2, methods: methods2 } = world2;
  net$1 = net$1 || methods2.one.buildNet(model2.two.matches, world2);
  const document = methods2.two.quickSplit(view.document);
  const ptrs = document.map((terms) => {
    const t2 = terms[0];
    return [t2.index[0], t2.index[1], t2.index[1] + terms.length];
  });
  const m2 = view.update(ptrs);
  m2.cache();
  m2.sweep(net$1);
  view.uncache();
  view.unfreeze();
  return view;
};
const tagger = (view) => view.compute(["freeze", "lexicon", "preTagger", "postTagger", "unfreeze"]);
const compute$1 = { postTagger, tagger };
const round$1 = (n2) => Math.round(n2 * 100) / 100;
function api$i(View2) {
  View2.prototype.confidence = function() {
    let sum = 0;
    let count = 0;
    this.docs.forEach((terms) => {
      terms.forEach((term) => {
        count += 1;
        sum += term.confidence || 1;
      });
    });
    if (count === 0) {
      return 1;
    }
    return round$1(sum / count);
  };
  View2.prototype.tagger = function() {
    return this.compute(["tagger"]);
  };
}
const plugin$2 = {
  api: api$i,
  compute: compute$1,
  model,
  hooks: ["postTagger"]
};
const getWords = function(net2) {
  return Object.keys(net2.hooks).filter((w) => !w.startsWith("#") && !w.startsWith("%"));
};
const maybeMatch = function(doc, net2) {
  const words2 = getWords(net2);
  if (words2.length === 0) {
    return doc;
  }
  if (!doc._cache) {
    doc.cache();
  }
  const cache2 = doc._cache;
  return doc.filter((_m, i2) => {
    return words2.some((str) => cache2[i2].has(str));
  });
};
const lazyParse = function(input, reg) {
  let net2 = reg;
  if (typeof reg === "string") {
    net2 = this.buildNet([{ match: reg }]);
  }
  const doc = this.tokenize(input);
  const m2 = maybeMatch(doc, net2);
  if (m2.found) {
    m2.compute(["index", "tagger"]);
    return m2.match(reg);
  }
  return doc.none();
};
const lazy = {
  lib: {
    lazy: lazyParse
  }
};
const matchVerb = function(m2, lemma) {
  const conjugate2 = m2.methods.two.transform.verb.conjugate;
  const all2 = conjugate2(lemma, m2.model);
  if (m2.has("#Gerund")) {
    return all2.Gerund;
  }
  if (m2.has("#PastTense")) {
    return all2.PastTense;
  }
  if (m2.has("#PresentTense")) {
    return all2.PresentTense;
  }
  if (m2.has("#Gerund")) {
    return all2.Gerund;
  }
  return lemma;
};
const swapVerb = function(vb2, lemma) {
  let str = lemma;
  vb2.forEach((m2) => {
    if (!m2.has("#Infinitive")) {
      str = matchVerb(m2, lemma);
    }
    m2.replaceWith(str);
  });
  return vb2;
};
const swapNoun = function(m2, lemma) {
  let str = lemma;
  if (m2.has("#Plural")) {
    const toPlural = m2.methods.two.transform.noun.toPlural;
    str = toPlural(lemma, m2.model);
  }
  m2.replaceWith(str, { possessives: true });
};
const swapAdverb = function(m2, lemma) {
  const { toAdverb: toAdverb2 } = m2.methods.two.transform.adjective;
  const str = lemma;
  const adv2 = toAdverb2(str);
  if (adv2) {
    m2.replaceWith(adv2);
  }
};
const swapAdjective = function(m2, lemma) {
  const { toComparative: toComparative2, toSuperlative: toSuperlative2 } = m2.methods.two.transform.adjective;
  let str = lemma;
  if (m2.has("#Comparative")) {
    str = toComparative2(str, m2.model);
  } else if (m2.has("#Superlative")) {
    str = toSuperlative2(str, m2.model);
  }
  if (str) {
    m2.replaceWith(str);
  }
};
const swap$1 = function(from, to, tag2) {
  let reg = from.split(/ /g).map((str) => str.toLowerCase().trim());
  reg = reg.filter((str) => str);
  reg = reg.map((str) => `{${str}}`).join(" ");
  let m2 = this.match(reg);
  if (tag2) {
    m2 = m2.if(tag2);
  }
  if (m2.has("#Verb")) {
    return swapVerb(m2, to);
  }
  if (m2.has("#Noun")) {
    return swapNoun(m2, to);
  }
  if (m2.has("#Adverb")) {
    return swapAdverb(m2, to);
  }
  if (m2.has("#Adjective")) {
    return swapAdjective(m2, to);
  }
  return this;
};
const api$h = function(View2) {
  View2.prototype.swap = swap$1;
};
const swap = {
  api: api$h
};
nlp.plugin(preTag);
nlp.plugin(contractionTwo);
nlp.plugin(plugin$2);
nlp.plugin(lazy);
nlp.plugin(swap);
const toRoot$1 = function(adj2) {
  const { fromComparative: fromComparative2, fromSuperlative: fromSuperlative2 } = adj2.methods.two.transform.adjective;
  const str = adj2.text("normal");
  if (adj2.has("#Comparative")) {
    return fromComparative2(str, adj2.model);
  }
  if (adj2.has("#Superlative")) {
    return fromSuperlative2(str, adj2.model);
  }
  return str;
};
const api$g = function(View2) {
  class Adjectives extends View2 {
    constructor(document, pointer, groups) {
      super(document, pointer, groups);
      this.viewType = "Adjectives";
    }
    json(opts2 = {}) {
      const { toAdverb: toAdverb2, toNoun: toNoun2, toSuperlative: toSuperlative2, toComparative: toComparative2 } = this.methods.two.transform.adjective;
      opts2.normal = true;
      return this.map((m2) => {
        const json = m2.toView().json(opts2)[0] || {};
        const str = toRoot$1(m2);
        json.adjective = {
          adverb: toAdverb2(str, this.model),
          noun: toNoun2(str, this.model),
          superlative: toSuperlative2(str, this.model),
          comparative: toComparative2(str, this.model)
        };
        return json;
      }, []);
    }
    adverbs() {
      return this.before("#Adverb+$").concat(this.after("^#Adverb+"));
    }
    conjugate(n2) {
      const { toComparative: toComparative2, toSuperlative: toSuperlative2, toNoun: toNoun2, toAdverb: toAdverb2 } = this.methods.two.transform.adjective;
      return this.getNth(n2).map((adj2) => {
        const root = toRoot$1(adj2);
        return {
          Adjective: root,
          Comparative: toComparative2(root, this.model),
          Superlative: toSuperlative2(root, this.model),
          Noun: toNoun2(root, this.model),
          Adverb: toAdverb2(root, this.model)
        };
      }, []);
    }
    toComparative(n2) {
      const { toComparative: toComparative2 } = this.methods.two.transform.adjective;
      return this.getNth(n2).map((adj2) => {
        const root = toRoot$1(adj2);
        const str = toComparative2(root, this.model);
        return adj2.replaceWith(str);
      });
    }
    toSuperlative(n2) {
      const { toSuperlative: toSuperlative2 } = this.methods.two.transform.adjective;
      return this.getNth(n2).map((adj2) => {
        const root = toRoot$1(adj2);
        const str = toSuperlative2(root, this.model);
        return adj2.replaceWith(str);
      });
    }
    toAdverb(n2) {
      const { toAdverb: toAdverb2 } = this.methods.two.transform.adjective;
      return this.getNth(n2).map((adj2) => {
        const root = toRoot$1(adj2);
        const str = toAdverb2(root, this.model);
        return adj2.replaceWith(str);
      });
    }
    toNoun(n2) {
      const { toNoun: toNoun2 } = this.methods.two.transform.adjective;
      return this.getNth(n2).map((adj2) => {
        const root = toRoot$1(adj2);
        const str = toNoun2(root, this.model);
        return adj2.replaceWith(str);
      });
    }
  }
  View2.prototype.adjectives = function(n2) {
    let m2 = this.match("#Adjective");
    m2 = m2.getNth(n2);
    return new Adjectives(m2.document, m2.pointer);
  };
  View2.prototype.superlatives = function(n2) {
    let m2 = this.match("#Superlative");
    m2 = m2.getNth(n2);
    return new Adjectives(m2.document, m2.pointer);
  };
  View2.prototype.comparatives = function(n2) {
    let m2 = this.match("#Comparative");
    m2 = m2.getNth(n2);
    return new Adjectives(m2.document, m2.pointer);
  };
};
const adjectives = { api: api$g };
const toRoot = function(adj2) {
  const str = adj2.compute("root").text("root");
  return str;
};
const api$f = function(View2) {
  class Adverbs extends View2 {
    constructor(document, pointer, groups) {
      super(document, pointer, groups);
      this.viewType = "Adverbs";
    }
    conjugate(n2) {
      return this.getNth(n2).map((adv2) => {
        const adj2 = toRoot(adv2);
        return {
          Adverb: adv2.text("normal"),
          Adjective: adj2
        };
      }, []);
    }
    json(opts2 = {}) {
      const fromAdverb = this.methods.two.transform.adjective.fromAdverb;
      opts2.normal = true;
      return this.map((m2) => {
        const json = m2.toView().json(opts2)[0] || {};
        json.adverb = {
          adjective: fromAdverb(json.normal)
        };
        return json;
      }, []);
    }
  }
  View2.prototype.adverbs = function(n2) {
    let m2 = this.match("#Adverb");
    m2 = m2.getNth(n2);
    return new Adverbs(m2.document, m2.pointer);
  };
};
const adverbs = { api: api$f };
const byComma = function(doc) {
  let commas = doc.match("@hasComma");
  commas = commas.filter((m2) => {
    if (m2.growLeft(".").wordCount() === 1) {
      return false;
    }
    if (m2.growRight(". .").wordCount() === 1) {
      return false;
    }
    let more = m2.grow(".");
    more = more.ifNo("@hasComma @hasComma");
    more = more.ifNo("@hasComma (and|or) .");
    more = more.ifNo("(#City && @hasComma) #Country");
    more = more.ifNo("(#WeekDay && @hasComma) #Date");
    more = more.ifNo("(#Date+ && @hasComma) #Value");
    more = more.ifNo("(#Adjective && @hasComma) #Adjective");
    return more.found;
  });
  return doc.splitAfter(commas);
};
const splitParentheses = function(doc) {
  let matches2 = doc.parentheses();
  matches2 = matches2.filter((m2) => {
    return m2.wordCount() >= 3 && m2.has("#Verb") && m2.has("#Noun");
  });
  return doc.splitOn(matches2);
};
const splitQuotes = function(doc) {
  let matches2 = doc.quotations();
  matches2 = matches2.filter((m2) => {
    return m2.wordCount() >= 3 && m2.has("#Verb") && m2.has("#Noun");
  });
  return doc.splitOn(matches2);
};
const clauses = function(n2) {
  let found = this;
  found = splitParentheses(found);
  found = splitQuotes(found);
  found = byComma(found);
  found = found.splitAfter("(@hasEllipses|@hasSemicolon|@hasDash|@hasColon)");
  found = found.splitAfter("^#Pronoun (said|says)");
  found = found.splitBefore("(said|says) #ProperNoun$");
  found = found.splitBefore(". . if .{4}");
  found = found.splitBefore("and while");
  found = found.splitBefore("now that");
  found = found.splitBefore("ever since");
  found = found.splitBefore("(supposing|although)");
  found = found.splitBefore("even (while|if|though)");
  found = found.splitBefore("(whereas|whose)");
  found = found.splitBefore("as (though|if)");
  found = found.splitBefore("(til|until)");
  const m2 = found.match("#Verb .* [but] .* #Verb", 0);
  if (m2.found) {
    found = found.splitBefore(m2);
  }
  const condition = found.if("if .{2,9} then .").match("then");
  found = found.splitBefore(condition);
  if (typeof n2 === "number") {
    found = found.get(n2);
  }
  return found;
};
const chunks = function(doc) {
  const all2 = [];
  let lastOne = null;
  const m2 = doc.clauses();
  m2.docs.forEach((terms) => {
    terms.forEach((term) => {
      if (!term.chunk || term.chunk !== lastOne) {
        lastOne = term.chunk;
        all2.push([term.index[0], term.index[1], term.index[1] + 1]);
      } else {
        all2[all2.length - 1][2] = term.index[1] + 1;
      }
    });
    lastOne = null;
  });
  const parts = doc.update(all2);
  return parts;
};
const api$e = function(View2) {
  class Chunks extends View2 {
    constructor(document, pointer, groups) {
      super(document, pointer, groups);
      this.viewType = "Chunks";
    }
    isVerb() {
      return this.filter((c2) => c2.has("<Verb>"));
    }
    isNoun() {
      return this.filter((c2) => c2.has("<Noun>"));
    }
    isAdjective() {
      return this.filter((c2) => c2.has("<Adjective>"));
    }
    isPivot() {
      return this.filter((c2) => c2.has("<Pivot>"));
    }
    // chunk-friendly debug
    debug() {
      this.toView().debug("chunks");
      return this;
    }
    // overloaded - keep Sentences class
    update(pointer) {
      const m2 = new Chunks(this.document, pointer);
      m2._cache = this._cache;
      return m2;
    }
  }
  View2.prototype.chunks = function(n2) {
    let m2 = chunks(this);
    m2 = m2.getNth(n2);
    return new Chunks(this.document, m2.pointer);
  };
  View2.prototype.clauses = clauses;
};
const byWord = {
  this: "Noun",
  then: "Pivot"
};
const easyMode = function(document) {
  for (let n2 = 0; n2 < document.length; n2 += 1) {
    for (let t2 = 0; t2 < document[n2].length; t2 += 1) {
      const term = document[n2][t2];
      if (byWord.hasOwnProperty(term.normal) === true) {
        term.chunk = byWord[term.normal];
        continue;
      }
      if (term.tags.has("Verb")) {
        term.chunk = "Verb";
        continue;
      }
      if (term.tags.has("Noun") || term.tags.has("Determiner")) {
        term.chunk = "Noun";
        continue;
      }
      if (term.tags.has("Value")) {
        term.chunk = "Noun";
        continue;
      }
      if (term.tags.has("QuestionWord")) {
        term.chunk = "Pivot";
        continue;
      }
    }
  }
};
const byNeighbour = function(document) {
  for (let n2 = 0; n2 < document.length; n2 += 1) {
    for (let t2 = 0; t2 < document[n2].length; t2 += 1) {
      const term = document[n2][t2];
      if (term.chunk) {
        continue;
      }
      const onRight = document[n2][t2 + 1];
      const onLeft = document[n2][t2 - 1];
      if (term.tags.has("Adjective")) {
        if (onLeft && onLeft.tags.has("Copula")) {
          term.chunk = "Adjective";
          continue;
        }
        if (onLeft && onLeft.tags.has("Determiner")) {
          term.chunk = "Noun";
          continue;
        }
        if (onRight && onRight.tags.has("Noun")) {
          term.chunk = "Noun";
          continue;
        }
        continue;
      }
      if (term.tags.has("Adverb") || term.tags.has("Negative")) {
        if (onLeft && onLeft.tags.has("Adjective")) {
          term.chunk = "Adjective";
          continue;
        }
        if (onLeft && onLeft.tags.has("Verb")) {
          term.chunk = "Verb";
          continue;
        }
        if (onRight && onRight.tags.has("Adjective")) {
          term.chunk = "Adjective";
          continue;
        }
        if (onRight && onRight.tags.has("Verb")) {
          term.chunk = "Verb";
          continue;
        }
      }
    }
  }
};
const rules = [
  // === Conjunction ===
  // that the houses
  { match: "[that] #Determiner #Noun", group: 0, chunk: "Pivot" },
  // estimated that
  { match: "#PastTense [that]", group: 0, chunk: "Pivot" },
  // so the
  { match: "[so] #Determiner", group: 0, chunk: "Pivot" },
  // === Adjective ===
  // was really nice
  { match: "#Copula #Adverb+? [#Adjective]", group: 0, chunk: "Adjective" },
  // was nice
  // { match: '#Copula [#Adjective]', group: 0, chunk: 'Adjective' },
  // nice and cool
  { match: "#Adjective and #Adjective", chunk: "Adjective" },
  // really nice
  // { match: '#Adverb+ #Adjective', chunk: 'Adjective' },
  // === Verb ===
  // quickly and suddenly run
  { match: "#Adverb+ and #Adverb #Verb", chunk: "Verb" },
  // sitting near
  { match: "#Gerund #Adjective$", chunk: "Verb" },
  // going to walk
  { match: "#Gerund to #Verb", chunk: "Verb" },
  // come and have a drink
  { match: "#PresentTense and #PresentTense", chunk: "Verb" },
  // really not
  { match: "#Adverb #Negative", chunk: "Verb" },
  // want to see
  { match: "(want|wants|wanted) to #Infinitive", chunk: "Verb" },
  // walk ourselves
  { match: "#Verb #Reflexive", chunk: "Verb" },
  // tell him the story
  // { match: '#PresentTense [#Pronoun] #Determiner', group: 0, chunk: 'Verb' },
  // tries to walk
  { match: "#Verb [to] #Adverb? #Infinitive", group: 0, chunk: "Verb" },
  // upon seeing
  { match: "[#Preposition] #Gerund", group: 0, chunk: "Verb" },
  // ensure that
  { match: "#Infinitive [that] <Noun>", group: 0, chunk: "Verb" },
  // === Noun ===
  // the brown fox
  // { match: '#Determiner #Adjective+ #Noun', chunk: 'Noun' },
  // the fox
  // { match: '(the|this) <Noun>', chunk: 'Noun' },
  // brown fox
  // { match: '#Adjective+ <Noun>', chunk: 'Noun' },
  // --- of ---
  // son of a gun
  { match: "#Noun of #Determiner? #Noun", chunk: "Noun" },
  // 3 beautiful women
  { match: "#Value+ #Adverb? #Adjective", chunk: "Noun" },
  // the last russian tsar
  { match: "the [#Adjective] #Noun", chunk: "Noun" },
  // breakfast in bed
  { match: "#Singular in #Determiner? #Singular", chunk: "Noun" },
  // Some citizens in this Canadian capital
  { match: "#Plural [in] #Determiner? #Noun", group: 0, chunk: "Pivot" },
  // indoor and outdoor seating
  { match: "#Noun and #Determiner? #Noun", notIf: "(#Possessive|#Pronoun)", chunk: "Noun" }
  //  boys and girls
  // { match: '#Plural and #Determiner? #Plural', chunk: 'Noun' },
  // tomatoes and cheese
  // { match: '#Noun and #Determiner? #Noun', notIf: '#Pronoun', chunk: 'Noun' },
  // that is why
  // { match: '[that] (is|was)', group: 0, chunk: 'Noun' },
];
let net = null;
const matcher = function(view, _2, world2) {
  const { methods: methods2 } = world2;
  net = net || methods2.one.buildNet(rules, world2);
  view.sweep(net);
};
var define_process_env_default = {};
const setChunk = function(term, chunk) {
  const env2 = typeof process === "undefined" || !define_process_env_default ? self.env || {} : define_process_env_default;
  if (env2.DEBUG_CHUNKS) {
    const str = (term.normal + "'").padEnd(8);
    console.log(`  | '${str}  →  \x1B[34m${chunk.padEnd(12)}\x1B[0m \x1B[2m -fallback- \x1B[0m`);
  }
  term.chunk = chunk;
};
const fallback = function(document) {
  for (let n2 = 0; n2 < document.length; n2 += 1) {
    for (let t2 = 0; t2 < document[n2].length; t2 += 1) {
      const term = document[n2][t2];
      if (term.chunk === void 0) {
        if (term.tags.has("Conjunction")) {
          setChunk(term, "Pivot");
        } else if (term.tags.has("Preposition")) {
          setChunk(term, "Pivot");
        } else if (term.tags.has("Adverb")) {
          setChunk(term, "Verb");
        } else {
          term.chunk = "Noun";
        }
      }
    }
  }
};
const fixUp = function(docs) {
  const byChunk = [];
  let current = null;
  docs.forEach((terms) => {
    for (let i2 = 0; i2 < terms.length; i2 += 1) {
      const term = terms[i2];
      if (current && term.chunk === current) {
        byChunk[byChunk.length - 1].terms.push(term);
      } else {
        byChunk.push({ chunk: term.chunk, terms: [term] });
        current = term.chunk;
      }
    }
  });
  byChunk.forEach((c2) => {
    if (c2.chunk === "Verb") {
      const hasVerb = c2.terms.find((t2) => t2.tags.has("Verb"));
      if (!hasVerb) {
        c2.terms.forEach((t2) => t2.chunk = null);
      }
    }
  });
};
const findChunks = function(view) {
  const { document, world: world2 } = view;
  easyMode(document);
  byNeighbour(document);
  matcher(view, document, world2);
  fallback(document);
  fixUp(document);
};
const compute = { chunks: findChunks };
const chunker = {
  compute,
  api: api$e,
  hooks: ["chunks"]
};
const hasPeriod = /\./g;
const api$d = function(View2) {
  class Acronyms extends View2 {
    constructor(document, pointer, groups) {
      super(document, pointer, groups);
      this.viewType = "Acronyms";
    }
    strip() {
      this.docs.forEach((terms) => {
        terms.forEach((term) => {
          term.text = term.text.replace(hasPeriod, "");
          term.normal = term.normal.replace(hasPeriod, "");
        });
      });
      return this;
    }
    addPeriods() {
      this.docs.forEach((terms) => {
        terms.forEach((term) => {
          term.text = term.text.replace(hasPeriod, "");
          term.normal = term.normal.replace(hasPeriod, "");
          term.text = term.text.split("").join(".") + ".";
          term.normal = term.normal.split("").join(".") + ".";
        });
      });
      return this;
    }
  }
  View2.prototype.acronyms = function(n2) {
    let m2 = this.match("#Acronym");
    m2 = m2.getNth(n2);
    return new Acronyms(m2.document, m2.pointer);
  };
};
const hasOpen$1 = /\(/;
const hasClosed$1 = /\)/;
const findEnd$1 = function(terms, i2) {
  for (; i2 < terms.length; i2 += 1) {
    if (terms[i2].post && hasClosed$1.test(terms[i2].post)) {
      let [, index2] = terms[i2].index;
      index2 = index2 || 0;
      return index2;
    }
  }
  return null;
};
const find$5 = function(doc) {
  const ptrs = [];
  doc.docs.forEach((terms) => {
    for (let i2 = 0; i2 < terms.length; i2 += 1) {
      const term = terms[i2];
      if (term.pre && hasOpen$1.test(term.pre)) {
        const end2 = findEnd$1(terms, i2);
        if (end2 !== null) {
          const [n2, start2] = terms[i2].index;
          ptrs.push([n2, start2, end2 + 1, terms[i2].id]);
          i2 = end2;
        }
      }
    }
  });
  return doc.update(ptrs);
};
const strip$1 = function(m2) {
  m2.docs.forEach((terms) => {
    terms[0].pre = terms[0].pre.replace(hasOpen$1, "");
    const last = terms[terms.length - 1];
    last.post = last.post.replace(hasClosed$1, "");
  });
  return m2;
};
const api$c = function(View2) {
  class Parentheses extends View2 {
    constructor(document, pointer, groups) {
      super(document, pointer, groups);
      this.viewType = "Possessives";
    }
    strip() {
      return strip$1(this);
    }
  }
  View2.prototype.parentheses = function(n2) {
    let m2 = find$5(this);
    m2 = m2.getNth(n2);
    return new Parentheses(m2.document, m2.pointer);
  };
};
const apostropheS = /'s$/;
const find$4 = function(doc) {
  let m2 = doc.match("#Possessive+");
  if (m2.has("#Person")) {
    m2 = m2.growLeft("#Person+");
  }
  if (m2.has("#Place")) {
    m2 = m2.growLeft("#Place+");
  }
  if (m2.has("#Organization")) {
    m2 = m2.growLeft("#Organization+");
  }
  return m2;
};
const api$b = function(View2) {
  class Possessives extends View2 {
    constructor(document, pointer, groups) {
      super(document, pointer, groups);
      this.viewType = "Possessives";
    }
    strip() {
      this.docs.forEach((terms) => {
        terms.forEach((term) => {
          term.text = term.text.replace(apostropheS, "");
          term.normal = term.normal.replace(apostropheS, "");
        });
      });
      return this;
    }
  }
  View2.prototype.possessives = function(n2) {
    let m2 = find$4(this);
    m2 = m2.getNth(n2);
    return new Possessives(m2.document, m2.pointer);
  };
};
const pairs = {
  '"': '"',
  // 'StraightDoubleQuotes'
  "＂": "＂",
  // 'StraightDoubleQuotesWide'
  "'": "'",
  // 'StraightSingleQuotes'
  "“": "”",
  // 'CommaDoubleQuotes'
  "‘": "’",
  // 'CommaSingleQuotes'
  "‟": "”",
  // 'CurlyDoubleQuotesReversed'
  "‛": "’",
  // 'CurlySingleQuotesReversed'
  "„": "”",
  // 'LowCurlyDoubleQuotes'
  "⹂": "”",
  // 'LowCurlyDoubleQuotesReversed'
  "‚": "’",
  // 'LowCurlySingleQuotes'
  "«": "»",
  // 'AngleDoubleQuotes' «, »
  "‹": "›",
  // 'AngleSingleQuotes'
  // Prime 'non quotation'
  "‵": "′",
  // 'PrimeSingleQuotes'
  "‶": "″",
  // 'PrimeDoubleQuotes'
  "‷": "‴",
  // 'PrimeTripleQuotes'
  // Prime 'quotation' variation
  "〝": "〞",
  // 'PrimeDoubleQuotes'
  "`": "´",
  // 'PrimeSingleQuotes'
  "〟": "〞"
  // 'LowPrimeDoubleQuotesReversed'
};
const hasOpen = RegExp("[" + Object.keys(pairs).join("") + "]");
const hasClosed = RegExp("[" + Object.values(pairs).join("") + "]");
const findEnd = function(terms, i2) {
  const have = terms[i2].pre.match(hasOpen)[0] || "";
  if (!have || !pairs[have]) {
    return null;
  }
  const want = pairs[have];
  for (; i2 < terms.length; i2 += 1) {
    if (terms[i2].post && terms[i2].post.match(want)) {
      return i2;
    }
  }
  return null;
};
const find$3 = function(doc) {
  const ptrs = [];
  doc.docs.forEach((terms) => {
    for (let i2 = 0; i2 < terms.length; i2 += 1) {
      const term = terms[i2];
      if (term.pre && hasOpen.test(term.pre)) {
        const end2 = findEnd(terms, i2);
        if (end2 !== null) {
          const [n2, start2] = terms[i2].index;
          ptrs.push([n2, start2, end2 + 1, terms[i2].id]);
          i2 = end2;
        }
      }
    }
  });
  return doc.update(ptrs);
};
const strip = function(m2) {
  m2.docs.forEach((terms) => {
    terms[0].pre = terms[0].pre.replace(hasOpen, "");
    const lastTerm = terms[terms.length - 1];
    lastTerm.post = lastTerm.post.replace(hasClosed, "");
  });
};
const api$a = function(View2) {
  class Quotations extends View2 {
    constructor(document, pointer, groups) {
      super(document, pointer, groups);
      this.viewType = "Possessives";
    }
    strip() {
      return strip(this);
    }
  }
  View2.prototype.quotations = function(n2) {
    let m2 = find$3(this);
    m2 = m2.getNth(n2);
    return new Quotations(m2.document, m2.pointer);
  };
};
const phoneNumbers = function(n2) {
  let m2 = this.splitAfter("@hasComma");
  m2 = m2.match("#PhoneNumber+");
  m2 = m2.getNth(n2);
  return m2;
};
const selections = [
  ["hyphenated", "@hasHyphen ."],
  ["hashTags", "#HashTag"],
  ["emails", "#Email"],
  ["emoji", "#Emoji"],
  ["emoticons", "#Emoticon"],
  ["atMentions", "#AtMention"],
  ["urls", "#Url"],
  // ['pronouns', '#Pronoun'],
  ["conjunctions", "#Conjunction"],
  ["prepositions", "#Preposition"],
  ["abbreviations", "#Abbreviation"],
  ["honorifics", "#Honorific"]
];
const aliases = [
  ["emojis", "emoji"],
  ["atmentions", "atMentions"]
];
const addMethods = function(View2) {
  selections.forEach((a2) => {
    View2.prototype[a2[0]] = function(n2) {
      const m2 = this.match(a2[1]);
      return typeof n2 === "number" ? m2.get(n2) : m2;
    };
  });
  View2.prototype.phoneNumbers = phoneNumbers;
  aliases.forEach((a2) => {
    View2.prototype[a2[0]] = View2.prototype[a2[1]];
  });
};
const hasSlash = /\//;
const api$9 = function(View2) {
  class Slashes extends View2 {
    constructor(document, pointer, groups) {
      super(document, pointer, groups);
      this.viewType = "Slashes";
    }
    split() {
      return this.map((m2) => {
        const str = m2.text();
        const arr = str.split(hasSlash);
        m2 = m2.replaceWith(arr.join(" "));
        return m2.growRight("(" + arr.join("|") + ")+");
      });
    }
  }
  View2.prototype.slashes = function(n2) {
    let m2 = this.match("#SlashedTerm");
    m2 = m2.getNth(n2);
    return new Slashes(m2.document, m2.pointer);
  };
};
const misc = {
  api: function(View2) {
    api$d(View2);
    api$c(View2);
    api$b(View2);
    api$a(View2);
    addMethods(View2);
    api$9(View2);
  }
};
const termLoop = function(view, cb) {
  view.docs.forEach((terms) => {
    terms.forEach(cb);
  });
};
const methods = {
  // remove titlecasing, uppercase
  "case": (doc) => {
    termLoop(doc, (term) => {
      term.text = term.text.toLowerCase();
    });
  },
  // visually romanize/anglicize 'Björk' into 'Bjork'.
  "unicode": (doc) => {
    const world2 = doc.world;
    const killUnicode2 = world2.methods.one.killUnicode;
    termLoop(doc, (term) => term.text = killUnicode2(term.text, world2));
  },
  // remove hyphens, newlines, and force one space between words
  "whitespace": (doc) => {
    termLoop(doc, (term) => {
      term.post = term.post.replace(/\s+/g, " ");
      term.post = term.post.replace(/\s([.,?!:;])/g, "$1");
      term.pre = term.pre.replace(/\s+/g, "");
    });
  },
  // remove commas, semicolons - but keep sentence-ending punctuation
  "punctuation": (doc) => {
    termLoop(doc, (term) => {
      term.post = term.post.replace(/[–—-]/g, " ");
      term.post = term.post.replace(/[,:;]/g, "");
      term.post = term.post.replace(/\.{2,}/g, "");
      term.post = term.post.replace(/\?{2,}/g, "?");
      term.post = term.post.replace(/!{2,}/g, "!");
      term.post = term.post.replace(/\?!+/g, "?");
    });
    const docs = doc.docs;
    const terms = docs[docs.length - 1];
    if (terms && terms.length > 0) {
      const lastTerm = terms[terms.length - 1];
      lastTerm.post = lastTerm.post.replace(/ /g, "");
    }
  },
  // ====== subsets ===
  // turn "isn't" to "is not"
  "contractions": (doc) => {
    doc.contractions().expand();
  },
  //remove periods from acronyms, like 'F.B.I.'
  "acronyms": (doc) => {
    doc.acronyms().strip();
  },
  //remove words inside brackets (like these)
  "parentheses": (doc) => {
    doc.parentheses().strip();
  },
  // turn "Google's tax return" to "Google tax return"
  "possessives": (doc) => {
    doc.possessives().strip();
  },
  // turn "tax return" to tax return
  "quotations": (doc) => {
    doc.quotations().strip();
  },
  // remove them
  "emoji": (doc) => {
    doc.emojis().remove();
  },
  //turn 'Vice Admiral John Smith' to 'John Smith'
  "honorifics": (doc) => {
    doc.match("#Honorific+ #Person").honorifics().remove();
  },
  // remove needless adverbs
  "adverbs": (doc) => {
    doc.adverbs().remove();
  },
  // turn "batmobiles" into "batmobile"
  "nouns": (doc) => {
    doc.nouns().toSingular();
  },
  // turn all verbs into Infinitive form - "I walked" → "I walk"
  "verbs": (doc) => {
    doc.verbs().toInfinitive();
  },
  // turn "fifty" into "50"
  "numbers": (doc) => {
    doc.numbers().toNumber();
  },
  /** remove bullets from beginning of phrase */
  "debullet": (doc) => {
    const hasBullet = /^\s*([-–—*•])\s*$/;
    doc.docs.forEach((terms) => {
      if (hasBullet.test(terms[0].pre)) {
        terms[0].pre = terms[0].pre.replace(hasBullet, "");
      }
    });
    return doc;
  }
};
const split = (str) => {
  return str.split("|").reduce((h2, k2) => {
    h2[k2] = true;
    return h2;
  }, {});
};
const light = "unicode|punctuation|whitespace|acronyms";
const medium = "|case|contractions|parentheses|quotations|emoji|honorifics|debullet";
const heavy = "|possessives|adverbs|nouns|verbs";
const presets = {
  light: split(light),
  medium: split(light + medium),
  heavy: split(light + medium + heavy)
};
function api$8(View2) {
  View2.prototype.normalize = function(opts2 = "light") {
    if (typeof opts2 === "string") {
      opts2 = presets[opts2];
    }
    Object.keys(opts2).forEach((fn) => {
      if (methods.hasOwnProperty(fn)) {
        methods[fn](this, opts2[fn]);
      }
    });
    return this;
  };
}
const normalize = {
  api: api$8
};
const findNouns = function(doc) {
  let m2 = doc.clauses().match("<Noun>");
  let commas = m2.match("@hasComma");
  commas = commas.not("#Place");
  if (commas.found) {
    m2 = m2.splitAfter(commas);
  }
  m2 = m2.splitOn("#Expression");
  m2 = m2.splitOn("(he|she|we|you|they|i)");
  m2 = m2.splitOn("(#Noun|#Adjective) [(he|him|she|it)]", 0);
  m2 = m2.splitOn("[(he|him|she|it)] (#Determiner|#Value)", 0);
  m2 = m2.splitBefore("#Noun [(the|a|an)] #Adjective? #Noun", 0);
  m2 = m2.splitOn("[(here|there)] #Noun", 0);
  m2 = m2.splitOn("[#Noun] (here|there)", 0);
  m2 = m2.splitBefore("(our|my|their|your)");
  m2 = m2.splitOn("#Noun [#Determiner]", 0);
  m2 = m2.if("#Noun");
  return m2;
};
const list$1 = [
  "after",
  "although",
  "as if",
  "as long as",
  "as",
  "because",
  "before",
  "even if",
  "even though",
  "ever since",
  "if",
  "in order that",
  "provided that",
  "since",
  "so that",
  "than",
  "that",
  "though",
  "unless",
  "until",
  "what",
  "whatever",
  "when",
  "whenever",
  "where",
  "whereas",
  "wherever",
  "whether",
  "which",
  "whichever",
  "who",
  "whoever",
  "whom",
  "whomever",
  "whose"
];
const isSubordinate = function(m2) {
  if (m2.before("#Preposition$").found) {
    return true;
  }
  const leadIn = m2.before();
  if (!leadIn.found) {
    return false;
  }
  for (let i2 = 0; i2 < list$1.length; i2 += 1) {
    if (m2.has(list$1[i2])) {
      return true;
    }
  }
  return false;
};
const notPlural = "(#Pronoun|#Place|#Value|#Person|#Uncountable|#Month|#WeekDay|#Holiday|#Possessive)";
const isPlural$2 = function(m2, root) {
  if (m2.has("#Plural")) {
    return true;
  }
  if (m2.has("#Noun and #Noun")) {
    return true;
  }
  if (m2.has("(we|they)")) {
    return true;
  }
  if (root.has(notPlural) === true) {
    return false;
  }
  if (m2.has("#Singular")) {
    return false;
  }
  const str = root.text("normal");
  return str.length > 3 && str.endsWith("s") && !str.endsWith("ss");
};
const getRoot = function(m2) {
  let tmp = m2.clone();
  tmp = tmp.match("#Noun+");
  tmp = tmp.remove("(#Adjective|#Preposition|#Determiner|#Value)");
  tmp = tmp.not("#Possessive");
  tmp = tmp.first();
  if (!tmp.found) {
    return m2;
  }
  return tmp;
};
const parseNoun = function(m2) {
  const root = getRoot(m2);
  return {
    determiner: m2.match("#Determiner").eq(0),
    adjectives: m2.match("#Adjective"),
    number: m2.values(),
    isPlural: isPlural$2(m2, root),
    isSubordinate: isSubordinate(m2),
    root
  };
};
const toText$2 = (m2) => m2.text();
const toArray$1 = (m2) => m2.json({ terms: false, normal: true }).map((s2) => s2.normal);
const getNum = function(m2) {
  const num = null;
  if (!m2.found) {
    return num;
  }
  const val = m2.values(0);
  if (val.found) {
    const obj = val.parse()[0] || {};
    return obj.num;
  }
  return num;
};
const toJSON$1 = function(m2) {
  const res = parseNoun(m2);
  return {
    root: toText$2(res.root),
    number: getNum(res.number),
    determiner: toText$2(res.determiner),
    adjectives: toArray$1(res.adjectives),
    isPlural: res.isPlural,
    isSubordinate: res.isSubordinate
  };
};
const hasPlural = function(root) {
  if (root.has("^(#Uncountable|#ProperNoun|#Place|#Pronoun|#Acronym)+$")) {
    return false;
  }
  return true;
};
const keep$7 = { tags: true };
const nounToPlural = function(m2, parsed) {
  if (parsed.isPlural === true) {
    return m2;
  }
  if (parsed.root.has("#Possessive")) {
    parsed.root = parsed.root.possessives().strip();
  }
  if (!hasPlural(parsed.root)) {
    return m2;
  }
  const { methods: methods2, model: model2 } = m2.world;
  const { toPlural } = methods2.two.transform.noun;
  const str = parsed.root.text({ keepPunct: false });
  const plural2 = toPlural(str, model2);
  m2.match(parsed.root).replaceWith(plural2, keep$7).tag("Plural", "toPlural");
  if (parsed.determiner.has("(a|an)")) {
    m2.remove(parsed.determiner);
  }
  const copula = parsed.root.after("not? #Adverb+? [#Copula]", 0);
  if (copula.found) {
    if (copula.has("is")) {
      m2.replace(copula, "are");
    } else if (copula.has("was")) {
      m2.replace(copula, "were");
    }
  }
  return m2;
};
const keep$6 = { tags: true };
const nounToSingular = function(m2, parsed) {
  if (parsed.isPlural === false) {
    return m2;
  }
  const { methods: methods2, model: model2 } = m2.world;
  const { toSingular: toSingular2 } = methods2.two.transform.noun;
  const str = parsed.root.text("normal");
  const single = toSingular2(str, model2);
  m2.replace(parsed.root, single, keep$6).tag("Singular", "toPlural");
  return m2;
};
const api$7 = function(View2) {
  class Nouns extends View2 {
    constructor(document, pointer, groups) {
      super(document, pointer, groups);
      this.viewType = "Nouns";
    }
    parse(n2) {
      return this.getNth(n2).map(parseNoun);
    }
    json(n2) {
      const opts2 = typeof n2 === "object" ? n2 : {};
      return this.getNth(n2).map((m2) => {
        const json = m2.toView().json(opts2)[0] || {};
        if (opts2 && opts2.noun !== false) {
          json.noun = toJSON$1(m2);
        }
        return json;
      }, []);
    }
    conjugate(n2) {
      const methods2 = this.world.methods.two.transform.noun;
      return this.getNth(n2).map((m2) => {
        const parsed = parseNoun(m2);
        const root = parsed.root.compute("root").text("root");
        const res = {
          Singular: root
        };
        if (hasPlural(parsed.root)) {
          res.Plural = methods2.toPlural(root, this.model);
        }
        if (res.Singular === res.Plural) {
          delete res.Plural;
        }
        return res;
      }, []);
    }
    isPlural(n2) {
      const res = this.filter((m2) => parseNoun(m2).isPlural);
      return res.getNth(n2);
    }
    isSingular(n2) {
      const res = this.filter((m2) => !parseNoun(m2).isPlural);
      return res.getNth(n2);
    }
    adjectives(n2) {
      let res = this.update([]);
      this.forEach((m2) => {
        const adj2 = parseNoun(m2).adjectives;
        if (adj2.found) {
          res = res.concat(adj2);
        }
      });
      return res.getNth(n2);
    }
    toPlural(n2) {
      return this.getNth(n2).map((m2) => {
        return nounToPlural(m2, parseNoun(m2));
      });
    }
    toSingular(n2) {
      return this.getNth(n2).map((m2) => {
        const res = parseNoun(m2);
        return nounToSingular(m2, res);
      });
    }
    // create a new View, from this one
    update(pointer) {
      const m2 = new Nouns(this.document, pointer);
      m2._cache = this._cache;
      return m2;
    }
  }
  View2.prototype.nouns = function(n2) {
    let m2 = findNouns(this);
    m2 = m2.getNth(n2);
    return new Nouns(this.document, m2.pointer);
  };
};
const nouns = {
  api: api$7
};
const findFractions = function(doc, n2) {
  let m2 = doc.match("#Fraction+");
  m2 = m2.filter((r2) => {
    return !r2.lookBehind("#Value and$").found;
  });
  m2 = m2.notIf("#Value seconds");
  return m2;
};
const findModifiers = (str) => {
  const mults = [
    {
      reg: /^(minus|negative)[\s-]/i,
      mult: -1
    },
    {
      reg: /^(a\s)?half[\s-](of\s)?/i,
      mult: 0.5
    }
    //  {
    //   reg: /^(a\s)?quarter[\s\-]/i,
    //   mult: 0.25
    // }
  ];
  for (let i2 = 0; i2 < mults.length; i2++) {
    if (mults[i2].reg.test(str) === true) {
      return {
        amount: mults[i2].mult,
        str: str.replace(mults[i2].reg, "")
      };
    }
  }
  return {
    amount: 1,
    str
  };
};
const words = {
  ones: {
    zeroth: 0,
    first: 1,
    second: 2,
    third: 3,
    fourth: 4,
    fifth: 5,
    sixth: 6,
    seventh: 7,
    eighth: 8,
    ninth: 9,
    zero: 0,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9
  },
  teens: {
    tenth: 10,
    eleventh: 11,
    twelfth: 12,
    thirteenth: 13,
    fourteenth: 14,
    fifteenth: 15,
    sixteenth: 16,
    seventeenth: 17,
    eighteenth: 18,
    nineteenth: 19,
    ten: 10,
    eleven: 11,
    twelve: 12,
    thirteen: 13,
    fourteen: 14,
    fifteen: 15,
    sixteen: 16,
    seventeen: 17,
    eighteen: 18,
    nineteen: 19
  },
  tens: {
    twentieth: 20,
    thirtieth: 30,
    fortieth: 40,
    fourtieth: 40,
    fiftieth: 50,
    sixtieth: 60,
    seventieth: 70,
    eightieth: 80,
    ninetieth: 90,
    twenty: 20,
    thirty: 30,
    forty: 40,
    fourty: 40,
    fifty: 50,
    sixty: 60,
    seventy: 70,
    eighty: 80,
    ninety: 90
  },
  multiples: {
    hundredth: 100,
    thousandth: 1e3,
    millionth: 1e6,
    billionth: 1e9,
    trillionth: 1e12,
    quadrillionth: 1e15,
    quintillionth: 1e18,
    sextillionth: 1e21,
    septillionth: 1e24,
    hundred: 100,
    thousand: 1e3,
    million: 1e6,
    billion: 1e9,
    trillion: 1e12,
    quadrillion: 1e15,
    quintillion: 1e18,
    sextillion: 1e21,
    septillion: 1e24,
    grand: 1e3
  }
};
const isValid = (w, has2) => {
  if (words.ones.hasOwnProperty(w)) {
    if (has2.ones || has2.teens) {
      return false;
    }
  } else if (words.teens.hasOwnProperty(w)) {
    if (has2.ones || has2.teens || has2.tens) {
      return false;
    }
  } else if (words.tens.hasOwnProperty(w)) {
    if (has2.ones || has2.teens || has2.tens) {
      return false;
    }
  }
  return true;
};
const parseDecimals = function(arr) {
  let str = "0.";
  for (let i2 = 0; i2 < arr.length; i2++) {
    const w = arr[i2];
    if (words.ones.hasOwnProperty(w) === true) {
      str += words.ones[w];
    } else if (words.teens.hasOwnProperty(w) === true) {
      str += words.teens[w];
    } else if (words.tens.hasOwnProperty(w) === true) {
      str += words.tens[w];
    } else if (/^[0-9]$/.test(w) === true) {
      str += w;
    } else {
      return 0;
    }
  }
  return parseFloat(str);
};
const parseNumeric$1 = (str) => {
  str = str.replace(/1st$/, "1");
  str = str.replace(/2nd$/, "2");
  str = str.replace(/3rd$/, "3");
  str = str.replace(/([4567890])r?th$/, "$1");
  str = str.replace(/^[$€¥£¢]/, "");
  str = str.replace(/[%$€¥£¢]$/, "");
  str = str.replace(/,/g, "");
  str = str.replace(/([0-9])([a-z\u00C0-\u00FF]{1,2})$/, "$1");
  return str;
};
const improperFraction = /^([0-9,. ]+)\/([0-9,. ]+)$/;
const casualForms = {
  "a few": 3,
  "a couple": 2,
  "a dozen": 12,
  "two dozen": 24,
  zero: 0
};
const section_sum = (obj) => {
  return Object.keys(obj).reduce((sum, k2) => {
    sum += obj[k2];
    return sum;
  }, 0);
};
const parse$2 = function(str) {
  if (casualForms.hasOwnProperty(str) === true) {
    return casualForms[str];
  }
  if (str === "a" || str === "an") {
    return 1;
  }
  const modifier = findModifiers(str);
  str = modifier.str;
  let last_mult = null;
  let has2 = {};
  let sum = 0;
  let isNegative = false;
  const terms = str.split(/[ -]/);
  for (let i2 = 0; i2 < terms.length; i2++) {
    let w = terms[i2];
    w = parseNumeric$1(w);
    if (!w || w === "and") {
      continue;
    }
    if (w === "-" || w === "negative") {
      isNegative = true;
      continue;
    }
    if (w.charAt(0) === "-") {
      isNegative = true;
      w = w.substring(1);
    }
    if (w === "point") {
      sum += section_sum(has2);
      sum += parseDecimals(terms.slice(i2 + 1, terms.length));
      sum *= modifier.amount;
      return sum;
    }
    const fm = w.match(improperFraction);
    if (fm) {
      const num = parseFloat(fm[1].replace(/[, ]/g, ""));
      const denom = parseFloat(fm[2].replace(/[, ]/g, ""));
      if (denom) {
        sum += num / denom || 0;
      }
      continue;
    }
    if (words.tens.hasOwnProperty(w)) {
      if (has2.ones && Object.keys(has2).length === 1) {
        sum = has2.ones * 100;
        has2 = {};
      }
    }
    if (isValid(w, has2) === false) {
      return null;
    }
    if (/^[0-9.]+$/.test(w)) {
      has2.ones = parseFloat(w);
    } else if (words.ones.hasOwnProperty(w) === true) {
      has2.ones = words.ones[w];
    } else if (words.teens.hasOwnProperty(w) === true) {
      has2.teens = words.teens[w];
    } else if (words.tens.hasOwnProperty(w) === true) {
      has2.tens = words.tens[w];
    } else if (words.multiples.hasOwnProperty(w) === true) {
      let mult = words.multiples[w];
      if (mult === last_mult) {
        return null;
      }
      if (mult === 100 && terms[i2 + 1] !== void 0) {
        const w2 = terms[i2 + 1];
        if (words.multiples[w2]) {
          mult *= words.multiples[w2];
          i2 += 1;
        }
      }
      if (last_mult === null || mult < last_mult) {
        sum += (section_sum(has2) || 1) * mult;
        last_mult = mult;
        has2 = {};
      } else {
        sum += section_sum(has2);
        last_mult = mult;
        sum = (sum || 1) * mult;
        has2 = {};
      }
    }
  }
  sum += section_sum(has2);
  sum *= modifier.amount;
  sum *= isNegative ? -1 : 1;
  if (sum === 0 && Object.keys(has2).length === 0) {
    return null;
  }
  return sum;
};
const endS = /s$/;
const parseNumber$1 = function(m2) {
  const str = m2.text("reduced");
  return parse$2(str);
};
const mapping = {
  half: 2,
  halve: 2,
  quarter: 4
};
const slashForm = function(m2) {
  const str = m2.text("reduced");
  const found = str.match(/^([-+]?[0-9]+)\/([-+]?[0-9]+)(st|nd|rd|th)?s?$/);
  if (found && found[1] && found[0]) {
    return {
      numerator: Number(found[1]),
      denominator: Number(found[2])
    };
  }
  return null;
};
const nOutOfN = function(m2) {
  const found = m2.match("[<num>#Value+] out of every? [<den>#Value+]");
  if (found.found !== true) {
    return null;
  }
  let { num, den } = found.groups();
  if (!num || !den) {
    return null;
  }
  num = parseNumber$1(num);
  den = parseNumber$1(den);
  if (!num || !den) {
    return null;
  }
  if (typeof num === "number" && typeof den === "number") {
    return {
      numerator: num,
      denominator: den
    };
  }
  return null;
};
const nOrinalth = function(m2) {
  const found = m2.match("[<num>(#Cardinal|a)+] [<den>#Fraction+]");
  if (found.found !== true) {
    return null;
  }
  let { num, den } = found.groups();
  if (num.has("a")) {
    num = 1;
  } else {
    num = parseNumber$1(num);
  }
  let str = den.text("reduced");
  if (endS.test(str)) {
    str = str.replace(endS, "");
    den = den.replaceWith(str);
  }
  if (mapping.hasOwnProperty(str)) {
    den = mapping[str];
  } else {
    den = parseNumber$1(den);
  }
  if (typeof num === "number" && typeof den === "number") {
    return {
      numerator: num,
      denominator: den
    };
  }
  return null;
};
const oneNth = function(m2) {
  const found = m2.match("^#Ordinal$");
  if (found.found !== true) {
    return null;
  }
  if (m2.lookAhead("^of .")) {
    const num = parseNumber$1(found);
    return {
      numerator: 1,
      denominator: num
    };
  }
  return null;
};
const named = function(m2) {
  const str = m2.text("reduced");
  if (mapping.hasOwnProperty(str)) {
    return { numerator: 1, denominator: mapping[str] };
  }
  return null;
};
const round = (n2) => {
  const rounded = Math.round(n2 * 1e3) / 1e3;
  if (rounded === 0 && n2 !== 0) {
    return n2;
  }
  return rounded;
};
const parseFraction = function(m2) {
  m2 = m2.clone();
  const res = named(m2) || slashForm(m2) || nOutOfN(m2) || nOrinalth(m2) || oneNth(m2) || null;
  if (res !== null) {
    if (res.numerator && res.denominator) {
      res.decimal = res.numerator / res.denominator;
      res.decimal = round(res.decimal);
    }
  }
  return res;
};
const numToString = function(n2) {
  if (n2 < 1e6) {
    return String(n2);
  }
  let str;
  if (typeof n2 === "number") {
    str = n2.toFixed(0);
  } else {
    str = n2;
  }
  if (str.indexOf("e+") === -1) {
    return str;
  }
  return str.replace(".", "").split("e+").reduce(function(p2, b) {
    return p2 + Array(b - p2.length + 2).join(0);
  });
};
const tens_mapping = [
  ["ninety", 90],
  ["eighty", 80],
  ["seventy", 70],
  ["sixty", 60],
  ["fifty", 50],
  ["forty", 40],
  ["thirty", 30],
  ["twenty", 20]
];
const ones_mapping = [
  "",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen"
];
const sequence = [
  [1e24, "septillion"],
  [1e20, "hundred sextillion"],
  [1e21, "sextillion"],
  [1e20, "hundred quintillion"],
  [1e18, "quintillion"],
  [1e17, "hundred quadrillion"],
  [1e15, "quadrillion"],
  [1e14, "hundred trillion"],
  [1e12, "trillion"],
  [1e11, "hundred billion"],
  [1e9, "billion"],
  [1e8, "hundred million"],
  [1e6, "million"],
  [1e5, "hundred thousand"],
  [1e3, "thousand"],
  [100, "hundred"],
  [1, "one"]
];
const breakdown_magnitudes = function(num) {
  let working = num;
  const have = [];
  sequence.forEach((a2) => {
    if (num >= a2[0]) {
      const howmany = Math.floor(working / a2[0]);
      working -= howmany * a2[0];
      if (howmany) {
        have.push({
          unit: a2[1],
          count: howmany
        });
      }
    }
  });
  return have;
};
const breakdown_hundred = function(num) {
  const arr = [];
  if (num > 100) {
    return arr;
  }
  for (let i2 = 0; i2 < tens_mapping.length; i2++) {
    if (num >= tens_mapping[i2][1]) {
      num -= tens_mapping[i2][1];
      arr.push(tens_mapping[i2][0]);
    }
  }
  if (ones_mapping[num]) {
    arr.push(ones_mapping[num]);
  }
  return arr;
};
const handle_decimal = (num) => {
  const names = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
  const arr = [];
  const str = numToString(num);
  const decimal = str.match(/\.([0-9]+)/);
  if (!decimal || !decimal[0]) {
    return arr;
  }
  arr.push("point");
  const decimals = decimal[0].split("");
  for (let i2 = 0; i2 < decimals.length; i2++) {
    arr.push(names[decimals[i2]]);
  }
  return arr;
};
const toText$1 = function(obj) {
  let num = obj.num;
  if (num === 0 || num === "0") {
    return "zero";
  }
  if (num > 1e21) {
    num = numToString(num);
  }
  let arr = [];
  if (num < 0) {
    arr.push("minus");
    num = Math.abs(num);
  }
  const units2 = breakdown_magnitudes(num);
  for (let i2 = 0; i2 < units2.length; i2++) {
    let unit_name = units2[i2].unit;
    if (unit_name === "one") {
      unit_name = "";
      if (arr.length > 1) {
        arr.push("and");
      }
    }
    arr = arr.concat(breakdown_hundred(units2[i2].count));
    arr.push(unit_name);
  }
  arr = arr.concat(handle_decimal(num));
  arr = arr.filter((s2) => s2);
  if (arr.length === 0) {
    arr[0] = "";
  }
  return arr.join(" ");
};
const toCardinal = function(obj) {
  if (!obj.numerator || !obj.denominator) {
    return "";
  }
  const a2 = toText$1({ num: obj.numerator });
  const b = toText$1({ num: obj.denominator });
  return `${a2} out of ${b}`;
};
const irregulars = {
  one: "first",
  two: "second",
  three: "third",
  five: "fifth",
  eight: "eighth",
  nine: "ninth",
  twelve: "twelfth",
  twenty: "twentieth",
  thirty: "thirtieth",
  forty: "fortieth",
  fourty: "fourtieth",
  fifty: "fiftieth",
  sixty: "sixtieth",
  seventy: "seventieth",
  eighty: "eightieth",
  ninety: "ninetieth"
};
const textOrdinal = (obj) => {
  const words2 = toText$1(obj).split(" ");
  const last = words2[words2.length - 1];
  if (irregulars.hasOwnProperty(last)) {
    words2[words2.length - 1] = irregulars[last];
  } else {
    words2[words2.length - 1] = last.replace(/y$/, "i") + "th";
  }
  return words2.join(" ");
};
const toOrdinal = function(obj) {
  if (!obj.numerator || !obj.denominator) {
    return "";
  }
  const start2 = toText$1({ num: obj.numerator });
  let end2 = textOrdinal({ num: obj.denominator });
  if (obj.denominator === 2) {
    end2 = "half";
  }
  if (start2 && end2) {
    if (obj.numerator !== 1) {
      end2 += "s";
    }
    return `${start2} ${end2}`;
  }
  return "";
};
const plugin$1 = function(View2) {
  class Fractions extends View2 {
    constructor(document, pointer, groups) {
      super(document, pointer, groups);
      this.viewType = "Fractions";
    }
    parse(n2) {
      return this.getNth(n2).map(parseFraction);
    }
    get(n2) {
      return this.getNth(n2).map(parseFraction);
    }
    json(n2) {
      return this.getNth(n2).map((p2) => {
        const json = p2.toView().json(n2)[0];
        const parsed = parseFraction(p2);
        json.fraction = parsed;
        return json;
      }, []);
    }
    // become 0.5
    toDecimal(n2) {
      this.getNth(n2).forEach((m2) => {
        const { decimal } = parseFraction(m2);
        m2 = m2.replaceWith(String(decimal), true);
        m2.tag("NumericValue");
        m2.unTag("Fraction");
      });
      return this;
    }
    toFraction(n2) {
      this.getNth(n2).forEach((m2) => {
        const obj = parseFraction(m2);
        if (obj && typeof obj.numerator === "number" && typeof obj.denominator === "number") {
          const str = `${obj.numerator}/${obj.denominator}`;
          this.replace(m2, str);
        }
      });
      return this;
    }
    toOrdinal(n2) {
      this.getNth(n2).forEach((m2) => {
        const obj = parseFraction(m2);
        let str = toOrdinal(obj);
        if (m2.after("^#Noun").found) {
          str += " of";
        }
        m2.replaceWith(str);
      });
      return this;
    }
    toCardinal(n2) {
      this.getNth(n2).forEach((m2) => {
        const obj = parseFraction(m2);
        const str = toCardinal(obj);
        m2.replaceWith(str);
      });
      return this;
    }
    toPercentage(n2) {
      this.getNth(n2).forEach((m2) => {
        const { decimal } = parseFraction(m2);
        let percent = decimal * 100;
        percent = Math.round(percent * 100) / 100;
        m2.replaceWith(`${percent}%`);
      });
      return this;
    }
  }
  View2.prototype.fractions = function(n2) {
    let m2 = findFractions(this);
    m2 = m2.getNth(n2);
    return new Fractions(this.document, m2.pointer);
  };
};
const ones = "one|two|three|four|five|six|seven|eight|nine";
const tens = "twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|fourty";
const teens = "eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen";
const findNumbers = function(doc) {
  let m2 = doc.match("#Value+");
  if (m2.has("#NumericValue #NumericValue")) {
    if (m2.has("#Value @hasComma #Value")) {
      m2.splitAfter("@hasComma");
    } else if (m2.has("#NumericValue #Fraction")) {
      m2.splitAfter("#NumericValue #Fraction");
    } else {
      m2 = m2.splitAfter("#NumericValue");
    }
  }
  if (m2.has("#Value #Value #Value") && !m2.has("#Multiple")) {
    if (m2.has("(" + tens + ") #Cardinal #Cardinal")) {
      m2 = m2.splitAfter("(" + tens + ") #Cardinal");
    }
  }
  if (m2.has("#Value #Value")) {
    if (m2.has("#NumericValue #NumericValue")) {
      m2 = m2.splitOn("#Year");
    }
    if (m2.has("(" + tens + ") (" + teens + ")")) {
      m2 = m2.splitAfter("(" + tens + ")");
    }
    const double = m2.match("#Cardinal #Cardinal");
    if (double.found && !m2.has("(point|decimal|#Fraction)")) {
      if (!double.has("#Cardinal (#Multiple|point|decimal)")) {
        const noMultiple = m2.has(`(${ones}) (${tens})`);
        const tensVal = double.has("(" + tens + ") #Cardinal");
        const multVal = double.has("#Multiple #Value");
        if (!noMultiple && !tensVal && !multVal) {
          double.terms().forEach((d2) => {
            m2 = m2.splitOn(d2);
          });
        }
      }
    }
    if (m2.match("#Ordinal #Ordinal").match("#TextValue").found && !m2.has("#Multiple")) {
      if (!m2.has("(" + tens + ") #Ordinal")) {
        m2 = m2.splitAfter("#Ordinal");
      }
    }
    if (m2.has("#Time")) {
      m2 = m2.splitOn("#Time");
    }
    m2 = m2.splitBefore("#Ordinal [#Cardinal]", 0);
    if (m2.has("#TextValue #NumericValue") && !m2.has("(" + tens + "|#Multiple)")) {
      m2 = m2.splitBefore("#TextValue #NumericValue");
    }
  }
  m2 = m2.splitAfter("#NumberRange");
  m2 = m2.splitBefore("#Year");
  return m2;
};
const parseNumeric = function(str, m2) {
  str = str.replace(/,/g, "");
  const arr = str.split(/([0-9.,]*)/);
  let [prefix2, num] = arr;
  let suffix = arr.slice(2).join("");
  if (num !== "" && m2.length < 2) {
    num = Number(num || str);
    if (typeof num !== "number") {
      num = null;
    }
    suffix = suffix || "";
    if (suffix === "st" || suffix === "nd" || suffix === "rd" || suffix === "th") {
      suffix = "";
    }
    return {
      prefix: prefix2 || "",
      num,
      suffix
    };
  }
  return null;
};
const parseNumber = function(m2) {
  if (typeof m2 === "string") {
    return { num: parse$2(m2) };
  }
  let str = m2.text("reduced");
  const unit = m2.growRight("#Unit").match("#Unit$").text("machine");
  const hasComma = /[0-9],[0-9]/.test(m2.text("text"));
  if (m2.terms().length === 1 && !m2.has("#Multiple")) {
    const res = parseNumeric(str, m2);
    if (res !== null) {
      res.hasComma = hasComma;
      res.unit = unit;
      return res;
    }
  }
  let frPart = m2.match("#Fraction{2,}$");
  frPart = frPart.found === false ? m2.match("^#Fraction$") : frPart;
  let fraction = null;
  if (frPart.found) {
    if (frPart.has("#Value and #Value #Fraction")) {
      frPart = frPart.match("and #Value #Fraction");
    }
    fraction = parseFraction(frPart);
    m2 = m2.not(frPart);
    m2 = m2.not("and$");
    str = m2.text("reduced");
  }
  let num = 0;
  if (str) {
    num = parse$2(str) || 0;
  }
  if (fraction && fraction.decimal) {
    num += fraction.decimal;
  }
  return {
    hasComma,
    prefix: "",
    num,
    suffix: "",
    isOrdinal: m2.has("#Ordinal"),
    isText: m2.has("#TextValue"),
    isFraction: m2.has("#Fraction"),
    isMoney: m2.has("#Money"),
    unit
  };
};
const numOrdinal = function(obj) {
  const num = obj.num;
  if (!num && num !== 0) {
    return null;
  }
  const tens2 = num % 100;
  if (tens2 > 10 && tens2 < 20) {
    return String(num) + "th";
  }
  const mapping2 = {
    0: "th",
    1: "st",
    2: "nd",
    3: "rd"
  };
  let str = numToString(num);
  const last = str.slice(str.length - 1, str.length);
  if (mapping2[last]) {
    str += mapping2[last];
  } else {
    str += "th";
  }
  return str;
};
const prefixes = {
  "¢": "cents",
  $: "dollars",
  "£": "pounds",
  "¥": "yen",
  "€": "euros",
  "₡": "colón",
  "฿": "baht",
  "₭": "kip",
  "₩": "won",
  "₹": "rupees",
  "₽": "ruble",
  "₺": "liras"
};
const suffixes = {
  "%": "percent",
  // s: 'seconds',
  // cm: 'centimetres',
  // km: 'kilometres',
  // ft: 'feet',
  "°": "degrees"
};
const addSuffix = function(obj) {
  const res = {
    suffix: "",
    prefix: obj.prefix
  };
  if (prefixes.hasOwnProperty(obj.prefix)) {
    res.suffix += " " + prefixes[obj.prefix];
    res.prefix = "";
  }
  if (suffixes.hasOwnProperty(obj.suffix)) {
    res.suffix += " " + suffixes[obj.suffix];
  }
  if (res.suffix && obj.num === 1) {
    res.suffix = res.suffix.replace(/s$/, "");
  }
  if (!res.suffix && obj.suffix) {
    res.suffix += " " + obj.suffix;
  }
  return res;
};
const format = function(obj, fmt2) {
  if (fmt2 === "TextOrdinal") {
    const { prefix: prefix2, suffix } = addSuffix(obj);
    return prefix2 + textOrdinal(obj) + suffix;
  }
  if (fmt2 === "Ordinal") {
    return obj.prefix + numOrdinal(obj) + obj.suffix;
  }
  if (fmt2 === "TextCardinal") {
    const { prefix: prefix2, suffix } = addSuffix(obj);
    return prefix2 + toText$1(obj) + suffix;
  }
  let num = obj.num;
  if (obj.hasComma) {
    num = num.toLocaleString();
  }
  return obj.prefix + String(num) + obj.suffix;
};
const isArray = (arr) => Object.prototype.toString.call(arr) === "[object Array]";
const coerceToObject = function(input) {
  if (typeof input === "string" || typeof input === "number") {
    const tmp = {};
    tmp[input] = true;
    return tmp;
  }
  if (isArray(input)) {
    return input.reduce((h2, s2) => {
      h2[s2] = true;
      return h2;
    }, {});
  }
  return input || {};
};
const isUnit = function(doc, input = {}) {
  input = coerceToObject(input);
  return doc.filter((p2) => {
    const { unit } = parseNumber(p2);
    if (unit && input[unit] === true) {
      return true;
    }
    return false;
  });
};
const addMethod$2 = function(View2) {
  class Numbers extends View2 {
    constructor(document, pointer, groups) {
      super(document, pointer, groups);
      this.viewType = "Numbers";
    }
    parse(n2) {
      return this.getNth(n2).map(parseNumber);
    }
    get(n2) {
      return this.getNth(n2).map(parseNumber).map((o2) => o2.num);
    }
    json(n2) {
      const opts2 = typeof n2 === "object" ? n2 : {};
      return this.getNth(n2).map((p2) => {
        const json = p2.toView().json(opts2)[0];
        const parsed = parseNumber(p2);
        json.number = {
          prefix: parsed.prefix,
          num: parsed.num,
          suffix: parsed.suffix,
          hasComma: parsed.hasComma,
          unit: parsed.unit
        };
        return json;
      }, []);
    }
    /** any known measurement unit, for the number */
    units() {
      return this.growRight("#Unit").match("#Unit$");
    }
    /** return values that match a given unit */
    isUnit(allowed) {
      return isUnit(this, allowed);
    }
    /** return only ordinal numbers */
    isOrdinal() {
      return this.if("#Ordinal");
    }
    /** return only cardinal numbers*/
    isCardinal() {
      return this.if("#Cardinal");
    }
    /** convert to numeric form like '8' or '8th' */
    toNumber() {
      const res = this.map((val) => {
        if (!this.has("#TextValue")) {
          return val;
        }
        const obj = parseNumber(val);
        if (obj.num === null) {
          return val;
        }
        const fmt2 = val.has("#Ordinal") ? "Ordinal" : "Cardinal";
        const str = format(obj, fmt2);
        val.replaceWith(str, { tags: true });
        return val.tag("NumericValue");
      });
      return new Numbers(res.document, res.pointer);
    }
    /** add commas, or nicer formatting for numbers */
    toLocaleString() {
      const m2 = this;
      m2.forEach((val) => {
        const obj = parseNumber(val);
        if (obj.num === null) {
          return;
        }
        let num = obj.num.toLocaleString();
        if (val.has("#Ordinal")) {
          const str = format(obj, "Ordinal");
          const end2 = str.match(/[a-z]+$/);
          if (end2) {
            num += end2[0] || "";
          }
        }
        val.replaceWith(num, { tags: true });
      });
      return this;
    }
    /** convert to numeric form like 'eight' or 'eighth' */
    toText() {
      const m2 = this;
      const res = m2.map((val) => {
        if (val.has("#TextValue")) {
          return val;
        }
        const obj = parseNumber(val);
        if (obj.num === null) {
          return val;
        }
        const fmt2 = val.has("#Ordinal") ? "TextOrdinal" : "TextCardinal";
        const str = format(obj, fmt2);
        val.replaceWith(str, { tags: true });
        val.tag("TextValue");
        return val;
      });
      return new Numbers(res.document, res.pointer);
    }
    /** convert ordinal to cardinal form, like 'eight', or '8' */
    toCardinal() {
      const m2 = this;
      const res = m2.map((val) => {
        if (!val.has("#Ordinal")) {
          return val;
        }
        const obj = parseNumber(val);
        if (obj.num === null) {
          return val;
        }
        const fmt2 = val.has("#TextValue") ? "TextCardinal" : "Cardinal";
        const str = format(obj, fmt2);
        val.replaceWith(str, { tags: true });
        val.tag("Cardinal");
        return val;
      });
      return new Numbers(res.document, res.pointer);
    }
    /** convert cardinal to ordinal form, like 'eighth', or '8th' */
    toOrdinal() {
      const m2 = this;
      const res = m2.map((val) => {
        if (val.has("#Ordinal")) {
          return val;
        }
        const obj = parseNumber(val);
        if (obj.num === null) {
          return val;
        }
        const fmt2 = val.has("#TextValue") ? "TextOrdinal" : "Ordinal";
        const str = format(obj, fmt2);
        val.replaceWith(str, { tags: true });
        val.tag("Ordinal");
        return val;
      });
      return new Numbers(res.document, res.pointer);
    }
    /** return only numbers that are == n */
    isEqual(n2) {
      return this.filter((val) => {
        const num = parseNumber(val).num;
        return num === n2;
      });
    }
    /** return only numbers that are > n*/
    greaterThan(n2) {
      return this.filter((val) => {
        const num = parseNumber(val).num;
        return num > n2;
      });
    }
    /** return only numbers that are < n*/
    lessThan(n2) {
      return this.filter((val) => {
        const num = parseNumber(val).num;
        return num < n2;
      });
    }
    /** return only numbers > min and < max */
    between(min2, max2) {
      return this.filter((val) => {
        const num = parseNumber(val).num;
        return num > min2 && num < max2;
      });
    }
    /** set these number to n */
    set(n2) {
      if (n2 === void 0) {
        return this;
      }
      if (typeof n2 === "string") {
        n2 = parseNumber(n2).num;
      }
      const m2 = this;
      const res = m2.map((val) => {
        const obj = parseNumber(val);
        obj.num = n2;
        if (obj.num === null) {
          return val;
        }
        let fmt2 = val.has("#Ordinal") ? "Ordinal" : "Cardinal";
        if (val.has("#TextValue")) {
          fmt2 = val.has("#Ordinal") ? "TextOrdinal" : "TextCardinal";
        }
        let str = format(obj, fmt2);
        if (obj.hasComma && fmt2 === "Cardinal") {
          str = Number(str).toLocaleString();
        }
        val = val.not("#Currency");
        val.replaceWith(str, { tags: true });
        return val;
      });
      return new Numbers(res.document, res.pointer);
    }
    add(n2) {
      if (!n2) {
        return this;
      }
      if (typeof n2 === "string") {
        n2 = parseNumber(n2).num;
      }
      const m2 = this;
      const res = m2.map((val) => {
        const obj = parseNumber(val);
        if (obj.num === null) {
          return val;
        }
        obj.num += n2;
        let fmt2 = val.has("#Ordinal") ? "Ordinal" : "Cardinal";
        if (obj.isText) {
          fmt2 = val.has("#Ordinal") ? "TextOrdinal" : "TextCardinal";
        }
        const str = format(obj, fmt2);
        val.replaceWith(str, { tags: true });
        return val;
      });
      return new Numbers(res.document, res.pointer);
    }
    /** decrease each number by n*/
    subtract(n2, agree) {
      return this.add(n2 * -1, agree);
    }
    /** increase each number by 1 */
    increment(agree) {
      return this.add(1, agree);
    }
    /** decrease each number by 1 */
    decrement(agree) {
      return this.add(-1, agree);
    }
    // overloaded - keep Numbers class
    update(pointer) {
      const m2 = new Numbers(this.document, pointer);
      m2._cache = this._cache;
      return m2;
    }
  }
  Numbers.prototype.toNice = Numbers.prototype.toLocaleString;
  Numbers.prototype.isBetween = Numbers.prototype.between;
  Numbers.prototype.minus = Numbers.prototype.subtract;
  Numbers.prototype.plus = Numbers.prototype.add;
  Numbers.prototype.equals = Numbers.prototype.isEqual;
  View2.prototype.numbers = function(n2) {
    let m2 = findNumbers(this);
    m2 = m2.getNth(n2);
    return new Numbers(this.document, m2.pointer);
  };
  View2.prototype.percentages = function(n2) {
    let m2 = findNumbers(this);
    m2 = m2.filter((v2) => v2.has("#Percent") || v2.after("^percent"));
    m2 = m2.getNth(n2);
    return new Numbers(this.document, m2.pointer);
  };
  View2.prototype.money = function(n2) {
    let m2 = findNumbers(this);
    m2 = m2.filter((v2) => v2.has("#Money") || v2.after("^#Currency"));
    m2 = m2.getNth(n2);
    return new Numbers(this.document, m2.pointer);
  };
  View2.prototype.values = View2.prototype.numbers;
};
const api$6 = function(View2) {
  plugin$1(View2);
  addMethod$2(View2);
};
const numbers = {
  api: api$6
  // add @greaterThan, @lessThan
  // mutate: world => {
  //   let termMethods = world.methods.one.termMethods
  //   termMethods.lessThan = function (term) {
  //     return false //TODO: implement
  //     // return /[aeiou]/.test(term.text)
  //   }
  // },
};
const defaults = {
  people: true,
  emails: true,
  phoneNumbers: true,
  places: true
};
const redact = function(opts2 = {}) {
  opts2 = Object.assign({}, defaults, opts2);
  if (opts2.people !== false) {
    this.people().replaceWith("██████████");
  }
  if (opts2.emails !== false) {
    this.emails().replaceWith("██████████");
  }
  if (opts2.places !== false) {
    this.places().replaceWith("██████████");
  }
  if (opts2.phoneNumbers !== false) {
    this.phoneNumbers().replaceWith("███████");
  }
  return this;
};
const plugin = {
  api: function(View2) {
    View2.prototype.redact = redact;
  }
};
const isQuestion = function(doc) {
  const clauses2 = doc.clauses();
  if (/\.\.$/.test(doc.out("text"))) {
    return false;
  }
  if (doc.has("^#QuestionWord") && doc.has("@hasComma")) {
    return false;
  }
  if (doc.has("or not$")) {
    return true;
  }
  if (doc.has("^#QuestionWord")) {
    return true;
  }
  if (doc.has("^(do|does|did|is|was|can|could|will|would|may) #Noun")) {
    return true;
  }
  if (doc.has("^(have|must) you")) {
    return true;
  }
  if (clauses2.has("(do|does|is|was) #Noun+ #Adverb? (#Adjective|#Infinitive)$")) {
    return true;
  }
  return false;
};
const findQuestions = function(view) {
  const hasQ = /\?/;
  const { document } = view;
  return view.filter((m2) => {
    const terms = m2.docs[0] || [];
    const lastTerm = terms[terms.length - 1];
    if (!lastTerm || document[lastTerm.index[0]].length !== terms.length) {
      return false;
    }
    if (hasQ.test(lastTerm.post)) {
      return true;
    }
    return isQuestion(m2);
  });
};
const subordinate = `(after|although|as|because|before|if|since|than|that|though|when|whenever|where|whereas|wherever|whether|while|why|unless|until|once)`;
const relative = `(that|which|whichever|who|whoever|whom|whose|whomever)`;
const mainClause = function(s2) {
  let m2 = s2;
  if (m2.length === 1) {
    return m2;
  }
  m2 = m2.if("#Verb");
  if (m2.length === 1) {
    return m2;
  }
  m2 = m2.ifNo(subordinate);
  m2 = m2.ifNo("^even (if|though)");
  m2 = m2.ifNo("^so that");
  m2 = m2.ifNo("^rather than");
  m2 = m2.ifNo("^provided that");
  if (m2.length === 1) {
    return m2;
  }
  m2 = m2.ifNo(relative);
  if (m2.length === 1) {
    return m2;
  }
  m2 = m2.ifNo("(^despite|^during|^before|^through|^throughout)");
  if (m2.length === 1) {
    return m2;
  }
  m2 = m2.ifNo("^#Gerund");
  if (m2.length === 1) {
    return m2;
  }
  if (m2.length === 0) {
    m2 = s2;
  }
  return m2.eq(0);
};
const grammar = function(vb2) {
  let tense = null;
  if (vb2.has("#PastTense")) {
    tense = "PastTense";
  } else if (vb2.has("#FutureTense")) {
    tense = "FutureTense";
  } else if (vb2.has("#PresentTense")) {
    tense = "PresentTense";
  }
  return {
    tense
  };
};
const parse$1 = function(s2) {
  const clauses2 = s2.clauses();
  const main = mainClause(clauses2);
  const chunks2 = main.chunks();
  let subj = s2.none();
  let verb2 = s2.none();
  let pred = s2.none();
  chunks2.forEach((ch, i2) => {
    if (i2 === 0 && !ch.has("<Verb>")) {
      subj = ch;
      return;
    }
    if (!verb2.found && ch.has("<Verb>")) {
      verb2 = ch;
      return;
    }
    if (verb2.found) {
      pred = pred.concat(ch);
    }
  });
  if (verb2.found && !subj.found) {
    subj = verb2.before("<Noun>+").first();
  }
  return {
    subj,
    verb: verb2,
    pred,
    grammar: grammar(verb2)
  };
};
const toPast$2 = function(s2) {
  let verbs2 = s2.verbs();
  const first = verbs2.eq(0);
  if (first.has("#PastTense")) {
    return s2;
  }
  first.toPastTense();
  if (verbs2.length > 1) {
    verbs2 = verbs2.slice(1);
    verbs2 = verbs2.filter((v2) => !v2.lookBehind("to$").found);
    verbs2 = verbs2.if("#PresentTense");
    verbs2 = verbs2.notIf("#Gerund");
    const list2 = s2.match("to #Verb+ #Conjunction #Verb").terms();
    verbs2 = verbs2.not(list2);
    if (verbs2.found) {
      verbs2.verbs().toPastTense();
    }
  }
  return s2;
};
const toPresent$1 = function(s2) {
  let verbs2 = s2.verbs();
  const first = verbs2.eq(0);
  first.toPresentTense();
  if (verbs2.length > 1) {
    verbs2 = verbs2.slice(1);
    verbs2 = verbs2.filter((v2) => !v2.lookBehind("to$").found);
    verbs2 = verbs2.notIf("#Gerund");
    if (verbs2.found) {
      verbs2.verbs().toPresentTense();
    }
  }
  return s2;
};
const toFuture$1 = function(s2) {
  let verbs2 = s2.verbs();
  const first = verbs2.eq(0);
  first.toFutureTense();
  s2 = s2.fullSentence();
  verbs2 = s2.verbs();
  if (verbs2.length > 1) {
    verbs2 = verbs2.slice(1);
    const toChange = verbs2.filter((vb2) => {
      if (vb2.lookBehind("to$").found) {
        return false;
      }
      if (vb2.has("#Copula #Gerund")) {
        return true;
      }
      if (vb2.has("#Gerund")) {
        return false;
      }
      if (vb2.has("#Copula")) {
        return true;
      }
      if (vb2.has("#PresentTense") && !vb2.has("#Infinitive") && vb2.lookBefore("(he|she|it|that|which)$").found) {
        return false;
      }
      return true;
    });
    if (toChange.found) {
      toChange.forEach((m2) => {
        if (m2.has("#Copula")) {
          m2.match("was").replaceWith("is");
          m2.match("is").replaceWith("will be");
          return;
        }
        m2.toInfinitive();
      });
    }
  }
  return s2;
};
const toNegative$1 = function(s2) {
  s2.verbs().first().toNegative().compute("chunks");
  return s2;
};
const toPositive = function(s2) {
  s2.verbs().first().toPositive().compute("chunks");
  return s2;
};
const toInfinitive = function(s2) {
  s2.verbs().toInfinitive();
  return s2;
};
const api$5 = function(View2) {
  class Sentences extends View2 {
    constructor(document, pointer, groups) {
      super(document, pointer, groups);
      this.viewType = "Sentences";
    }
    json(opts2 = {}) {
      return this.map((m2) => {
        const json = m2.toView().json(opts2)[0] || {};
        const { subj, verb: verb2, pred, grammar: grammar2 } = parse$1(m2);
        json.sentence = {
          subject: subj.text("normal"),
          verb: verb2.text("normal"),
          predicate: pred.text("normal"),
          grammar: grammar2
        };
        return json;
      }, []);
    }
    toPastTense(n2) {
      return this.getNth(n2).map((s2) => {
        parse$1(s2);
        return toPast$2(s2);
      });
    }
    toPresentTense(n2) {
      return this.getNth(n2).map((s2) => {
        parse$1(s2);
        return toPresent$1(s2);
      });
    }
    toFutureTense(n2) {
      return this.getNth(n2).map((s2) => {
        parse$1(s2);
        s2 = toFuture$1(s2);
        return s2;
      });
    }
    toInfinitive(n2) {
      return this.getNth(n2).map((s2) => {
        parse$1(s2);
        return toInfinitive(s2);
      });
    }
    toNegative(n2) {
      return this.getNth(n2).map((vb2) => {
        parse$1(vb2);
        return toNegative$1(vb2);
      });
    }
    toPositive(n2) {
      return this.getNth(n2).map((vb2) => {
        parse$1(vb2);
        return toPositive(vb2);
      });
    }
    isQuestion(n2) {
      return this.questions(n2);
    }
    isExclamation(n2) {
      const res = this.filter((s2) => s2.lastTerm().has("@hasExclamation"));
      return res.getNth(n2);
    }
    isStatement(n2) {
      const res = this.filter((s2) => !s2.isExclamation().found && !s2.isQuestion().found);
      return res.getNth(n2);
    }
    // overloaded - keep Sentences class
    update(pointer) {
      const m2 = new Sentences(this.document, pointer);
      m2._cache = this._cache;
      return m2;
    }
  }
  Sentences.prototype.toPresent = Sentences.prototype.toPresentTense;
  Sentences.prototype.toPast = Sentences.prototype.toPastTense;
  Sentences.prototype.toFuture = Sentences.prototype.toFutureTense;
  const methods2 = {
    sentences: function(n2) {
      let m2 = this.map((s2) => s2.fullSentence());
      m2 = m2.getNth(n2);
      return new Sentences(this.document, m2.pointer);
    },
    questions: function(n2) {
      const m2 = findQuestions(this);
      return m2.getNth(n2);
    }
  };
  Object.assign(View2.prototype, methods2);
};
const sentences = { api: api$5 };
const find$2 = function(doc) {
  let m2 = doc.splitAfter("@hasComma");
  m2 = m2.match("#Honorific+? #Person+");
  const poss = m2.match("#Possessive").notIf("(his|her)");
  m2 = m2.splitAfter(poss);
  return m2;
};
const parse = function(m2) {
  const res = {};
  res.firstName = m2.match("#FirstName+");
  res.lastName = m2.match("#LastName+");
  res.honorific = m2.match("#Honorific+");
  const last = res.lastName;
  const first = res.firstName;
  if (!first.found || !last.found) {
    if (!first.found && !last.found && m2.has("^#Honorific .$")) {
      res.lastName = m2.match(".$");
      return res;
    }
  }
  return res;
};
const m = "male";
const f = "female";
const honorifics = {
  mr: m,
  mrs: f,
  miss: f,
  madam: f,
  // british stuff
  king: m,
  queen: f,
  duke: m,
  duchess: f,
  baron: m,
  baroness: f,
  count: m,
  countess: f,
  prince: m,
  princess: f,
  sire: m,
  dame: f,
  lady: f,
  ayatullah: m,
  //i think?
  congressman: m,
  congresswoman: f,
  "first lady": f,
  // marked as non-binary
  mx: null
};
const predictGender = function(parsed, person2) {
  const { firstName, honorific } = parsed;
  if (firstName.has("#FemaleName")) {
    return f;
  }
  if (firstName.has("#MaleName")) {
    return m;
  }
  if (honorific.found) {
    let hon = honorific.text("normal");
    hon = hon.replace(/\./g, "");
    if (honorifics.hasOwnProperty(hon)) {
      return honorifics[hon];
    }
    if (/^her /.test(hon)) {
      return f;
    }
    if (/^his /.test(hon)) {
      return m;
    }
  }
  const after2 = person2.after();
  if (!after2.has("#Person") && after2.has("#Pronoun")) {
    const pro = after2.match("#Pronoun");
    if (pro.has("(they|their)")) {
      return null;
    }
    const hasMasc = pro.has("(he|his)");
    const hasFem = pro.has("(she|her|hers)");
    if (hasMasc && !hasFem) {
      return m;
    }
    if (hasFem && !hasMasc) {
      return f;
    }
  }
  return null;
};
const addMethod$1 = function(View2) {
  class People extends View2 {
    constructor(document, pointer, groups) {
      super(document, pointer, groups);
      this.viewType = "People";
    }
    parse(n2) {
      return this.getNth(n2).map(parse);
    }
    json(n2) {
      const opts2 = typeof n2 === "object" ? n2 : {};
      return this.getNth(n2).map((p2) => {
        const json = p2.toView().json(opts2)[0];
        const parsed = parse(p2);
        json.person = {
          firstName: parsed.firstName.text("normal"),
          lastName: parsed.lastName.text("normal"),
          honorific: parsed.honorific.text("normal"),
          presumed_gender: predictGender(parsed, p2)
        };
        return json;
      }, []);
    }
    // used for co-reference resolution only
    presumedMale() {
      return this.filter((m2) => {
        return m2.has("(#MaleName|mr|mister|sr|jr|king|pope|prince|sir)");
      });
    }
    presumedFemale() {
      return this.filter((m2) => {
        return m2.has("(#FemaleName|mrs|miss|queen|princess|madam)");
      });
    }
    // overloaded - keep People class
    update(pointer) {
      const m2 = new People(this.document, pointer);
      m2._cache = this._cache;
      return m2;
    }
  }
  View2.prototype.people = function(n2) {
    let m2 = find$2(this);
    m2 = m2.getNth(n2);
    return new People(this.document, m2.pointer);
  };
};
const find$1 = function(doc) {
  let m2 = doc.match("(#Place|#Address)+");
  let splits = m2.match("@hasComma");
  splits = splits.filter((c2) => {
    if (c2.has("(asia|africa|europe|america)$")) {
      return true;
    }
    if (c2.has("(#City|#Region|#ProperNoun)$") && c2.after("^(#Country|#Region)").found) {
      return false;
    }
    return true;
  });
  m2 = m2.splitAfter(splits);
  return m2;
};
const addMethod = function(View2) {
  View2.prototype.places = function(n2) {
    let m2 = find$1(this);
    m2 = m2.getNth(n2);
    return new View2(this.document, m2.pointer);
  };
};
const api$4 = function(View2) {
  View2.prototype.organizations = function(n2) {
    const m2 = this.match("#Organization+");
    return m2.getNth(n2);
  };
};
const find = function(n2) {
  const r2 = this.clauses();
  let m2 = r2.people();
  m2 = m2.concat(r2.places());
  m2 = m2.concat(r2.organizations());
  m2 = m2.not("(someone|man|woman|mother|brother|sister|father)");
  m2 = m2.sort("seq");
  m2 = m2.getNth(n2);
  return m2;
};
const api$3 = function(View2) {
  View2.prototype.topics = find;
};
const api$2 = function(View2) {
  addMethod$1(View2);
  addMethod(View2);
  api$4(View2);
  api$3(View2);
};
const topics = { api: api$2 };
const findVerbs = function(doc) {
  let m2 = doc.match("<Verb>");
  m2 = m2.not("#Conjunction");
  m2 = m2.not("#Preposition");
  m2 = m2.splitAfter("@hasComma");
  m2 = m2.splitAfter("[(do|did|am|was|is|will)] (is|was)", 0);
  m2 = m2.splitBefore("(#Verb && !#Copula) [being] #Verb", 0);
  m2 = m2.splitBefore("#Verb [to be] #Verb", 0);
  m2 = m2.splitAfter("[help] #PresentTense", 0);
  m2 = m2.splitBefore("(#PresentTense|#PastTense) [#Copula]$", 0);
  m2 = m2.splitBefore("(#PresentTense|#PastTense) [will be]$", 0);
  m2 = m2.splitBefore("(#PresentTense|#PastTense) [(had|has)]", 0);
  m2 = m2.not("#Reflexive$");
  m2 = m2.not("#Adjective");
  m2 = m2.splitAfter("[#PastTense] #PastTense", 0);
  m2 = m2.splitAfter("[#PastTense] #Auxiliary+ #PastTense", 0);
  m2 = m2.splitAfter("#Copula [#Gerund] #PastTense", 0);
  m2 = m2.if("#Verb");
  if (m2.has("(#Verb && !#Auxiliary) #Adverb+? #Copula")) {
    m2 = m2.splitBefore("#Copula");
  }
  return m2;
};
const getMain = function(vb2) {
  let root = vb2;
  if (vb2.wordCount() > 1) {
    root = vb2.not("(#Negative|#Auxiliary|#Modal|#Adverb|#Prefix)");
  }
  if (root.length > 1 && !root.has("#Phrasal #Particle")) {
    root = root.last();
  }
  root = root.not("(want|wants|wanted) to");
  if (!root.found) {
    root = vb2.not("#Negative");
    return root;
  }
  return root;
};
const getAdverbs = function(vb2, root) {
  const res = {
    pre: vb2.none(),
    post: vb2.none()
  };
  if (!vb2.has("#Adverb")) {
    return res;
  }
  const parts = vb2.splitOn(root);
  if (parts.length === 3) {
    return {
      pre: parts.eq(0).adverbs(),
      post: parts.eq(2).adverbs()
    };
  }
  if (parts.eq(0).isDoc(root)) {
    res.post = parts.eq(1).adverbs();
    return res;
  }
  res.pre = parts.eq(0).adverbs();
  return res;
};
const getAuxiliary = function(vb2, root) {
  const parts = vb2.splitBefore(root);
  if (parts.length <= 1) {
    return vb2.none();
  }
  let aux = parts.eq(0);
  aux = aux.not("(#Adverb|#Negative|#Prefix)");
  return aux;
};
const getNegative = function(vb2) {
  return vb2.match("#Negative");
};
const getPhrasal = function(root) {
  if (!root.has("(#Particle|#PhrasalVerb)")) {
    return {
      verb: root.none(),
      particle: root.none()
    };
  }
  const particle = root.match("#Particle$");
  return {
    verb: root.not(particle),
    particle
  };
};
const parseVerb = function(view) {
  const vb2 = view.clone();
  vb2.contractions().expand();
  const root = getMain(vb2);
  const res = {
    root,
    prefix: vb2.match("#Prefix"),
    adverbs: getAdverbs(vb2, root),
    auxiliary: getAuxiliary(vb2, root),
    negative: getNegative(vb2),
    phrasal: getPhrasal(root)
  };
  return res;
};
const present = { tense: "PresentTense" };
const conditional = { conditional: true };
const future = { tense: "FutureTense" };
const prog = { progressive: true };
const past = { tense: "PastTense" };
const complete = { complete: true, progressive: false };
const passive = { passive: true };
const plural = { plural: true };
const singular = { plural: false };
const getData = function(tags) {
  const data2 = {};
  tags.forEach((o2) => {
    Object.assign(data2, o2);
  });
  return data2;
};
const verbForms = {
  // === Simple ===
  "imperative": [
    // walk!
    ["#Imperative", []]
  ],
  "want-infinitive": [
    ["^(want|wants|wanted) to #Infinitive$", [present]],
    ["^wanted to #Infinitive$", [past]],
    ["^will want to #Infinitive$", [future]]
  ],
  "gerund-phrase": [
    // started looking
    ["^#PastTense #Gerund$", [past]],
    // starts looking
    ["^#PresentTense #Gerund$", [present]],
    // start looking
    ["^#Infinitive #Gerund$", [present]],
    // will start looking
    ["^will #Infinitive #Gerund$", [future]],
    // have started looking
    ["^have #PastTense #Gerund$", [past]],
    // will have started looking
    ["^will have #PastTense #Gerund$", [past]]
  ],
  "simple-present": [
    // he walks',
    ["^#PresentTense$", [present]],
    // we walk
    ["^#Infinitive$", [present]]
  ],
  "simple-past": [
    // he walked',
    ["^#PastTense$", [past]]
  ],
  "simple-future": [
    // he will walk
    ["^will #Adverb? #Infinitive", [future]]
  ],
  // === Progressive ===
  "present-progressive": [
    // he is walking
    ["^(is|are|am) #Gerund$", [present, prog]]
  ],
  "past-progressive": [
    // he was walking
    ["^(was|were) #Gerund$", [past, prog]]
  ],
  "future-progressive": [
    // he will be
    ["^will be #Gerund$", [future, prog]]
  ],
  // === Perfect ===
  "present-perfect": [
    // he has walked
    ["^(has|have) #PastTense$", [past, complete]]
    //past?
  ],
  "past-perfect": [
    // he had walked
    ["^had #PastTense$", [past, complete]],
    // had been to see
    ["^had #PastTense to #Infinitive", [past, complete]]
  ],
  "future-perfect": [
    // he will have
    ["^will have #PastTense$", [future, complete]]
  ],
  // === Progressive-perfect ===
  "present-perfect-progressive": [
    // he has been walking
    ["^(has|have) been #Gerund$", [past, prog]]
    //present?
  ],
  "past-perfect-progressive": [
    // he had been
    ["^had been #Gerund$", [past, prog]]
  ],
  "future-perfect-progressive": [
    // will have been
    ["^will have been #Gerund$", [future, prog]]
  ],
  // ==== Passive ===
  "passive-past": [
    // got walked, was walked, were walked
    ["(got|were|was) #Passive", [past, passive]],
    // was being walked
    ["^(was|were) being #Passive", [past, passive]],
    // had been walked, have been eaten
    ["^(had|have) been #Passive", [past, passive]]
  ],
  "passive-present": [
    // is walked, are stolen
    ["^(is|are|am) #Passive", [present, passive]],
    // is being walked
    ["^(is|are|am) being #Passive", [present, passive]],
    // has been cleaned
    ["^has been #Passive", [present, passive]]
  ],
  "passive-future": [
    // will have been walked
    ["will have been #Passive", [future, passive, conditional]],
    // will be cleaned
    ["will be being? #Passive", [future, passive, conditional]]
  ],
  // === Conditional ===
  "present-conditional": [
    // would be walked
    ["would be #PastTense", [present, conditional]]
  ],
  "past-conditional": [
    // would have been walked
    ["would have been #PastTense", [past, conditional]]
  ],
  // ==== Auxiliary ===
  "auxiliary-future": [
    // going to drink
    ["(is|are|am|was) going to (#Infinitive|#PresentTense)", [future]]
  ],
  "auxiliary-past": [
    // he did walk
    ["^did #Infinitive$", [past, singular]],
    // used to walk
    ["^used to #Infinitive$", [past, complete]]
  ],
  "auxiliary-present": [
    // we do walk
    ["^(does|do) #Infinitive$", [present, complete, plural]]
  ],
  // === modals ===
  "modal-past": [
    // he could have walked
    ["^(could|must|should|shall) have #PastTense$", [past]]
  ],
  "modal-infinitive": [
    // he can walk
    ["^#Modal #Infinitive$", []]
  ],
  "infinitive": [
    // walk
    ["^#Infinitive$", []]
  ]
};
const list = [];
Object.keys(verbForms).map((k2) => {
  verbForms[k2].forEach((a2) => {
    list.push({
      name: k2,
      match: a2[0],
      data: getData(a2[1])
    });
  });
});
const cleanUp = function(vb2, res) {
  vb2 = vb2.clone();
  if (res.adverbs.post && res.adverbs.post.found) {
    vb2.remove(res.adverbs.post);
  }
  if (res.adverbs.pre && res.adverbs.pre.found) {
    vb2.remove(res.adverbs.pre);
  }
  if (vb2.has("#Negative")) {
    vb2 = vb2.remove("#Negative");
  }
  if (vb2.has("#Prefix")) {
    vb2 = vb2.remove("#Prefix");
  }
  if (res.root.has("#PhrasalVerb #Particle")) {
    vb2.remove("#Particle$");
  }
  vb2 = vb2.not("#Adverb");
  return vb2;
};
const isInfinitive = function(vb2) {
  if (vb2.has("#Infinitive")) {
    const m2 = vb2.growLeft("to");
    if (m2.has("^to #Infinitive")) {
      return true;
    }
  }
  return false;
};
const getGrammar = function(vb2, res) {
  const grammar2 = {};
  vb2 = cleanUp(vb2, res);
  for (let i2 = 0; i2 < list.length; i2 += 1) {
    const todo = list[i2];
    if (vb2.has(todo.match) === true) {
      grammar2.form = todo.name;
      Object.assign(grammar2, todo.data);
      break;
    }
  }
  if (!grammar2.form) {
    if (vb2.has("^#Verb$")) {
      grammar2.form = "infinitive";
    }
  }
  if (!grammar2.tense) {
    grammar2.tense = res.root.has("#PastTense") ? "PastTense" : "PresentTense";
  }
  grammar2.copula = res.root.has("#Copula");
  grammar2.isInfinitive = isInfinitive(vb2);
  return grammar2;
};
const shouldSkip = function(last) {
  if (last.length <= 1) {
    return false;
  }
  const obj = last.parse()[0] || {};
  return obj.isSubordinate;
};
const noSubClause = function(before2) {
  let parts = before2.clauses();
  parts = parts.filter((m2, i2) => {
    if (m2.has("^(if|unless|while|but|for|per|at|by|that|which|who|from)")) {
      return false;
    }
    if (i2 > 0 && m2.has("^#Verb . #Noun+$")) {
      return false;
    }
    if (i2 > 0 && m2.has("^#Adverb")) {
      return false;
    }
    return true;
  });
  if (parts.length === 0) {
    return before2;
  }
  return parts;
};
const lastNoun = function(vb2) {
  let before2 = vb2.before();
  before2 = noSubClause(before2);
  const nouns2 = before2.nouns();
  let last = nouns2.last();
  const pronoun = last.match("(i|he|she|we|you|they)");
  if (pronoun.found) {
    return pronoun.nouns();
  }
  let det = nouns2.if("^(that|this|those)");
  if (det.found) {
    return det;
  }
  if (nouns2.found === false) {
    det = before2.match("^(that|this|those)");
    if (det.found) {
      return det;
    }
  }
  last = nouns2.last();
  if (shouldSkip(last)) {
    nouns2.remove(last);
    last = nouns2.last();
  }
  if (shouldSkip(last)) {
    nouns2.remove(last);
    last = nouns2.last();
  }
  return last;
};
const isPlural$1 = function(subj, vb2) {
  if (vb2.has("(are|were|does)")) {
    return true;
  }
  if (subj.has("(those|they|we)")) {
    return true;
  }
  if (subj.found && subj.isPlural) {
    return subj.isPlural().found;
  }
  return false;
};
const getSubject = function(vb2) {
  const subj = lastNoun(vb2);
  return {
    subject: subj,
    plural: isPlural$1(subj, vb2)
  };
};
const noop = (vb2) => vb2;
const isPlural = (vb2, parsed) => {
  const subj = getSubject(vb2);
  const m2 = subj.subject;
  if (m2.has("i") || m2.has("we")) {
    return true;
  }
  return subj.plural;
};
const wasWere = (vb2, parsed) => {
  const { subject, plural: plural2 } = getSubject(vb2);
  if (plural2 || subject.has("we")) {
    return "were";
  }
  return "was";
};
const isAreAm = function(vb2, parsed) {
  if (vb2.has("were")) {
    return "are";
  }
  const { subject, plural: plural2 } = getSubject(vb2);
  if (subject.has("i")) {
    return "am";
  }
  if (subject.has("we") || plural2) {
    return "are";
  }
  return "is";
};
const doDoes = function(vb2, parsed) {
  const subj = getSubject(vb2);
  const m2 = subj.subject;
  if (m2.has("i") || m2.has("we")) {
    return "do";
  }
  if (subj.plural) {
    return "do";
  }
  return "does";
};
const getTense = function(m2) {
  if (m2.has("#Infinitive")) {
    return "Infinitive";
  }
  if (m2.has("#Participle")) {
    return "Participle";
  }
  if (m2.has("#PastTense")) {
    return "PastTense";
  }
  if (m2.has("#Gerund")) {
    return "Gerund";
  }
  if (m2.has("#PresentTense")) {
    return "PresentTense";
  }
  return void 0;
};
const toInf$2 = function(vb2, parsed) {
  const { toInfinitive: toInfinitive2 } = vb2.methods.two.transform.verb;
  let str = parsed.root.text({ keepPunct: false });
  str = toInfinitive2(str, vb2.model, getTense(vb2));
  if (str) {
    vb2.replace(parsed.root, str);
  }
  return vb2;
};
const noWill = (vb2) => {
  if (vb2.has("will not")) {
    return vb2.replace("will not", "have not");
  }
  return vb2.remove("will");
};
const toArray = function(m2) {
  if (!m2 || !m2.isView) {
    return [];
  }
  const opts2 = { normal: true, terms: false, text: false };
  return m2.json(opts2).map((s2) => s2.normal);
};
const toText = function(m2) {
  if (!m2 || !m2.isView) {
    return "";
  }
  return m2.text("normal");
};
const toInf$1 = function(root) {
  const { toInfinitive: toInfinitive2 } = root.methods.two.transform.verb;
  const str = root.text("normal");
  return toInfinitive2(str, root.model, getTense(root));
};
const toJSON = function(vb2) {
  const parsed = parseVerb(vb2);
  vb2 = vb2.clone().toView();
  const info = getGrammar(vb2, parsed);
  return {
    root: parsed.root.text(),
    preAdverbs: toArray(parsed.adverbs.pre),
    postAdverbs: toArray(parsed.adverbs.post),
    auxiliary: toText(parsed.auxiliary),
    negative: parsed.negative.found,
    prefix: toText(parsed.prefix),
    infinitive: toInf$1(parsed.root),
    grammar: info
  };
};
const keep$5 = { tags: true };
const toInf = function(vb2, parsed) {
  const { toInfinitive: toInfinitive2 } = vb2.methods.two.transform.verb;
  const { root, auxiliary: auxiliary2 } = parsed;
  const aux = auxiliary2.terms().harden();
  let str = root.text("normal");
  str = toInfinitive2(str, vb2.model, getTense(root));
  if (str) {
    vb2.replace(root, str, keep$5).tag("Verb").firstTerm().tag("Infinitive");
  }
  if (aux.found) {
    vb2.remove(aux);
  }
  if (parsed.negative.found) {
    if (!vb2.has("not")) {
      vb2.prepend("not");
    }
    const does = doDoes(vb2);
    vb2.prepend(does);
  }
  vb2.fullSentence().compute(["freeze", "lexicon", "preTagger", "postTagger", "unfreeze", "chunks"]);
  return vb2;
};
const keep$4 = { tags: true };
const fns = {
  noAux: (vb2, parsed) => {
    if (parsed.auxiliary.found) {
      vb2 = vb2.remove(parsed.auxiliary);
    }
    return vb2;
  },
  // walk->walked
  simple: (vb2, parsed) => {
    const { conjugate: conjugate2, toInfinitive: toInfinitive2 } = vb2.methods.two.transform.verb;
    const root = parsed.root;
    if (root.has("#Modal")) {
      return vb2;
    }
    let str = root.text({ keepPunct: false });
    str = toInfinitive2(str, vb2.model, getTense(root));
    const all2 = conjugate2(str, vb2.model);
    str = all2.PastTense;
    str = str === "been" ? "was" : str;
    if (str === "was") {
      str = wasWere(vb2);
    }
    if (str) {
      vb2.replace(root, str, keep$4);
    }
    return vb2;
  },
  both: function(vb2, parsed) {
    if (parsed.negative.found) {
      vb2.replace("will", "did");
      return vb2;
    }
    vb2 = fns.simple(vb2, parsed);
    vb2 = fns.noAux(vb2, parsed);
    return vb2;
  },
  hasHad: (vb2) => {
    vb2.replace("has", "had", keep$4);
    return vb2;
  },
  // some verbs have this weird past-tense form
  // drive -> driven, (!drove)
  hasParticiple: (vb2, parsed) => {
    const { conjugate: conjugate2, toInfinitive: toInfinitive2 } = vb2.methods.two.transform.verb;
    const root = parsed.root;
    let str = root.text("normal");
    str = toInfinitive2(str, vb2.model, getTense(root));
    return conjugate2(str, vb2.model).Participle;
  }
};
const forms$4 = {
  // walk -> walked
  "infinitive": fns.simple,
  // he walks -> he walked
  "simple-present": fns.simple,
  // he walked
  "simple-past": noop,
  // he will walk -> he walked
  "simple-future": fns.both,
  // he is walking
  "present-progressive": (vb2) => {
    vb2.replace("are", "were", keep$4);
    vb2.replace("(is|are|am)", "was", keep$4);
    return vb2;
  },
  // he was walking
  "past-progressive": noop,
  // he will be walking
  "future-progressive": (vb2, parsed) => {
    vb2.match(parsed.root).insertBefore("was");
    vb2.remove("(will|be)");
    return vb2;
  },
  // has walked -> had walked (?)
  "present-perfect": fns.hasHad,
  // had walked
  "past-perfect": noop,
  // will have walked -> had walked
  "future-perfect": (vb2, parsed) => {
    vb2.match(parsed.root).insertBefore("had");
    if (vb2.has("will")) {
      vb2 = noWill(vb2);
    }
    vb2.remove("have");
    return vb2;
  },
  // has been walking -> had been
  "present-perfect-progressive": fns.hasHad,
  // had been walking
  "past-perfect-progressive": noop,
  // will have been -> had
  "future-perfect-progressive": (vb2) => {
    vb2.remove("will");
    vb2.replace("have", "had", keep$4);
    return vb2;
  },
  // got walked
  "passive-past": (vb2) => {
    vb2.replace("have", "had", keep$4);
    return vb2;
  },
  // is being walked  -> 'was being walked'
  "passive-present": (vb2) => {
    vb2.replace("(is|are)", "was", keep$4);
    return vb2;
  },
  // will be walked -> had been walked
  "passive-future": (vb2, parsed) => {
    if (parsed.auxiliary.has("will be")) {
      vb2.match(parsed.root).insertBefore("had been");
      vb2.remove("(will|be)");
    }
    if (parsed.auxiliary.has("will have been")) {
      vb2.replace("have", "had", keep$4);
      vb2.remove("will");
    }
    return vb2;
  },
  // would be walked -> 'would have been walked'
  "present-conditional": (vb2) => {
    vb2.replace("be", "have been");
    return vb2;
  },
  // would have been walked
  "past-conditional": noop,
  // is going to drink -> was going to drink
  "auxiliary-future": (vb2) => {
    vb2.replace("(is|are|am)", "was", keep$4);
    return vb2;
  },
  // used to walk
  "auxiliary-past": noop,
  // we do walk -> we did walk
  "auxiliary-present": (vb2) => {
    vb2.replace("(do|does)", "did", keep$4);
    return vb2;
  },
  // must walk -> 'must have walked'
  "modal-infinitive": (vb2, parsed) => {
    if (vb2.has("can")) {
      vb2.replace("can", "could", keep$4);
    } else {
      fns.simple(vb2, parsed);
      vb2.match("#Modal").insertAfter("have").tag("Auxiliary");
    }
    return vb2;
  },
  // must have walked
  "modal-past": noop,
  // wanted to walk
  "want-infinitive": (vb2) => {
    vb2.replace("(want|wants)", "wanted", keep$4);
    vb2.remove("will");
    return vb2;
  },
  // started looking
  "gerund-phrase": (vb2, parsed) => {
    parsed.root = parsed.root.not("#Gerund$");
    fns.simple(vb2, parsed);
    noWill(vb2);
    return vb2;
  }
};
const toPast$1 = function(vb2, parsed, form) {
  if (forms$4.hasOwnProperty(form)) {
    vb2 = forms$4[form](vb2, parsed);
    vb2.fullSentence().compute(["tagger", "chunks"]);
    return vb2;
  }
  return vb2;
};
const haveHas = function(vb2, parsed) {
  const subj = getSubject(vb2);
  const m2 = subj.subject;
  if (m2.has("(i|we|you)")) {
    return "have";
  }
  if (subj.plural === false) {
    return "has";
  }
  if (m2.has("he") || m2.has("she") || m2.has("#Person")) {
    return "has";
  }
  return "have";
};
const simple$2 = (vb2, parsed) => {
  const { conjugate: conjugate2, toInfinitive: toInfinitive2 } = vb2.methods.two.transform.verb;
  const { root, auxiliary: auxiliary2 } = parsed;
  if (root.has("#Modal")) {
    return vb2;
  }
  let str = root.text({ keepPunct: false });
  str = toInfinitive2(str, vb2.model, getTense(root));
  const all2 = conjugate2(str, vb2.model);
  str = all2.Participle || all2.PastTense;
  if (str) {
    vb2 = vb2.replace(root, str);
    const have = haveHas(vb2);
    vb2.prepend(have).match(have).tag("Auxiliary");
    vb2.remove(auxiliary2);
  }
  return vb2;
};
const forms$3 = {
  // walk -> walked
  "infinitive": simple$2,
  // he walks -> he walked
  "simple-present": simple$2,
  // he walked
  // 'simple-past': noop,
  // he will walk -> he walked
  "simple-future": (vb2, parsed) => vb2.replace("will", haveHas(vb2)),
  // he is walking
  // 'present-progressive': noop,
  // he was walking
  // 'past-progressive': noop,
  // he will be walking
  // 'future-progressive': noop,
  // has walked -> had walked (?)
  "present-perfect": noop,
  // had walked
  "past-perfect": noop,
  // will have walked -> had walked
  "future-perfect": (vb2, parsed) => vb2.replace("will have", haveHas(vb2)),
  // has been walking -> had been
  "present-perfect-progressive": noop,
  // had been walking
  "past-perfect-progressive": noop,
  // will have been -> had
  "future-perfect-progressive": noop
  // got walked
  // 'passive-past': noop,
  // is being walked  -> 'was being walked'
  // 'passive-present': noop,
  // will be walked -> had been walked
  // 'passive-future': noop,
  // would be walked -> 'would have been walked'
  // 'present-conditional': noop,
  // would have been walked
  // 'past-conditional': noop,
  // is going to drink -> was going to drink
  // 'auxiliary-future': noop,
  // used to walk
  // 'auxiliary-past': noop,
  // we do walk -> we did walk
  // 'auxiliary-present': noop,
  // must walk -> 'must have walked'
  // 'modal-infinitive': noop,
  // must have walked
  // 'modal-past': noop,
  // wanted to walk
  // 'want-infinitive': noop,
  // started looking
  // 'gerund-phrase': noop,
};
const toPast = function(vb2, parsed, form) {
  if (forms$3.hasOwnProperty(form)) {
    vb2 = forms$3[form](vb2, parsed);
    vb2.fullSentence().compute(["tagger", "chunks"]);
    return vb2;
  }
  vb2 = simple$2(vb2, parsed);
  vb2.fullSentence().compute(["tagger", "chunks"]);
  return vb2;
};
const keep$3 = { tags: true };
const simple$1 = (vb2, parsed) => {
  const { conjugate: conjugate2, toInfinitive: toInfinitive2 } = vb2.methods.two.transform.verb;
  const root = parsed.root;
  let str = root.text("normal");
  str = toInfinitive2(str, vb2.model, getTense(root));
  if (isPlural(vb2) === false) {
    str = conjugate2(str, vb2.model).PresentTense;
  }
  if (root.has("#Copula")) {
    str = isAreAm(vb2);
  }
  if (str) {
    vb2 = vb2.replace(root, str, keep$3);
    vb2.not("#Particle").tag("PresentTense");
  }
  return vb2;
};
const toGerund$1 = (vb2, parsed) => {
  const { conjugate: conjugate2, toInfinitive: toInfinitive2 } = vb2.methods.two.transform.verb;
  const root = parsed.root;
  let str = root.text("normal");
  str = toInfinitive2(str, vb2.model, getTense(root));
  if (isPlural(vb2) === false) {
    str = conjugate2(str, vb2.model).Gerund;
  }
  if (str) {
    vb2 = vb2.replace(root, str, keep$3);
    vb2.not("#Particle").tag("Gerund");
  }
  return vb2;
};
const vbToInf = (vb2, parsed) => {
  const { toInfinitive: toInfinitive2 } = vb2.methods.two.transform.verb;
  const root = parsed.root;
  let str = parsed.root.text("normal");
  str = toInfinitive2(str, vb2.model, getTense(root));
  if (str) {
    vb2 = vb2.replace(parsed.root, str, keep$3);
  }
  return vb2;
};
const forms$2 = {
  // walk
  "infinitive": simple$1,
  // he walks -> he walked
  "simple-present": (vb2, parsed) => {
    const { conjugate: conjugate2 } = vb2.methods.two.transform.verb;
    const { root } = parsed;
    if (root.has("#Infinitive")) {
      const subj = getSubject(vb2);
      const m2 = subj.subject;
      if (isPlural(vb2) || m2.has("i")) {
        return vb2;
      }
      const str = root.text("normal");
      const pres = conjugate2(str, vb2.model).PresentTense;
      if (str !== pres) {
        vb2.replace(root, pres, keep$3);
      }
    } else {
      return simple$1(vb2, parsed);
    }
    return vb2;
  },
  // he walked
  "simple-past": simple$1,
  // he will walk -> he walked
  "simple-future": (vb2, parsed) => {
    const { root, auxiliary: auxiliary2 } = parsed;
    if (auxiliary2.has("will") && root.has("be")) {
      const str = isAreAm(vb2);
      vb2.replace(root, str);
      vb2 = vb2.remove("will");
      vb2.replace("not " + str, str + " not");
    } else {
      simple$1(vb2, parsed);
      vb2 = vb2.remove("will");
    }
    return vb2;
  },
  // is walking ->
  "present-progressive": noop,
  // was walking -> is walking
  "past-progressive": (vb2, parsed) => {
    const str = isAreAm(vb2);
    return vb2.replace("(were|was)", str, keep$3);
  },
  // will be walking -> is walking
  "future-progressive": (vb2) => {
    vb2.match("will").insertBefore("is");
    vb2.remove("be");
    return vb2.remove("will");
  },
  // has walked ->  (?)
  "present-perfect": (vb2, parsed) => {
    simple$1(vb2, parsed);
    vb2 = vb2.remove("(have|had|has)");
    return vb2;
  },
  // had walked -> has walked
  "past-perfect": (vb2, parsed) => {
    const subj = getSubject(vb2);
    const m2 = subj.subject;
    if (isPlural(vb2) || m2.has("i")) {
      vb2 = toInf$2(vb2, parsed);
      vb2.remove("had");
      return vb2;
    }
    vb2.replace("had", "has", keep$3);
    return vb2;
  },
  // will have walked -> has walked
  "future-perfect": (vb2) => {
    vb2.match("will").insertBefore("has");
    return vb2.remove("have").remove("will");
  },
  // has been walking
  "present-perfect-progressive": noop,
  // had been walking
  "past-perfect-progressive": (vb2) => vb2.replace("had", "has", keep$3),
  // will have been -> has been
  "future-perfect-progressive": (vb2) => {
    vb2.match("will").insertBefore("has");
    return vb2.remove("have").remove("will");
  },
  // got walked -> is walked
  // was walked -> is walked
  // had been walked -> is walked
  "passive-past": (vb2, parsed) => {
    const str = isAreAm(vb2);
    if (vb2.has("(had|have|has)") && vb2.has("been")) {
      vb2.replace("(had|have|has)", str, keep$3);
      vb2.replace("been", "being");
      return vb2;
    }
    return vb2.replace("(got|was|were)", str);
  },
  // is being walked  ->
  "passive-present": noop,
  // will be walked -> is being walked
  "passive-future": (vb2) => {
    vb2.replace("will", "is");
    return vb2.replace("be", "being");
  },
  // would be walked ->
  "present-conditional": noop,
  // would have been walked ->
  "past-conditional": (vb2) => {
    vb2.replace("been", "be");
    return vb2.remove("have");
  },
  // is going to drink -> is drinking
  "auxiliary-future": (vb2, parsed) => {
    toGerund$1(vb2, parsed);
    vb2.remove("(going|to)");
    return vb2;
  },
  // used to walk -> is walking
  // did walk -> is walking
  "auxiliary-past": (vb2, parsed) => {
    if (parsed.auxiliary.has("did")) {
      const str = doDoes(vb2);
      vb2.replace(parsed.auxiliary, str);
      return vb2;
    }
    toGerund$1(vb2, parsed);
    vb2.replace(parsed.auxiliary, "is");
    return vb2;
  },
  // we do walk ->
  "auxiliary-present": noop,
  // must walk -> 'must have walked'
  "modal-infinitive": noop,
  // must have walked
  "modal-past": (vb2, parsed) => {
    vbToInf(vb2, parsed);
    return vb2.remove("have");
  },
  // started looking
  "gerund-phrase": (vb2, parsed) => {
    parsed.root = parsed.root.not("#Gerund$");
    simple$1(vb2, parsed);
    return vb2.remove("(will|have)");
  },
  // wanted to walk
  "want-infinitive": (vb2, parsed) => {
    let str = "wants";
    if (isPlural(vb2)) {
      str = "want";
    }
    vb2.replace("(want|wanted|wants)", str, keep$3);
    vb2.remove("will");
    return vb2;
  }
};
const toPresent = function(vb2, parsed, form) {
  if (forms$2.hasOwnProperty(form)) {
    vb2 = forms$2[form](vb2, parsed);
    vb2.fullSentence().compute(["tagger", "chunks"]);
    return vb2;
  }
  return vb2;
};
const keep$2 = { tags: true };
const simple = (vb2, parsed) => {
  const { toInfinitive: toInfinitive2 } = vb2.methods.two.transform.verb;
  const { root, auxiliary: auxiliary2 } = parsed;
  if (root.has("#Modal")) {
    return vb2;
  }
  let str = root.text("normal");
  str = toInfinitive2(str, vb2.model, getTense(root));
  if (str) {
    vb2 = vb2.replace(root, str, keep$2);
    vb2.not("#Particle").tag("Verb");
  }
  vb2.prepend("will").match("will").tag("Auxiliary");
  vb2.remove(auxiliary2);
  return vb2;
};
const progressive = (vb2, parsed) => {
  const { conjugate: conjugate2, toInfinitive: toInfinitive2 } = vb2.methods.two.transform.verb;
  const { root, auxiliary: auxiliary2 } = parsed;
  let str = root.text("normal");
  str = toInfinitive2(str, vb2.model, getTense(root));
  if (str) {
    str = conjugate2(str, vb2.model).Gerund;
    vb2.replace(root, str, keep$2);
    vb2.not("#Particle").tag("PresentTense");
  }
  vb2.remove(auxiliary2);
  vb2.prepend("will be").match("will be").tag("Auxiliary");
  return vb2;
};
const forms$1 = {
  // walk ->
  "infinitive": simple,
  // he walks ->
  "simple-present": simple,
  // he walked
  "simple-past": simple,
  // he will walk ->
  "simple-future": noop,
  // is walking ->
  "present-progressive": progressive,
  // was walking ->
  "past-progressive": progressive,
  // will be walking ->
  "future-progressive": noop,
  // has walked ->
  "present-perfect": (vb2) => {
    vb2.match("(have|has)").replaceWith("will have");
    return vb2;
  },
  // had walked ->
  "past-perfect": (vb2) => vb2.replace("(had|has)", "will have"),
  // will have walked ->
  "future-perfect": noop,
  // has been walking
  "present-perfect-progressive": (vb2) => vb2.replace("has", "will have"),
  // had been walking
  "past-perfect-progressive": (vb2) => vb2.replace("had", "will have"),
  // will have been ->
  "future-perfect-progressive": noop,
  // got walked ->
  // was walked ->
  // was being walked ->
  // had been walked ->
  "passive-past": (vb2) => {
    if (vb2.has("got")) {
      return vb2.replace("got", "will get");
    }
    if (vb2.has("(was|were)")) {
      vb2.replace("(was|were)", "will be");
      return vb2.remove("being");
    }
    if (vb2.has("(have|has|had) been")) {
      return vb2.replace("(have|has|had) been", "will be");
    }
    return vb2;
  },
  // is being walked  ->
  "passive-present": (vb2) => {
    vb2.replace("being", "will be");
    vb2.remove("(is|are|am)");
    return vb2;
  },
  // will be walked ->
  "passive-future": noop,
  // would be walked ->
  "present-conditional": (vb2) => vb2.replace("would", "will"),
  // would have been walked ->
  "past-conditional": (vb2) => vb2.replace("would", "will"),
  // is going to drink ->
  "auxiliary-future": noop,
  // used to walk -> is walking
  // did walk -> is walking
  "auxiliary-past": (vb2) => {
    if (vb2.has("used") && vb2.has("to")) {
      vb2.replace("used", "will");
      return vb2.remove("to");
    }
    vb2.replace("did", "will");
    return vb2;
  },
  // we do walk ->
  // he does walk ->
  "auxiliary-present": (vb2) => {
    return vb2.replace("(do|does)", "will");
  },
  // must walk ->
  "modal-infinitive": noop,
  // must have walked
  "modal-past": noop,
  // started looking
  "gerund-phrase": (vb2, parsed) => {
    parsed.root = parsed.root.not("#Gerund$");
    simple(vb2, parsed);
    return vb2.remove("(had|have)");
  },
  // wanted to walk
  "want-infinitive": (vb2) => {
    vb2.replace("(want|wants|wanted)", "will want");
    return vb2;
  }
};
const toFuture = function(vb2, parsed, form) {
  if (vb2.has("will") || vb2.has("going to")) {
    return vb2;
  }
  if (forms$1.hasOwnProperty(form)) {
    vb2 = forms$1[form](vb2, parsed);
    vb2.fullSentence().compute(["tagger", "chunks"]);
    return vb2;
  }
  return vb2;
};
const keep$1 = { tags: true };
const toGerund = function(vb2, parsed) {
  const { toInfinitive: toInfinitive2, conjugate: conjugate2 } = vb2.methods.two.transform.verb;
  const { root, auxiliary: auxiliary2 } = parsed;
  if (vb2.has("#Gerund")) {
    return vb2;
  }
  let str = root.text("normal");
  str = toInfinitive2(str, vb2.model, getTense(root));
  const gerund2 = conjugate2(str, vb2.model).Gerund;
  if (gerund2) {
    const aux = isAreAm(vb2);
    vb2.replace(root, gerund2, keep$1);
    vb2.remove(auxiliary2);
    vb2.prepend(aux);
  }
  vb2.replace("not is", "is not");
  vb2.replace("not are", "are not");
  vb2.fullSentence().compute(["tagger", "chunks"]);
  return vb2;
};
const keep = { tags: true };
const doesNot = function(vb2, parsed) {
  const does = doDoes(vb2);
  vb2.prepend(does + " not");
  return vb2;
};
const isWas = function(vb2) {
  let m2 = vb2.match("be");
  if (m2.found) {
    m2.prepend("not");
    return vb2;
  }
  m2 = vb2.match("(is|was|am|are|will|were)");
  if (m2.found) {
    m2.append("not");
    return vb2;
  }
  return vb2;
};
const hasCopula = (vb2) => vb2.has("(is|was|am|are|will|were|be)");
const forms = {
  // he walks' -> 'he does not walk'
  "simple-present": (vb2, parsed) => {
    if (hasCopula(vb2) === true) {
      return isWas(vb2);
    }
    vb2 = toInf$2(vb2, parsed);
    vb2 = doesNot(vb2);
    return vb2;
  },
  // 'he walked' -> 'he did not walk'
  "simple-past": (vb2, parsed) => {
    if (hasCopula(vb2) === true) {
      return isWas(vb2);
    }
    vb2 = toInf$2(vb2, parsed);
    vb2.prepend("did not");
    return vb2;
  },
  // walk! -> 'do not walk'
  "imperative": (vb2) => {
    vb2.prepend("do not");
    return vb2;
  },
  // walk -> does not walk
  "infinitive": (vb2, parsed) => {
    if (hasCopula(vb2) === true) {
      return isWas(vb2);
    }
    return doesNot(vb2);
  },
  "passive-past": (vb2) => {
    if (vb2.has("got")) {
      vb2.replace("got", "get", keep);
      vb2.prepend("did not");
      return vb2;
    }
    const m2 = vb2.match("(was|were|had|have)");
    if (m2.found) {
      m2.append("not");
    }
    return vb2;
  },
  "auxiliary-past": (vb2) => {
    if (vb2.has("used")) {
      vb2.prepend("did not");
      return vb2;
    }
    const m2 = vb2.match("(did|does|do)");
    if (m2.found) {
      m2.append("not");
    }
    return vb2;
  },
  // wants to walk
  "want-infinitive": (vb2, parsed) => {
    vb2 = doesNot(vb2);
    vb2 = vb2.replace("wants", "want", keep);
    return vb2;
  }
};
const toNegative = function(vb2, parsed, form) {
  if (vb2.has("#Negative")) {
    return vb2;
  }
  if (forms.hasOwnProperty(form)) {
    vb2 = forms[form](vb2, parsed);
    return vb2;
  }
  let m2 = vb2.matchOne("be");
  if (m2.found) {
    m2.prepend("not");
    return vb2;
  }
  if (hasCopula(vb2) === true) {
    return isWas(vb2);
  }
  m2 = vb2.matchOne("(will|had|have|has|did|does|do|#Modal)");
  if (m2.found) {
    m2.append("not");
    return vb2;
  }
  return vb2;
};
const api$1 = function(View2) {
  class Verbs extends View2 {
    constructor(document, pointer, groups) {
      super(document, pointer, groups);
      this.viewType = "Verbs";
    }
    parse(n2) {
      return this.getNth(n2).map(parseVerb);
    }
    json(opts2, n2) {
      const m2 = this.getNth(n2);
      const arr = m2.map((vb2) => {
        const json = vb2.toView().json(opts2)[0] || {};
        json.verb = toJSON(vb2);
        return json;
      }, []);
      return arr;
    }
    subjects(n2) {
      return this.getNth(n2).map((vb2) => {
        parseVerb(vb2);
        return getSubject(vb2).subject;
      });
    }
    adverbs(n2) {
      return this.getNth(n2).map((vb2) => vb2.match("#Adverb"));
    }
    isSingular(n2) {
      return this.getNth(n2).filter((vb2) => {
        return getSubject(vb2).plural !== true;
      });
    }
    isPlural(n2) {
      return this.getNth(n2).filter((vb2) => {
        return getSubject(vb2).plural === true;
      });
    }
    isImperative(n2) {
      return this.getNth(n2).filter((vb2) => vb2.has("#Imperative"));
    }
    toInfinitive(n2) {
      return this.getNth(n2).map((vb2) => {
        const parsed = parseVerb(vb2);
        const info = getGrammar(vb2, parsed);
        return toInf(vb2, parsed, info.form);
      });
    }
    toPresentTense(n2) {
      return this.getNth(n2).map((vb2) => {
        const parsed = parseVerb(vb2);
        const info = getGrammar(vb2, parsed);
        if (info.isInfinitive) {
          return vb2;
        }
        return toPresent(vb2, parsed, info.form);
      });
    }
    toPastTense(n2) {
      return this.getNth(n2).map((vb2) => {
        const parsed = parseVerb(vb2);
        const info = getGrammar(vb2, parsed);
        if (info.isInfinitive) {
          return vb2;
        }
        return toPast$1(vb2, parsed, info.form);
      });
    }
    toFutureTense(n2) {
      return this.getNth(n2).map((vb2) => {
        const parsed = parseVerb(vb2);
        const info = getGrammar(vb2, parsed);
        if (info.isInfinitive) {
          return vb2;
        }
        return toFuture(vb2, parsed, info.form);
      });
    }
    toGerund(n2) {
      return this.getNth(n2).map((vb2) => {
        const parsed = parseVerb(vb2);
        const info = getGrammar(vb2, parsed);
        if (info.isInfinitive) {
          return vb2;
        }
        return toGerund(vb2, parsed, info.form);
      });
    }
    toPastParticiple(n2) {
      return this.getNth(n2).map((vb2) => {
        const parsed = parseVerb(vb2);
        const info = getGrammar(vb2, parsed);
        if (info.isInfinitive) {
          return vb2;
        }
        return toPast(vb2, parsed, info.form);
      });
    }
    conjugate(n2) {
      const { conjugate: conjugate2, toInfinitive: toInfinitive2 } = this.world.methods.two.transform.verb;
      return this.getNth(n2).map((vb2) => {
        const parsed = parseVerb(vb2);
        const info = getGrammar(vb2, parsed);
        if (info.form === "imperative") {
          info.form = "simple-present";
        }
        let inf = parsed.root.text("normal");
        if (!parsed.root.has("#Infinitive")) {
          const tense = getTense(parsed.root);
          inf = toInfinitive2(inf, vb2.model, tense) || inf;
        }
        return conjugate2(inf, vb2.model);
      }, []);
    }
    /** return only verbs with 'not'*/
    isNegative() {
      return this.if("#Negative");
    }
    /**  return only verbs without 'not'*/
    isPositive() {
      return this.ifNo("#Negative");
    }
    /** remove 'not' from these verbs */
    toPositive() {
      const m2 = this.match("do not #Verb");
      if (m2.found) {
        m2.remove("do not");
      }
      return this.remove("#Negative");
    }
    toNegative(n2) {
      return this.getNth(n2).map((vb2) => {
        const parsed = parseVerb(vb2);
        const info = getGrammar(vb2, parsed);
        return toNegative(vb2, parsed, info.form);
      });
    }
    // overloaded - keep Verb class
    update(pointer) {
      const m2 = new Verbs(this.document, pointer);
      m2._cache = this._cache;
      return m2;
    }
  }
  Verbs.prototype.toPast = Verbs.prototype.toPastTense;
  Verbs.prototype.toPresent = Verbs.prototype.toPresentTense;
  Verbs.prototype.toFuture = Verbs.prototype.toFutureTense;
  View2.prototype.verbs = function(n2) {
    let vb2 = findVerbs(this);
    vb2 = vb2.getNth(n2);
    return new Verbs(this.document, vb2.pointer);
  };
};
const verbs = {
  api: api$1
};
const findChained = function(want, s2) {
  const m2 = s2.match(want);
  if (m2.found) {
    const ref = m2.pronouns().refersTo();
    if (ref.found) {
      return ref;
    }
  }
  return s2.none();
};
const prevSentence = function(m2) {
  if (!m2.found) {
    return m2;
  }
  const [n2] = m2.fullPointer[0];
  if (n2 && n2 > 0) {
    return m2.update([[n2 - 1]]);
  }
  return m2.none();
};
const byGender = function(ppl, gender) {
  if (gender === "m") {
    return ppl.filter((m2) => !m2.presumedFemale().found);
  } else if (gender === "f") {
    return ppl.filter((m2) => !m2.presumedMale().found);
  }
  return ppl;
};
const getPerson = function(s2, gender) {
  let people = s2.people();
  people = byGender(people, gender);
  if (people.found) {
    return people.last();
  }
  people = s2.nouns("#Actor");
  if (people.found) {
    return people.last();
  }
  if (gender === "f") {
    return findChained("(she|her|hers)", s2);
  }
  if (gender === "m") {
    return findChained("(he|him|his)", s2);
  }
  return s2.none();
};
const getThey = function(s2) {
  const nouns2 = s2.nouns();
  let things = nouns2.isPlural().notIf("#Pronoun");
  if (things.found) {
    return things.last();
  }
  const chain = findChained("(they|their|theirs)", s2);
  if (chain.found) {
    return chain;
  }
  things = nouns2.match("(somebody|nobody|everybody|anybody|someone|noone|everyone|anyone)");
  if (things.found) {
    return things.last();
  }
  return s2.none();
};
const addReference = function(pron, m2) {
  if (m2 && m2.found) {
    const term = pron.docs[0][0];
    term.reference = m2.ptrs[0];
  }
};
const stepBack = function(m2, cb) {
  let s2 = m2.before();
  let res = cb(s2);
  if (res.found) {
    return res;
  }
  s2 = prevSentence(m2);
  res = cb(s2);
  if (res.found) {
    return res;
  }
  s2 = prevSentence(s2);
  res = cb(s2);
  if (res.found) {
    return res;
  }
  return m2.none();
};
const coreference$1 = function(view) {
  const pronouns = view.pronouns().if("(he|him|his|she|her|hers|they|their|theirs|it|its)");
  pronouns.forEach((pron) => {
    let res = null;
    if (pron.has("(he|him|his)")) {
      res = stepBack(pron, (m2) => getPerson(m2, "m"));
    } else if (pron.has("(she|her|hers)")) {
      res = stepBack(pron, (m2) => getPerson(m2, "f"));
    } else if (pron.has("(they|their|theirs)")) {
      res = stepBack(pron, getThey);
    }
    if (res && res.found) {
      addReference(pron, res);
    }
  });
};
const api = function(View2) {
  class Pronouns extends View2 {
    constructor(document, pointer, groups) {
      super(document, pointer, groups);
      this.viewType = "Pronouns";
    }
    hasReference() {
      this.compute("coreference");
      return this.filter((m2) => {
        const term = m2.docs[0][0];
        return term.reference;
      });
    }
    // get the noun-phrase this pronoun refers to
    refersTo() {
      this.compute("coreference");
      return this.map((m2) => {
        if (!m2.found) {
          return m2.none();
        }
        const term = m2.docs[0][0];
        if (term.reference) {
          return m2.update([term.reference]);
        }
        return m2.none();
      });
    }
    // overloaded - keep Numbers class
    update(pointer) {
      const m2 = new Pronouns(this.document, pointer);
      m2._cache = this._cache;
      return m2;
    }
  }
  View2.prototype.pronouns = function(n2) {
    let m2 = this.match("#Pronoun");
    m2 = m2.getNth(n2);
    return new Pronouns(m2.document, m2.pointer);
  };
};
const coreference = {
  compute: { coreference: coreference$1 },
  api
};
nlp.plugin(adjectives);
nlp.plugin(adverbs);
nlp.plugin(chunker);
nlp.plugin(coreference);
nlp.plugin(misc);
nlp.plugin(normalize);
nlp.plugin(nouns);
nlp.plugin(numbers);
nlp.plugin(plugin);
nlp.plugin(sentences);
nlp.plugin(topics);
nlp.plugin(verbs);
export {
  nlp as n
};
