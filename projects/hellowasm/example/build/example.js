// The Module object: Our interface to the outside world. We import
// and export values on it, and do the work to get that through
// closure compiler if necessary. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to do an eval in order to handle the closure compiler
// case, where this code here is minified but Module was defined
// elsewhere (e.g. case 4 above). We also need to check if Module
// already exists (e.g. case 3 above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module;
if (!Module) Module = (typeof Module !== 'undefined' ? Module : null) || {};

// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
for (var key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}

// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_WEB = false;
var ENVIRONMENT_IS_WORKER = false;
var ENVIRONMENT_IS_NODE = false;
var ENVIRONMENT_IS_SHELL = false;

// Three configurations we can be running in:
// 1) We could be the application main() thread running in the main JS UI thread. (ENVIRONMENT_IS_WORKER == false and ENVIRONMENT_IS_PTHREAD == false)
// 2) We could be the application main() thread proxied to worker. (with Emscripten -s PROXY_TO_WORKER=1) (ENVIRONMENT_IS_WORKER == true, ENVIRONMENT_IS_PTHREAD == false)
// 3) We could be an application pthread running in a worker. (ENVIRONMENT_IS_WORKER == true and ENVIRONMENT_IS_PTHREAD == true)

if (Module['ENVIRONMENT']) {
  if (Module['ENVIRONMENT'] === 'WEB') {
    ENVIRONMENT_IS_WEB = true;
  } else if (Module['ENVIRONMENT'] === 'WORKER') {
    ENVIRONMENT_IS_WORKER = true;
  } else if (Module['ENVIRONMENT'] === 'NODE') {
    ENVIRONMENT_IS_NODE = true;
  } else if (Module['ENVIRONMENT'] === 'SHELL') {
    ENVIRONMENT_IS_SHELL = true;
  } else {
    throw new Error('The provided Module[\'ENVIRONMENT\'] value is not valid. It must be one of: WEB|WORKER|NODE|SHELL.');
  }
} else {
  ENVIRONMENT_IS_WEB = typeof window === 'object';
  ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
  ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function' && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER;
  ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
}


if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  if (!Module['print']) Module['print'] = console.log;
  if (!Module['printErr']) Module['printErr'] = console.warn;

  var nodeFS;
  var nodePath;

  Module['read'] = function shell_read(filename, binary) {
    if (!nodeFS) nodeFS = require('fs');
    if (!nodePath) nodePath = require('path');
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    return binary ? ret : ret.toString();
  };

  Module['readBinary'] = function readBinary(filename) {
    var ret = Module['read'](filename, true);
    if (!ret.buffer) {
      ret = new Uint8Array(ret);
    }
    assert(ret.buffer);
    return ret;
  };

  Module['load'] = function load(f) {
    globalEval(read(f));
  };

  if (!Module['thisProgram']) {
    if (process['argv'].length > 1) {
      Module['thisProgram'] = process['argv'][1].replace(/\\/g, '/');
    } else {
      Module['thisProgram'] = 'unknown-program';
    }
  }

  Module['arguments'] = process['argv'].slice(2);

  if (typeof module !== 'undefined') {
    module['exports'] = Module;
  }

  process['on']('uncaughtException', function(ex) {
    // suppress ExitStatus exceptions from showing an error
    if (!(ex instanceof ExitStatus)) {
      throw ex;
    }
  });

  Module['inspect'] = function () { return '[Emscripten Module object]'; };
}
else if (ENVIRONMENT_IS_SHELL) {
  if (!Module['print']) Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm

  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function shell_read() { throw 'no read() available' };
  }

  Module['readBinary'] = function readBinary(f) {
    if (typeof readbuffer === 'function') {
      return new Uint8Array(readbuffer(f));
    }
    var data = read(f, 'binary');
    assert(typeof data === 'object');
    return data;
  };

  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

  if (typeof quit === 'function') {
    Module['quit'] = function(status, toThrow) {
      quit(status);
    }
  }

}
else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function shell_read(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };

  if (ENVIRONMENT_IS_WORKER) {
    Module['readBinary'] = function readBinary(url) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, false);
      xhr.responseType = 'arraybuffer';
      xhr.send(null);
      return new Uint8Array(xhr.response);
    };
  }

  Module['readAsync'] = function readAsync(url, onload, onerror) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function xhr_onload() {
      if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
        onload(xhr.response);
      } else {
        onerror();
      }
    };
    xhr.onerror = onerror;
    xhr.send(null);
  };

  if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

  if (typeof console !== 'undefined') {
    if (!Module['print']) Module['print'] = function shell_print(x) {
      console.log(x);
    };
    if (!Module['printErr']) Module['printErr'] = function shell_printErr(x) {
      console.warn(x);
    };
  } else {
    // Probably a worker, and without console.log. We can do very little here...
    var TRY_USE_DUMP = false;
    if (!Module['print']) Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }

  if (ENVIRONMENT_IS_WORKER) {
    Module['load'] = importScripts;
  }

  if (typeof Module['setWindowTitle'] === 'undefined') {
    Module['setWindowTitle'] = function(title) { document.title = title };
  }
}
else {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}

function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] && Module['read']) {
  Module['load'] = function load(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
if (!Module['thisProgram']) {
  Module['thisProgram'] = './this.program';
}
if (!Module['quit']) {
  Module['quit'] = function(status, toThrow) {
    throw toThrow;
  }
}

// *** Environment setup code ***

// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];

// Callbacks
Module['preRun'] = [];
Module['postRun'] = [];

// Merge back in the overrides
for (var key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}
// Free the object hierarchy contained in the overrides, this lets the GC
// reclaim data used e.g. in memoryInitializerRequest, which is a large typed array.
moduleOverrides = undefined;



// {{PREAMBLE_ADDITIONS}}

// === Preamble library stuff ===

// Documentation for the public APIs defined in this file must be updated in:
//    site/source/docs/api_reference/preamble.js.rst
// A prebuilt local version of the documentation is available at:
//    site/build/text/docs/api_reference/preamble.js.txt
// You can also build docs locally as HTML or other formats in site/
// An online HTML version (which may be of a different version of Emscripten)
//    is up at http://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html

//========================================
// Runtime code shared with compiler
//========================================

var Runtime = {
  setTempRet0: function (value) {
    tempRet0 = value;
    return value;
  },
  getTempRet0: function () {
    return tempRet0;
  },
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  getNativeTypeSize: function (type) {
    switch (type) {
      case 'i1': case 'i8': return 1;
      case 'i16': return 2;
      case 'i32': return 4;
      case 'i64': return 8;
      case 'float': return 4;
      case 'double': return 8;
      default: {
        if (type[type.length-1] === '*') {
          return Runtime.QUANTUM_SIZE; // A pointer
        } else if (type[0] === 'i') {
          var bits = parseInt(type.substr(1));
          assert(bits % 8 === 0);
          return bits/8;
        } else {
          return 0;
        }
      }
    }
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  STACK_ALIGN: 16,
  prepVararg: function (ptr, type) {
    if (type === 'double' || type === 'i64') {
      // move so the load is aligned
      if (ptr & 7) {
        assert((ptr & 7) === 4);
        ptr += 4;
      }
    } else {
      assert((ptr & 3) === 0);
    }
    return ptr;
  },
  getAlignSize: function (type, size, vararg) {
    // we align i64s and doubles on 64-bit boundaries, unlike x86
    if (!vararg && (type == 'i64' || type == 'double')) return 8;
    if (!type) return Math.min(size, 8); // align structures internally to 64 bits
    return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      return Module['dynCall_' + sig].apply(null, [ptr].concat(args));
    } else {
      return Module['dynCall_' + sig].call(null, ptr);
    }
  },
  functionPointers: [],
  addFunction: function (func) {
    for (var i = 0; i < Runtime.functionPointers.length; i++) {
      if (!Runtime.functionPointers[i]) {
        Runtime.functionPointers[i] = func;
        return 2*(1 + i);
      }
    }
    throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
  },
  removeFunction: function (index) {
    Runtime.functionPointers[(index-2)/2] = null;
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[sig]) {
      Runtime.funcWrappers[sig] = {};
    }
    var sigCache = Runtime.funcWrappers[sig];
    if (!sigCache[func]) {
      // optimize away arguments usage in common cases
      if (sig.length === 1) {
        sigCache[func] = function dynCall_wrapper() {
          return Runtime.dynCall(sig, func);
        };
      } else if (sig.length === 2) {
        sigCache[func] = function dynCall_wrapper(arg) {
          return Runtime.dynCall(sig, func, [arg]);
        };
      } else {
        // general case
        sigCache[func] = function dynCall_wrapper() {
          return Runtime.dynCall(sig, func, Array.prototype.slice.call(arguments));
        };
      }
    }
    return sigCache[func];
  },
  getCompilerSetting: function (name) {
    throw 'You must build with -s RETAIN_COMPILER_SETTINGS=1 for Runtime.getCompilerSetting or emscripten_get_compiler_setting to work';
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = (((STACKTOP)+15)&-16); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = (((STATICTOP)+15)&-16); return ret; },
  dynamicAlloc: function (size) { var ret = HEAP32[DYNAMICTOP_PTR>>2];var end = (((ret + size + 15)|0) & -16);HEAP32[DYNAMICTOP_PTR>>2] = end;if (end >= TOTAL_MEMORY) {var success = enlargeMemory();if (!success) {HEAP32[DYNAMICTOP_PTR>>2] = ret;return 0;}}return ret;},
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 16))*(quantum ? quantum : 16); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((+((low>>>0)))+((+((high>>>0)))*(+4294967296))) : ((+((low>>>0)))+((+((high|0)))*(+4294967296)))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}



Module["Runtime"] = Runtime;



//========================================
// Runtime essentials
//========================================

var ABORT = 0; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var EXITSTATUS = 0;

/** @type {function(*, string=)} */
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}

var globalScope = this;

// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  var func = Module['_' + ident]; // closure exported function
  if (!func) {
    try { func = eval('_' + ident); } catch(e) {}
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}

var cwrap, ccall;
(function(){
  var JSfuncs = {
    // Helpers for cwrap -- it can't refer to Runtime directly because it might
    // be renamed by closure, instead it calls JSfuncs['stackSave'].body to find
    // out what the minified function name is.
    'stackSave': function() {
      Runtime.stackSave()
    },
    'stackRestore': function() {
      Runtime.stackRestore()
    },
    // type conversion from js to c
    'arrayToC' : function(arr) {
      var ret = Runtime.stackAlloc(arr.length);
      writeArrayToMemory(arr, ret);
      return ret;
    },
    'stringToC' : function(str) {
      var ret = 0;
      if (str !== null && str !== undefined && str !== 0) { // null string
        // at most 4 bytes per UTF-8 code point, +1 for the trailing '\0'
        var len = (str.length << 2) + 1;
        ret = Runtime.stackAlloc(len);
        stringToUTF8(str, ret, len);
      }
      return ret;
    }
  };
  // For fast lookup of conversion functions
  var toC = {'string' : JSfuncs['stringToC'], 'array' : JSfuncs['arrayToC']};

  // C calling interface.
  ccall = function ccallFunc(ident, returnType, argTypes, args, opts) {
    var func = getCFunc(ident);
    var cArgs = [];
    var stack = 0;
    if (args) {
      for (var i = 0; i < args.length; i++) {
        var converter = toC[argTypes[i]];
        if (converter) {
          if (stack === 0) stack = Runtime.stackSave();
          cArgs[i] = converter(args[i]);
        } else {
          cArgs[i] = args[i];
        }
      }
    }
    var ret = func.apply(null, cArgs);
    if (returnType === 'string') ret = Pointer_stringify(ret);
    if (stack !== 0) {
      if (opts && opts.async) {
        EmterpreterAsync.asyncFinalizers.push(function() {
          Runtime.stackRestore(stack);
        });
        return;
      }
      Runtime.stackRestore(stack);
    }
    return ret;
  }

  var sourceRegex = /^function\s*[a-zA-Z$_0-9]*\s*\(([^)]*)\)\s*{\s*([^*]*?)[\s;]*(?:return\s*(.*?)[;\s]*)?}$/;
  function parseJSFunc(jsfunc) {
    // Match the body and the return value of a javascript function source
    var parsed = jsfunc.toString().match(sourceRegex).slice(1);
    return {arguments : parsed[0], body : parsed[1], returnValue: parsed[2]}
  }

  // sources of useful functions. we create this lazily as it can trigger a source decompression on this entire file
  var JSsource = null;
  function ensureJSsource() {
    if (!JSsource) {
      JSsource = {};
      for (var fun in JSfuncs) {
        if (JSfuncs.hasOwnProperty(fun)) {
          // Elements of toCsource are arrays of three items:
          // the code, and the return value
          JSsource[fun] = parseJSFunc(JSfuncs[fun]);
        }
      }
    }
  }

  cwrap = function cwrap(ident, returnType, argTypes) {
    argTypes = argTypes || [];
    var cfunc = getCFunc(ident);
    // When the function takes numbers and returns a number, we can just return
    // the original function
    var numericArgs = argTypes.every(function(type){ return type === 'number'});
    var numericRet = (returnType !== 'string');
    if ( numericRet && numericArgs) {
      return cfunc;
    }
    // Creation of the arguments list (["$1","$2",...,"$nargs"])
    var argNames = argTypes.map(function(x,i){return '$'+i});
    var funcstr = "(function(" + argNames.join(',') + ") {";
    var nargs = argTypes.length;
    if (!numericArgs) {
      // Generate the code needed to convert the arguments from javascript
      // values to pointers
      ensureJSsource();
      funcstr += 'var stack = ' + JSsource['stackSave'].body + ';';
      for (var i = 0; i < nargs; i++) {
        var arg = argNames[i], type = argTypes[i];
        if (type === 'number') continue;
        var convertCode = JSsource[type + 'ToC']; // [code, return]
        funcstr += 'var ' + convertCode.arguments + ' = ' + arg + ';';
        funcstr += convertCode.body + ';';
        funcstr += arg + '=(' + convertCode.returnValue + ');';
      }
    }

    // When the code is compressed, the name of cfunc is not literally 'cfunc' anymore
    var cfuncname = parseJSFunc(function(){return cfunc}).returnValue;
    // Call the function
    funcstr += 'var ret = ' + cfuncname + '(' + argNames.join(',') + ');';
    if (!numericRet) { // Return type can only by 'string' or 'number'
      // Convert the result to a string
      var strgfy = parseJSFunc(function(){return Pointer_stringify}).returnValue;
      funcstr += 'ret = ' + strgfy + '(ret);';
    }
    if (!numericArgs) {
      // If we had a stack, restore it
      ensureJSsource();
      funcstr += JSsource['stackRestore'].body.replace('()', '(stack)') + ';';
    }
    funcstr += 'return ret})';
    return eval(funcstr);
  };
})();
Module["ccall"] = ccall;
Module["cwrap"] = cwrap;

/** @type {function(number, number, string, boolean=)} */
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[((ptr)>>0)]=value; break;
      case 'i8': HEAP8[((ptr)>>0)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math_abs(tempDouble))) >= (+1) ? (tempDouble > (+0) ? ((Math_min((+(Math_floor((tempDouble)/(+4294967296)))), (+4294967295)))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+4294967296))))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module["setValue"] = setValue;

/** @type {function(number, string, boolean=)} */
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[((ptr)>>0)];
      case 'i8': return HEAP8[((ptr)>>0)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module["getValue"] = getValue;

var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate
Module["ALLOC_NORMAL"] = ALLOC_NORMAL;
Module["ALLOC_STACK"] = ALLOC_STACK;
Module["ALLOC_STATIC"] = ALLOC_STATIC;
Module["ALLOC_DYNAMIC"] = ALLOC_DYNAMIC;
Module["ALLOC_NONE"] = ALLOC_NONE;

// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
/** @type {function((TypedArray|Array<number>|number), string, number, number=)} */
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }

  var singleType = typeof types === 'string' ? types : null;

  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [typeof _malloc === 'function' ? _malloc : Runtime.staticAlloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }

  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)>>0)]=0;
    }
    return ret;
  }

  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(/** @type {!Uint8Array} */ (slab), ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }

  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];

    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }

    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }

    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later

    setValue(ret+i, curr, type);

    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }

  return ret;
}
Module["allocate"] = allocate;

// Allocate memory during any stage of startup - static memory early on, dynamic memory later, malloc when ready
function getMemory(size) {
  if (!staticSealed) return Runtime.staticAlloc(size);
  if (!runtimeInitialized) return Runtime.dynamicAlloc(size);
  return _malloc(size);
}
Module["getMemory"] = getMemory;

/** @type {function(number, number=)} */
function Pointer_stringify(ptr, length) {
  if (length === 0 || !ptr) return '';
  // TODO: use TextDecoder
  // Find the length, and check for UTF while doing so
  var hasUtf = 0;
  var t;
  var i = 0;
  while (1) {
    t = HEAPU8[(((ptr)+(i))>>0)];
    hasUtf |= t;
    if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;

  var ret = '';

  if (hasUtf < 128) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }
  return Module['UTF8ToString'](ptr);
}
Module["Pointer_stringify"] = Pointer_stringify;

// Given a pointer 'ptr' to a null-terminated ASCII-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

function AsciiToString(ptr) {
  var str = '';
  while (1) {
    var ch = HEAP8[((ptr++)>>0)];
    if (!ch) return str;
    str += String.fromCharCode(ch);
  }
}
Module["AsciiToString"] = AsciiToString;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in ASCII form. The copy will require at most str.length+1 bytes of space in the HEAP.

function stringToAscii(str, outPtr) {
  return writeAsciiToMemory(str, outPtr, false);
}
Module["stringToAscii"] = stringToAscii;

// Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the given array that contains uint8 values, returns
// a copy of that string as a Javascript String object.

var UTF8Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf8') : undefined;
function UTF8ArrayToString(u8Array, idx) {
  var endPtr = idx;
  // TextDecoder needs to know the byte length in advance, it doesn't stop on null terminator by itself.
  // Also, use the length info to avoid running tiny strings through TextDecoder, since .subarray() allocates garbage.
  while (u8Array[endPtr]) ++endPtr;

  if (endPtr - idx > 16 && u8Array.subarray && UTF8Decoder) {
    return UTF8Decoder.decode(u8Array.subarray(idx, endPtr));
  } else {
    var u0, u1, u2, u3, u4, u5;

    var str = '';
    while (1) {
      // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description and https://www.ietf.org/rfc/rfc2279.txt and https://tools.ietf.org/html/rfc3629
      u0 = u8Array[idx++];
      if (!u0) return str;
      if (!(u0 & 0x80)) { str += String.fromCharCode(u0); continue; }
      u1 = u8Array[idx++] & 63;
      if ((u0 & 0xE0) == 0xC0) { str += String.fromCharCode(((u0 & 31) << 6) | u1); continue; }
      u2 = u8Array[idx++] & 63;
      if ((u0 & 0xF0) == 0xE0) {
        u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
      } else {
        u3 = u8Array[idx++] & 63;
        if ((u0 & 0xF8) == 0xF0) {
          u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | u3;
        } else {
          u4 = u8Array[idx++] & 63;
          if ((u0 & 0xFC) == 0xF8) {
            u0 = ((u0 & 3) << 24) | (u1 << 18) | (u2 << 12) | (u3 << 6) | u4;
          } else {
            u5 = u8Array[idx++] & 63;
            u0 = ((u0 & 1) << 30) | (u1 << 24) | (u2 << 18) | (u3 << 12) | (u4 << 6) | u5;
          }
        }
      }
      if (u0 < 0x10000) {
        str += String.fromCharCode(u0);
      } else {
        var ch = u0 - 0x10000;
        str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
      }
    }
  }
}
Module["UTF8ArrayToString"] = UTF8ArrayToString;

// Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

function UTF8ToString(ptr) {
  return UTF8ArrayToString(HEAPU8,ptr);
}
Module["UTF8ToString"] = UTF8ToString;

// Copies the given Javascript String object 'str' to the given byte array at address 'outIdx',
// encoded in UTF8 form and null-terminated. The copy will require at most str.length*4+1 bytes of space in the HEAP.
// Use the function lengthBytesUTF8 to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outU8Array: the array to copy to. Each index in this array is assumed to be one 8-byte element.
//   outIdx: The starting offset in the array to begin the copying.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null
//                    terminator, i.e. if maxBytesToWrite=1, only the null terminator will be written and nothing else.
//                    maxBytesToWrite=0 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF8Array(str, outU8Array, outIdx, maxBytesToWrite) {
  if (!(maxBytesToWrite > 0)) // Parameter maxBytesToWrite is not optional. Negative values, 0, null, undefined and false each don't write out any bytes.
    return 0;

  var startIdx = outIdx;
  var endIdx = outIdx + maxBytesToWrite - 1; // -1 for string null terminator.
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description and https://www.ietf.org/rfc/rfc2279.txt and https://tools.ietf.org/html/rfc3629
    var u = str.charCodeAt(i); // possibly a lead surrogate
    if (u >= 0xD800 && u <= 0xDFFF) u = 0x10000 + ((u & 0x3FF) << 10) | (str.charCodeAt(++i) & 0x3FF);
    if (u <= 0x7F) {
      if (outIdx >= endIdx) break;
      outU8Array[outIdx++] = u;
    } else if (u <= 0x7FF) {
      if (outIdx + 1 >= endIdx) break;
      outU8Array[outIdx++] = 0xC0 | (u >> 6);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else if (u <= 0xFFFF) {
      if (outIdx + 2 >= endIdx) break;
      outU8Array[outIdx++] = 0xE0 | (u >> 12);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else if (u <= 0x1FFFFF) {
      if (outIdx + 3 >= endIdx) break;
      outU8Array[outIdx++] = 0xF0 | (u >> 18);
      outU8Array[outIdx++] = 0x80 | ((u >> 12) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else if (u <= 0x3FFFFFF) {
      if (outIdx + 4 >= endIdx) break;
      outU8Array[outIdx++] = 0xF8 | (u >> 24);
      outU8Array[outIdx++] = 0x80 | ((u >> 18) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 12) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else {
      if (outIdx + 5 >= endIdx) break;
      outU8Array[outIdx++] = 0xFC | (u >> 30);
      outU8Array[outIdx++] = 0x80 | ((u >> 24) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 18) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 12) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    }
  }
  // Null-terminate the pointer to the buffer.
  outU8Array[outIdx] = 0;
  return outIdx - startIdx;
}
Module["stringToUTF8Array"] = stringToUTF8Array;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF8 form. The copy will require at most str.length*4+1 bytes of space in the HEAP.
// Use the function lengthBytesUTF8 to compute the exact number of bytes (excluding null terminator) that this function will write.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF8(str, outPtr, maxBytesToWrite) {
  return stringToUTF8Array(str, HEAPU8,outPtr, maxBytesToWrite);
}
Module["stringToUTF8"] = stringToUTF8;

// Returns the number of bytes the given Javascript string takes if encoded as a UTF8 byte array, EXCLUDING the null terminator byte.

function lengthBytesUTF8(str) {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var u = str.charCodeAt(i); // possibly a lead surrogate
    if (u >= 0xD800 && u <= 0xDFFF) u = 0x10000 + ((u & 0x3FF) << 10) | (str.charCodeAt(++i) & 0x3FF);
    if (u <= 0x7F) {
      ++len;
    } else if (u <= 0x7FF) {
      len += 2;
    } else if (u <= 0xFFFF) {
      len += 3;
    } else if (u <= 0x1FFFFF) {
      len += 4;
    } else if (u <= 0x3FFFFFF) {
      len += 5;
    } else {
      len += 6;
    }
  }
  return len;
}
Module["lengthBytesUTF8"] = lengthBytesUTF8;

// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

var UTF16Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-16le') : undefined;
function UTF16ToString(ptr) {
  var endPtr = ptr;
  // TextDecoder needs to know the byte length in advance, it doesn't stop on null terminator by itself.
  // Also, use the length info to avoid running tiny strings through TextDecoder, since .subarray() allocates garbage.
  var idx = endPtr >> 1;
  while (HEAP16[idx]) ++idx;
  endPtr = idx << 1;

  if (endPtr - ptr > 32 && UTF16Decoder) {
    return UTF16Decoder.decode(HEAPU8.subarray(ptr, endPtr));
  } else {
    var i = 0;

    var str = '';
    while (1) {
      var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
      if (codeUnit == 0) return str;
      ++i;
      // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
      str += String.fromCharCode(codeUnit);
    }
  }
}


// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF16 form. The copy will require at most str.length*4+2 bytes of space in the HEAP.
// Use the function lengthBytesUTF16() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outPtr: Byte address in Emscripten HEAP where to write the string to.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null
//                    terminator, i.e. if maxBytesToWrite=2, only the null terminator will be written and nothing else.
//                    maxBytesToWrite<2 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF16(str, outPtr, maxBytesToWrite) {
  // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
  if (maxBytesToWrite === undefined) {
    maxBytesToWrite = 0x7FFFFFFF;
  }
  if (maxBytesToWrite < 2) return 0;
  maxBytesToWrite -= 2; // Null terminator.
  var startPtr = outPtr;
  var numCharsToWrite = (maxBytesToWrite < str.length*2) ? (maxBytesToWrite / 2) : str.length;
  for (var i = 0; i < numCharsToWrite; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[((outPtr)>>1)]=codeUnit;
    outPtr += 2;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[((outPtr)>>1)]=0;
  return outPtr - startPtr;
}


// Returns the number of bytes the given Javascript string takes if encoded as a UTF16 byte array, EXCLUDING the null terminator byte.

function lengthBytesUTF16(str) {
  return str.length*2;
}


function UTF32ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0)
      return str;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
}


// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF32 form. The copy will require at most str.length*4+4 bytes of space in the HEAP.
// Use the function lengthBytesUTF32() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outPtr: Byte address in Emscripten HEAP where to write the string to.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null
//                    terminator, i.e. if maxBytesToWrite=4, only the null terminator will be written and nothing else.
//                    maxBytesToWrite<4 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF32(str, outPtr, maxBytesToWrite) {
  // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
  if (maxBytesToWrite === undefined) {
    maxBytesToWrite = 0x7FFFFFFF;
  }
  if (maxBytesToWrite < 4) return 0;
  var startPtr = outPtr;
  var endPtr = startPtr + maxBytesToWrite - 4;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++i);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[((outPtr)>>2)]=codeUnit;
    outPtr += 4;
    if (outPtr + 4 > endPtr) break;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[((outPtr)>>2)]=0;
  return outPtr - startPtr;
}


// Returns the number of bytes the given Javascript string takes if encoded as a UTF16 byte array, EXCLUDING the null terminator byte.

function lengthBytesUTF32(str) {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var codeUnit = str.charCodeAt(i);
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) ++i; // possibly a lead surrogate, so skip over the tail surrogate.
    len += 4;
  }

  return len;
}


function demangle(func) {
  var __cxa_demangle_func = Module['___cxa_demangle'] || Module['__cxa_demangle'];
  if (__cxa_demangle_func) {
    try {
      var s =
        func.substr(1);
      var len = lengthBytesUTF8(s)+1;
      var buf = _malloc(len);
      stringToUTF8(s, buf, len);
      var status = _malloc(4);
      var ret = __cxa_demangle_func(buf, 0, 0, status);
      if (getValue(status, 'i32') === 0 && ret) {
        return Pointer_stringify(ret);
      }
      // otherwise, libcxxabi failed
    } catch(e) {
      // ignore problems here
    } finally {
      if (buf) _free(buf);
      if (status) _free(status);
      if (ret) _free(ret);
    }
    // failure when using libcxxabi, don't demangle
    return func;
  }
  Runtime.warnOnce('warning: build with  -s DEMANGLE_SUPPORT=1  to link in libcxxabi demangling');
  return func;
}

function demangleAll(text) {
  var regex =
    /__Z[\w\d_]+/g;
  return text.replace(regex,
    function(x) {
      var y = demangle(x);
      return x === y ? x : (x + ' [' + y + ']');
    });
}

function jsStackTrace() {
  var err = new Error();
  if (!err.stack) {
    // IE10+ special cases: It does have callstack info, but it is only populated if an Error object is thrown,
    // so try that as a special-case.
    try {
      throw new Error(0);
    } catch(e) {
      err = e;
    }
    if (!err.stack) {
      return '(no stack trace available)';
    }
  }
  return err.stack.toString();
}

function stackTrace() {
  var js = jsStackTrace();
  if (Module['extraStackTrace']) js += '\n' + Module['extraStackTrace']();
  return demangleAll(js);
}
Module["stackTrace"] = stackTrace;

// Memory management

var PAGE_SIZE = 16384;
var WASM_PAGE_SIZE = 65536;
var ASMJS_PAGE_SIZE = 16777216;
var MIN_TOTAL_MEMORY = 16777216;

function alignUp(x, multiple) {
  if (x % multiple > 0) {
    x += multiple - (x % multiple);
  }
  return x;
}

var HEAP,
/** @type {ArrayBuffer} */
  buffer,
/** @type {Int8Array} */
  HEAP8,
/** @type {Uint8Array} */
  HEAPU8,
/** @type {Int16Array} */
  HEAP16,
/** @type {Uint16Array} */
  HEAPU16,
/** @type {Int32Array} */
  HEAP32,
/** @type {Uint32Array} */
  HEAPU32,
/** @type {Float32Array} */
  HEAPF32,
/** @type {Float64Array} */
  HEAPF64;

function updateGlobalBuffer(buf) {
  Module['buffer'] = buffer = buf;
}

function updateGlobalBufferViews() {
  Module['HEAP8'] = HEAP8 = new Int8Array(buffer);
  Module['HEAP16'] = HEAP16 = new Int16Array(buffer);
  Module['HEAP32'] = HEAP32 = new Int32Array(buffer);
  Module['HEAPU8'] = HEAPU8 = new Uint8Array(buffer);
  Module['HEAPU16'] = HEAPU16 = new Uint16Array(buffer);
  Module['HEAPU32'] = HEAPU32 = new Uint32Array(buffer);
  Module['HEAPF32'] = HEAPF32 = new Float32Array(buffer);
  Module['HEAPF64'] = HEAPF64 = new Float64Array(buffer);
}

var STATIC_BASE, STATICTOP, staticSealed; // static area
var STACK_BASE, STACKTOP, STACK_MAX; // stack area
var DYNAMIC_BASE, DYNAMICTOP_PTR; // dynamic area handled by sbrk

  STATIC_BASE = STATICTOP = STACK_BASE = STACKTOP = STACK_MAX = DYNAMIC_BASE = DYNAMICTOP_PTR = 0;
  staticSealed = false;



function abortOnCannotGrowMemory() {
  abort('Cannot enlarge memory arrays. Either (1) compile with  -s TOTAL_MEMORY=X  with X higher than the current value ' + TOTAL_MEMORY + ', (2) compile with  -s ALLOW_MEMORY_GROWTH=1  which allows increasing the size at runtime but prevents some optimizations, (3) set Module.TOTAL_MEMORY to a higher value before the program runs, or (4) if you want malloc to return NULL (0) instead of this abort, compile with  -s ABORTING_MALLOC=0 ');
}


function enlargeMemory() {
  abortOnCannotGrowMemory();
}


var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;
if (TOTAL_MEMORY < TOTAL_STACK) Module.printErr('TOTAL_MEMORY should be larger than TOTAL_STACK, was ' + TOTAL_MEMORY + '! (TOTAL_STACK=' + TOTAL_STACK + ')');

// Initialize the runtime's memory



// Use a provided buffer, if there is one, or else allocate a new one
if (Module['buffer']) {
  buffer = Module['buffer'];
} else {
  // Use a WebAssembly memory where available
  {
    buffer = new ArrayBuffer(TOTAL_MEMORY);
  }
}
updateGlobalBufferViews();


function getTotalMemory() {
  return TOTAL_MEMORY;
}

// Endianness check (note: assumes compiler arch was little-endian)
  HEAP32[0] = 0x63736d65; /* 'emsc' */
HEAP16[1] = 0x6373;
if (HEAPU8[2] !== 0x73 || HEAPU8[3] !== 0x63) throw 'Runtime error: expected the system to be little-endian!';

Module['HEAP'] = HEAP;
Module['buffer'] = buffer;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;

function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Module['dynCall_v'](func);
      } else {
        Module['dynCall_vi'](func, callback.arg);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}

var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the runtime has exited

var runtimeInitialized = false;
var runtimeExited = false;


function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}

function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}

function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
  runtimeExited = true;
}

function postRun() {
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
Module["addOnPreRun"] = addOnPreRun;

function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
Module["addOnInit"] = addOnInit;

function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}
Module["addOnPreMain"] = addOnPreMain;

function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}
Module["addOnExit"] = addOnExit;

function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
Module["addOnPostRun"] = addOnPostRun;

// Tools

/** @type {function(string, boolean=, number=)} */
function intArrayFromString(stringy, dontAddNull, length) {
  var len = length > 0 ? length : lengthBytesUTF8(stringy)+1;
  var u8array = new Array(len);
  var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
  if (dontAddNull) u8array.length = numBytesWritten;
  return u8array;
}
Module["intArrayFromString"] = intArrayFromString;

function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module["intArrayToString"] = intArrayToString;

// Deprecated: This function should not be called because it is unsafe and does not provide
// a maximum length limit of how many bytes it is allowed to write. Prefer calling the
// function stringToUTF8Array() instead, which takes in a maximum length that can be used
// to be secure from out of bounds writes.
/** @deprecated */
function writeStringToMemory(string, buffer, dontAddNull) {
  Runtime.warnOnce('writeStringToMemory is deprecated and should not be called! Use stringToUTF8() instead!');

  var /** @type {number} */ lastChar, /** @type {number} */ end;
  if (dontAddNull) {
    // stringToUTF8Array always appends null. If we don't want to do that, remember the
    // character that existed at the location where the null will be placed, and restore
    // that after the write (below).
    end = buffer + lengthBytesUTF8(string);
    lastChar = HEAP8[end];
  }
  stringToUTF8(string, buffer, Infinity);
  if (dontAddNull) HEAP8[end] = lastChar; // Restore the value under the null character.
}
Module["writeStringToMemory"] = writeStringToMemory;

function writeArrayToMemory(array, buffer) {
  HEAP8.set(array, buffer);
}
Module["writeArrayToMemory"] = writeArrayToMemory;

function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; ++i) {
    HEAP8[((buffer++)>>0)]=str.charCodeAt(i);
  }
  // Null-terminate the pointer to the HEAP.
  if (!dontAddNull) HEAP8[((buffer)>>0)]=0;
}
Module["writeAsciiToMemory"] = writeAsciiToMemory;

function unSign(value, bits, ignore) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}

// check for imul support, and also for correctness ( https://bugs.webkit.org/show_bug.cgi?id=126345 )
if (!Math['imul'] || Math['imul'](0xffffffff, 5) !== -5) Math['imul'] = function imul(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
Math.imul = Math['imul'];


if (!Math['clz32']) Math['clz32'] = function(x) {
  x = x >>> 0;
  for (var i = 0; i < 32; i++) {
    if (x & (1 << (31 - i))) return i;
  }
  return 32;
};
Math.clz32 = Math['clz32']

if (!Math['trunc']) Math['trunc'] = function(x) {
  return x < 0 ? Math.ceil(x) : Math.floor(x);
};
Math.trunc = Math['trunc'];

var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_round = Math.round;
var Math_min = Math.min;
var Math_clz32 = Math.clz32;
var Math_trunc = Math.trunc;

// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled

function getUniqueRunDependency(id) {
  return id;
}

function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
}
Module["addRunDependency"] = addRunDependency;

function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}
Module["removeRunDependency"] = removeRunDependency;

Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data



var memoryInitializer = null;






// === Body ===

var ASM_CONSTS = [];




STATIC_BASE = Runtime.GLOBAL_BASE;

STATICTOP = STATIC_BASE + 4160;
/* global initializers */  __ATINIT__.push({ func: function() { __GLOBAL__sub_I_bind_cpp() } });


memoryInitializer = "example.html.mem";





/* no memory initializer */
var tempDoublePtr = STATICTOP; STATICTOP += 16;

function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

}

function copyTempDouble(ptr) {

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];

  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];

  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];

  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];

}

// {{PRE_LIBRARY}}


  
  
  
  function embind_init_charCodes() {
      var codes = new Array(256);
      for (var i = 0; i < 256; ++i) {
          codes[i] = String.fromCharCode(i);
      }
      embind_charCodes = codes;
    }var embind_charCodes=undefined;function readLatin1String(ptr) {
      var ret = "";
      var c = ptr;
      while (HEAPU8[c]) {
          ret += embind_charCodes[HEAPU8[c++]];
      }
      return ret;
    }
  
  
  var awaitingDependencies={};
  
  var registeredTypes={};
  
  var typeDependencies={};
  
  
  
  
  
  
  var char_0=48;
  
  var char_9=57;function makeLegalFunctionName(name) {
      if (undefined === name) {
          return '_unknown';
      }
      name = name.replace(/[^a-zA-Z0-9_]/g, '$');
      var f = name.charCodeAt(0);
      if (f >= char_0 && f <= char_9) {
          return '_' + name;
      } else {
          return name;
      }
    }function createNamedFunction(name, body) {
      name = makeLegalFunctionName(name);
      /*jshint evil:true*/
      return new Function(
          "body",
          "return function " + name + "() {\n" +
          "    \"use strict\";" +
          "    return body.apply(this, arguments);\n" +
          "};\n"
      )(body);
    }function extendError(baseErrorType, errorName) {
      var errorClass = createNamedFunction(errorName, function(message) {
          this.name = errorName;
          this.message = message;
  
          var stack = (new Error(message)).stack;
          if (stack !== undefined) {
              this.stack = this.toString() + '\n' +
                  stack.replace(/^Error(:[^\n]*)?\n/, '');
          }
      });
      errorClass.prototype = Object.create(baseErrorType.prototype);
      errorClass.prototype.constructor = errorClass;
      errorClass.prototype.toString = function() {
          if (this.message === undefined) {
              return this.name;
          } else {
              return this.name + ': ' + this.message;
          }
      };
  
      return errorClass;
    }var BindingError=undefined;function throwBindingError(message) {
      throw new BindingError(message);
    }
  
  
  
  var InternalError=undefined;function throwInternalError(message) {
      throw new InternalError(message);
    }function whenDependentTypesAreResolved(myTypes, dependentTypes, getTypeConverters) {
      myTypes.forEach(function(type) {
          typeDependencies[type] = dependentTypes;
      });
  
      function onComplete(typeConverters) {
          var myTypeConverters = getTypeConverters(typeConverters);
          if (myTypeConverters.length !== myTypes.length) {
              throwInternalError('Mismatched type converter count');
          }
          for (var i = 0; i < myTypes.length; ++i) {
              registerType(myTypes[i], myTypeConverters[i]);
          }
      }
  
      var typeConverters = new Array(dependentTypes.length);
      var unregisteredTypes = [];
      var registered = 0;
      dependentTypes.forEach(function(dt, i) {
          if (registeredTypes.hasOwnProperty(dt)) {
              typeConverters[i] = registeredTypes[dt];
          } else {
              unregisteredTypes.push(dt);
              if (!awaitingDependencies.hasOwnProperty(dt)) {
                  awaitingDependencies[dt] = [];
              }
              awaitingDependencies[dt].push(function() {
                  typeConverters[i] = registeredTypes[dt];
                  ++registered;
                  if (registered === unregisteredTypes.length) {
                      onComplete(typeConverters);
                  }
              });
          }
      });
      if (0 === unregisteredTypes.length) {
          onComplete(typeConverters);
      }
    }function registerType(rawType, registeredInstance, options) {
      options = options || {};
  
      if (!('argPackAdvance' in registeredInstance)) {
          throw new TypeError('registerType registeredInstance requires argPackAdvance');
      }
  
      var name = registeredInstance.name;
      if (!rawType) {
          throwBindingError('type "' + name + '" must have a positive integer typeid pointer');
      }
      if (registeredTypes.hasOwnProperty(rawType)) {
          if (options.ignoreDuplicateRegistrations) {
              return;
          } else {
              throwBindingError("Cannot register type '" + name + "' twice");
          }
      }
  
      registeredTypes[rawType] = registeredInstance;
      delete typeDependencies[rawType];
  
      if (awaitingDependencies.hasOwnProperty(rawType)) {
          var callbacks = awaitingDependencies[rawType];
          delete awaitingDependencies[rawType];
          callbacks.forEach(function(cb) {
              cb();
          });
      }
    }function __embind_register_void(rawType, name) {
      name = readLatin1String(name);
      registerType(rawType, {
          isVoid: true, // void return values can be optimized out sometimes
          name: name,
          'argPackAdvance': 0,
          'fromWireType': function() {
              return undefined;
          },
          'toWireType': function(destructors, o) {
              // TODO: assert if anything else is given?
              return undefined;
          },
      });
    }

  
  function _embind_repr(v) {
      if (v === null) {
          return 'null';
      }
      var t = typeof v;
      if (t === 'object' || t === 'array' || t === 'function') {
          return v.toString();
      } else {
          return '' + v;
      }
    }
  
  function floatReadValueFromPointer(name, shift) {
      switch (shift) {
          case 2: return function(pointer) {
              return this['fromWireType'](HEAPF32[pointer >> 2]);
          };
          case 3: return function(pointer) {
              return this['fromWireType'](HEAPF64[pointer >> 3]);
          };
          default:
              throw new TypeError("Unknown float type: " + name);
      }
    }
  
  function getShiftFromSize(size) {
      switch (size) {
          case 1: return 0;
          case 2: return 1;
          case 4: return 2;
          case 8: return 3;
          default:
              throw new TypeError('Unknown type size: ' + size);
      }
    }function __embind_register_float(rawType, name, size) {
      var shift = getShiftFromSize(size);
      name = readLatin1String(name);
      registerType(rawType, {
          name: name,
          'fromWireType': function(value) {
              return value;
          },
          'toWireType': function(destructors, value) {
              // todo: Here we have an opportunity for -O3 level "unsafe" optimizations: we could
              // avoid the following if() and assume value is of proper type.
              if (typeof value !== "number" && typeof value !== "boolean") {
                  throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name);
              }
              return value;
          },
          'argPackAdvance': 8,
          'readValueFromPointer': floatReadValueFromPointer(name, shift),
          destructorFunction: null, // This type does not need a destructor
      });
    }

   

  function __embind_register_bool(rawType, name, size, trueValue, falseValue) {
      var shift = getShiftFromSize(size);
  
      name = readLatin1String(name);
      registerType(rawType, {
          name: name,
          'fromWireType': function(wt) {
              // ambiguous emscripten ABI: sometimes return values are
              // true or false, and sometimes integers (0 or 1)
              return !!wt;
          },
          'toWireType': function(destructors, o) {
              return o ? trueValue : falseValue;
          },
          'argPackAdvance': 8,
          'readValueFromPointer': function(pointer) {
              // TODO: if heap is fixed (like in asm.js) this could be executed outside
              var heap;
              if (size === 1) {
                  heap = HEAP8;
              } else if (size === 2) {
                  heap = HEAP16;
              } else if (size === 4) {
                  heap = HEAP32;
              } else {
                  throw new TypeError("Unknown boolean type size: " + name);
              }
              return this['fromWireType'](heap[pointer >> shift]);
          },
          destructorFunction: null, // This type does not need a destructor
      });
    }

  function _abort() {
      Module['abort']();
    }

  
  function simpleReadValueFromPointer(pointer) {
      return this['fromWireType'](HEAPU32[pointer >> 2]);
    }function __embind_register_std_string(rawType, name) {
      name = readLatin1String(name);
      registerType(rawType, {
          name: name,
          'fromWireType': function(value) {
              var length = HEAPU32[value >> 2];
              var a = new Array(length);
              for (var i = 0; i < length; ++i) {
                  a[i] = String.fromCharCode(HEAPU8[value + 4 + i]);
              }
              _free(value);
              return a.join('');
          },
          'toWireType': function(destructors, value) {
              if (value instanceof ArrayBuffer) {
                  value = new Uint8Array(value);
              }
  
              function getTAElement(ta, index) {
                  return ta[index];
              }
              function getStringElement(string, index) {
                  return string.charCodeAt(index);
              }
              var getElement;
              if (value instanceof Uint8Array) {
                  getElement = getTAElement;
              } else if (value instanceof Uint8ClampedArray) {
                  getElement = getTAElement;
              } else if (value instanceof Int8Array) {
                  getElement = getTAElement;
              } else if (typeof value === 'string') {
                  getElement = getStringElement;
              } else {
                  throwBindingError('Cannot pass non-string to std::string');
              }
  
              // assumes 4-byte alignment
              var length = value.length;
              var ptr = _malloc(4 + length);
              HEAPU32[ptr >> 2] = length;
              for (var i = 0; i < length; ++i) {
                  var charCode = getElement(value, i);
                  if (charCode > 255) {
                      _free(ptr);
                      throwBindingError('String has UTF-16 code units that do not fit in 8 bits');
                  }
                  HEAPU8[ptr + 4 + i] = charCode;
              }
              if (destructors !== null) {
                  destructors.push(_free, ptr);
              }
              return ptr;
          },
          'argPackAdvance': 8,
          'readValueFromPointer': simpleReadValueFromPointer,
          destructorFunction: function(ptr) { _free(ptr); },
      });
    }

  function __embind_register_std_wstring(rawType, charSize, name) {
      // nb. do not cache HEAPU16 and HEAPU32, they may be destroyed by enlargeMemory().
      name = readLatin1String(name);
      var getHeap, shift;
      if (charSize === 2) {
          getHeap = function() { return HEAPU16; };
          shift = 1;
      } else if (charSize === 4) {
          getHeap = function() { return HEAPU32; };
          shift = 2;
      }
      registerType(rawType, {
          name: name,
          'fromWireType': function(value) {
              var HEAP = getHeap();
              var length = HEAPU32[value >> 2];
              var a = new Array(length);
              var start = (value + 4) >> shift;
              for (var i = 0; i < length; ++i) {
                  a[i] = String.fromCharCode(HEAP[start + i]);
              }
              _free(value);
              return a.join('');
          },
          'toWireType': function(destructors, value) {
              // assumes 4-byte alignment
              var HEAP = getHeap();
              var length = value.length;
              var ptr = _malloc(4 + length * charSize);
              HEAPU32[ptr >> 2] = length;
              var start = (ptr + 4) >> shift;
              for (var i = 0; i < length; ++i) {
                  HEAP[start + i] = value.charCodeAt(i);
              }
              if (destructors !== null) {
                  destructors.push(_free, ptr);
              }
              return ptr;
          },
          'argPackAdvance': 8,
          'readValueFromPointer': simpleReadValueFromPointer,
          destructorFunction: function(ptr) { _free(ptr); },
      });
    }

  
  function _emscripten_memcpy_big(dest, src, num) {
      HEAPU8.set(HEAPU8.subarray(src, src+num), dest);
      return dest;
    } 

  
  var SYSCALLS={varargs:0,get:function (varargs) {
        SYSCALLS.varargs += 4;
        var ret = HEAP32[(((SYSCALLS.varargs)-(4))>>2)];
        return ret;
      },getStr:function () {
        var ret = Pointer_stringify(SYSCALLS.get());
        return ret;
      },get64:function () {
        var low = SYSCALLS.get(), high = SYSCALLS.get();
        if (low >= 0) assert(high === 0);
        else assert(high === -1);
        return low;
      },getZero:function () {
        assert(SYSCALLS.get() === 0);
      }};function ___syscall6(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // close
      var stream = SYSCALLS.getStreamFromFD();
      FS.close(stream);
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  
  function ___setErrNo(value) {
      if (Module['___errno_location']) HEAP32[((Module['___errno_location']())>>2)]=value;
      return value;
    } 

  
  function __ZSt18uncaught_exceptionv() { // std::uncaught_exception()
      return !!__ZSt18uncaught_exceptionv.uncaught_exception;
    }
  
  
  
  var EXCEPTIONS={last:0,caught:[],infos:{},deAdjust:function (adjusted) {
        if (!adjusted || EXCEPTIONS.infos[adjusted]) return adjusted;
        for (var ptr in EXCEPTIONS.infos) {
          var info = EXCEPTIONS.infos[ptr];
          if (info.adjusted === adjusted) {
            return ptr;
          }
        }
        return adjusted;
      },addRef:function (ptr) {
        if (!ptr) return;
        var info = EXCEPTIONS.infos[ptr];
        info.refcount++;
      },decRef:function (ptr) {
        if (!ptr) return;
        var info = EXCEPTIONS.infos[ptr];
        assert(info.refcount > 0);
        info.refcount--;
        // A rethrown exception can reach refcount 0; it must not be discarded
        // Its next handler will clear the rethrown flag and addRef it, prior to
        // final decRef and destruction here
        if (info.refcount === 0 && !info.rethrown) {
          if (info.destructor) {
            Module['dynCall_vi'](info.destructor, ptr);
          }
          delete EXCEPTIONS.infos[ptr];
          ___cxa_free_exception(ptr);
        }
      },clearRef:function (ptr) {
        if (!ptr) return;
        var info = EXCEPTIONS.infos[ptr];
        info.refcount = 0;
      }};
  function ___resumeException(ptr) {
      if (!EXCEPTIONS.last) { EXCEPTIONS.last = ptr; }
      throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";
    }function ___cxa_find_matching_catch() {
      var thrown = EXCEPTIONS.last;
      if (!thrown) {
        // just pass through the null ptr
        return ((Runtime.setTempRet0(0),0)|0);
      }
      var info = EXCEPTIONS.infos[thrown];
      var throwntype = info.type;
      if (!throwntype) {
        // just pass through the thrown ptr
        return ((Runtime.setTempRet0(0),thrown)|0);
      }
      var typeArray = Array.prototype.slice.call(arguments);
  
      var pointer = Module['___cxa_is_pointer_type'](throwntype);
      // can_catch receives a **, add indirection
      if (!___cxa_find_matching_catch.buffer) ___cxa_find_matching_catch.buffer = _malloc(4);
      HEAP32[((___cxa_find_matching_catch.buffer)>>2)]=thrown;
      thrown = ___cxa_find_matching_catch.buffer;
      // The different catch blocks are denoted by different types.
      // Due to inheritance, those types may not precisely match the
      // type of the thrown object. Find one which matches, and
      // return the type of the catch block which should be called.
      for (var i = 0; i < typeArray.length; i++) {
        if (typeArray[i] && Module['___cxa_can_catch'](typeArray[i], throwntype, thrown)) {
          thrown = HEAP32[((thrown)>>2)]; // undo indirection
          info.adjusted = thrown;
          return ((Runtime.setTempRet0(typeArray[i]),thrown)|0);
        }
      }
      // Shouldn't happen unless we have bogus data in typeArray
      // or encounter a type for which emscripten doesn't have suitable
      // typeinfo defined. Best-efforts match just in case.
      thrown = HEAP32[((thrown)>>2)]; // undo indirection
      return ((Runtime.setTempRet0(throwntype),thrown)|0);
    }function ___gxx_personality_v0() {
    }

  
  function integerReadValueFromPointer(name, shift, signed) {
      // integers are quite common, so generate very specialized functions
      switch (shift) {
          case 0: return signed ?
              function readS8FromPointer(pointer) { return HEAP8[pointer]; } :
              function readU8FromPointer(pointer) { return HEAPU8[pointer]; };
          case 1: return signed ?
              function readS16FromPointer(pointer) { return HEAP16[pointer >> 1]; } :
              function readU16FromPointer(pointer) { return HEAPU16[pointer >> 1]; };
          case 2: return signed ?
              function readS32FromPointer(pointer) { return HEAP32[pointer >> 2]; } :
              function readU32FromPointer(pointer) { return HEAPU32[pointer >> 2]; };
          default:
              throw new TypeError("Unknown integer type: " + name);
      }
    }function __embind_register_integer(primitiveType, name, size, minRange, maxRange) {
      name = readLatin1String(name);
      if (maxRange === -1) { // LLVM doesn't have signed and unsigned 32-bit types, so u32 literals come out as 'i32 -1'. Always treat those as max u32.
          maxRange = 4294967295;
      }
  
      var shift = getShiftFromSize(size);
      
      var fromWireType = function(value) {
          return value;
      };
      
      if (minRange === 0) {
          var bitshift = 32 - 8*size;
          fromWireType = function(value) {
              return (value << bitshift) >>> bitshift;
          };
      }
  
      var isUnsignedType = (name.indexOf('unsigned') != -1);
  
      registerType(primitiveType, {
          name: name,
          'fromWireType': fromWireType,
          'toWireType': function(destructors, value) {
              // todo: Here we have an opportunity for -O3 level "unsafe" optimizations: we could
              // avoid the following two if()s and assume value is of proper type.
              if (typeof value !== "number" && typeof value !== "boolean") {
                  throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name);
              }
              if (value < minRange || value > maxRange) {
                  throw new TypeError('Passing a number "' + _embind_repr(value) + '" from JS side to C/C++ side to an argument of type "' + name + '", which is outside the valid range [' + minRange + ', ' + maxRange + ']!');
              }
              return isUnsignedType ? (value >>> 0) : (value | 0);
          },
          'argPackAdvance': 8,
          'readValueFromPointer': integerReadValueFromPointer(name, shift, minRange !== 0),
          destructorFunction: null, // This type does not need a destructor
      });
    }

  
  
  var emval_free_list=[];
  
  var emval_handle_array=[{},{value:undefined},{value:null},{value:true},{value:false}];function __emval_decref(handle) {
      if (handle > 4 && 0 === --emval_handle_array[handle].refcount) {
          emval_handle_array[handle] = undefined;
          emval_free_list.push(handle);
      }
    }
  
  
  
  function count_emval_handles() {
      var count = 0;
      for (var i = 5; i < emval_handle_array.length; ++i) {
          if (emval_handle_array[i] !== undefined) {
              ++count;
          }
      }
      return count;
    }
  
  function get_first_emval() {
      for (var i = 5; i < emval_handle_array.length; ++i) {
          if (emval_handle_array[i] !== undefined) {
              return emval_handle_array[i];
          }
      }
      return null;
    }function init_emval() {
      Module['count_emval_handles'] = count_emval_handles;
      Module['get_first_emval'] = get_first_emval;
    }function __emval_register(value) {
  
      switch(value){
        case undefined :{ return 1; }
        case null :{ return 2; }
        case true :{ return 3; }
        case false :{ return 4; }
        default:{
          var handle = emval_free_list.length ?
              emval_free_list.pop() :
              emval_handle_array.length;
  
          emval_handle_array[handle] = {refcount: 1, value: value};
          return handle;
          }
        }
    }function __embind_register_emval(rawType, name) {
      name = readLatin1String(name);
      registerType(rawType, {
          name: name,
          'fromWireType': function(handle) {
              var rv = emval_handle_array[handle].value;
              __emval_decref(handle);
              return rv;
          },
          'toWireType': function(destructors, value) {
              return __emval_register(value);
          },
          'argPackAdvance': 8,
          'readValueFromPointer': simpleReadValueFromPointer,
          destructorFunction: null, // This type does not need a destructor
  
          // TODO: do we need a deleteObject here?  write a test where
          // emval is passed into JS via an interface
      });
    }

  function __embind_register_memory_view(rawType, dataTypeIndex, name) {
      var typeMapping = [
          Int8Array,
          Uint8Array,
          Int16Array,
          Uint16Array,
          Int32Array,
          Uint32Array,
          Float32Array,
          Float64Array,
      ];
  
      var TA = typeMapping[dataTypeIndex];
  
      function decodeMemoryView(handle) {
          handle = handle >> 2;
          var heap = HEAPU32;
          var size = heap[handle]; // in elements
          var data = heap[handle + 1]; // byte offset into emscripten heap
          return new TA(heap['buffer'], data, size);
      }
  
      name = readLatin1String(name);
      registerType(rawType, {
          name: name,
          'fromWireType': decodeMemoryView,
          'argPackAdvance': 8,
          'readValueFromPointer': decodeMemoryView,
      }, {
          ignoreDuplicateRegistrations: true,
      });
    }

  function ___syscall140(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // llseek
      var stream = SYSCALLS.getStreamFromFD(), offset_high = SYSCALLS.get(), offset_low = SYSCALLS.get(), result = SYSCALLS.get(), whence = SYSCALLS.get();
      // NOTE: offset_high is unused - Emscripten's off_t is 32-bit
      var offset = offset_low;
      FS.llseek(stream, offset, whence);
      HEAP32[((result)>>2)]=stream.position;
      if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null; // reset readdir state
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function ___syscall146(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // writev
      // hack to support printf in NO_FILESYSTEM
      var stream = SYSCALLS.get(), iov = SYSCALLS.get(), iovcnt = SYSCALLS.get();
      var ret = 0;
      if (!___syscall146.buffer) {
        ___syscall146.buffers = [null, [], []]; // 1 => stdout, 2 => stderr
        ___syscall146.printChar = function(stream, curr) {
          var buffer = ___syscall146.buffers[stream];
          assert(buffer);
          if (curr === 0 || curr === 10) {
            (stream === 1 ? Module['print'] : Module['printErr'])(UTF8ArrayToString(buffer, 0));
            buffer.length = 0;
          } else {
            buffer.push(curr);
          }
        };
      }
      for (var i = 0; i < iovcnt; i++) {
        var ptr = HEAP32[(((iov)+(i*8))>>2)];
        var len = HEAP32[(((iov)+(i*8 + 4))>>2)];
        for (var j = 0; j < len; j++) {
          ___syscall146.printChar(stream, HEAPU8[ptr+j]);
        }
        ret += len;
      }
      return ret;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function ___syscall54(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // ioctl
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }
embind_init_charCodes();
BindingError = Module['BindingError'] = extendError(Error, 'BindingError');;
InternalError = Module['InternalError'] = extendError(Error, 'InternalError');;
init_emval();;
/* flush anything remaining in the buffer during shutdown */ __ATEXIT__.push(function() { var fflush = Module["_fflush"]; if (fflush) fflush(0); var printChar = ___syscall146.printChar; if (!printChar) return; var buffers = ___syscall146.buffers; if (buffers[1].length) printChar(1, 10); if (buffers[2].length) printChar(2, 10); });;
DYNAMICTOP_PTR = allocate(1, "i32", ALLOC_STATIC);

STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);

STACK_MAX = STACK_BASE + TOTAL_STACK;

DYNAMIC_BASE = Runtime.alignMemory(STACK_MAX);

HEAP32[DYNAMICTOP_PTR>>2] = DYNAMIC_BASE;

staticSealed = true; // seal the static portion of memory


function invoke_iiii(index,a1,a2,a3) {
  try {
    return Module["dynCall_iiii"](index,a1,a2,a3);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiiii(index,a1,a2,a3,a4,a5) {
  try {
    Module["dynCall_viiiii"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_vi(index,a1) {
  try {
    Module["dynCall_vi"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_ii(index,a1) {
  try {
    return Module["dynCall_ii"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiiiii(index,a1,a2,a3,a4,a5,a6) {
  try {
    Module["dynCall_viiiiii"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiii(index,a1,a2,a3,a4) {
  try {
    Module["dynCall_viiii"](index,a1,a2,a3,a4);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

Module.asmGlobalArg = { "Math": Math, "Int8Array": Int8Array, "Int16Array": Int16Array, "Int32Array": Int32Array, "Uint8Array": Uint8Array, "Uint16Array": Uint16Array, "Uint32Array": Uint32Array, "Float32Array": Float32Array, "Float64Array": Float64Array, "NaN": NaN, "Infinity": Infinity };

Module.asmLibraryArg = { "abort": abort, "assert": assert, "enlargeMemory": enlargeMemory, "getTotalMemory": getTotalMemory, "abortOnCannotGrowMemory": abortOnCannotGrowMemory, "invoke_iiii": invoke_iiii, "invoke_viiiii": invoke_viiiii, "invoke_vi": invoke_vi, "invoke_ii": invoke_ii, "invoke_viiiiii": invoke_viiiiii, "invoke_viiii": invoke_viiii, "floatReadValueFromPointer": floatReadValueFromPointer, "simpleReadValueFromPointer": simpleReadValueFromPointer, "integerReadValueFromPointer": integerReadValueFromPointer, "__embind_register_integer": __embind_register_integer, "throwInternalError": throwInternalError, "get_first_emval": get_first_emval, "_abort": _abort, "___gxx_personality_v0": ___gxx_personality_v0, "extendError": extendError, "__embind_register_void": __embind_register_void, "___cxa_find_matching_catch": ___cxa_find_matching_catch, "getShiftFromSize": getShiftFromSize, "embind_init_charCodes": embind_init_charCodes, "___setErrNo": ___setErrNo, "__emval_register": __emval_register, "__embind_register_std_wstring": __embind_register_std_wstring, "_emscripten_memcpy_big": _emscripten_memcpy_big, "__embind_register_bool": __embind_register_bool, "___resumeException": ___resumeException, "__ZSt18uncaught_exceptionv": __ZSt18uncaught_exceptionv, "_embind_repr": _embind_repr, "__embind_register_std_string": __embind_register_std_string, "createNamedFunction": createNamedFunction, "__embind_register_emval": __embind_register_emval, "readLatin1String": readLatin1String, "__embind_register_memory_view": __embind_register_memory_view, "__emval_decref": __emval_decref, "__embind_register_float": __embind_register_float, "makeLegalFunctionName": makeLegalFunctionName, "___syscall54": ___syscall54, "init_emval": init_emval, "whenDependentTypesAreResolved": whenDependentTypesAreResolved, "registerType": registerType, "___syscall6": ___syscall6, "throwBindingError": throwBindingError, "count_emval_handles": count_emval_handles, "___syscall140": ___syscall140, "___syscall146": ___syscall146, "DYNAMICTOP_PTR": DYNAMICTOP_PTR, "tempDoublePtr": tempDoublePtr, "ABORT": ABORT, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX };
// EMSCRIPTEN_START_ASM
var asm = (function(global, env, buffer) {
'use asm';


  var HEAP8 = new global.Int8Array(buffer);
  var HEAP16 = new global.Int16Array(buffer);
  var HEAP32 = new global.Int32Array(buffer);
  var HEAPU8 = new global.Uint8Array(buffer);
  var HEAPU16 = new global.Uint16Array(buffer);
  var HEAPU32 = new global.Uint32Array(buffer);
  var HEAPF32 = new global.Float32Array(buffer);
  var HEAPF64 = new global.Float64Array(buffer);

  var DYNAMICTOP_PTR=env.DYNAMICTOP_PTR|0;
  var tempDoublePtr=env.tempDoublePtr|0;
  var ABORT=env.ABORT|0;
  var STACKTOP=env.STACKTOP|0;
  var STACK_MAX=env.STACK_MAX|0;

  var __THREW__ = 0;
  var threwValue = 0;
  var setjmpId = 0;
  var undef = 0;
  var nan = global.NaN, inf = global.Infinity;
  var tempInt = 0, tempBigInt = 0, tempBigIntS = 0, tempValue = 0, tempDouble = 0.0;
  var tempRet0 = 0;

  var Math_floor=global.Math.floor;
  var Math_abs=global.Math.abs;
  var Math_sqrt=global.Math.sqrt;
  var Math_pow=global.Math.pow;
  var Math_cos=global.Math.cos;
  var Math_sin=global.Math.sin;
  var Math_tan=global.Math.tan;
  var Math_acos=global.Math.acos;
  var Math_asin=global.Math.asin;
  var Math_atan=global.Math.atan;
  var Math_atan2=global.Math.atan2;
  var Math_exp=global.Math.exp;
  var Math_log=global.Math.log;
  var Math_ceil=global.Math.ceil;
  var Math_imul=global.Math.imul;
  var Math_min=global.Math.min;
  var Math_max=global.Math.max;
  var Math_clz32=global.Math.clz32;
  var abort=env.abort;
  var assert=env.assert;
  var enlargeMemory=env.enlargeMemory;
  var getTotalMemory=env.getTotalMemory;
  var abortOnCannotGrowMemory=env.abortOnCannotGrowMemory;
  var invoke_iiii=env.invoke_iiii;
  var invoke_viiiii=env.invoke_viiiii;
  var invoke_vi=env.invoke_vi;
  var invoke_ii=env.invoke_ii;
  var invoke_viiiiii=env.invoke_viiiiii;
  var invoke_viiii=env.invoke_viiii;
  var floatReadValueFromPointer=env.floatReadValueFromPointer;
  var simpleReadValueFromPointer=env.simpleReadValueFromPointer;
  var integerReadValueFromPointer=env.integerReadValueFromPointer;
  var __embind_register_integer=env.__embind_register_integer;
  var throwInternalError=env.throwInternalError;
  var get_first_emval=env.get_first_emval;
  var _abort=env._abort;
  var ___gxx_personality_v0=env.___gxx_personality_v0;
  var extendError=env.extendError;
  var __embind_register_void=env.__embind_register_void;
  var ___cxa_find_matching_catch=env.___cxa_find_matching_catch;
  var getShiftFromSize=env.getShiftFromSize;
  var embind_init_charCodes=env.embind_init_charCodes;
  var ___setErrNo=env.___setErrNo;
  var __emval_register=env.__emval_register;
  var __embind_register_std_wstring=env.__embind_register_std_wstring;
  var _emscripten_memcpy_big=env._emscripten_memcpy_big;
  var __embind_register_bool=env.__embind_register_bool;
  var ___resumeException=env.___resumeException;
  var __ZSt18uncaught_exceptionv=env.__ZSt18uncaught_exceptionv;
  var _embind_repr=env._embind_repr;
  var __embind_register_std_string=env.__embind_register_std_string;
  var createNamedFunction=env.createNamedFunction;
  var __embind_register_emval=env.__embind_register_emval;
  var readLatin1String=env.readLatin1String;
  var __embind_register_memory_view=env.__embind_register_memory_view;
  var __emval_decref=env.__emval_decref;
  var __embind_register_float=env.__embind_register_float;
  var makeLegalFunctionName=env.makeLegalFunctionName;
  var ___syscall54=env.___syscall54;
  var init_emval=env.init_emval;
  var whenDependentTypesAreResolved=env.whenDependentTypesAreResolved;
  var registerType=env.registerType;
  var ___syscall6=env.___syscall6;
  var throwBindingError=env.throwBindingError;
  var count_emval_handles=env.count_emval_handles;
  var ___syscall140=env.___syscall140;
  var ___syscall146=env.___syscall146;
  var tempFloat = 0.0;

// EMSCRIPTEN_START_FUNCS
function _malloc($0) {
 $0 = $0 | 0;
 var $$$0192$i = 0, $$$0193$i = 0, $$$4351$i = 0, $$$i = 0, $$0 = 0, $$0$i$i = 0, $$0$i$i$i = 0, $$0$i18$i = 0, $$01$i$i = 0, $$0189$i = 0, $$0192$lcssa$i = 0, $$01928$i = 0, $$0193$lcssa$i = 0, $$01937$i = 0, $$0197 = 0, $$0199 = 0, $$0206$i$i = 0, $$0207$i$i = 0, $$0211$i$i = 0, $$0212$i$i = 0, $$024371$i = 0, $$0287$i$i = 0, $$0288$i$i = 0, $$0289$i$i = 0, $$0295$i$i = 0, $$0296$i$i = 0, $$0342$i = 0, $$0344$i = 0, $$0345$i = 0, $$0347$i = 0, $$0353$i = 0, $$0358$i = 0, $$0359$i = 0, $$0361$i = 0, $$0362$i = 0, $$0368$i = 0, $$1196$i = 0, $$1198$i = 0, $$124470$i = 0, $$1291$i$i = 0, $$1293$i$i = 0, $$1343$i = 0, $$1348$i = 0, $$1363$i = 0, $$1370$i = 0, $$1374$i = 0, $$2234253237$i = 0, $$2247$ph$i = 0, $$2253$ph$i = 0, $$2355$i = 0, $$3$i = 0, $$3$i$i = 0, $$3$i201 = 0, $$3350$i = 0, $$3372$i = 0, $$4$lcssa$i = 0, $$4$ph$i = 0, $$415$i = 0, $$4236$i = 0, $$4351$lcssa$i = 0, $$435114$i = 0, $$4357$$4$i = 0, $$4357$ph$i = 0, $$435713$i = 0, $$723948$i = 0, $$749$i = 0, $$pre$phi$i$iZ2D = 0, $$pre$phi$i20$iZ2D = 0, $$pre$phi$i211Z2D = 0, $$pre$phi$iZ2D = 0, $$pre$phi11$i$iZ2D = 0, $$pre$phiZ2D = 0, $1 = 0, $1001 = 0, $1007 = 0, $101 = 0, $1010 = 0, $1011 = 0, $102 = 0, $1029 = 0, $1031 = 0, $1038 = 0, $1039 = 0, $1040 = 0, $1048 = 0, $1050 = 0, $1051 = 0, $1052 = 0, $108 = 0, $112 = 0, $114 = 0, $115 = 0, $117 = 0, $119 = 0, $121 = 0, $123 = 0, $125 = 0, $127 = 0, $129 = 0, $134 = 0, $138 = 0, $14 = 0, $142 = 0, $145 = 0, $148 = 0, $149 = 0, $155 = 0, $157 = 0, $16 = 0, $160 = 0, $162 = 0, $165 = 0, $167 = 0, $17 = 0, $170 = 0, $173 = 0, $174 = 0, $176 = 0, $177 = 0, $179 = 0, $18 = 0, $180 = 0, $182 = 0, $183 = 0, $188 = 0, $189 = 0, $19 = 0, $20 = 0, $201 = 0, $205 = 0, $211 = 0, $218 = 0, $222 = 0, $231 = 0, $232 = 0, $234 = 0, $235 = 0, $239 = 0, $240 = 0, $248 = 0, $249 = 0, $250 = 0, $252 = 0, $253 = 0, $258 = 0, $259 = 0, $262 = 0, $264 = 0, $267 = 0, $27 = 0, $272 = 0, $279 = 0, $289 = 0, $293 = 0, $299 = 0, $30 = 0, $303 = 0, $306 = 0, $310 = 0, $312 = 0, $313 = 0, $315 = 0, $317 = 0, $319 = 0, $321 = 0, $323 = 0, $325 = 0, $327 = 0, $337 = 0, $338 = 0, $34 = 0, $348 = 0, $350 = 0, $353 = 0, $355 = 0, $358 = 0, $360 = 0, $363 = 0, $366 = 0, $367 = 0, $369 = 0, $37 = 0, $370 = 0, $372 = 0, $373 = 0, $375 = 0, $376 = 0, $381 = 0, $382 = 0, $387 = 0, $394 = 0, $398 = 0, $404 = 0, $41 = 0, $411 = 0, $415 = 0, $423 = 0, $426 = 0, $427 = 0, $428 = 0, $432 = 0, $433 = 0, $439 = 0, $44 = 0, $444 = 0, $445 = 0, $448 = 0, $450 = 0, $453 = 0, $458 = 0, $464 = 0, $466 = 0, $468 = 0, $47 = 0, $470 = 0, $487 = 0, $489 = 0, $49 = 0, $496 = 0, $497 = 0, $498 = 0, $50 = 0, $506 = 0, $508 = 0, $509 = 0, $511 = 0, $52 = 0, $520 = 0, $524 = 0, $526 = 0, $527 = 0, $528 = 0, $538 = 0, $539 = 0, $54 = 0, $540 = 0, $541 = 0, $542 = 0, $543 = 0, $544 = 0, $546 = 0, $548 = 0, $549 = 0, $555 = 0, $557 = 0, $559 = 0, $56 = 0, $564 = 0, $566 = 0, $568 = 0, $569 = 0, $570 = 0, $578 = 0, $579 = 0, $58 = 0, $582 = 0, $586 = 0, $589 = 0, $591 = 0, $597 = 0, $6 = 0, $60 = 0, $601 = 0, $605 = 0, $614 = 0, $615 = 0, $62 = 0, $621 = 0, $623 = 0, $627 = 0, $630 = 0, $632 = 0, $637 = 0, $64 = 0, $643 = 0, $648 = 0, $649 = 0, $650 = 0, $656 = 0, $657 = 0, $658 = 0, $662 = 0, $67 = 0, $673 = 0, $678 = 0, $679 = 0, $681 = 0, $687 = 0, $689 = 0, $69 = 0, $693 = 0, $699 = 0, $7 = 0, $70 = 0, $703 = 0, $709 = 0, $71 = 0, $711 = 0, $717 = 0, $72 = 0, $721 = 0, $722 = 0, $727 = 0, $73 = 0, $733 = 0, $738 = 0, $741 = 0, $742 = 0, $745 = 0, $747 = 0, $749 = 0, $752 = 0, $763 = 0, $768 = 0, $77 = 0, $770 = 0, $773 = 0, $775 = 0, $778 = 0, $781 = 0, $782 = 0, $783 = 0, $785 = 0, $787 = 0, $788 = 0, $790 = 0, $791 = 0, $796 = 0, $797 = 0, $8 = 0, $80 = 0, $810 = 0, $813 = 0, $814 = 0, $820 = 0, $828 = 0, $834 = 0, $837 = 0, $838 = 0, $839 = 0, $84 = 0, $843 = 0, $844 = 0, $850 = 0, $855 = 0, $856 = 0, $859 = 0, $861 = 0, $864 = 0, $869 = 0, $87 = 0, $875 = 0, $877 = 0, $879 = 0, $880 = 0, $898 = 0, $9 = 0, $900 = 0, $907 = 0, $908 = 0, $909 = 0, $916 = 0, $92 = 0, $920 = 0, $924 = 0, $926 = 0, $93 = 0, $932 = 0, $933 = 0, $935 = 0, $936 = 0, $937 = 0, $940 = 0, $945 = 0, $946 = 0, $947 = 0, $95 = 0, $953 = 0, $955 = 0, $96 = 0, $961 = 0, $966 = 0, $969 = 0, $970 = 0, $971 = 0, $975 = 0, $976 = 0, $98 = 0, $982 = 0, $987 = 0, $988 = 0, $991 = 0, $993 = 0, $996 = 0, label = 0, sp = 0, $955$looptemp = 0;
 sp = STACKTOP; //@line 166
 STACKTOP = STACKTOP + 16 | 0; //@line 167
 $1 = sp; //@line 168
 do {
  if ($0 >>> 0 < 245) {
   $6 = $0 >>> 0 < 11 ? 16 : $0 + 11 & -8; //@line 175
   $7 = $6 >>> 3; //@line 176
   $8 = HEAP32[640] | 0; //@line 177
   $9 = $8 >>> $7; //@line 178
   if ($9 & 3 | 0) {
    $14 = ($9 & 1 ^ 1) + $7 | 0; //@line 184
    $16 = 2600 + ($14 << 1 << 2) | 0; //@line 186
    $17 = $16 + 8 | 0; //@line 187
    $18 = HEAP32[$17 >> 2] | 0; //@line 188
    $19 = $18 + 8 | 0; //@line 189
    $20 = HEAP32[$19 >> 2] | 0; //@line 190
    do {
     if (($16 | 0) == ($20 | 0)) {
      HEAP32[640] = $8 & ~(1 << $14); //@line 197
     } else {
      if ($20 >>> 0 < (HEAP32[644] | 0) >>> 0) {
       _abort(); //@line 202
      }
      $27 = $20 + 12 | 0; //@line 205
      if ((HEAP32[$27 >> 2] | 0) == ($18 | 0)) {
       HEAP32[$27 >> 2] = $16; //@line 209
       HEAP32[$17 >> 2] = $20; //@line 210
       break;
      } else {
       _abort(); //@line 213
      }
     }
    } while (0);
    $30 = $14 << 3; //@line 218
    HEAP32[$18 + 4 >> 2] = $30 | 3; //@line 221
    $34 = $18 + $30 + 4 | 0; //@line 223
    HEAP32[$34 >> 2] = HEAP32[$34 >> 2] | 1; //@line 226
    $$0 = $19; //@line 227
    STACKTOP = sp; //@line 228
    return $$0 | 0; //@line 228
   }
   $37 = HEAP32[642] | 0; //@line 230
   if ($6 >>> 0 > $37 >>> 0) {
    if ($9 | 0) {
     $41 = 2 << $7; //@line 236
     $44 = $9 << $7 & ($41 | 0 - $41); //@line 239
     $47 = ($44 & 0 - $44) + -1 | 0; //@line 242
     $49 = $47 >>> 12 & 16; //@line 244
     $50 = $47 >>> $49; //@line 245
     $52 = $50 >>> 5 & 8; //@line 247
     $54 = $50 >>> $52; //@line 249
     $56 = $54 >>> 2 & 4; //@line 251
     $58 = $54 >>> $56; //@line 253
     $60 = $58 >>> 1 & 2; //@line 255
     $62 = $58 >>> $60; //@line 257
     $64 = $62 >>> 1 & 1; //@line 259
     $67 = ($52 | $49 | $56 | $60 | $64) + ($62 >>> $64) | 0; //@line 262
     $69 = 2600 + ($67 << 1 << 2) | 0; //@line 264
     $70 = $69 + 8 | 0; //@line 265
     $71 = HEAP32[$70 >> 2] | 0; //@line 266
     $72 = $71 + 8 | 0; //@line 267
     $73 = HEAP32[$72 >> 2] | 0; //@line 268
     do {
      if (($69 | 0) == ($73 | 0)) {
       $77 = $8 & ~(1 << $67); //@line 274
       HEAP32[640] = $77; //@line 275
       $98 = $77; //@line 276
      } else {
       if ($73 >>> 0 < (HEAP32[644] | 0) >>> 0) {
        _abort(); //@line 281
       }
       $80 = $73 + 12 | 0; //@line 284
       if ((HEAP32[$80 >> 2] | 0) == ($71 | 0)) {
        HEAP32[$80 >> 2] = $69; //@line 288
        HEAP32[$70 >> 2] = $73; //@line 289
        $98 = $8; //@line 290
        break;
       } else {
        _abort(); //@line 293
       }
      }
     } while (0);
     $84 = ($67 << 3) - $6 | 0; //@line 299
     HEAP32[$71 + 4 >> 2] = $6 | 3; //@line 302
     $87 = $71 + $6 | 0; //@line 303
     HEAP32[$87 + 4 >> 2] = $84 | 1; //@line 306
     HEAP32[$87 + $84 >> 2] = $84; //@line 308
     if ($37 | 0) {
      $92 = HEAP32[645] | 0; //@line 311
      $93 = $37 >>> 3; //@line 312
      $95 = 2600 + ($93 << 1 << 2) | 0; //@line 314
      $96 = 1 << $93; //@line 315
      if (!($98 & $96)) {
       HEAP32[640] = $98 | $96; //@line 320
       $$0199 = $95; //@line 322
       $$pre$phiZ2D = $95 + 8 | 0; //@line 322
      } else {
       $101 = $95 + 8 | 0; //@line 324
       $102 = HEAP32[$101 >> 2] | 0; //@line 325
       if ($102 >>> 0 < (HEAP32[644] | 0) >>> 0) {
        _abort(); //@line 329
       } else {
        $$0199 = $102; //@line 332
        $$pre$phiZ2D = $101; //@line 332
       }
      }
      HEAP32[$$pre$phiZ2D >> 2] = $92; //@line 335
      HEAP32[$$0199 + 12 >> 2] = $92; //@line 337
      HEAP32[$92 + 8 >> 2] = $$0199; //@line 339
      HEAP32[$92 + 12 >> 2] = $95; //@line 341
     }
     HEAP32[642] = $84; //@line 343
     HEAP32[645] = $87; //@line 344
     $$0 = $72; //@line 345
     STACKTOP = sp; //@line 346
     return $$0 | 0; //@line 346
    }
    $108 = HEAP32[641] | 0; //@line 348
    if (!$108) {
     $$0197 = $6; //@line 351
    } else {
     $112 = ($108 & 0 - $108) + -1 | 0; //@line 355
     $114 = $112 >>> 12 & 16; //@line 357
     $115 = $112 >>> $114; //@line 358
     $117 = $115 >>> 5 & 8; //@line 360
     $119 = $115 >>> $117; //@line 362
     $121 = $119 >>> 2 & 4; //@line 364
     $123 = $119 >>> $121; //@line 366
     $125 = $123 >>> 1 & 2; //@line 368
     $127 = $123 >>> $125; //@line 370
     $129 = $127 >>> 1 & 1; //@line 372
     $134 = HEAP32[2864 + (($117 | $114 | $121 | $125 | $129) + ($127 >>> $129) << 2) >> 2] | 0; //@line 377
     $138 = (HEAP32[$134 + 4 >> 2] & -8) - $6 | 0; //@line 381
     $142 = HEAP32[$134 + 16 + (((HEAP32[$134 + 16 >> 2] | 0) == 0 & 1) << 2) >> 2] | 0; //@line 387
     if (!$142) {
      $$0192$lcssa$i = $134; //@line 390
      $$0193$lcssa$i = $138; //@line 390
     } else {
      $$01928$i = $134; //@line 392
      $$01937$i = $138; //@line 392
      $145 = $142; //@line 392
      while (1) {
       $148 = (HEAP32[$145 + 4 >> 2] & -8) - $6 | 0; //@line 397
       $149 = $148 >>> 0 < $$01937$i >>> 0; //@line 398
       $$$0193$i = $149 ? $148 : $$01937$i; //@line 399
       $$$0192$i = $149 ? $145 : $$01928$i; //@line 400
       $145 = HEAP32[$145 + 16 + (((HEAP32[$145 + 16 >> 2] | 0) == 0 & 1) << 2) >> 2] | 0; //@line 406
       if (!$145) {
        $$0192$lcssa$i = $$$0192$i; //@line 409
        $$0193$lcssa$i = $$$0193$i; //@line 409
        break;
       } else {
        $$01928$i = $$$0192$i; //@line 412
        $$01937$i = $$$0193$i; //@line 412
       }
      }
     }
     $155 = HEAP32[644] | 0; //@line 416
     if ($$0192$lcssa$i >>> 0 < $155 >>> 0) {
      _abort(); //@line 419
     }
     $157 = $$0192$lcssa$i + $6 | 0; //@line 422
     if ($$0192$lcssa$i >>> 0 >= $157 >>> 0) {
      _abort(); //@line 425
     }
     $160 = HEAP32[$$0192$lcssa$i + 24 >> 2] | 0; //@line 429
     $162 = HEAP32[$$0192$lcssa$i + 12 >> 2] | 0; //@line 431
     do {
      if (($162 | 0) == ($$0192$lcssa$i | 0)) {
       $173 = $$0192$lcssa$i + 20 | 0; //@line 435
       $174 = HEAP32[$173 >> 2] | 0; //@line 436
       if (!$174) {
        $176 = $$0192$lcssa$i + 16 | 0; //@line 439
        $177 = HEAP32[$176 >> 2] | 0; //@line 440
        if (!$177) {
         $$3$i = 0; //@line 443
         break;
        } else {
         $$1196$i = $177; //@line 446
         $$1198$i = $176; //@line 446
        }
       } else {
        $$1196$i = $174; //@line 449
        $$1198$i = $173; //@line 449
       }
       while (1) {
        $179 = $$1196$i + 20 | 0; //@line 452
        $180 = HEAP32[$179 >> 2] | 0; //@line 453
        if ($180 | 0) {
         $$1196$i = $180; //@line 456
         $$1198$i = $179; //@line 456
         continue;
        }
        $182 = $$1196$i + 16 | 0; //@line 459
        $183 = HEAP32[$182 >> 2] | 0; //@line 460
        if (!$183) {
         break;
        } else {
         $$1196$i = $183; //@line 465
         $$1198$i = $182; //@line 465
        }
       }
       if ($$1198$i >>> 0 < $155 >>> 0) {
        _abort(); //@line 470
       } else {
        HEAP32[$$1198$i >> 2] = 0; //@line 473
        $$3$i = $$1196$i; //@line 474
        break;
       }
      } else {
       $165 = HEAP32[$$0192$lcssa$i + 8 >> 2] | 0; //@line 479
       if ($165 >>> 0 < $155 >>> 0) {
        _abort(); //@line 482
       }
       $167 = $165 + 12 | 0; //@line 485
       if ((HEAP32[$167 >> 2] | 0) != ($$0192$lcssa$i | 0)) {
        _abort(); //@line 489
       }
       $170 = $162 + 8 | 0; //@line 492
       if ((HEAP32[$170 >> 2] | 0) == ($$0192$lcssa$i | 0)) {
        HEAP32[$167 >> 2] = $162; //@line 496
        HEAP32[$170 >> 2] = $165; //@line 497
        $$3$i = $162; //@line 498
        break;
       } else {
        _abort(); //@line 501
       }
      }
     } while (0);
     L73 : do {
      if ($160 | 0) {
       $188 = HEAP32[$$0192$lcssa$i + 28 >> 2] | 0; //@line 510
       $189 = 2864 + ($188 << 2) | 0; //@line 511
       do {
        if (($$0192$lcssa$i | 0) == (HEAP32[$189 >> 2] | 0)) {
         HEAP32[$189 >> 2] = $$3$i; //@line 516
         if (!$$3$i) {
          HEAP32[641] = $108 & ~(1 << $188); //@line 522
          break L73;
         }
        } else {
         if ($160 >>> 0 < (HEAP32[644] | 0) >>> 0) {
          _abort(); //@line 529
         } else {
          HEAP32[$160 + 16 + (((HEAP32[$160 + 16 >> 2] | 0) != ($$0192$lcssa$i | 0) & 1) << 2) >> 2] = $$3$i; //@line 537
          if (!$$3$i) {
           break L73;
          } else {
           break;
          }
         }
        }
       } while (0);
       $201 = HEAP32[644] | 0; //@line 547
       if ($$3$i >>> 0 < $201 >>> 0) {
        _abort(); //@line 550
       }
       HEAP32[$$3$i + 24 >> 2] = $160; //@line 554
       $205 = HEAP32[$$0192$lcssa$i + 16 >> 2] | 0; //@line 556
       do {
        if ($205 | 0) {
         if ($205 >>> 0 < $201 >>> 0) {
          _abort(); //@line 562
         } else {
          HEAP32[$$3$i + 16 >> 2] = $205; //@line 566
          HEAP32[$205 + 24 >> 2] = $$3$i; //@line 568
          break;
         }
        }
       } while (0);
       $211 = HEAP32[$$0192$lcssa$i + 20 >> 2] | 0; //@line 574
       if ($211 | 0) {
        if ($211 >>> 0 < (HEAP32[644] | 0) >>> 0) {
         _abort(); //@line 580
        } else {
         HEAP32[$$3$i + 20 >> 2] = $211; //@line 584
         HEAP32[$211 + 24 >> 2] = $$3$i; //@line 586
         break;
        }
       }
      }
     } while (0);
     if ($$0193$lcssa$i >>> 0 < 16) {
      $218 = $$0193$lcssa$i + $6 | 0; //@line 594
      HEAP32[$$0192$lcssa$i + 4 >> 2] = $218 | 3; //@line 597
      $222 = $$0192$lcssa$i + $218 + 4 | 0; //@line 599
      HEAP32[$222 >> 2] = HEAP32[$222 >> 2] | 1; //@line 602
     } else {
      HEAP32[$$0192$lcssa$i + 4 >> 2] = $6 | 3; //@line 606
      HEAP32[$157 + 4 >> 2] = $$0193$lcssa$i | 1; //@line 609
      HEAP32[$157 + $$0193$lcssa$i >> 2] = $$0193$lcssa$i; //@line 611
      if ($37 | 0) {
       $231 = HEAP32[645] | 0; //@line 614
       $232 = $37 >>> 3; //@line 615
       $234 = 2600 + ($232 << 1 << 2) | 0; //@line 617
       $235 = 1 << $232; //@line 618
       if (!($8 & $235)) {
        HEAP32[640] = $8 | $235; //@line 623
        $$0189$i = $234; //@line 625
        $$pre$phi$iZ2D = $234 + 8 | 0; //@line 625
       } else {
        $239 = $234 + 8 | 0; //@line 627
        $240 = HEAP32[$239 >> 2] | 0; //@line 628
        if ($240 >>> 0 < (HEAP32[644] | 0) >>> 0) {
         _abort(); //@line 632
        } else {
         $$0189$i = $240; //@line 635
         $$pre$phi$iZ2D = $239; //@line 635
        }
       }
       HEAP32[$$pre$phi$iZ2D >> 2] = $231; //@line 638
       HEAP32[$$0189$i + 12 >> 2] = $231; //@line 640
       HEAP32[$231 + 8 >> 2] = $$0189$i; //@line 642
       HEAP32[$231 + 12 >> 2] = $234; //@line 644
      }
      HEAP32[642] = $$0193$lcssa$i; //@line 646
      HEAP32[645] = $157; //@line 647
     }
     $$0 = $$0192$lcssa$i + 8 | 0; //@line 650
     STACKTOP = sp; //@line 651
     return $$0 | 0; //@line 651
    }
   } else {
    $$0197 = $6; //@line 654
   }
  } else {
   if ($0 >>> 0 > 4294967231) {
    $$0197 = -1; //@line 659
   } else {
    $248 = $0 + 11 | 0; //@line 661
    $249 = $248 & -8; //@line 662
    $250 = HEAP32[641] | 0; //@line 663
    if (!$250) {
     $$0197 = $249; //@line 666
    } else {
     $252 = 0 - $249 | 0; //@line 668
     $253 = $248 >>> 8; //@line 669
     if (!$253) {
      $$0358$i = 0; //@line 672
     } else {
      if ($249 >>> 0 > 16777215) {
       $$0358$i = 31; //@line 676
      } else {
       $258 = ($253 + 1048320 | 0) >>> 16 & 8; //@line 680
       $259 = $253 << $258; //@line 681
       $262 = ($259 + 520192 | 0) >>> 16 & 4; //@line 684
       $264 = $259 << $262; //@line 686
       $267 = ($264 + 245760 | 0) >>> 16 & 2; //@line 689
       $272 = 14 - ($262 | $258 | $267) + ($264 << $267 >>> 15) | 0; //@line 694
       $$0358$i = $249 >>> ($272 + 7 | 0) & 1 | $272 << 1; //@line 700
      }
     }
     $279 = HEAP32[2864 + ($$0358$i << 2) >> 2] | 0; //@line 704
     L117 : do {
      if (!$279) {
       $$2355$i = 0; //@line 708
       $$3$i201 = 0; //@line 708
       $$3350$i = $252; //@line 708
       label = 81; //@line 709
      } else {
       $$0342$i = 0; //@line 716
       $$0347$i = $252; //@line 716
       $$0353$i = $279; //@line 716
       $$0359$i = $249 << (($$0358$i | 0) == 31 ? 0 : 25 - ($$0358$i >>> 1) | 0); //@line 716
       $$0362$i = 0; //@line 716
       while (1) {
        $289 = (HEAP32[$$0353$i + 4 >> 2] & -8) - $249 | 0; //@line 721
        if ($289 >>> 0 < $$0347$i >>> 0) {
         if (!$289) {
          $$415$i = $$0353$i; //@line 726
          $$435114$i = 0; //@line 726
          $$435713$i = $$0353$i; //@line 726
          label = 85; //@line 727
          break L117;
         } else {
          $$1343$i = $$0353$i; //@line 730
          $$1348$i = $289; //@line 730
         }
        } else {
         $$1343$i = $$0342$i; //@line 733
         $$1348$i = $$0347$i; //@line 733
        }
        $293 = HEAP32[$$0353$i + 20 >> 2] | 0; //@line 736
        $$0353$i = HEAP32[$$0353$i + 16 + ($$0359$i >>> 31 << 2) >> 2] | 0; //@line 739
        $$1363$i = ($293 | 0) == 0 | ($293 | 0) == ($$0353$i | 0) ? $$0362$i : $293; //@line 743
        $299 = ($$0353$i | 0) == 0; //@line 744
        if ($299) {
         $$2355$i = $$1363$i; //@line 749
         $$3$i201 = $$1343$i; //@line 749
         $$3350$i = $$1348$i; //@line 749
         label = 81; //@line 750
         break;
        } else {
         $$0342$i = $$1343$i; //@line 753
         $$0347$i = $$1348$i; //@line 753
         $$0359$i = $$0359$i << (($299 ^ 1) & 1); //@line 753
         $$0362$i = $$1363$i; //@line 753
        }
       }
      }
     } while (0);
     if ((label | 0) == 81) {
      if (($$2355$i | 0) == 0 & ($$3$i201 | 0) == 0) {
       $303 = 2 << $$0358$i; //@line 763
       $306 = $250 & ($303 | 0 - $303); //@line 766
       if (!$306) {
        $$0197 = $249; //@line 769
        break;
       }
       $310 = ($306 & 0 - $306) + -1 | 0; //@line 774
       $312 = $310 >>> 12 & 16; //@line 776
       $313 = $310 >>> $312; //@line 777
       $315 = $313 >>> 5 & 8; //@line 779
       $317 = $313 >>> $315; //@line 781
       $319 = $317 >>> 2 & 4; //@line 783
       $321 = $317 >>> $319; //@line 785
       $323 = $321 >>> 1 & 2; //@line 787
       $325 = $321 >>> $323; //@line 789
       $327 = $325 >>> 1 & 1; //@line 791
       $$4$ph$i = 0; //@line 797
       $$4357$ph$i = HEAP32[2864 + (($315 | $312 | $319 | $323 | $327) + ($325 >>> $327) << 2) >> 2] | 0; //@line 797
      } else {
       $$4$ph$i = $$3$i201; //@line 799
       $$4357$ph$i = $$2355$i; //@line 799
      }
      if (!$$4357$ph$i) {
       $$4$lcssa$i = $$4$ph$i; //@line 803
       $$4351$lcssa$i = $$3350$i; //@line 803
      } else {
       $$415$i = $$4$ph$i; //@line 805
       $$435114$i = $$3350$i; //@line 805
       $$435713$i = $$4357$ph$i; //@line 805
       label = 85; //@line 806
      }
     }
     if ((label | 0) == 85) {
      while (1) {
       label = 0; //@line 811
       $337 = (HEAP32[$$435713$i + 4 >> 2] & -8) - $249 | 0; //@line 815
       $338 = $337 >>> 0 < $$435114$i >>> 0; //@line 816
       $$$4351$i = $338 ? $337 : $$435114$i; //@line 817
       $$4357$$4$i = $338 ? $$435713$i : $$415$i; //@line 818
       $$435713$i = HEAP32[$$435713$i + 16 + (((HEAP32[$$435713$i + 16 >> 2] | 0) == 0 & 1) << 2) >> 2] | 0; //@line 824
       if (!$$435713$i) {
        $$4$lcssa$i = $$4357$$4$i; //@line 827
        $$4351$lcssa$i = $$$4351$i; //@line 827
        break;
       } else {
        $$415$i = $$4357$$4$i; //@line 830
        $$435114$i = $$$4351$i; //@line 830
        label = 85; //@line 831
       }
      }
     }
     if (!$$4$lcssa$i) {
      $$0197 = $249; //@line 837
     } else {
      if ($$4351$lcssa$i >>> 0 < ((HEAP32[642] | 0) - $249 | 0) >>> 0) {
       $348 = HEAP32[644] | 0; //@line 843
       if ($$4$lcssa$i >>> 0 < $348 >>> 0) {
        _abort(); //@line 846
       }
       $350 = $$4$lcssa$i + $249 | 0; //@line 849
       if ($$4$lcssa$i >>> 0 >= $350 >>> 0) {
        _abort(); //@line 852
       }
       $353 = HEAP32[$$4$lcssa$i + 24 >> 2] | 0; //@line 856
       $355 = HEAP32[$$4$lcssa$i + 12 >> 2] | 0; //@line 858
       do {
        if (($355 | 0) == ($$4$lcssa$i | 0)) {
         $366 = $$4$lcssa$i + 20 | 0; //@line 862
         $367 = HEAP32[$366 >> 2] | 0; //@line 863
         if (!$367) {
          $369 = $$4$lcssa$i + 16 | 0; //@line 866
          $370 = HEAP32[$369 >> 2] | 0; //@line 867
          if (!$370) {
           $$3372$i = 0; //@line 870
           break;
          } else {
           $$1370$i = $370; //@line 873
           $$1374$i = $369; //@line 873
          }
         } else {
          $$1370$i = $367; //@line 876
          $$1374$i = $366; //@line 876
         }
         while (1) {
          $372 = $$1370$i + 20 | 0; //@line 879
          $373 = HEAP32[$372 >> 2] | 0; //@line 880
          if ($373 | 0) {
           $$1370$i = $373; //@line 883
           $$1374$i = $372; //@line 883
           continue;
          }
          $375 = $$1370$i + 16 | 0; //@line 886
          $376 = HEAP32[$375 >> 2] | 0; //@line 887
          if (!$376) {
           break;
          } else {
           $$1370$i = $376; //@line 892
           $$1374$i = $375; //@line 892
          }
         }
         if ($$1374$i >>> 0 < $348 >>> 0) {
          _abort(); //@line 897
         } else {
          HEAP32[$$1374$i >> 2] = 0; //@line 900
          $$3372$i = $$1370$i; //@line 901
          break;
         }
        } else {
         $358 = HEAP32[$$4$lcssa$i + 8 >> 2] | 0; //@line 906
         if ($358 >>> 0 < $348 >>> 0) {
          _abort(); //@line 909
         }
         $360 = $358 + 12 | 0; //@line 912
         if ((HEAP32[$360 >> 2] | 0) != ($$4$lcssa$i | 0)) {
          _abort(); //@line 916
         }
         $363 = $355 + 8 | 0; //@line 919
         if ((HEAP32[$363 >> 2] | 0) == ($$4$lcssa$i | 0)) {
          HEAP32[$360 >> 2] = $355; //@line 923
          HEAP32[$363 >> 2] = $358; //@line 924
          $$3372$i = $355; //@line 925
          break;
         } else {
          _abort(); //@line 928
         }
        }
       } while (0);
       L164 : do {
        if (!$353) {
         $470 = $250; //@line 936
        } else {
         $381 = HEAP32[$$4$lcssa$i + 28 >> 2] | 0; //@line 939
         $382 = 2864 + ($381 << 2) | 0; //@line 940
         do {
          if (($$4$lcssa$i | 0) == (HEAP32[$382 >> 2] | 0)) {
           HEAP32[$382 >> 2] = $$3372$i; //@line 945
           if (!$$3372$i) {
            $387 = $250 & ~(1 << $381); //@line 950
            HEAP32[641] = $387; //@line 951
            $470 = $387; //@line 952
            break L164;
           }
          } else {
           if ($353 >>> 0 < (HEAP32[644] | 0) >>> 0) {
            _abort(); //@line 959
           } else {
            HEAP32[$353 + 16 + (((HEAP32[$353 + 16 >> 2] | 0) != ($$4$lcssa$i | 0) & 1) << 2) >> 2] = $$3372$i; //@line 967
            if (!$$3372$i) {
             $470 = $250; //@line 970
             break L164;
            } else {
             break;
            }
           }
          }
         } while (0);
         $394 = HEAP32[644] | 0; //@line 978
         if ($$3372$i >>> 0 < $394 >>> 0) {
          _abort(); //@line 981
         }
         HEAP32[$$3372$i + 24 >> 2] = $353; //@line 985
         $398 = HEAP32[$$4$lcssa$i + 16 >> 2] | 0; //@line 987
         do {
          if ($398 | 0) {
           if ($398 >>> 0 < $394 >>> 0) {
            _abort(); //@line 993
           } else {
            HEAP32[$$3372$i + 16 >> 2] = $398; //@line 997
            HEAP32[$398 + 24 >> 2] = $$3372$i; //@line 999
            break;
           }
          }
         } while (0);
         $404 = HEAP32[$$4$lcssa$i + 20 >> 2] | 0; //@line 1005
         if (!$404) {
          $470 = $250; //@line 1008
         } else {
          if ($404 >>> 0 < (HEAP32[644] | 0) >>> 0) {
           _abort(); //@line 1013
          } else {
           HEAP32[$$3372$i + 20 >> 2] = $404; //@line 1017
           HEAP32[$404 + 24 >> 2] = $$3372$i; //@line 1019
           $470 = $250; //@line 1020
           break;
          }
         }
        }
       } while (0);
       do {
        if ($$4351$lcssa$i >>> 0 < 16) {
         $411 = $$4351$lcssa$i + $249 | 0; //@line 1029
         HEAP32[$$4$lcssa$i + 4 >> 2] = $411 | 3; //@line 1032
         $415 = $$4$lcssa$i + $411 + 4 | 0; //@line 1034
         HEAP32[$415 >> 2] = HEAP32[$415 >> 2] | 1; //@line 1037
        } else {
         HEAP32[$$4$lcssa$i + 4 >> 2] = $249 | 3; //@line 1041
         HEAP32[$350 + 4 >> 2] = $$4351$lcssa$i | 1; //@line 1044
         HEAP32[$350 + $$4351$lcssa$i >> 2] = $$4351$lcssa$i; //@line 1046
         $423 = $$4351$lcssa$i >>> 3; //@line 1047
         if ($$4351$lcssa$i >>> 0 < 256) {
          $426 = 2600 + ($423 << 1 << 2) | 0; //@line 1051
          $427 = HEAP32[640] | 0; //@line 1052
          $428 = 1 << $423; //@line 1053
          if (!($427 & $428)) {
           HEAP32[640] = $427 | $428; //@line 1058
           $$0368$i = $426; //@line 1060
           $$pre$phi$i211Z2D = $426 + 8 | 0; //@line 1060
          } else {
           $432 = $426 + 8 | 0; //@line 1062
           $433 = HEAP32[$432 >> 2] | 0; //@line 1063
           if ($433 >>> 0 < (HEAP32[644] | 0) >>> 0) {
            _abort(); //@line 1067
           } else {
            $$0368$i = $433; //@line 1070
            $$pre$phi$i211Z2D = $432; //@line 1070
           }
          }
          HEAP32[$$pre$phi$i211Z2D >> 2] = $350; //@line 1073
          HEAP32[$$0368$i + 12 >> 2] = $350; //@line 1075
          HEAP32[$350 + 8 >> 2] = $$0368$i; //@line 1077
          HEAP32[$350 + 12 >> 2] = $426; //@line 1079
          break;
         }
         $439 = $$4351$lcssa$i >>> 8; //@line 1082
         if (!$439) {
          $$0361$i = 0; //@line 1085
         } else {
          if ($$4351$lcssa$i >>> 0 > 16777215) {
           $$0361$i = 31; //@line 1089
          } else {
           $444 = ($439 + 1048320 | 0) >>> 16 & 8; //@line 1093
           $445 = $439 << $444; //@line 1094
           $448 = ($445 + 520192 | 0) >>> 16 & 4; //@line 1097
           $450 = $445 << $448; //@line 1099
           $453 = ($450 + 245760 | 0) >>> 16 & 2; //@line 1102
           $458 = 14 - ($448 | $444 | $453) + ($450 << $453 >>> 15) | 0; //@line 1107
           $$0361$i = $$4351$lcssa$i >>> ($458 + 7 | 0) & 1 | $458 << 1; //@line 1113
          }
         }
         $464 = 2864 + ($$0361$i << 2) | 0; //@line 1116
         HEAP32[$350 + 28 >> 2] = $$0361$i; //@line 1118
         $466 = $350 + 16 | 0; //@line 1119
         HEAP32[$466 + 4 >> 2] = 0; //@line 1121
         HEAP32[$466 >> 2] = 0; //@line 1122
         $468 = 1 << $$0361$i; //@line 1123
         if (!($470 & $468)) {
          HEAP32[641] = $470 | $468; //@line 1128
          HEAP32[$464 >> 2] = $350; //@line 1129
          HEAP32[$350 + 24 >> 2] = $464; //@line 1131
          HEAP32[$350 + 12 >> 2] = $350; //@line 1133
          HEAP32[$350 + 8 >> 2] = $350; //@line 1135
          break;
         }
         $$0344$i = $$4351$lcssa$i << (($$0361$i | 0) == 31 ? 0 : 25 - ($$0361$i >>> 1) | 0); //@line 1144
         $$0345$i = HEAP32[$464 >> 2] | 0; //@line 1144
         while (1) {
          if ((HEAP32[$$0345$i + 4 >> 2] & -8 | 0) == ($$4351$lcssa$i | 0)) {
           label = 139; //@line 1151
           break;
          }
          $487 = $$0345$i + 16 + ($$0344$i >>> 31 << 2) | 0; //@line 1155
          $489 = HEAP32[$487 >> 2] | 0; //@line 1157
          if (!$489) {
           label = 136; //@line 1160
           break;
          } else {
           $$0344$i = $$0344$i << 1; //@line 1163
           $$0345$i = $489; //@line 1163
          }
         }
         if ((label | 0) == 136) {
          if ($487 >>> 0 < (HEAP32[644] | 0) >>> 0) {
           _abort(); //@line 1170
          } else {
           HEAP32[$487 >> 2] = $350; //@line 1173
           HEAP32[$350 + 24 >> 2] = $$0345$i; //@line 1175
           HEAP32[$350 + 12 >> 2] = $350; //@line 1177
           HEAP32[$350 + 8 >> 2] = $350; //@line 1179
           break;
          }
         } else if ((label | 0) == 139) {
          $496 = $$0345$i + 8 | 0; //@line 1184
          $497 = HEAP32[$496 >> 2] | 0; //@line 1185
          $498 = HEAP32[644] | 0; //@line 1186
          if ($497 >>> 0 >= $498 >>> 0 & $$0345$i >>> 0 >= $498 >>> 0) {
           HEAP32[$497 + 12 >> 2] = $350; //@line 1192
           HEAP32[$496 >> 2] = $350; //@line 1193
           HEAP32[$350 + 8 >> 2] = $497; //@line 1195
           HEAP32[$350 + 12 >> 2] = $$0345$i; //@line 1197
           HEAP32[$350 + 24 >> 2] = 0; //@line 1199
           break;
          } else {
           _abort(); //@line 1202
          }
         }
        }
       } while (0);
       $$0 = $$4$lcssa$i + 8 | 0; //@line 1209
       STACKTOP = sp; //@line 1210
       return $$0 | 0; //@line 1210
      } else {
       $$0197 = $249; //@line 1212
      }
     }
    }
   }
  }
 } while (0);
 $506 = HEAP32[642] | 0; //@line 1219
 if ($506 >>> 0 >= $$0197 >>> 0) {
  $508 = $506 - $$0197 | 0; //@line 1222
  $509 = HEAP32[645] | 0; //@line 1223
  if ($508 >>> 0 > 15) {
   $511 = $509 + $$0197 | 0; //@line 1226
   HEAP32[645] = $511; //@line 1227
   HEAP32[642] = $508; //@line 1228
   HEAP32[$511 + 4 >> 2] = $508 | 1; //@line 1231
   HEAP32[$511 + $508 >> 2] = $508; //@line 1233
   HEAP32[$509 + 4 >> 2] = $$0197 | 3; //@line 1236
  } else {
   HEAP32[642] = 0; //@line 1238
   HEAP32[645] = 0; //@line 1239
   HEAP32[$509 + 4 >> 2] = $506 | 3; //@line 1242
   $520 = $509 + $506 + 4 | 0; //@line 1244
   HEAP32[$520 >> 2] = HEAP32[$520 >> 2] | 1; //@line 1247
  }
  $$0 = $509 + 8 | 0; //@line 1250
  STACKTOP = sp; //@line 1251
  return $$0 | 0; //@line 1251
 }
 $524 = HEAP32[643] | 0; //@line 1253
 if ($524 >>> 0 > $$0197 >>> 0) {
  $526 = $524 - $$0197 | 0; //@line 1256
  HEAP32[643] = $526; //@line 1257
  $527 = HEAP32[646] | 0; //@line 1258
  $528 = $527 + $$0197 | 0; //@line 1259
  HEAP32[646] = $528; //@line 1260
  HEAP32[$528 + 4 >> 2] = $526 | 1; //@line 1263
  HEAP32[$527 + 4 >> 2] = $$0197 | 3; //@line 1266
  $$0 = $527 + 8 | 0; //@line 1268
  STACKTOP = sp; //@line 1269
  return $$0 | 0; //@line 1269
 }
 if (!(HEAP32[758] | 0)) {
  HEAP32[760] = 4096; //@line 1274
  HEAP32[759] = 4096; //@line 1275
  HEAP32[761] = -1; //@line 1276
  HEAP32[762] = -1; //@line 1277
  HEAP32[763] = 0; //@line 1278
  HEAP32[751] = 0; //@line 1279
  $538 = $1 & -16 ^ 1431655768; //@line 1282
  HEAP32[$1 >> 2] = $538; //@line 1283
  HEAP32[758] = $538; //@line 1284
  $542 = 4096; //@line 1285
 } else {
  $542 = HEAP32[760] | 0; //@line 1288
 }
 $539 = $$0197 + 48 | 0; //@line 1290
 $540 = $$0197 + 47 | 0; //@line 1291
 $541 = $542 + $540 | 0; //@line 1292
 $543 = 0 - $542 | 0; //@line 1293
 $544 = $541 & $543; //@line 1294
 if ($544 >>> 0 <= $$0197 >>> 0) {
  $$0 = 0; //@line 1297
  STACKTOP = sp; //@line 1298
  return $$0 | 0; //@line 1298
 }
 $546 = HEAP32[750] | 0; //@line 1300
 if ($546 | 0) {
  $548 = HEAP32[748] | 0; //@line 1303
  $549 = $548 + $544 | 0; //@line 1304
  if ($549 >>> 0 <= $548 >>> 0 | $549 >>> 0 > $546 >>> 0) {
   $$0 = 0; //@line 1309
   STACKTOP = sp; //@line 1310
   return $$0 | 0; //@line 1310
  }
 }
 L244 : do {
  if (!(HEAP32[751] & 4)) {
   $555 = HEAP32[646] | 0; //@line 1318
   L246 : do {
    if (!$555) {
     label = 163; //@line 1322
    } else {
     $$0$i$i = 3008; //@line 1324
     while (1) {
      $557 = HEAP32[$$0$i$i >> 2] | 0; //@line 1326
      if ($557 >>> 0 <= $555 >>> 0) {
       $559 = $$0$i$i + 4 | 0; //@line 1329
       if (($557 + (HEAP32[$559 >> 2] | 0) | 0) >>> 0 > $555 >>> 0) {
        break;
       }
      }
      $564 = HEAP32[$$0$i$i + 8 >> 2] | 0; //@line 1338
      if (!$564) {
       label = 163; //@line 1341
       break L246;
      } else {
       $$0$i$i = $564; //@line 1344
      }
     }
     $589 = $541 - $524 & $543; //@line 1348
     if ($589 >>> 0 < 2147483647) {
      $591 = _sbrk($589 | 0) | 0; //@line 1351
      if (($591 | 0) == ((HEAP32[$$0$i$i >> 2] | 0) + (HEAP32[$559 >> 2] | 0) | 0)) {
       if (($591 | 0) == (-1 | 0)) {
        $$2234253237$i = $589; //@line 1359
       } else {
        $$723948$i = $589; //@line 1361
        $$749$i = $591; //@line 1361
        label = 180; //@line 1362
        break L244;
       }
      } else {
       $$2247$ph$i = $591; //@line 1366
       $$2253$ph$i = $589; //@line 1366
       label = 171; //@line 1367
      }
     } else {
      $$2234253237$i = 0; //@line 1370
     }
    }
   } while (0);
   do {
    if ((label | 0) == 163) {
     $566 = _sbrk(0) | 0; //@line 1376
     if (($566 | 0) == (-1 | 0)) {
      $$2234253237$i = 0; //@line 1379
     } else {
      $568 = $566; //@line 1381
      $569 = HEAP32[759] | 0; //@line 1382
      $570 = $569 + -1 | 0; //@line 1383
      $$$i = (($570 & $568 | 0) == 0 ? 0 : ($570 + $568 & 0 - $569) - $568 | 0) + $544 | 0; //@line 1391
      $578 = HEAP32[748] | 0; //@line 1392
      $579 = $$$i + $578 | 0; //@line 1393
      if ($$$i >>> 0 > $$0197 >>> 0 & $$$i >>> 0 < 2147483647) {
       $582 = HEAP32[750] | 0; //@line 1398
       if ($582 | 0) {
        if ($579 >>> 0 <= $578 >>> 0 | $579 >>> 0 > $582 >>> 0) {
         $$2234253237$i = 0; //@line 1405
         break;
        }
       }
       $586 = _sbrk($$$i | 0) | 0; //@line 1409
       if (($586 | 0) == ($566 | 0)) {
        $$723948$i = $$$i; //@line 1412
        $$749$i = $566; //@line 1412
        label = 180; //@line 1413
        break L244;
       } else {
        $$2247$ph$i = $586; //@line 1416
        $$2253$ph$i = $$$i; //@line 1416
        label = 171; //@line 1417
       }
      } else {
       $$2234253237$i = 0; //@line 1420
      }
     }
    }
   } while (0);
   do {
    if ((label | 0) == 171) {
     $597 = 0 - $$2253$ph$i | 0; //@line 1427
     if (!($539 >>> 0 > $$2253$ph$i >>> 0 & ($$2253$ph$i >>> 0 < 2147483647 & ($$2247$ph$i | 0) != (-1 | 0)))) {
      if (($$2247$ph$i | 0) == (-1 | 0)) {
       $$2234253237$i = 0; //@line 1436
       break;
      } else {
       $$723948$i = $$2253$ph$i; //@line 1439
       $$749$i = $$2247$ph$i; //@line 1439
       label = 180; //@line 1440
       break L244;
      }
     }
     $601 = HEAP32[760] | 0; //@line 1444
     $605 = $540 - $$2253$ph$i + $601 & 0 - $601; //@line 1448
     if ($605 >>> 0 >= 2147483647) {
      $$723948$i = $$2253$ph$i; //@line 1451
      $$749$i = $$2247$ph$i; //@line 1451
      label = 180; //@line 1452
      break L244;
     }
     if ((_sbrk($605 | 0) | 0) == (-1 | 0)) {
      _sbrk($597 | 0) | 0; //@line 1458
      $$2234253237$i = 0; //@line 1459
      break;
     } else {
      $$723948$i = $605 + $$2253$ph$i | 0; //@line 1463
      $$749$i = $$2247$ph$i; //@line 1463
      label = 180; //@line 1464
      break L244;
     }
    }
   } while (0);
   HEAP32[751] = HEAP32[751] | 4; //@line 1471
   $$4236$i = $$2234253237$i; //@line 1472
   label = 178; //@line 1473
  } else {
   $$4236$i = 0; //@line 1475
   label = 178; //@line 1476
  }
 } while (0);
 if ((label | 0) == 178) {
  if ($544 >>> 0 < 2147483647) {
   $614 = _sbrk($544 | 0) | 0; //@line 1482
   $615 = _sbrk(0) | 0; //@line 1483
   $621 = $615 - $614 | 0; //@line 1491
   $623 = $621 >>> 0 > ($$0197 + 40 | 0) >>> 0; //@line 1493
   if (!(($614 | 0) == (-1 | 0) | $623 ^ 1 | $614 >>> 0 < $615 >>> 0 & (($614 | 0) != (-1 | 0) & ($615 | 0) != (-1 | 0)) ^ 1)) {
    $$723948$i = $623 ? $621 : $$4236$i; //@line 1501
    $$749$i = $614; //@line 1501
    label = 180; //@line 1502
   }
  }
 }
 if ((label | 0) == 180) {
  $627 = (HEAP32[748] | 0) + $$723948$i | 0; //@line 1508
  HEAP32[748] = $627; //@line 1509
  if ($627 >>> 0 > (HEAP32[749] | 0) >>> 0) {
   HEAP32[749] = $627; //@line 1513
  }
  $630 = HEAP32[646] | 0; //@line 1515
  do {
   if (!$630) {
    $632 = HEAP32[644] | 0; //@line 1519
    if (($632 | 0) == 0 | $$749$i >>> 0 < $632 >>> 0) {
     HEAP32[644] = $$749$i; //@line 1524
    }
    HEAP32[752] = $$749$i; //@line 1526
    HEAP32[753] = $$723948$i; //@line 1527
    HEAP32[755] = 0; //@line 1528
    HEAP32[649] = HEAP32[758]; //@line 1530
    HEAP32[648] = -1; //@line 1531
    $$01$i$i = 0; //@line 1532
    do {
     $637 = 2600 + ($$01$i$i << 1 << 2) | 0; //@line 1535
     HEAP32[$637 + 12 >> 2] = $637; //@line 1537
     HEAP32[$637 + 8 >> 2] = $637; //@line 1539
     $$01$i$i = $$01$i$i + 1 | 0; //@line 1540
    } while (($$01$i$i | 0) != 32);
    $643 = $$749$i + 8 | 0; //@line 1550
    $648 = ($643 & 7 | 0) == 0 ? 0 : 0 - $643 & 7; //@line 1555
    $649 = $$749$i + $648 | 0; //@line 1556
    $650 = $$723948$i + -40 - $648 | 0; //@line 1557
    HEAP32[646] = $649; //@line 1558
    HEAP32[643] = $650; //@line 1559
    HEAP32[$649 + 4 >> 2] = $650 | 1; //@line 1562
    HEAP32[$649 + $650 + 4 >> 2] = 40; //@line 1565
    HEAP32[647] = HEAP32[762]; //@line 1567
   } else {
    $$024371$i = 3008; //@line 1569
    while (1) {
     $656 = HEAP32[$$024371$i >> 2] | 0; //@line 1571
     $657 = $$024371$i + 4 | 0; //@line 1572
     $658 = HEAP32[$657 >> 2] | 0; //@line 1573
     if (($$749$i | 0) == ($656 + $658 | 0)) {
      label = 190; //@line 1577
      break;
     }
     $662 = HEAP32[$$024371$i + 8 >> 2] | 0; //@line 1581
     if (!$662) {
      break;
     } else {
      $$024371$i = $662; //@line 1586
     }
    }
    if ((label | 0) == 190) {
     if (!(HEAP32[$$024371$i + 12 >> 2] & 8)) {
      if ($630 >>> 0 < $$749$i >>> 0 & $630 >>> 0 >= $656 >>> 0) {
       HEAP32[$657 >> 2] = $658 + $$723948$i; //@line 1600
       $673 = $630 + 8 | 0; //@line 1603
       $678 = ($673 & 7 | 0) == 0 ? 0 : 0 - $673 & 7; //@line 1608
       $679 = $630 + $678 | 0; //@line 1609
       $681 = (HEAP32[643] | 0) + ($$723948$i - $678) | 0; //@line 1611
       HEAP32[646] = $679; //@line 1612
       HEAP32[643] = $681; //@line 1613
       HEAP32[$679 + 4 >> 2] = $681 | 1; //@line 1616
       HEAP32[$679 + $681 + 4 >> 2] = 40; //@line 1619
       HEAP32[647] = HEAP32[762]; //@line 1621
       break;
      }
     }
    }
    $687 = HEAP32[644] | 0; //@line 1626
    if ($$749$i >>> 0 < $687 >>> 0) {
     HEAP32[644] = $$749$i; //@line 1629
     $752 = $$749$i; //@line 1630
    } else {
     $752 = $687; //@line 1632
    }
    $689 = $$749$i + $$723948$i | 0; //@line 1634
    $$124470$i = 3008; //@line 1635
    while (1) {
     if ((HEAP32[$$124470$i >> 2] | 0) == ($689 | 0)) {
      label = 198; //@line 1640
      break;
     }
     $693 = HEAP32[$$124470$i + 8 >> 2] | 0; //@line 1644
     if (!$693) {
      break;
     } else {
      $$124470$i = $693; //@line 1649
     }
    }
    if ((label | 0) == 198) {
     if (!(HEAP32[$$124470$i + 12 >> 2] & 8)) {
      HEAP32[$$124470$i >> 2] = $$749$i; //@line 1658
      $699 = $$124470$i + 4 | 0; //@line 1659
      HEAP32[$699 >> 2] = (HEAP32[$699 >> 2] | 0) + $$723948$i; //@line 1662
      $703 = $$749$i + 8 | 0; //@line 1664
      $709 = $$749$i + (($703 & 7 | 0) == 0 ? 0 : 0 - $703 & 7) | 0; //@line 1670
      $711 = $689 + 8 | 0; //@line 1672
      $717 = $689 + (($711 & 7 | 0) == 0 ? 0 : 0 - $711 & 7) | 0; //@line 1678
      $721 = $709 + $$0197 | 0; //@line 1682
      $722 = $717 - $709 - $$0197 | 0; //@line 1683
      HEAP32[$709 + 4 >> 2] = $$0197 | 3; //@line 1686
      do {
       if (($717 | 0) == ($630 | 0)) {
        $727 = (HEAP32[643] | 0) + $722 | 0; //@line 1691
        HEAP32[643] = $727; //@line 1692
        HEAP32[646] = $721; //@line 1693
        HEAP32[$721 + 4 >> 2] = $727 | 1; //@line 1696
       } else {
        if (($717 | 0) == (HEAP32[645] | 0)) {
         $733 = (HEAP32[642] | 0) + $722 | 0; //@line 1702
         HEAP32[642] = $733; //@line 1703
         HEAP32[645] = $721; //@line 1704
         HEAP32[$721 + 4 >> 2] = $733 | 1; //@line 1707
         HEAP32[$721 + $733 >> 2] = $733; //@line 1709
         break;
        }
        $738 = HEAP32[$717 + 4 >> 2] | 0; //@line 1713
        if (($738 & 3 | 0) == 1) {
         $741 = $738 & -8; //@line 1717
         $742 = $738 >>> 3; //@line 1718
         L314 : do {
          if ($738 >>> 0 < 256) {
           $745 = HEAP32[$717 + 8 >> 2] | 0; //@line 1723
           $747 = HEAP32[$717 + 12 >> 2] | 0; //@line 1725
           $749 = 2600 + ($742 << 1 << 2) | 0; //@line 1727
           do {
            if (($745 | 0) != ($749 | 0)) {
             if ($745 >>> 0 < $752 >>> 0) {
              _abort(); //@line 1733
             }
             if ((HEAP32[$745 + 12 >> 2] | 0) == ($717 | 0)) {
              break;
             }
             _abort(); //@line 1742
            }
           } while (0);
           if (($747 | 0) == ($745 | 0)) {
            HEAP32[640] = HEAP32[640] & ~(1 << $742); //@line 1752
            break;
           }
           do {
            if (($747 | 0) == ($749 | 0)) {
             $$pre$phi11$i$iZ2D = $747 + 8 | 0; //@line 1759
            } else {
             if ($747 >>> 0 < $752 >>> 0) {
              _abort(); //@line 1763
             }
             $763 = $747 + 8 | 0; //@line 1766
             if ((HEAP32[$763 >> 2] | 0) == ($717 | 0)) {
              $$pre$phi11$i$iZ2D = $763; //@line 1770
              break;
             }
             _abort(); //@line 1773
            }
           } while (0);
           HEAP32[$745 + 12 >> 2] = $747; //@line 1778
           HEAP32[$$pre$phi11$i$iZ2D >> 2] = $745; //@line 1779
          } else {
           $768 = HEAP32[$717 + 24 >> 2] | 0; //@line 1782
           $770 = HEAP32[$717 + 12 >> 2] | 0; //@line 1784
           do {
            if (($770 | 0) == ($717 | 0)) {
             $781 = $717 + 16 | 0; //@line 1788
             $782 = $781 + 4 | 0; //@line 1789
             $783 = HEAP32[$782 >> 2] | 0; //@line 1790
             if (!$783) {
              $785 = HEAP32[$781 >> 2] | 0; //@line 1793
              if (!$785) {
               $$3$i$i = 0; //@line 1796
               break;
              } else {
               $$1291$i$i = $785; //@line 1799
               $$1293$i$i = $781; //@line 1799
              }
             } else {
              $$1291$i$i = $783; //@line 1802
              $$1293$i$i = $782; //@line 1802
             }
             while (1) {
              $787 = $$1291$i$i + 20 | 0; //@line 1805
              $788 = HEAP32[$787 >> 2] | 0; //@line 1806
              if ($788 | 0) {
               $$1291$i$i = $788; //@line 1809
               $$1293$i$i = $787; //@line 1809
               continue;
              }
              $790 = $$1291$i$i + 16 | 0; //@line 1812
              $791 = HEAP32[$790 >> 2] | 0; //@line 1813
              if (!$791) {
               break;
              } else {
               $$1291$i$i = $791; //@line 1818
               $$1293$i$i = $790; //@line 1818
              }
             }
             if ($$1293$i$i >>> 0 < $752 >>> 0) {
              _abort(); //@line 1823
             } else {
              HEAP32[$$1293$i$i >> 2] = 0; //@line 1826
              $$3$i$i = $$1291$i$i; //@line 1827
              break;
             }
            } else {
             $773 = HEAP32[$717 + 8 >> 2] | 0; //@line 1832
             if ($773 >>> 0 < $752 >>> 0) {
              _abort(); //@line 1835
             }
             $775 = $773 + 12 | 0; //@line 1838
             if ((HEAP32[$775 >> 2] | 0) != ($717 | 0)) {
              _abort(); //@line 1842
             }
             $778 = $770 + 8 | 0; //@line 1845
             if ((HEAP32[$778 >> 2] | 0) == ($717 | 0)) {
              HEAP32[$775 >> 2] = $770; //@line 1849
              HEAP32[$778 >> 2] = $773; //@line 1850
              $$3$i$i = $770; //@line 1851
              break;
             } else {
              _abort(); //@line 1854
             }
            }
           } while (0);
           if (!$768) {
            break;
           }
           $796 = HEAP32[$717 + 28 >> 2] | 0; //@line 1864
           $797 = 2864 + ($796 << 2) | 0; //@line 1865
           do {
            if (($717 | 0) == (HEAP32[$797 >> 2] | 0)) {
             HEAP32[$797 >> 2] = $$3$i$i; //@line 1870
             if ($$3$i$i | 0) {
              break;
             }
             HEAP32[641] = HEAP32[641] & ~(1 << $796); //@line 1879
             break L314;
            } else {
             if ($768 >>> 0 < (HEAP32[644] | 0) >>> 0) {
              _abort(); //@line 1885
             } else {
              HEAP32[$768 + 16 + (((HEAP32[$768 + 16 >> 2] | 0) != ($717 | 0) & 1) << 2) >> 2] = $$3$i$i; //@line 1893
              if (!$$3$i$i) {
               break L314;
              } else {
               break;
              }
             }
            }
           } while (0);
           $810 = HEAP32[644] | 0; //@line 1903
           if ($$3$i$i >>> 0 < $810 >>> 0) {
            _abort(); //@line 1906
           }
           HEAP32[$$3$i$i + 24 >> 2] = $768; //@line 1910
           $813 = $717 + 16 | 0; //@line 1911
           $814 = HEAP32[$813 >> 2] | 0; //@line 1912
           do {
            if ($814 | 0) {
             if ($814 >>> 0 < $810 >>> 0) {
              _abort(); //@line 1918
             } else {
              HEAP32[$$3$i$i + 16 >> 2] = $814; //@line 1922
              HEAP32[$814 + 24 >> 2] = $$3$i$i; //@line 1924
              break;
             }
            }
           } while (0);
           $820 = HEAP32[$813 + 4 >> 2] | 0; //@line 1930
           if (!$820) {
            break;
           }
           if ($820 >>> 0 < (HEAP32[644] | 0) >>> 0) {
            _abort(); //@line 1938
           } else {
            HEAP32[$$3$i$i + 20 >> 2] = $820; //@line 1942
            HEAP32[$820 + 24 >> 2] = $$3$i$i; //@line 1944
            break;
           }
          }
         } while (0);
         $$0$i18$i = $717 + $741 | 0; //@line 1951
         $$0287$i$i = $741 + $722 | 0; //@line 1951
        } else {
         $$0$i18$i = $717; //@line 1953
         $$0287$i$i = $722; //@line 1953
        }
        $828 = $$0$i18$i + 4 | 0; //@line 1955
        HEAP32[$828 >> 2] = HEAP32[$828 >> 2] & -2; //@line 1958
        HEAP32[$721 + 4 >> 2] = $$0287$i$i | 1; //@line 1961
        HEAP32[$721 + $$0287$i$i >> 2] = $$0287$i$i; //@line 1963
        $834 = $$0287$i$i >>> 3; //@line 1964
        if ($$0287$i$i >>> 0 < 256) {
         $837 = 2600 + ($834 << 1 << 2) | 0; //@line 1968
         $838 = HEAP32[640] | 0; //@line 1969
         $839 = 1 << $834; //@line 1970
         do {
          if (!($838 & $839)) {
           HEAP32[640] = $838 | $839; //@line 1976
           $$0295$i$i = $837; //@line 1978
           $$pre$phi$i20$iZ2D = $837 + 8 | 0; //@line 1978
          } else {
           $843 = $837 + 8 | 0; //@line 1980
           $844 = HEAP32[$843 >> 2] | 0; //@line 1981
           if ($844 >>> 0 >= (HEAP32[644] | 0) >>> 0) {
            $$0295$i$i = $844; //@line 1985
            $$pre$phi$i20$iZ2D = $843; //@line 1985
            break;
           }
           _abort(); //@line 1988
          }
         } while (0);
         HEAP32[$$pre$phi$i20$iZ2D >> 2] = $721; //@line 1992
         HEAP32[$$0295$i$i + 12 >> 2] = $721; //@line 1994
         HEAP32[$721 + 8 >> 2] = $$0295$i$i; //@line 1996
         HEAP32[$721 + 12 >> 2] = $837; //@line 1998
         break;
        }
        $850 = $$0287$i$i >>> 8; //@line 2001
        do {
         if (!$850) {
          $$0296$i$i = 0; //@line 2005
         } else {
          if ($$0287$i$i >>> 0 > 16777215) {
           $$0296$i$i = 31; //@line 2009
           break;
          }
          $855 = ($850 + 1048320 | 0) >>> 16 & 8; //@line 2014
          $856 = $850 << $855; //@line 2015
          $859 = ($856 + 520192 | 0) >>> 16 & 4; //@line 2018
          $861 = $856 << $859; //@line 2020
          $864 = ($861 + 245760 | 0) >>> 16 & 2; //@line 2023
          $869 = 14 - ($859 | $855 | $864) + ($861 << $864 >>> 15) | 0; //@line 2028
          $$0296$i$i = $$0287$i$i >>> ($869 + 7 | 0) & 1 | $869 << 1; //@line 2034
         }
        } while (0);
        $875 = 2864 + ($$0296$i$i << 2) | 0; //@line 2037
        HEAP32[$721 + 28 >> 2] = $$0296$i$i; //@line 2039
        $877 = $721 + 16 | 0; //@line 2040
        HEAP32[$877 + 4 >> 2] = 0; //@line 2042
        HEAP32[$877 >> 2] = 0; //@line 2043
        $879 = HEAP32[641] | 0; //@line 2044
        $880 = 1 << $$0296$i$i; //@line 2045
        if (!($879 & $880)) {
         HEAP32[641] = $879 | $880; //@line 2050
         HEAP32[$875 >> 2] = $721; //@line 2051
         HEAP32[$721 + 24 >> 2] = $875; //@line 2053
         HEAP32[$721 + 12 >> 2] = $721; //@line 2055
         HEAP32[$721 + 8 >> 2] = $721; //@line 2057
         break;
        }
        $$0288$i$i = $$0287$i$i << (($$0296$i$i | 0) == 31 ? 0 : 25 - ($$0296$i$i >>> 1) | 0); //@line 2066
        $$0289$i$i = HEAP32[$875 >> 2] | 0; //@line 2066
        while (1) {
         if ((HEAP32[$$0289$i$i + 4 >> 2] & -8 | 0) == ($$0287$i$i | 0)) {
          label = 265; //@line 2073
          break;
         }
         $898 = $$0289$i$i + 16 + ($$0288$i$i >>> 31 << 2) | 0; //@line 2077
         $900 = HEAP32[$898 >> 2] | 0; //@line 2079
         if (!$900) {
          label = 262; //@line 2082
          break;
         } else {
          $$0288$i$i = $$0288$i$i << 1; //@line 2085
          $$0289$i$i = $900; //@line 2085
         }
        }
        if ((label | 0) == 262) {
         if ($898 >>> 0 < (HEAP32[644] | 0) >>> 0) {
          _abort(); //@line 2092
         } else {
          HEAP32[$898 >> 2] = $721; //@line 2095
          HEAP32[$721 + 24 >> 2] = $$0289$i$i; //@line 2097
          HEAP32[$721 + 12 >> 2] = $721; //@line 2099
          HEAP32[$721 + 8 >> 2] = $721; //@line 2101
          break;
         }
        } else if ((label | 0) == 265) {
         $907 = $$0289$i$i + 8 | 0; //@line 2106
         $908 = HEAP32[$907 >> 2] | 0; //@line 2107
         $909 = HEAP32[644] | 0; //@line 2108
         if ($908 >>> 0 >= $909 >>> 0 & $$0289$i$i >>> 0 >= $909 >>> 0) {
          HEAP32[$908 + 12 >> 2] = $721; //@line 2114
          HEAP32[$907 >> 2] = $721; //@line 2115
          HEAP32[$721 + 8 >> 2] = $908; //@line 2117
          HEAP32[$721 + 12 >> 2] = $$0289$i$i; //@line 2119
          HEAP32[$721 + 24 >> 2] = 0; //@line 2121
          break;
         } else {
          _abort(); //@line 2124
         }
        }
       }
      } while (0);
      $$0 = $709 + 8 | 0; //@line 2131
      STACKTOP = sp; //@line 2132
      return $$0 | 0; //@line 2132
     }
    }
    $$0$i$i$i = 3008; //@line 2135
    while (1) {
     $916 = HEAP32[$$0$i$i$i >> 2] | 0; //@line 2137
     if ($916 >>> 0 <= $630 >>> 0) {
      $920 = $916 + (HEAP32[$$0$i$i$i + 4 >> 2] | 0) | 0; //@line 2142
      if ($920 >>> 0 > $630 >>> 0) {
       break;
      }
     }
     $$0$i$i$i = HEAP32[$$0$i$i$i + 8 >> 2] | 0; //@line 2150
    }
    $924 = $920 + -47 | 0; //@line 2152
    $926 = $924 + 8 | 0; //@line 2154
    $932 = $924 + (($926 & 7 | 0) == 0 ? 0 : 0 - $926 & 7) | 0; //@line 2160
    $933 = $630 + 16 | 0; //@line 2161
    $935 = $932 >>> 0 < $933 >>> 0 ? $630 : $932; //@line 2163
    $936 = $935 + 8 | 0; //@line 2164
    $937 = $935 + 24 | 0; //@line 2165
    $940 = $$749$i + 8 | 0; //@line 2168
    $945 = ($940 & 7 | 0) == 0 ? 0 : 0 - $940 & 7; //@line 2173
    $946 = $$749$i + $945 | 0; //@line 2174
    $947 = $$723948$i + -40 - $945 | 0; //@line 2175
    HEAP32[646] = $946; //@line 2176
    HEAP32[643] = $947; //@line 2177
    HEAP32[$946 + 4 >> 2] = $947 | 1; //@line 2180
    HEAP32[$946 + $947 + 4 >> 2] = 40; //@line 2183
    HEAP32[647] = HEAP32[762]; //@line 2185
    $953 = $935 + 4 | 0; //@line 2186
    HEAP32[$953 >> 2] = 27; //@line 2187
    HEAP32[$936 >> 2] = HEAP32[752]; //@line 2188
    HEAP32[$936 + 4 >> 2] = HEAP32[753]; //@line 2188
    HEAP32[$936 + 8 >> 2] = HEAP32[754]; //@line 2188
    HEAP32[$936 + 12 >> 2] = HEAP32[755]; //@line 2188
    HEAP32[752] = $$749$i; //@line 2189
    HEAP32[753] = $$723948$i; //@line 2190
    HEAP32[755] = 0; //@line 2191
    HEAP32[754] = $936; //@line 2192
    $955 = $937; //@line 2193
    do {
     $955$looptemp = $955;
     $955 = $955 + 4 | 0; //@line 2195
     HEAP32[$955 >> 2] = 7; //@line 2196
    } while (($955$looptemp + 8 | 0) >>> 0 < $920 >>> 0);
    if (($935 | 0) != ($630 | 0)) {
     $961 = $935 - $630 | 0; //@line 2209
     HEAP32[$953 >> 2] = HEAP32[$953 >> 2] & -2; //@line 2212
     HEAP32[$630 + 4 >> 2] = $961 | 1; //@line 2215
     HEAP32[$935 >> 2] = $961; //@line 2216
     $966 = $961 >>> 3; //@line 2217
     if ($961 >>> 0 < 256) {
      $969 = 2600 + ($966 << 1 << 2) | 0; //@line 2221
      $970 = HEAP32[640] | 0; //@line 2222
      $971 = 1 << $966; //@line 2223
      if (!($970 & $971)) {
       HEAP32[640] = $970 | $971; //@line 2228
       $$0211$i$i = $969; //@line 2230
       $$pre$phi$i$iZ2D = $969 + 8 | 0; //@line 2230
      } else {
       $975 = $969 + 8 | 0; //@line 2232
       $976 = HEAP32[$975 >> 2] | 0; //@line 2233
       if ($976 >>> 0 < (HEAP32[644] | 0) >>> 0) {
        _abort(); //@line 2237
       } else {
        $$0211$i$i = $976; //@line 2240
        $$pre$phi$i$iZ2D = $975; //@line 2240
       }
      }
      HEAP32[$$pre$phi$i$iZ2D >> 2] = $630; //@line 2243
      HEAP32[$$0211$i$i + 12 >> 2] = $630; //@line 2245
      HEAP32[$630 + 8 >> 2] = $$0211$i$i; //@line 2247
      HEAP32[$630 + 12 >> 2] = $969; //@line 2249
      break;
     }
     $982 = $961 >>> 8; //@line 2252
     if (!$982) {
      $$0212$i$i = 0; //@line 2255
     } else {
      if ($961 >>> 0 > 16777215) {
       $$0212$i$i = 31; //@line 2259
      } else {
       $987 = ($982 + 1048320 | 0) >>> 16 & 8; //@line 2263
       $988 = $982 << $987; //@line 2264
       $991 = ($988 + 520192 | 0) >>> 16 & 4; //@line 2267
       $993 = $988 << $991; //@line 2269
       $996 = ($993 + 245760 | 0) >>> 16 & 2; //@line 2272
       $1001 = 14 - ($991 | $987 | $996) + ($993 << $996 >>> 15) | 0; //@line 2277
       $$0212$i$i = $961 >>> ($1001 + 7 | 0) & 1 | $1001 << 1; //@line 2283
      }
     }
     $1007 = 2864 + ($$0212$i$i << 2) | 0; //@line 2286
     HEAP32[$630 + 28 >> 2] = $$0212$i$i; //@line 2288
     HEAP32[$630 + 20 >> 2] = 0; //@line 2290
     HEAP32[$933 >> 2] = 0; //@line 2291
     $1010 = HEAP32[641] | 0; //@line 2292
     $1011 = 1 << $$0212$i$i; //@line 2293
     if (!($1010 & $1011)) {
      HEAP32[641] = $1010 | $1011; //@line 2298
      HEAP32[$1007 >> 2] = $630; //@line 2299
      HEAP32[$630 + 24 >> 2] = $1007; //@line 2301
      HEAP32[$630 + 12 >> 2] = $630; //@line 2303
      HEAP32[$630 + 8 >> 2] = $630; //@line 2305
      break;
     }
     $$0206$i$i = $961 << (($$0212$i$i | 0) == 31 ? 0 : 25 - ($$0212$i$i >>> 1) | 0); //@line 2314
     $$0207$i$i = HEAP32[$1007 >> 2] | 0; //@line 2314
     while (1) {
      if ((HEAP32[$$0207$i$i + 4 >> 2] & -8 | 0) == ($961 | 0)) {
       label = 292; //@line 2321
       break;
      }
      $1029 = $$0207$i$i + 16 + ($$0206$i$i >>> 31 << 2) | 0; //@line 2325
      $1031 = HEAP32[$1029 >> 2] | 0; //@line 2327
      if (!$1031) {
       label = 289; //@line 2330
       break;
      } else {
       $$0206$i$i = $$0206$i$i << 1; //@line 2333
       $$0207$i$i = $1031; //@line 2333
      }
     }
     if ((label | 0) == 289) {
      if ($1029 >>> 0 < (HEAP32[644] | 0) >>> 0) {
       _abort(); //@line 2340
      } else {
       HEAP32[$1029 >> 2] = $630; //@line 2343
       HEAP32[$630 + 24 >> 2] = $$0207$i$i; //@line 2345
       HEAP32[$630 + 12 >> 2] = $630; //@line 2347
       HEAP32[$630 + 8 >> 2] = $630; //@line 2349
       break;
      }
     } else if ((label | 0) == 292) {
      $1038 = $$0207$i$i + 8 | 0; //@line 2354
      $1039 = HEAP32[$1038 >> 2] | 0; //@line 2355
      $1040 = HEAP32[644] | 0; //@line 2356
      if ($1039 >>> 0 >= $1040 >>> 0 & $$0207$i$i >>> 0 >= $1040 >>> 0) {
       HEAP32[$1039 + 12 >> 2] = $630; //@line 2362
       HEAP32[$1038 >> 2] = $630; //@line 2363
       HEAP32[$630 + 8 >> 2] = $1039; //@line 2365
       HEAP32[$630 + 12 >> 2] = $$0207$i$i; //@line 2367
       HEAP32[$630 + 24 >> 2] = 0; //@line 2369
       break;
      } else {
       _abort(); //@line 2372
      }
     }
    }
   }
  } while (0);
  $1048 = HEAP32[643] | 0; //@line 2379
  if ($1048 >>> 0 > $$0197 >>> 0) {
   $1050 = $1048 - $$0197 | 0; //@line 2382
   HEAP32[643] = $1050; //@line 2383
   $1051 = HEAP32[646] | 0; //@line 2384
   $1052 = $1051 + $$0197 | 0; //@line 2385
   HEAP32[646] = $1052; //@line 2386
   HEAP32[$1052 + 4 >> 2] = $1050 | 1; //@line 2389
   HEAP32[$1051 + 4 >> 2] = $$0197 | 3; //@line 2392
   $$0 = $1051 + 8 | 0; //@line 2394
   STACKTOP = sp; //@line 2395
   return $$0 | 0; //@line 2395
  }
 }
 HEAP32[(___errno_location() | 0) >> 2] = 12; //@line 2399
 $$0 = 0; //@line 2400
 STACKTOP = sp; //@line 2401
 return $$0 | 0; //@line 2401
}
function _free($0) {
 $0 = $0 | 0;
 var $$0212$i = 0, $$0212$in$i = 0, $$0383 = 0, $$0384 = 0, $$0396 = 0, $$0403 = 0, $$1 = 0, $$1382 = 0, $$1387 = 0, $$1390 = 0, $$1398 = 0, $$1402 = 0, $$2 = 0, $$3 = 0, $$3400 = 0, $$pre$phi443Z2D = 0, $$pre$phi445Z2D = 0, $$pre$phiZ2D = 0, $10 = 0, $104 = 0, $105 = 0, $113 = 0, $114 = 0, $115 = 0, $122 = 0, $124 = 0, $13 = 0, $130 = 0, $135 = 0, $136 = 0, $139 = 0, $141 = 0, $143 = 0, $158 = 0, $16 = 0, $163 = 0, $165 = 0, $168 = 0, $17 = 0, $171 = 0, $174 = 0, $177 = 0, $178 = 0, $179 = 0, $181 = 0, $183 = 0, $184 = 0, $186 = 0, $187 = 0, $193 = 0, $194 = 0, $2 = 0, $207 = 0, $21 = 0, $210 = 0, $211 = 0, $217 = 0, $232 = 0, $235 = 0, $236 = 0, $237 = 0, $24 = 0, $241 = 0, $242 = 0, $248 = 0, $253 = 0, $254 = 0, $257 = 0, $259 = 0, $26 = 0, $262 = 0, $267 = 0, $273 = 0, $277 = 0, $278 = 0, $28 = 0, $296 = 0, $298 = 0, $3 = 0, $305 = 0, $306 = 0, $307 = 0, $315 = 0, $41 = 0, $46 = 0, $48 = 0, $51 = 0, $53 = 0, $56 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $63 = 0, $65 = 0, $66 = 0, $68 = 0, $69 = 0, $7 = 0, $74 = 0, $75 = 0, $88 = 0, $9 = 0, $91 = 0, $92 = 0, $98 = 0, label = 0;
 if (!$0) {
  return;
 }
 $2 = $0 + -8 | 0; //@line 2428
 $3 = HEAP32[644] | 0; //@line 2429
 if ($2 >>> 0 < $3 >>> 0) {
  _abort(); //@line 2432
 }
 $6 = HEAP32[$0 + -4 >> 2] | 0; //@line 2436
 $7 = $6 & 3; //@line 2437
 if (($7 | 0) == 1) {
  _abort(); //@line 2440
 }
 $9 = $6 & -8; //@line 2443
 $10 = $2 + $9 | 0; //@line 2444
 L10 : do {
  if (!($6 & 1)) {
   $13 = HEAP32[$2 >> 2] | 0; //@line 2449
   if (!$7) {
    return;
   }
   $16 = $2 + (0 - $13) | 0; //@line 2455
   $17 = $13 + $9 | 0; //@line 2456
   if ($16 >>> 0 < $3 >>> 0) {
    _abort(); //@line 2459
   }
   if (($16 | 0) == (HEAP32[645] | 0)) {
    $104 = $10 + 4 | 0; //@line 2465
    $105 = HEAP32[$104 >> 2] | 0; //@line 2466
    if (($105 & 3 | 0) != 3) {
     $$1 = $16; //@line 2470
     $$1382 = $17; //@line 2470
     $113 = $16; //@line 2470
     break;
    }
    HEAP32[642] = $17; //@line 2477
    HEAP32[$104 >> 2] = $105 & -2; //@line 2478
    HEAP32[$16 + 4 >> 2] = $17 | 1; //@line 2479
    HEAP32[$16 + $17 >> 2] = $17; //@line 2480
    return;
   }
   $21 = $13 >>> 3; //@line 2483
   if ($13 >>> 0 < 256) {
    $24 = HEAP32[$16 + 8 >> 2] | 0; //@line 2487
    $26 = HEAP32[$16 + 12 >> 2] | 0; //@line 2489
    $28 = 2600 + ($21 << 1 << 2) | 0; //@line 2491
    if (($24 | 0) != ($28 | 0)) {
     if ($24 >>> 0 < $3 >>> 0) {
      _abort(); //@line 2496
     }
     if ((HEAP32[$24 + 12 >> 2] | 0) != ($16 | 0)) {
      _abort(); //@line 2503
     }
    }
    if (($26 | 0) == ($24 | 0)) {
     HEAP32[640] = HEAP32[640] & ~(1 << $21); //@line 2513
     $$1 = $16; //@line 2514
     $$1382 = $17; //@line 2514
     $113 = $16; //@line 2514
     break;
    }
    if (($26 | 0) == ($28 | 0)) {
     $$pre$phi445Z2D = $26 + 8 | 0; //@line 2520
    } else {
     if ($26 >>> 0 < $3 >>> 0) {
      _abort(); //@line 2524
     }
     $41 = $26 + 8 | 0; //@line 2527
     if ((HEAP32[$41 >> 2] | 0) == ($16 | 0)) {
      $$pre$phi445Z2D = $41; //@line 2531
     } else {
      _abort(); //@line 2533
     }
    }
    HEAP32[$24 + 12 >> 2] = $26; //@line 2538
    HEAP32[$$pre$phi445Z2D >> 2] = $24; //@line 2539
    $$1 = $16; //@line 2540
    $$1382 = $17; //@line 2540
    $113 = $16; //@line 2540
    break;
   }
   $46 = HEAP32[$16 + 24 >> 2] | 0; //@line 2544
   $48 = HEAP32[$16 + 12 >> 2] | 0; //@line 2546
   do {
    if (($48 | 0) == ($16 | 0)) {
     $59 = $16 + 16 | 0; //@line 2550
     $60 = $59 + 4 | 0; //@line 2551
     $61 = HEAP32[$60 >> 2] | 0; //@line 2552
     if (!$61) {
      $63 = HEAP32[$59 >> 2] | 0; //@line 2555
      if (!$63) {
       $$3 = 0; //@line 2558
       break;
      } else {
       $$1387 = $63; //@line 2561
       $$1390 = $59; //@line 2561
      }
     } else {
      $$1387 = $61; //@line 2564
      $$1390 = $60; //@line 2564
     }
     while (1) {
      $65 = $$1387 + 20 | 0; //@line 2567
      $66 = HEAP32[$65 >> 2] | 0; //@line 2568
      if ($66 | 0) {
       $$1387 = $66; //@line 2571
       $$1390 = $65; //@line 2571
       continue;
      }
      $68 = $$1387 + 16 | 0; //@line 2574
      $69 = HEAP32[$68 >> 2] | 0; //@line 2575
      if (!$69) {
       break;
      } else {
       $$1387 = $69; //@line 2580
       $$1390 = $68; //@line 2580
      }
     }
     if ($$1390 >>> 0 < $3 >>> 0) {
      _abort(); //@line 2585
     } else {
      HEAP32[$$1390 >> 2] = 0; //@line 2588
      $$3 = $$1387; //@line 2589
      break;
     }
    } else {
     $51 = HEAP32[$16 + 8 >> 2] | 0; //@line 2594
     if ($51 >>> 0 < $3 >>> 0) {
      _abort(); //@line 2597
     }
     $53 = $51 + 12 | 0; //@line 2600
     if ((HEAP32[$53 >> 2] | 0) != ($16 | 0)) {
      _abort(); //@line 2604
     }
     $56 = $48 + 8 | 0; //@line 2607
     if ((HEAP32[$56 >> 2] | 0) == ($16 | 0)) {
      HEAP32[$53 >> 2] = $48; //@line 2611
      HEAP32[$56 >> 2] = $51; //@line 2612
      $$3 = $48; //@line 2613
      break;
     } else {
      _abort(); //@line 2616
     }
    }
   } while (0);
   if (!$46) {
    $$1 = $16; //@line 2623
    $$1382 = $17; //@line 2623
    $113 = $16; //@line 2623
   } else {
    $74 = HEAP32[$16 + 28 >> 2] | 0; //@line 2626
    $75 = 2864 + ($74 << 2) | 0; //@line 2627
    do {
     if (($16 | 0) == (HEAP32[$75 >> 2] | 0)) {
      HEAP32[$75 >> 2] = $$3; //@line 2632
      if (!$$3) {
       HEAP32[641] = HEAP32[641] & ~(1 << $74); //@line 2639
       $$1 = $16; //@line 2640
       $$1382 = $17; //@line 2640
       $113 = $16; //@line 2640
       break L10;
      }
     } else {
      if ($46 >>> 0 < (HEAP32[644] | 0) >>> 0) {
       _abort(); //@line 2647
      } else {
       HEAP32[$46 + 16 + (((HEAP32[$46 + 16 >> 2] | 0) != ($16 | 0) & 1) << 2) >> 2] = $$3; //@line 2655
       if (!$$3) {
        $$1 = $16; //@line 2658
        $$1382 = $17; //@line 2658
        $113 = $16; //@line 2658
        break L10;
       } else {
        break;
       }
      }
     }
    } while (0);
    $88 = HEAP32[644] | 0; //@line 2666
    if ($$3 >>> 0 < $88 >>> 0) {
     _abort(); //@line 2669
    }
    HEAP32[$$3 + 24 >> 2] = $46; //@line 2673
    $91 = $16 + 16 | 0; //@line 2674
    $92 = HEAP32[$91 >> 2] | 0; //@line 2675
    do {
     if ($92 | 0) {
      if ($92 >>> 0 < $88 >>> 0) {
       _abort(); //@line 2681
      } else {
       HEAP32[$$3 + 16 >> 2] = $92; //@line 2685
       HEAP32[$92 + 24 >> 2] = $$3; //@line 2687
       break;
      }
     }
    } while (0);
    $98 = HEAP32[$91 + 4 >> 2] | 0; //@line 2693
    if (!$98) {
     $$1 = $16; //@line 2696
     $$1382 = $17; //@line 2696
     $113 = $16; //@line 2696
    } else {
     if ($98 >>> 0 < (HEAP32[644] | 0) >>> 0) {
      _abort(); //@line 2701
     } else {
      HEAP32[$$3 + 20 >> 2] = $98; //@line 2705
      HEAP32[$98 + 24 >> 2] = $$3; //@line 2707
      $$1 = $16; //@line 2708
      $$1382 = $17; //@line 2708
      $113 = $16; //@line 2708
      break;
     }
    }
   }
  } else {
   $$1 = $2; //@line 2714
   $$1382 = $9; //@line 2714
   $113 = $2; //@line 2714
  }
 } while (0);
 if ($113 >>> 0 >= $10 >>> 0) {
  _abort(); //@line 2719
 }
 $114 = $10 + 4 | 0; //@line 2722
 $115 = HEAP32[$114 >> 2] | 0; //@line 2723
 if (!($115 & 1)) {
  _abort(); //@line 2727
 }
 if (!($115 & 2)) {
  $122 = HEAP32[645] | 0; //@line 2735
  if (($10 | 0) == (HEAP32[646] | 0)) {
   $124 = (HEAP32[643] | 0) + $$1382 | 0; //@line 2738
   HEAP32[643] = $124; //@line 2739
   HEAP32[646] = $$1; //@line 2740
   HEAP32[$$1 + 4 >> 2] = $124 | 1; //@line 2743
   if (($$1 | 0) != ($122 | 0)) {
    return;
   }
   HEAP32[645] = 0; //@line 2748
   HEAP32[642] = 0; //@line 2749
   return;
  }
  if (($10 | 0) == ($122 | 0)) {
   $130 = (HEAP32[642] | 0) + $$1382 | 0; //@line 2755
   HEAP32[642] = $130; //@line 2756
   HEAP32[645] = $113; //@line 2757
   HEAP32[$$1 + 4 >> 2] = $130 | 1; //@line 2760
   HEAP32[$113 + $130 >> 2] = $130; //@line 2762
   return;
  }
  $135 = ($115 & -8) + $$1382 | 0; //@line 2766
  $136 = $115 >>> 3; //@line 2767
  L108 : do {
   if ($115 >>> 0 < 256) {
    $139 = HEAP32[$10 + 8 >> 2] | 0; //@line 2772
    $141 = HEAP32[$10 + 12 >> 2] | 0; //@line 2774
    $143 = 2600 + ($136 << 1 << 2) | 0; //@line 2776
    if (($139 | 0) != ($143 | 0)) {
     if ($139 >>> 0 < (HEAP32[644] | 0) >>> 0) {
      _abort(); //@line 2782
     }
     if ((HEAP32[$139 + 12 >> 2] | 0) != ($10 | 0)) {
      _abort(); //@line 2789
     }
    }
    if (($141 | 0) == ($139 | 0)) {
     HEAP32[640] = HEAP32[640] & ~(1 << $136); //@line 2799
     break;
    }
    if (($141 | 0) == ($143 | 0)) {
     $$pre$phi443Z2D = $141 + 8 | 0; //@line 2805
    } else {
     if ($141 >>> 0 < (HEAP32[644] | 0) >>> 0) {
      _abort(); //@line 2810
     }
     $158 = $141 + 8 | 0; //@line 2813
     if ((HEAP32[$158 >> 2] | 0) == ($10 | 0)) {
      $$pre$phi443Z2D = $158; //@line 2817
     } else {
      _abort(); //@line 2819
     }
    }
    HEAP32[$139 + 12 >> 2] = $141; //@line 2824
    HEAP32[$$pre$phi443Z2D >> 2] = $139; //@line 2825
   } else {
    $163 = HEAP32[$10 + 24 >> 2] | 0; //@line 2828
    $165 = HEAP32[$10 + 12 >> 2] | 0; //@line 2830
    do {
     if (($165 | 0) == ($10 | 0)) {
      $177 = $10 + 16 | 0; //@line 2834
      $178 = $177 + 4 | 0; //@line 2835
      $179 = HEAP32[$178 >> 2] | 0; //@line 2836
      if (!$179) {
       $181 = HEAP32[$177 >> 2] | 0; //@line 2839
       if (!$181) {
        $$3400 = 0; //@line 2842
        break;
       } else {
        $$1398 = $181; //@line 2845
        $$1402 = $177; //@line 2845
       }
      } else {
       $$1398 = $179; //@line 2848
       $$1402 = $178; //@line 2848
      }
      while (1) {
       $183 = $$1398 + 20 | 0; //@line 2851
       $184 = HEAP32[$183 >> 2] | 0; //@line 2852
       if ($184 | 0) {
        $$1398 = $184; //@line 2855
        $$1402 = $183; //@line 2855
        continue;
       }
       $186 = $$1398 + 16 | 0; //@line 2858
       $187 = HEAP32[$186 >> 2] | 0; //@line 2859
       if (!$187) {
        break;
       } else {
        $$1398 = $187; //@line 2864
        $$1402 = $186; //@line 2864
       }
      }
      if ($$1402 >>> 0 < (HEAP32[644] | 0) >>> 0) {
       _abort(); //@line 2870
      } else {
       HEAP32[$$1402 >> 2] = 0; //@line 2873
       $$3400 = $$1398; //@line 2874
       break;
      }
     } else {
      $168 = HEAP32[$10 + 8 >> 2] | 0; //@line 2879
      if ($168 >>> 0 < (HEAP32[644] | 0) >>> 0) {
       _abort(); //@line 2883
      }
      $171 = $168 + 12 | 0; //@line 2886
      if ((HEAP32[$171 >> 2] | 0) != ($10 | 0)) {
       _abort(); //@line 2890
      }
      $174 = $165 + 8 | 0; //@line 2893
      if ((HEAP32[$174 >> 2] | 0) == ($10 | 0)) {
       HEAP32[$171 >> 2] = $165; //@line 2897
       HEAP32[$174 >> 2] = $168; //@line 2898
       $$3400 = $165; //@line 2899
       break;
      } else {
       _abort(); //@line 2902
      }
     }
    } while (0);
    if ($163 | 0) {
     $193 = HEAP32[$10 + 28 >> 2] | 0; //@line 2910
     $194 = 2864 + ($193 << 2) | 0; //@line 2911
     do {
      if (($10 | 0) == (HEAP32[$194 >> 2] | 0)) {
       HEAP32[$194 >> 2] = $$3400; //@line 2916
       if (!$$3400) {
        HEAP32[641] = HEAP32[641] & ~(1 << $193); //@line 2923
        break L108;
       }
      } else {
       if ($163 >>> 0 < (HEAP32[644] | 0) >>> 0) {
        _abort(); //@line 2930
       } else {
        HEAP32[$163 + 16 + (((HEAP32[$163 + 16 >> 2] | 0) != ($10 | 0) & 1) << 2) >> 2] = $$3400; //@line 2938
        if (!$$3400) {
         break L108;
        } else {
         break;
        }
       }
      }
     } while (0);
     $207 = HEAP32[644] | 0; //@line 2948
     if ($$3400 >>> 0 < $207 >>> 0) {
      _abort(); //@line 2951
     }
     HEAP32[$$3400 + 24 >> 2] = $163; //@line 2955
     $210 = $10 + 16 | 0; //@line 2956
     $211 = HEAP32[$210 >> 2] | 0; //@line 2957
     do {
      if ($211 | 0) {
       if ($211 >>> 0 < $207 >>> 0) {
        _abort(); //@line 2963
       } else {
        HEAP32[$$3400 + 16 >> 2] = $211; //@line 2967
        HEAP32[$211 + 24 >> 2] = $$3400; //@line 2969
        break;
       }
      }
     } while (0);
     $217 = HEAP32[$210 + 4 >> 2] | 0; //@line 2975
     if ($217 | 0) {
      if ($217 >>> 0 < (HEAP32[644] | 0) >>> 0) {
       _abort(); //@line 2981
      } else {
       HEAP32[$$3400 + 20 >> 2] = $217; //@line 2985
       HEAP32[$217 + 24 >> 2] = $$3400; //@line 2987
       break;
      }
     }
    }
   }
  } while (0);
  HEAP32[$$1 + 4 >> 2] = $135 | 1; //@line 2996
  HEAP32[$113 + $135 >> 2] = $135; //@line 2998
  if (($$1 | 0) == (HEAP32[645] | 0)) {
   HEAP32[642] = $135; //@line 3002
   return;
  } else {
   $$2 = $135; //@line 3005
  }
 } else {
  HEAP32[$114 >> 2] = $115 & -2; //@line 3009
  HEAP32[$$1 + 4 >> 2] = $$1382 | 1; //@line 3012
  HEAP32[$113 + $$1382 >> 2] = $$1382; //@line 3014
  $$2 = $$1382; //@line 3015
 }
 $232 = $$2 >>> 3; //@line 3017
 if ($$2 >>> 0 < 256) {
  $235 = 2600 + ($232 << 1 << 2) | 0; //@line 3021
  $236 = HEAP32[640] | 0; //@line 3022
  $237 = 1 << $232; //@line 3023
  if (!($236 & $237)) {
   HEAP32[640] = $236 | $237; //@line 3028
   $$0403 = $235; //@line 3030
   $$pre$phiZ2D = $235 + 8 | 0; //@line 3030
  } else {
   $241 = $235 + 8 | 0; //@line 3032
   $242 = HEAP32[$241 >> 2] | 0; //@line 3033
   if ($242 >>> 0 < (HEAP32[644] | 0) >>> 0) {
    _abort(); //@line 3037
   } else {
    $$0403 = $242; //@line 3040
    $$pre$phiZ2D = $241; //@line 3040
   }
  }
  HEAP32[$$pre$phiZ2D >> 2] = $$1; //@line 3043
  HEAP32[$$0403 + 12 >> 2] = $$1; //@line 3045
  HEAP32[$$1 + 8 >> 2] = $$0403; //@line 3047
  HEAP32[$$1 + 12 >> 2] = $235; //@line 3049
  return;
 }
 $248 = $$2 >>> 8; //@line 3052
 if (!$248) {
  $$0396 = 0; //@line 3055
 } else {
  if ($$2 >>> 0 > 16777215) {
   $$0396 = 31; //@line 3059
  } else {
   $253 = ($248 + 1048320 | 0) >>> 16 & 8; //@line 3063
   $254 = $248 << $253; //@line 3064
   $257 = ($254 + 520192 | 0) >>> 16 & 4; //@line 3067
   $259 = $254 << $257; //@line 3069
   $262 = ($259 + 245760 | 0) >>> 16 & 2; //@line 3072
   $267 = 14 - ($257 | $253 | $262) + ($259 << $262 >>> 15) | 0; //@line 3077
   $$0396 = $$2 >>> ($267 + 7 | 0) & 1 | $267 << 1; //@line 3083
  }
 }
 $273 = 2864 + ($$0396 << 2) | 0; //@line 3086
 HEAP32[$$1 + 28 >> 2] = $$0396; //@line 3088
 HEAP32[$$1 + 20 >> 2] = 0; //@line 3091
 HEAP32[$$1 + 16 >> 2] = 0; //@line 3092
 $277 = HEAP32[641] | 0; //@line 3093
 $278 = 1 << $$0396; //@line 3094
 do {
  if (!($277 & $278)) {
   HEAP32[641] = $277 | $278; //@line 3100
   HEAP32[$273 >> 2] = $$1; //@line 3101
   HEAP32[$$1 + 24 >> 2] = $273; //@line 3103
   HEAP32[$$1 + 12 >> 2] = $$1; //@line 3105
   HEAP32[$$1 + 8 >> 2] = $$1; //@line 3107
  } else {
   $$0383 = $$2 << (($$0396 | 0) == 31 ? 0 : 25 - ($$0396 >>> 1) | 0); //@line 3115
   $$0384 = HEAP32[$273 >> 2] | 0; //@line 3115
   while (1) {
    if ((HEAP32[$$0384 + 4 >> 2] & -8 | 0) == ($$2 | 0)) {
     label = 124; //@line 3122
     break;
    }
    $296 = $$0384 + 16 + ($$0383 >>> 31 << 2) | 0; //@line 3126
    $298 = HEAP32[$296 >> 2] | 0; //@line 3128
    if (!$298) {
     label = 121; //@line 3131
     break;
    } else {
     $$0383 = $$0383 << 1; //@line 3134
     $$0384 = $298; //@line 3134
    }
   }
   if ((label | 0) == 121) {
    if ($296 >>> 0 < (HEAP32[644] | 0) >>> 0) {
     _abort(); //@line 3141
    } else {
     HEAP32[$296 >> 2] = $$1; //@line 3144
     HEAP32[$$1 + 24 >> 2] = $$0384; //@line 3146
     HEAP32[$$1 + 12 >> 2] = $$1; //@line 3148
     HEAP32[$$1 + 8 >> 2] = $$1; //@line 3150
     break;
    }
   } else if ((label | 0) == 124) {
    $305 = $$0384 + 8 | 0; //@line 3155
    $306 = HEAP32[$305 >> 2] | 0; //@line 3156
    $307 = HEAP32[644] | 0; //@line 3157
    if ($306 >>> 0 >= $307 >>> 0 & $$0384 >>> 0 >= $307 >>> 0) {
     HEAP32[$306 + 12 >> 2] = $$1; //@line 3163
     HEAP32[$305 >> 2] = $$1; //@line 3164
     HEAP32[$$1 + 8 >> 2] = $306; //@line 3166
     HEAP32[$$1 + 12 >> 2] = $$0384; //@line 3168
     HEAP32[$$1 + 24 >> 2] = 0; //@line 3170
     break;
    } else {
     _abort(); //@line 3173
    }
   }
  }
 } while (0);
 $315 = (HEAP32[648] | 0) + -1 | 0; //@line 3180
 HEAP32[648] = $315; //@line 3181
 if (!$315) {
  $$0212$in$i = 3016; //@line 3184
 } else {
  return;
 }
 while (1) {
  $$0212$i = HEAP32[$$0212$in$i >> 2] | 0; //@line 3189
  if (!$$0212$i) {
   break;
  } else {
   $$0212$in$i = $$0212$i + 8 | 0; //@line 3195
  }
 }
 HEAP32[648] = -1; //@line 3198
 return;
}
function __ZNK10__cxxabiv121__vmi_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib($0, $1, $2, $3, $4) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 $2 = $2 | 0;
 $3 = $3 | 0;
 $4 = $4 | 0;
 var $$0 = 0, $$081$off0 = 0, $$084 = 0, $$085$off0 = 0, $$1 = 0, $$182$off0 = 0, $$186$off0 = 0, $$2 = 0, $$283$off0 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $19 = 0, $20 = 0, $24 = 0, $28 = 0, $29 = 0, $30 = 0, $47 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $59 = 0, label = 0;
 L1 : do {
  if (__ZN10__cxxabiv18is_equalEPKSt9type_infoS2_b($0, HEAP32[$1 + 8 >> 2] | 0, $4) | 0) {
   __ZNK10__cxxabiv117__class_type_info29process_static_type_below_dstEPNS_19__dynamic_cast_infoEPKvi(0, $1, $2, $3); //@line 4524
  } else {
   $10 = $0 + 12 | 0; //@line 4528
   $11 = $1 + 24 | 0; //@line 4529
   $12 = $1 + 36 | 0; //@line 4530
   $13 = $1 + 54 | 0; //@line 4531
   $14 = $0 + 8 | 0; //@line 4532
   $15 = $0 + 16 | 0; //@line 4533
   if (!(__ZN10__cxxabiv18is_equalEPKSt9type_infoS2_b($0, HEAP32[$1 >> 2] | 0, $4) | 0)) {
    $55 = HEAP32[$10 >> 2] | 0; //@line 4535
    $56 = $0 + 16 + ($55 << 3) | 0; //@line 4536
    __ZNK10__cxxabiv122__base_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib($15, $1, $2, $3, $4); //@line 4537
    $57 = $0 + 24 | 0; //@line 4538
    if (($55 | 0) <= 1) {
     break;
    }
    $59 = HEAP32[$14 >> 2] | 0; //@line 4543
    if (!($59 & 2)) {
     if ((HEAP32[$12 >> 2] | 0) == 1) {
      $$0 = $57; //@line 4550
     } else {
      if (!($59 & 1)) {
       $$2 = $57; //@line 4555
       while (1) {
        if (HEAP8[$13 >> 0] | 0) {
         break L1;
        }
        if ((HEAP32[$12 >> 2] | 0) == 1) {
         break L1;
        }
        __ZNK10__cxxabiv122__base_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib($$2, $1, $2, $3, $4); //@line 4567
        $$2 = $$2 + 8 | 0; //@line 4568
        if ($$2 >>> 0 >= $56 >>> 0) {
         break L1;
        }
       }
      } else {
       $$1 = $57; //@line 4577
      }
      while (1) {
       if (HEAP8[$13 >> 0] | 0) {
        break L1;
       }
       if ((HEAP32[$12 >> 2] | 0) == 1) {
        if ((HEAP32[$11 >> 2] | 0) == 1) {
         break L1;
        }
       }
       __ZNK10__cxxabiv122__base_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib($$1, $1, $2, $3, $4); //@line 4594
       $$1 = $$1 + 8 | 0; //@line 4595
       if ($$1 >>> 0 >= $56 >>> 0) {
        break L1;
       }
      }
     }
    } else {
     $$0 = $57; //@line 4605
    }
    while (1) {
     if (HEAP8[$13 >> 0] | 0) {
      break L1;
     }
     __ZNK10__cxxabiv122__base_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib($$0, $1, $2, $3, $4); //@line 4613
     $$0 = $$0 + 8 | 0; //@line 4614
     if ($$0 >>> 0 >= $56 >>> 0) {
      break L1;
     }
    }
   }
   $19 = $1 + 32 | 0; //@line 4626
   if ((HEAP32[$1 + 16 >> 2] | 0) != ($2 | 0)) {
    $20 = $1 + 20 | 0; //@line 4628
    if ((HEAP32[$20 >> 2] | 0) != ($2 | 0)) {
     HEAP32[$19 >> 2] = $3; //@line 4632
     $24 = $1 + 44 | 0; //@line 4633
     if ((HEAP32[$24 >> 2] | 0) == 4) {
      break;
     }
     $28 = $0 + 16 + (HEAP32[$10 >> 2] << 3) | 0; //@line 4640
     $29 = $1 + 52 | 0; //@line 4641
     $30 = $1 + 53 | 0; //@line 4642
     $$081$off0 = 0; //@line 4643
     $$084 = $15; //@line 4643
     $$085$off0 = 0; //@line 4643
     L29 : while (1) {
      if ($$084 >>> 0 >= $28 >>> 0) {
       $$283$off0 = $$081$off0; //@line 4647
       label = 18; //@line 4648
       break;
      }
      HEAP8[$29 >> 0] = 0; //@line 4651
      HEAP8[$30 >> 0] = 0; //@line 4652
      __ZNK10__cxxabiv122__base_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib($$084, $1, $2, $2, 1, $4); //@line 4653
      if (HEAP8[$13 >> 0] | 0) {
       $$283$off0 = $$081$off0; //@line 4657
       label = 18; //@line 4658
       break;
      }
      do {
       if (!(HEAP8[$30 >> 0] | 0)) {
        $$182$off0 = $$081$off0; //@line 4665
        $$186$off0 = $$085$off0; //@line 4665
       } else {
        if (!(HEAP8[$29 >> 0] | 0)) {
         if (!(HEAP32[$14 >> 2] & 1)) {
          $$283$off0 = 1; //@line 4674
          label = 18; //@line 4675
          break L29;
         } else {
          $$182$off0 = 1; //@line 4678
          $$186$off0 = $$085$off0; //@line 4678
          break;
         }
        }
        if ((HEAP32[$11 >> 2] | 0) == 1) {
         label = 23; //@line 4685
         break L29;
        }
        if (!(HEAP32[$14 >> 2] & 2)) {
         label = 23; //@line 4692
         break L29;
        } else {
         $$182$off0 = 1; //@line 4695
         $$186$off0 = 1; //@line 4695
        }
       }
      } while (0);
      $$081$off0 = $$182$off0; //@line 4700
      $$084 = $$084 + 8 | 0; //@line 4700
      $$085$off0 = $$186$off0; //@line 4700
     }
     do {
      if ((label | 0) == 18) {
       if (!$$085$off0) {
        HEAP32[$20 >> 2] = $2; //@line 4705
        $47 = $1 + 40 | 0; //@line 4706
        HEAP32[$47 >> 2] = (HEAP32[$47 >> 2] | 0) + 1; //@line 4709
        if ((HEAP32[$12 >> 2] | 0) == 1) {
         if ((HEAP32[$11 >> 2] | 0) == 2) {
          HEAP8[$13 >> 0] = 1; //@line 4716
          if ($$283$off0) {
           label = 23; //@line 4718
           break;
          } else {
           $54 = 4; //@line 4721
           break;
          }
         }
        }
       }
       if ($$283$off0) {
        label = 23; //@line 4728
       } else {
        $54 = 4; //@line 4730
       }
      }
     } while (0);
     if ((label | 0) == 23) {
      $54 = 3; //@line 4735
     }
     HEAP32[$24 >> 2] = $54; //@line 4737
     break;
    }
   }
   if (($3 | 0) == 1) {
    HEAP32[$19 >> 2] = 1; //@line 4743
   }
  }
 } while (0);
 return;
}
function ___stdio_write($0, $1, $2) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 $2 = $2 | 0;
 var $$0 = 0, $$04756 = 0, $$04855 = 0, $$04954 = 0, $$051 = 0, $$1 = 0, $$150 = 0, $12 = 0, $13 = 0, $17 = 0, $20 = 0, $26 = 0, $3 = 0, $36 = 0, $37 = 0, $4 = 0, $43 = 0, $5 = 0, $7 = 0, $9 = 0, $vararg_buffer = 0, $vararg_buffer3 = 0, label = 0, sp = 0;
 sp = STACKTOP; //@line 3228
 STACKTOP = STACKTOP + 48 | 0; //@line 3229
 $vararg_buffer3 = sp + 16 | 0; //@line 3230
 $vararg_buffer = sp; //@line 3231
 $3 = sp + 32 | 0; //@line 3232
 $4 = $0 + 28 | 0; //@line 3233
 $5 = HEAP32[$4 >> 2] | 0; //@line 3234
 HEAP32[$3 >> 2] = $5; //@line 3235
 $7 = $0 + 20 | 0; //@line 3237
 $9 = (HEAP32[$7 >> 2] | 0) - $5 | 0; //@line 3239
 HEAP32[$3 + 4 >> 2] = $9; //@line 3240
 HEAP32[$3 + 8 >> 2] = $1; //@line 3242
 HEAP32[$3 + 12 >> 2] = $2; //@line 3244
 $12 = $9 + $2 | 0; //@line 3245
 $13 = $0 + 60 | 0; //@line 3246
 HEAP32[$vararg_buffer >> 2] = HEAP32[$13 >> 2]; //@line 3249
 HEAP32[$vararg_buffer + 4 >> 2] = $3; //@line 3251
 HEAP32[$vararg_buffer + 8 >> 2] = 2; //@line 3253
 $17 = ___syscall_ret(___syscall146(146, $vararg_buffer | 0) | 0) | 0; //@line 3255
 L1 : do {
  if (($12 | 0) == ($17 | 0)) {
   label = 3; //@line 3259
  } else {
   $$04756 = 2; //@line 3261
   $$04855 = $12; //@line 3261
   $$04954 = $3; //@line 3261
   $26 = $17; //@line 3261
   while (1) {
    if (($26 | 0) < 0) {
     break;
    }
    $$04855 = $$04855 - $26 | 0; //@line 3267
    $36 = HEAP32[$$04954 + 4 >> 2] | 0; //@line 3269
    $37 = $26 >>> 0 > $36 >>> 0; //@line 3270
    $$150 = $37 ? $$04954 + 8 | 0 : $$04954; //@line 3272
    $$1 = ($37 << 31 >> 31) + $$04756 | 0; //@line 3274
    $$0 = $26 - ($37 ? $36 : 0) | 0; //@line 3276
    HEAP32[$$150 >> 2] = (HEAP32[$$150 >> 2] | 0) + $$0; //@line 3279
    $43 = $$150 + 4 | 0; //@line 3280
    HEAP32[$43 >> 2] = (HEAP32[$43 >> 2] | 0) - $$0; //@line 3283
    HEAP32[$vararg_buffer3 >> 2] = HEAP32[$13 >> 2]; //@line 3286
    HEAP32[$vararg_buffer3 + 4 >> 2] = $$150; //@line 3288
    HEAP32[$vararg_buffer3 + 8 >> 2] = $$1; //@line 3290
    $26 = ___syscall_ret(___syscall146(146, $vararg_buffer3 | 0) | 0) | 0; //@line 3292
    if (($$04855 | 0) == ($26 | 0)) {
     label = 3; //@line 3295
     break L1;
    } else {
     $$04756 = $$1; //@line 3298
     $$04954 = $$150; //@line 3298
    }
   }
   HEAP32[$0 + 16 >> 2] = 0; //@line 3302
   HEAP32[$4 >> 2] = 0; //@line 3303
   HEAP32[$7 >> 2] = 0; //@line 3304
   HEAP32[$0 >> 2] = HEAP32[$0 >> 2] | 32; //@line 3307
   if (($$04756 | 0) == 2) {
    $$051 = 0; //@line 3310
   } else {
    $$051 = $2 - (HEAP32[$$04954 + 4 >> 2] | 0) | 0; //@line 3315
   }
  }
 } while (0);
 if ((label | 0) == 3) {
  $20 = HEAP32[$0 + 44 >> 2] | 0; //@line 3321
  HEAP32[$0 + 16 >> 2] = $20 + (HEAP32[$0 + 48 >> 2] | 0); //@line 3326
  HEAP32[$4 >> 2] = $20; //@line 3327
  HEAP32[$7 >> 2] = $20; //@line 3328
  $$051 = $2; //@line 3329
 }
 STACKTOP = sp; //@line 3331
 return $$051 | 0; //@line 3331
}
function _memcpy(dest, src, num) {
 dest = dest | 0;
 src = src | 0;
 num = num | 0;
 var ret = 0, aligned_dest_end = 0, block_aligned_dest_end = 0, dest_end = 0;
 if ((num | 0) >= 8192) {
  return _emscripten_memcpy_big(dest | 0, src | 0, num | 0) | 0; //@line 4949
 }
 ret = dest | 0; //@line 4952
 dest_end = dest + num | 0; //@line 4953
 if ((dest & 3) == (src & 3)) {
  while (dest & 3) {
   if (!num) return ret | 0; //@line 4957
   HEAP8[dest >> 0] = HEAP8[src >> 0] | 0; //@line 4958
   dest = dest + 1 | 0; //@line 4959
   src = src + 1 | 0; //@line 4960
   num = num - 1 | 0; //@line 4961
  }
  aligned_dest_end = dest_end & -4 | 0; //@line 4963
  block_aligned_dest_end = aligned_dest_end - 64 | 0; //@line 4964
  while ((dest | 0) <= (block_aligned_dest_end | 0)) {
   HEAP32[dest >> 2] = HEAP32[src >> 2]; //@line 4966
   HEAP32[dest + 4 >> 2] = HEAP32[src + 4 >> 2]; //@line 4967
   HEAP32[dest + 8 >> 2] = HEAP32[src + 8 >> 2]; //@line 4968
   HEAP32[dest + 12 >> 2] = HEAP32[src + 12 >> 2]; //@line 4969
   HEAP32[dest + 16 >> 2] = HEAP32[src + 16 >> 2]; //@line 4970
   HEAP32[dest + 20 >> 2] = HEAP32[src + 20 >> 2]; //@line 4971
   HEAP32[dest + 24 >> 2] = HEAP32[src + 24 >> 2]; //@line 4972
   HEAP32[dest + 28 >> 2] = HEAP32[src + 28 >> 2]; //@line 4973
   HEAP32[dest + 32 >> 2] = HEAP32[src + 32 >> 2]; //@line 4974
   HEAP32[dest + 36 >> 2] = HEAP32[src + 36 >> 2]; //@line 4975
   HEAP32[dest + 40 >> 2] = HEAP32[src + 40 >> 2]; //@line 4976
   HEAP32[dest + 44 >> 2] = HEAP32[src + 44 >> 2]; //@line 4977
   HEAP32[dest + 48 >> 2] = HEAP32[src + 48 >> 2]; //@line 4978
   HEAP32[dest + 52 >> 2] = HEAP32[src + 52 >> 2]; //@line 4979
   HEAP32[dest + 56 >> 2] = HEAP32[src + 56 >> 2]; //@line 4980
   HEAP32[dest + 60 >> 2] = HEAP32[src + 60 >> 2]; //@line 4981
   dest = dest + 64 | 0; //@line 4982
   src = src + 64 | 0; //@line 4983
  }
  while ((dest | 0) < (aligned_dest_end | 0)) {
   HEAP32[dest >> 2] = HEAP32[src >> 2]; //@line 4986
   dest = dest + 4 | 0; //@line 4987
   src = src + 4 | 0; //@line 4988
  }
 } else {
  aligned_dest_end = dest_end - 4 | 0; //@line 4992
  while ((dest | 0) < (aligned_dest_end | 0)) {
   HEAP8[dest >> 0] = HEAP8[src >> 0] | 0; //@line 4994
   HEAP8[dest + 1 >> 0] = HEAP8[src + 1 >> 0] | 0; //@line 4995
   HEAP8[dest + 2 >> 0] = HEAP8[src + 2 >> 0] | 0; //@line 4996
   HEAP8[dest + 3 >> 0] = HEAP8[src + 3 >> 0] | 0; //@line 4997
   dest = dest + 4 | 0; //@line 4998
   src = src + 4 | 0; //@line 4999
  }
 }
 while ((dest | 0) < (dest_end | 0)) {
  HEAP8[dest >> 0] = HEAP8[src >> 0] | 0; //@line 5004
  dest = dest + 1 | 0; //@line 5005
  src = src + 1 | 0; //@line 5006
 }
 return ret | 0; //@line 5008
}
function __ZNK10__cxxabiv120__si_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib($0, $1, $2, $3, $4) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 $2 = $2 | 0;
 $3 = $3 | 0;
 $4 = $4 | 0;
 var $$037$off038 = 0, $$037$off039 = 0, $10 = 0, $14 = 0, $15 = 0, $19 = 0, $22 = 0, $23 = 0, $24 = 0, $31 = 0, $41 = 0, label = 0;
 do {
  if (__ZN10__cxxabiv18is_equalEPKSt9type_infoS2_b($0, HEAP32[$1 + 8 >> 2] | 0, $4) | 0) {
   __ZNK10__cxxabiv117__class_type_info29process_static_type_below_dstEPNS_19__dynamic_cast_infoEPKvi(0, $1, $2, $3); //@line 4273
  } else {
   $10 = $0 + 8 | 0; //@line 4277
   if (!(__ZN10__cxxabiv18is_equalEPKSt9type_infoS2_b($0, HEAP32[$1 >> 2] | 0, $4) | 0)) {
    $41 = HEAP32[$10 >> 2] | 0; //@line 4279
    FUNCTION_TABLE_viiiii[HEAP32[(HEAP32[$41 >> 2] | 0) + 24 >> 2] & 3]($41, $1, $2, $3, $4); //@line 4283
    break;
   }
   $14 = $1 + 32 | 0; //@line 4289
   if ((HEAP32[$1 + 16 >> 2] | 0) != ($2 | 0)) {
    $15 = $1 + 20 | 0; //@line 4291
    if ((HEAP32[$15 >> 2] | 0) != ($2 | 0)) {
     HEAP32[$14 >> 2] = $3; //@line 4295
     $19 = $1 + 44 | 0; //@line 4296
     if ((HEAP32[$19 >> 2] | 0) == 4) {
      break;
     }
     $22 = $1 + 52 | 0; //@line 4302
     HEAP8[$22 >> 0] = 0; //@line 4303
     $23 = $1 + 53 | 0; //@line 4304
     HEAP8[$23 >> 0] = 0; //@line 4305
     $24 = HEAP32[$10 >> 2] | 0; //@line 4306
     FUNCTION_TABLE_viiiiii[HEAP32[(HEAP32[$24 >> 2] | 0) + 20 >> 2] & 3]($24, $1, $2, $2, 1, $4); //@line 4310
     if (!(HEAP8[$23 >> 0] | 0)) {
      $$037$off038 = 4; //@line 4314
      label = 11; //@line 4315
     } else {
      if (!(HEAP8[$22 >> 0] | 0)) {
       $$037$off038 = 3; //@line 4320
       label = 11; //@line 4321
      } else {
       $$037$off039 = 3; //@line 4323
      }
     }
     if ((label | 0) == 11) {
      HEAP32[$15 >> 2] = $2; //@line 4327
      $31 = $1 + 40 | 0; //@line 4328
      HEAP32[$31 >> 2] = (HEAP32[$31 >> 2] | 0) + 1; //@line 4331
      if ((HEAP32[$1 + 36 >> 2] | 0) == 1) {
       if ((HEAP32[$1 + 24 >> 2] | 0) == 2) {
        HEAP8[$1 + 54 >> 0] = 1; //@line 4341
        $$037$off039 = $$037$off038; //@line 4342
       } else {
        $$037$off039 = $$037$off038; //@line 4344
       }
      } else {
       $$037$off039 = $$037$off038; //@line 4347
      }
     }
     HEAP32[$19 >> 2] = $$037$off039; //@line 4350
     break;
    }
   }
   if (($3 | 0) == 1) {
    HEAP32[$14 >> 2] = 1; //@line 4356
   }
  }
 } while (0);
 return;
}
function ___dynamic_cast($0, $1, $2, $3) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 $2 = $2 | 0;
 $3 = $3 | 0;
 var $$0 = 0, $10 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $4 = 0, $5 = 0, $8 = 0, dest = 0, sp = 0, stop = 0;
 sp = STACKTOP; //@line 4137
 STACKTOP = STACKTOP + 64 | 0; //@line 4138
 $4 = sp; //@line 4139
 $5 = HEAP32[$0 >> 2] | 0; //@line 4140
 $8 = $0 + (HEAP32[$5 + -8 >> 2] | 0) | 0; //@line 4143
 $10 = HEAP32[$5 + -4 >> 2] | 0; //@line 4145
 HEAP32[$4 >> 2] = $2; //@line 4146
 HEAP32[$4 + 4 >> 2] = $0; //@line 4148
 HEAP32[$4 + 8 >> 2] = $1; //@line 4150
 HEAP32[$4 + 12 >> 2] = $3; //@line 4152
 $14 = $4 + 16 | 0; //@line 4153
 $15 = $4 + 20 | 0; //@line 4154
 $16 = $4 + 24 | 0; //@line 4155
 $17 = $4 + 28 | 0; //@line 4156
 $18 = $4 + 32 | 0; //@line 4157
 $19 = $4 + 40 | 0; //@line 4158
 dest = $14; //@line 4159
 stop = dest + 36 | 0; //@line 4159
 do {
  HEAP32[dest >> 2] = 0; //@line 4159
  dest = dest + 4 | 0; //@line 4159
 } while ((dest | 0) < (stop | 0));
 HEAP16[$14 + 36 >> 1] = 0; //@line 4159
 HEAP8[$14 + 38 >> 0] = 0; //@line 4159
 L1 : do {
  if (__ZN10__cxxabiv18is_equalEPKSt9type_infoS2_b($10, $2, 0) | 0) {
   HEAP32[$4 + 48 >> 2] = 1; //@line 4164
   FUNCTION_TABLE_viiiiii[HEAP32[(HEAP32[$10 >> 2] | 0) + 20 >> 2] & 3]($10, $4, $8, $8, 1, 0); //@line 4168
   $$0 = (HEAP32[$16 >> 2] | 0) == 1 ? $8 : 0; //@line 4172
  } else {
   FUNCTION_TABLE_viiiii[HEAP32[(HEAP32[$10 >> 2] | 0) + 24 >> 2] & 3]($10, $4, $8, 1, 0); //@line 4178
   switch (HEAP32[$4 + 36 >> 2] | 0) {
   case 0:
    {
     $$0 = (HEAP32[$19 >> 2] | 0) == 1 & (HEAP32[$17 >> 2] | 0) == 1 & (HEAP32[$18 >> 2] | 0) == 1 ? HEAP32[$15 >> 2] | 0 : 0; //@line 4192
     break L1;
     break;
    }
   case 1:
    {
     break;
    }
   default:
    {
     $$0 = 0; //@line 4200
     break L1;
    }
   }
   if ((HEAP32[$16 >> 2] | 0) != 1) {
    if (!((HEAP32[$19 >> 2] | 0) == 0 & (HEAP32[$17 >> 2] | 0) == 1 & (HEAP32[$18 >> 2] | 0) == 1)) {
     $$0 = 0; //@line 4216
     break;
    }
   }
   $$0 = HEAP32[$14 >> 2] | 0; //@line 4221
  }
 } while (0);
 STACKTOP = sp; //@line 4224
 return $$0 | 0; //@line 4224
}
function __ZN53EmscriptenBindingInitializer_native_and_builtin_typesC2Ev($0) {
 $0 = $0 | 0;
 __embind_register_void(264, 918); //@line 59
 __embind_register_bool(272, 923, 1, 1, 0); //@line 60
 __embind_register_integer(280, 928, 1, -128, 127); //@line 61
 __embind_register_integer(296, 933, 1, -128, 127); //@line 62
 __embind_register_integer(288, 945, 1, 0, 255); //@line 63
 __embind_register_integer(304, 959, 2, -32768, 32767); //@line 64
 __embind_register_integer(312, 965, 2, 0, 65535); //@line 65
 __embind_register_integer(320, 980, 4, -2147483648, 2147483647); //@line 66
 __embind_register_integer(328, 984, 4, 0, -1); //@line 67
 __embind_register_integer(336, 997, 4, -2147483648, 2147483647); //@line 68
 __embind_register_integer(344, 1002, 4, 0, -1); //@line 69
 __embind_register_float(352, 1016, 4); //@line 70
 __embind_register_float(360, 1022, 8); //@line 71
 __embind_register_std_string(8, 1029); //@line 72
 __embind_register_std_string(32, 1041); //@line 73
 __embind_register_std_wstring(56, 4, 1074); //@line 74
 __embind_register_emval(80, 1087); //@line 75
 __embind_register_memory_view(88, 0, 1103); //@line 76
 __embind_register_memory_view(96, 0, 1133); //@line 77
 __embind_register_memory_view(104, 1, 1170); //@line 78
 __embind_register_memory_view(112, 2, 1209); //@line 79
 __embind_register_memory_view(120, 3, 1240); //@line 80
 __embind_register_memory_view(128, 4, 1280); //@line 81
 __embind_register_memory_view(136, 5, 1309); //@line 82
 __embind_register_memory_view(144, 4, 1347); //@line 83
 __embind_register_memory_view(152, 5, 1377); //@line 84
 __embind_register_memory_view(96, 0, 1416); //@line 85
 __embind_register_memory_view(104, 1, 1448); //@line 86
 __embind_register_memory_view(112, 2, 1481); //@line 87
 __embind_register_memory_view(120, 3, 1514); //@line 88
 __embind_register_memory_view(128, 4, 1548); //@line 89
 __embind_register_memory_view(136, 5, 1581); //@line 90
 __embind_register_memory_view(160, 6, 1615); //@line 91
 __embind_register_memory_view(168, 7, 1646); //@line 92
 __embind_register_memory_view(176, 7, 1678); //@line 93
 return;
}
function ___fwritex($0, $1, $2) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 $2 = $2 | 0;
 var $$038 = 0, $$1 = 0, $$139 = 0, $$141 = 0, $$143 = 0, $10 = 0, $12 = 0, $14 = 0, $22 = 0, $28 = 0, $3 = 0, $31 = 0, $4 = 0, $9 = 0, label = 0;
 $3 = $2 + 16 | 0; //@line 3458
 $4 = HEAP32[$3 >> 2] | 0; //@line 3459
 if (!$4) {
  if (!(___towrite($2) | 0)) {
   $12 = HEAP32[$3 >> 2] | 0; //@line 3466
   label = 5; //@line 3467
  } else {
   $$1 = 0; //@line 3469
  }
 } else {
  $12 = $4; //@line 3473
  label = 5; //@line 3474
 }
 L5 : do {
  if ((label | 0) == 5) {
   $9 = $2 + 20 | 0; //@line 3478
   $10 = HEAP32[$9 >> 2] | 0; //@line 3479
   $14 = $10; //@line 3482
   if (($12 - $10 | 0) >>> 0 < $1 >>> 0) {
    $$1 = FUNCTION_TABLE_iiii[HEAP32[$2 + 36 >> 2] & 7]($2, $0, $1) | 0; //@line 3487
    break;
   }
   L10 : do {
    if ((HEAP8[$2 + 75 >> 0] | 0) > -1) {
     $$038 = $1; //@line 3495
     while (1) {
      if (!$$038) {
       $$139 = 0; //@line 3499
       $$141 = $0; //@line 3499
       $$143 = $1; //@line 3499
       $31 = $14; //@line 3499
       break L10;
      }
      $22 = $$038 + -1 | 0; //@line 3502
      if ((HEAP8[$0 + $22 >> 0] | 0) == 10) {
       break;
      } else {
       $$038 = $22; //@line 3509
      }
     }
     $28 = FUNCTION_TABLE_iiii[HEAP32[$2 + 36 >> 2] & 7]($2, $0, $$038) | 0; //@line 3514
     if ($28 >>> 0 < $$038 >>> 0) {
      $$1 = $28; //@line 3517
      break L5;
     }
     $$139 = $$038; //@line 3523
     $$141 = $0 + $$038 | 0; //@line 3523
     $$143 = $1 - $$038 | 0; //@line 3523
     $31 = HEAP32[$9 >> 2] | 0; //@line 3523
    } else {
     $$139 = 0; //@line 3525
     $$141 = $0; //@line 3525
     $$143 = $1; //@line 3525
     $31 = $14; //@line 3525
    }
   } while (0);
   _memcpy($31 | 0, $$141 | 0, $$143 | 0) | 0; //@line 3528
   HEAP32[$9 >> 2] = (HEAP32[$9 >> 2] | 0) + $$143; //@line 3531
   $$1 = $$139 + $$143 | 0; //@line 3533
  }
 } while (0);
 return $$1 | 0; //@line 3536
}
function __ZNK10__cxxabiv121__vmi_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib($0, $1, $2, $3, $4, $5) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 $2 = $2 | 0;
 $3 = $3 | 0;
 $4 = $4 | 0;
 $5 = $5 | 0;
 var $$0 = 0, $10 = 0, $11 = 0, $12 = 0, $15 = 0, $16 = 0, $19 = 0, $20 = 0, $21 = 0, $9 = 0;
 if (__ZN10__cxxabiv18is_equalEPKSt9type_infoS2_b($0, HEAP32[$1 + 8 >> 2] | 0, $5) | 0) {
  __ZNK10__cxxabiv117__class_type_info29process_static_type_above_dstEPNS_19__dynamic_cast_infoEPKvS4_i(0, $1, $2, $3, $4); //@line 4436
 } else {
  $9 = $1 + 52 | 0; //@line 4438
  $10 = HEAP8[$9 >> 0] | 0; //@line 4439
  $11 = $1 + 53 | 0; //@line 4440
  $12 = HEAP8[$11 >> 0] | 0; //@line 4441
  $15 = HEAP32[$0 + 12 >> 2] | 0; //@line 4444
  $16 = $0 + 16 + ($15 << 3) | 0; //@line 4445
  HEAP8[$9 >> 0] = 0; //@line 4446
  HEAP8[$11 >> 0] = 0; //@line 4447
  __ZNK10__cxxabiv122__base_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib($0 + 16 | 0, $1, $2, $3, $4, $5); //@line 4448
  L4 : do {
   if (($15 | 0) > 1) {
    $19 = $1 + 24 | 0; //@line 4453
    $20 = $1 + 54 | 0; //@line 4454
    $21 = $0 + 8 | 0; //@line 4455
    $$0 = $0 + 24 | 0; //@line 4456
    do {
     if (HEAP8[$20 >> 0] | 0) {
      break L4;
     }
     if (!(HEAP8[$9 >> 0] | 0)) {
      if (HEAP8[$11 >> 0] | 0) {
       if (!(HEAP32[$21 >> 2] & 1)) {
        break L4;
       }
      }
     } else {
      if ((HEAP32[$19 >> 2] | 0) == 1) {
       break L4;
      }
      if (!(HEAP32[$21 >> 2] & 2)) {
       break L4;
      }
     }
     HEAP8[$9 >> 0] = 0; //@line 4489
     HEAP8[$11 >> 0] = 0; //@line 4490
     __ZNK10__cxxabiv122__base_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib($$0, $1, $2, $3, $4, $5); //@line 4491
     $$0 = $$0 + 8 | 0; //@line 4492
    } while ($$0 >>> 0 < $16 >>> 0);
   }
  } while (0);
  HEAP8[$9 >> 0] = $10; //@line 4502
  HEAP8[$11 >> 0] = $12; //@line 4503
 }
 return;
}
function runPostSets() {}
function _memset(ptr, value, num) {
 ptr = ptr | 0;
 value = value | 0;
 num = num | 0;
 var end = 0, aligned_end = 0, block_aligned_end = 0, value4 = 0;
 end = ptr + num | 0; //@line 4894
 value = value & 255; //@line 4896
 if ((num | 0) >= 67) {
  while (ptr & 3) {
   HEAP8[ptr >> 0] = value; //@line 4899
   ptr = ptr + 1 | 0; //@line 4900
  }
  aligned_end = end & -4 | 0; //@line 4903
  block_aligned_end = aligned_end - 64 | 0; //@line 4904
  value4 = value | value << 8 | value << 16 | value << 24; //@line 4905
  while ((ptr | 0) <= (block_aligned_end | 0)) {
   HEAP32[ptr >> 2] = value4; //@line 4908
   HEAP32[ptr + 4 >> 2] = value4; //@line 4909
   HEAP32[ptr + 8 >> 2] = value4; //@line 4910
   HEAP32[ptr + 12 >> 2] = value4; //@line 4911
   HEAP32[ptr + 16 >> 2] = value4; //@line 4912
   HEAP32[ptr + 20 >> 2] = value4; //@line 4913
   HEAP32[ptr + 24 >> 2] = value4; //@line 4914
   HEAP32[ptr + 28 >> 2] = value4; //@line 4915
   HEAP32[ptr + 32 >> 2] = value4; //@line 4916
   HEAP32[ptr + 36 >> 2] = value4; //@line 4917
   HEAP32[ptr + 40 >> 2] = value4; //@line 4918
   HEAP32[ptr + 44 >> 2] = value4; //@line 4919
   HEAP32[ptr + 48 >> 2] = value4; //@line 4920
   HEAP32[ptr + 52 >> 2] = value4; //@line 4921
   HEAP32[ptr + 56 >> 2] = value4; //@line 4922
   HEAP32[ptr + 60 >> 2] = value4; //@line 4923
   ptr = ptr + 64 | 0; //@line 4924
  }
  while ((ptr | 0) < (aligned_end | 0)) {
   HEAP32[ptr >> 2] = value4; //@line 4928
   ptr = ptr + 4 | 0; //@line 4929
  }
 }
 while ((ptr | 0) < (end | 0)) {
  HEAP8[ptr >> 0] = value; //@line 4934
  ptr = ptr + 1 | 0; //@line 4935
 }
 return end - num | 0; //@line 4937
}
function __ZNK10__cxxabiv117__class_type_info29process_static_type_above_dstEPNS_19__dynamic_cast_infoEPKvS4_i($0, $1, $2, $3, $4) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 $2 = $2 | 0;
 $3 = $3 | 0;
 $4 = $4 | 0;
 var $10 = 0, $11 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $21 = 0, $26 = 0;
 HEAP8[$1 + 53 >> 0] = 1; //@line 4073
 do {
  if ((HEAP32[$1 + 4 >> 2] | 0) == ($3 | 0)) {
   HEAP8[$1 + 52 >> 0] = 1; //@line 4080
   $10 = $1 + 16 | 0; //@line 4081
   $11 = HEAP32[$10 >> 2] | 0; //@line 4082
   $13 = $1 + 54 | 0; //@line 4084
   $14 = $1 + 48 | 0; //@line 4085
   $15 = $1 + 24 | 0; //@line 4086
   $16 = $1 + 36 | 0; //@line 4087
   if (!$11) {
    HEAP32[$10 >> 2] = $2; //@line 4089
    HEAP32[$15 >> 2] = $4; //@line 4090
    HEAP32[$16 >> 2] = 1; //@line 4091
    if (!((HEAP32[$14 >> 2] | 0) == 1 & ($4 | 0) == 1)) {
     break;
    }
    HEAP8[$13 >> 0] = 1; //@line 4099
    break;
   }
   if (($11 | 0) != ($2 | 0)) {
    HEAP32[$16 >> 2] = (HEAP32[$16 >> 2] | 0) + 1; //@line 4106
    HEAP8[$13 >> 0] = 1; //@line 4107
    break;
   }
   $21 = HEAP32[$15 >> 2] | 0; //@line 4110
   if (($21 | 0) == 2) {
    HEAP32[$15 >> 2] = $4; //@line 4113
    $26 = $4; //@line 4114
   } else {
    $26 = $21; //@line 4116
   }
   if ((HEAP32[$14 >> 2] | 0) == 1 & ($26 | 0) == 1) {
    HEAP8[$13 >> 0] = 1; //@line 4123
   }
  }
 } while (0);
 return;
}
function __ZNK10__cxxabiv117__class_type_info9can_catchEPKNS_16__shim_type_infoERPv($0, $1, $2) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 $2 = $2 | 0;
 var $$0 = 0, $$2 = 0, $3 = 0, $6 = 0, dest = 0, sp = 0, stop = 0;
 sp = STACKTOP; //@line 3858
 STACKTOP = STACKTOP + 64 | 0; //@line 3859
 $3 = sp; //@line 3860
 if (__ZN10__cxxabiv18is_equalEPKSt9type_infoS2_b($0, $1, 0) | 0) {
  $$2 = 1; //@line 3863
 } else {
  if (!$1) {
   $$2 = 0; //@line 3867
  } else {
   $6 = ___dynamic_cast($1, 208, 192, 0) | 0; //@line 3869
   if (!$6) {
    $$2 = 0; //@line 3872
   } else {
    dest = $3 + 4 | 0; //@line 3875
    stop = dest + 52 | 0; //@line 3875
    do {
     HEAP32[dest >> 2] = 0; //@line 3875
     dest = dest + 4 | 0; //@line 3875
    } while ((dest | 0) < (stop | 0));
    HEAP32[$3 >> 2] = $6; //@line 3876
    HEAP32[$3 + 8 >> 2] = $0; //@line 3878
    HEAP32[$3 + 12 >> 2] = -1; //@line 3880
    HEAP32[$3 + 48 >> 2] = 1; //@line 3882
    FUNCTION_TABLE_viiii[HEAP32[(HEAP32[$6 >> 2] | 0) + 28 >> 2] & 3]($6, $3, HEAP32[$2 >> 2] | 0, 1); //@line 3887
    if ((HEAP32[$3 + 24 >> 2] | 0) == 1) {
     HEAP32[$2 >> 2] = HEAP32[$3 + 16 >> 2]; //@line 3894
     $$0 = 1; //@line 3895
    } else {
     $$0 = 0; //@line 3897
    }
    $$2 = $$0; //@line 3899
   }
  }
 }
 STACKTOP = sp; //@line 3903
 return $$2 | 0; //@line 3903
}
function _strlen($0) {
 $0 = $0 | 0;
 var $$0 = 0, $$015$lcssa = 0, $$01519 = 0, $$1$lcssa = 0, $$pn = 0, $$sink = 0, $1 = 0, $10 = 0, $19 = 0, $23 = 0, $6 = 0, label = 0;
 $1 = $0; //@line 3582
 L1 : do {
  if (!($1 & 3)) {
   $$015$lcssa = $0; //@line 3587
   label = 4; //@line 3588
  } else {
   $$01519 = $0; //@line 3590
   $23 = $1; //@line 3590
   while (1) {
    if (!(HEAP8[$$01519 >> 0] | 0)) {
     $$sink = $23; //@line 3595
     break L1;
    }
    $6 = $$01519 + 1 | 0; //@line 3598
    $23 = $6; //@line 3599
    if (!($23 & 3)) {
     $$015$lcssa = $6; //@line 3603
     label = 4; //@line 3604
     break;
    } else {
     $$01519 = $6; //@line 3607
    }
   }
  }
 } while (0);
 if ((label | 0) == 4) {
  $$0 = $$015$lcssa; //@line 3613
  while (1) {
   $10 = HEAP32[$$0 >> 2] | 0; //@line 3615
   if (!(($10 & -2139062144 ^ -2139062144) & $10 + -16843009)) {
    $$0 = $$0 + 4 | 0; //@line 3623
   } else {
    break;
   }
  }
  if (!(($10 & 255) << 24 >> 24)) {
   $$1$lcssa = $$0; //@line 3631
  } else {
   $$pn = $$0; //@line 3633
   while (1) {
    $19 = $$pn + 1 | 0; //@line 3635
    if (!(HEAP8[$19 >> 0] | 0)) {
     $$1$lcssa = $19; //@line 3639
     break;
    } else {
     $$pn = $19; //@line 3642
    }
   }
  }
  $$sink = $$1$lcssa; //@line 3647
 }
 return $$sink - $1 | 0; //@line 3650
}
function __ZNK10__cxxabiv117__class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib($0, $1, $2, $3, $4) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 $2 = $2 | 0;
 $3 = $3 | 0;
 $4 = $4 | 0;
 var $13 = 0, $14 = 0, $18 = 0;
 do {
  if (__ZN10__cxxabiv18is_equalEPKSt9type_infoS2_b($0, HEAP32[$1 + 8 >> 2] | 0, $4) | 0) {
   __ZNK10__cxxabiv117__class_type_info29process_static_type_below_dstEPNS_19__dynamic_cast_infoEPKvi(0, $1, $2, $3); //@line 3936
  } else {
   if (__ZN10__cxxabiv18is_equalEPKSt9type_infoS2_b($0, HEAP32[$1 >> 2] | 0, $4) | 0) {
    $13 = $1 + 32 | 0; //@line 3944
    if ((HEAP32[$1 + 16 >> 2] | 0) != ($2 | 0)) {
     $14 = $1 + 20 | 0; //@line 3946
     if ((HEAP32[$14 >> 2] | 0) != ($2 | 0)) {
      HEAP32[$13 >> 2] = $3; //@line 3950
      HEAP32[$14 >> 2] = $2; //@line 3951
      $18 = $1 + 40 | 0; //@line 3952
      HEAP32[$18 >> 2] = (HEAP32[$18 >> 2] | 0) + 1; //@line 3955
      if ((HEAP32[$1 + 36 >> 2] | 0) == 1) {
       if ((HEAP32[$1 + 24 >> 2] | 0) == 2) {
        HEAP8[$1 + 54 >> 0] = 1; //@line 3965
       }
      }
      HEAP32[$1 + 44 >> 2] = 4; //@line 3969
      break;
     }
    }
    if (($3 | 0) == 1) {
     HEAP32[$13 >> 2] = 1; //@line 3975
    }
   }
  }
 } while (0);
 return;
}
function ___overflow($0, $1) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 var $$0 = 0, $10 = 0, $12 = 0, $13 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP; //@line 3704
 STACKTOP = STACKTOP + 16 | 0; //@line 3705
 $2 = sp; //@line 3706
 $3 = $1 & 255; //@line 3707
 HEAP8[$2 >> 0] = $3; //@line 3708
 $4 = $0 + 16 | 0; //@line 3709
 $5 = HEAP32[$4 >> 2] | 0; //@line 3710
 if (!$5) {
  if (!(___towrite($0) | 0)) {
   $12 = HEAP32[$4 >> 2] | 0; //@line 3717
   label = 4; //@line 3718
  } else {
   $$0 = -1; //@line 3720
  }
 } else {
  $12 = $5; //@line 3723
  label = 4; //@line 3724
 }
 do {
  if ((label | 0) == 4) {
   $9 = $0 + 20 | 0; //@line 3728
   $10 = HEAP32[$9 >> 2] | 0; //@line 3729
   if ($10 >>> 0 < $12 >>> 0) {
    $13 = $1 & 255; //@line 3732
    if (($13 | 0) != (HEAP8[$0 + 75 >> 0] | 0)) {
     HEAP32[$9 >> 2] = $10 + 1; //@line 3739
     HEAP8[$10 >> 0] = $3; //@line 3740
     $$0 = $13; //@line 3741
     break;
    }
   }
   if ((FUNCTION_TABLE_iiii[HEAP32[$0 + 36 >> 2] & 7]($0, $2, 1) | 0) == 1) {
    $$0 = HEAPU8[$2 >> 0] | 0; //@line 3752
   } else {
    $$0 = -1; //@line 3754
   }
  }
 } while (0);
 STACKTOP = sp; //@line 3758
 return $$0 | 0; //@line 3758
}
function __ZNK10__cxxabiv121__vmi_class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi($0, $1, $2, $3) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 $2 = $2 | 0;
 $3 = $3 | 0;
 var $$0 = 0, $10 = 0, $13 = 0, $9 = 0;
 L1 : do {
  if (__ZN10__cxxabiv18is_equalEPKSt9type_infoS2_b($0, HEAP32[$1 + 8 >> 2] | 0, 0) | 0) {
   __ZNK10__cxxabiv117__class_type_info24process_found_base_classEPNS_19__dynamic_cast_infoEPvi(0, $1, $2, $3); //@line 4761
  } else {
   $9 = HEAP32[$0 + 12 >> 2] | 0; //@line 4765
   $10 = $0 + 16 + ($9 << 3) | 0; //@line 4766
   __ZNK10__cxxabiv122__base_class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi($0 + 16 | 0, $1, $2, $3); //@line 4767
   if (($9 | 0) > 1) {
    $13 = $1 + 54 | 0; //@line 4771
    $$0 = $0 + 24 | 0; //@line 4772
    do {
     __ZNK10__cxxabiv122__base_class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi($$0, $1, $2, $3); //@line 4774
     if (HEAP8[$13 >> 0] | 0) {
      break L1;
     }
     $$0 = $$0 + 8 | 0; //@line 4780
    } while ($$0 >>> 0 < $10 >>> 0);
   }
  }
 } while (0);
 return;
}
function ___stdio_seek($0, $1, $2) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 $2 = $2 | 0;
 var $10 = 0, $3 = 0, $vararg_buffer = 0, sp = 0;
 sp = STACKTOP; //@line 3338
 STACKTOP = STACKTOP + 32 | 0; //@line 3339
 $vararg_buffer = sp; //@line 3340
 $3 = sp + 20 | 0; //@line 3341
 HEAP32[$vararg_buffer >> 2] = HEAP32[$0 + 60 >> 2]; //@line 3345
 HEAP32[$vararg_buffer + 4 >> 2] = 0; //@line 3347
 HEAP32[$vararg_buffer + 8 >> 2] = $1; //@line 3349
 HEAP32[$vararg_buffer + 12 >> 2] = $3; //@line 3351
 HEAP32[$vararg_buffer + 16 >> 2] = $2; //@line 3353
 if ((___syscall_ret(___syscall140(140, $vararg_buffer | 0) | 0) | 0) < 0) {
  HEAP32[$3 >> 2] = -1; //@line 3358
  $10 = -1; //@line 3359
 } else {
  $10 = HEAP32[$3 >> 2] | 0; //@line 3362
 }
 STACKTOP = sp; //@line 3364
 return $10 | 0; //@line 3364
}
function _puts($0) {
 $0 = $0 | 0;
 var $1 = 0, $11 = 0, $12 = 0, $19 = 0, $21 = 0;
 $1 = HEAP32[157] | 0; //@line 3781
 if ((HEAP32[$1 + 76 >> 2] | 0) > -1) {
  $21 = ___lockfile($1) | 0; //@line 3787
 } else {
  $21 = 0; //@line 3789
 }
 do {
  if ((_fputs($0, $1) | 0) < 0) {
   $19 = 1; //@line 3795
  } else {
   if ((HEAP8[$1 + 75 >> 0] | 0) != 10) {
    $11 = $1 + 20 | 0; //@line 3801
    $12 = HEAP32[$11 >> 2] | 0; //@line 3802
    if ($12 >>> 0 < (HEAP32[$1 + 16 >> 2] | 0) >>> 0) {
     HEAP32[$11 >> 2] = $12 + 1; //@line 3808
     HEAP8[$12 >> 0] = 10; //@line 3809
     $19 = 0; //@line 3810
     break;
    }
   }
   $19 = (___overflow($1, 10) | 0) < 0; //@line 3816
  }
 } while (0);
 if ($21 | 0) {
  ___unlockfile($1); //@line 3822
 }
 return $19 << 31 >> 31 | 0; //@line 3824
}
function __ZNK10__cxxabiv117__class_type_info24process_found_base_classEPNS_19__dynamic_cast_infoEPvi($0, $1, $2, $3) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 $2 = $2 | 0;
 $3 = $3 | 0;
 var $4 = 0, $5 = 0, $7 = 0, $8 = 0;
 $4 = $1 + 16 | 0; //@line 4013
 $5 = HEAP32[$4 >> 2] | 0; //@line 4014
 $7 = $1 + 36 | 0; //@line 4016
 $8 = $1 + 24 | 0; //@line 4017
 do {
  if (!$5) {
   HEAP32[$4 >> 2] = $2; //@line 4020
   HEAP32[$8 >> 2] = $3; //@line 4021
   HEAP32[$7 >> 2] = 1; //@line 4022
  } else {
   if (($5 | 0) != ($2 | 0)) {
    HEAP32[$7 >> 2] = (HEAP32[$7 >> 2] | 0) + 1; //@line 4028
    HEAP32[$8 >> 2] = 2; //@line 4029
    HEAP8[$1 + 54 >> 0] = 1; //@line 4031
    break;
   }
   if ((HEAP32[$8 >> 2] | 0) == 2) {
    HEAP32[$8 >> 2] = $3; //@line 4037
   }
  }
 } while (0);
 return;
}
function _sbrk(increment) {
 increment = increment | 0;
 var oldDynamicTop = 0, newDynamicTop = 0;
 increment = increment + 15 & -16 | 0; //@line 5016
 oldDynamicTop = HEAP32[DYNAMICTOP_PTR >> 2] | 0; //@line 5017
 newDynamicTop = oldDynamicTop + increment | 0; //@line 5018
 if ((increment | 0) > 0 & (newDynamicTop | 0) < (oldDynamicTop | 0) | (newDynamicTop | 0) < 0) {
  abortOnCannotGrowMemory() | 0; //@line 5022
  ___setErrNo(12); //@line 5023
  return -1;
 }
 HEAP32[DYNAMICTOP_PTR >> 2] = newDynamicTop; //@line 5027
 if ((newDynamicTop | 0) > (getTotalMemory() | 0)) {
  if (!(enlargeMemory() | 0)) {
   HEAP32[DYNAMICTOP_PTR >> 2] = oldDynamicTop; //@line 5031
   ___setErrNo(12); //@line 5032
   return -1;
  }
 }
 return oldDynamicTop | 0; //@line 5036
}
function _fwrite($0, $1, $2, $3) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 $2 = $2 | 0;
 $3 = $3 | 0;
 var $$ = 0, $11 = 0, $13 = 0, $15 = 0, $4 = 0, $phitmp = 0;
 $4 = Math_imul($2, $1) | 0; //@line 3670
 $$ = ($1 | 0) == 0 ? 0 : $2; //@line 3672
 if ((HEAP32[$3 + 76 >> 2] | 0) > -1) {
  $phitmp = (___lockfile($3) | 0) == 0; //@line 3678
  $11 = ___fwritex($0, $4, $3) | 0; //@line 3679
  if ($phitmp) {
   $13 = $11; //@line 3681
  } else {
   ___unlockfile($3); //@line 3683
   $13 = $11; //@line 3684
  }
 } else {
  $13 = ___fwritex($0, $4, $3) | 0; //@line 3688
 }
 if (($13 | 0) == ($4 | 0)) {
  $15 = $$; //@line 3692
 } else {
  $15 = ($13 >>> 0) / ($1 >>> 0) | 0; //@line 3695
 }
 return $15 | 0; //@line 3697
}
function ___stdout_write($0, $1, $2) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 $2 = $2 | 0;
 var $14 = 0, $vararg_buffer = 0, sp = 0;
 sp = STACKTOP; //@line 3410
 STACKTOP = STACKTOP + 32 | 0; //@line 3411
 $vararg_buffer = sp; //@line 3412
 HEAP32[$0 + 36 >> 2] = 5; //@line 3415
 if (!(HEAP32[$0 >> 2] & 64)) {
  HEAP32[$vararg_buffer >> 2] = HEAP32[$0 + 60 >> 2]; //@line 3423
  HEAP32[$vararg_buffer + 4 >> 2] = 21523; //@line 3425
  HEAP32[$vararg_buffer + 8 >> 2] = sp + 16; //@line 3427
  if (___syscall54(54, $vararg_buffer | 0) | 0) {
   HEAP8[$0 + 75 >> 0] = -1; //@line 3432
  }
 }
 $14 = ___stdio_write($0, $1, $2) | 0; //@line 3435
 STACKTOP = sp; //@line 3436
 return $14 | 0; //@line 3436
}
function ___towrite($0) {
 $0 = $0 | 0;
 var $$0 = 0, $1 = 0, $14 = 0, $3 = 0, $7 = 0;
 $1 = $0 + 74 | 0; //@line 3543
 $3 = HEAP8[$1 >> 0] | 0; //@line 3545
 HEAP8[$1 >> 0] = $3 + 255 | $3; //@line 3549
 $7 = HEAP32[$0 >> 2] | 0; //@line 3550
 if (!($7 & 8)) {
  HEAP32[$0 + 8 >> 2] = 0; //@line 3555
  HEAP32[$0 + 4 >> 2] = 0; //@line 3557
  $14 = HEAP32[$0 + 44 >> 2] | 0; //@line 3559
  HEAP32[$0 + 28 >> 2] = $14; //@line 3561
  HEAP32[$0 + 20 >> 2] = $14; //@line 3563
  HEAP32[$0 + 16 >> 2] = $14 + (HEAP32[$0 + 48 >> 2] | 0); //@line 3568
  $$0 = 0; //@line 3569
 } else {
  HEAP32[$0 >> 2] = $7 | 32; //@line 3572
  $$0 = -1; //@line 3573
 }
 return $$0 | 0; //@line 3575
}
function __ZNK10__cxxabiv122__base_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib($0, $1, $2, $3, $4, $5) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 $2 = $2 | 0;
 $3 = $3 | 0;
 $4 = $4 | 0;
 $5 = $5 | 0;
 var $$0 = 0, $14 = 0, $7 = 0, $8 = 0;
 $7 = HEAP32[$0 + 4 >> 2] | 0; //@line 4834
 $8 = $7 >> 8; //@line 4835
 if (!($7 & 1)) {
  $$0 = $8; //@line 4839
 } else {
  $$0 = HEAP32[(HEAP32[$3 >> 2] | 0) + $8 >> 2] | 0; //@line 4844
 }
 $14 = HEAP32[$0 >> 2] | 0; //@line 4846
 FUNCTION_TABLE_viiiiii[HEAP32[(HEAP32[$14 >> 2] | 0) + 20 >> 2] & 3]($14, $1, $2, $3 + $$0 | 0, $7 & 2 | 0 ? $4 : 2, $5); //@line 4854
 return;
}
function __ZNK10__cxxabiv120__si_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib($0, $1, $2, $3, $4, $5) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 $2 = $2 | 0;
 $3 = $3 | 0;
 $4 = $4 | 0;
 $5 = $5 | 0;
 var $10 = 0;
 if (__ZN10__cxxabiv18is_equalEPKSt9type_infoS2_b($0, HEAP32[$1 + 8 >> 2] | 0, $5) | 0) {
  __ZNK10__cxxabiv117__class_type_info29process_static_type_above_dstEPNS_19__dynamic_cast_infoEPKvS4_i(0, $1, $2, $3, $4); //@line 4247
 } else {
  $10 = HEAP32[$0 + 8 >> 2] | 0; //@line 4250
  FUNCTION_TABLE_viiiiii[HEAP32[(HEAP32[$10 >> 2] | 0) + 20 >> 2] & 3]($10, $1, $2, $3, $4, $5); //@line 4254
 }
 return;
}
function __ZNK10__cxxabiv122__base_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib($0, $1, $2, $3, $4) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 $2 = $2 | 0;
 $3 = $3 | 0;
 $4 = $4 | 0;
 var $$0 = 0, $13 = 0, $6 = 0, $7 = 0;
 $6 = HEAP32[$0 + 4 >> 2] | 0; //@line 4866
 $7 = $6 >> 8; //@line 4867
 if (!($6 & 1)) {
  $$0 = $7; //@line 4871
 } else {
  $$0 = HEAP32[(HEAP32[$2 >> 2] | 0) + $7 >> 2] | 0; //@line 4876
 }
 $13 = HEAP32[$0 >> 2] | 0; //@line 4878
 FUNCTION_TABLE_viiiii[HEAP32[(HEAP32[$13 >> 2] | 0) + 24 >> 2] & 3]($13, $1, $2 + $$0 | 0, $6 & 2 | 0 ? $3 : 2, $4); //@line 4886
 return;
}
function __ZNK10__cxxabiv122__base_class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi($0, $1, $2, $3) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 $2 = $2 | 0;
 $3 = $3 | 0;
 var $$0 = 0, $12 = 0, $5 = 0, $6 = 0;
 $5 = HEAP32[$0 + 4 >> 2] | 0; //@line 4801
 $6 = $5 >> 8; //@line 4802
 if (!($5 & 1)) {
  $$0 = $6; //@line 4806
 } else {
  $$0 = HEAP32[(HEAP32[$2 >> 2] | 0) + $6 >> 2] | 0; //@line 4811
 }
 $12 = HEAP32[$0 >> 2] | 0; //@line 4813
 FUNCTION_TABLE_viiii[HEAP32[(HEAP32[$12 >> 2] | 0) + 28 >> 2] & 3]($12, $1, $2 + $$0 | 0, $5 & 2 | 0 ? $3 : 2); //@line 4821
 return;
}
function __ZNK10__cxxabiv120__si_class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi($0, $1, $2, $3) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 $2 = $2 | 0;
 $3 = $3 | 0;
 var $8 = 0;
 if (__ZN10__cxxabiv18is_equalEPKSt9type_infoS2_b($0, HEAP32[$1 + 8 >> 2] | 0, 0) | 0) {
  __ZNK10__cxxabiv117__class_type_info24process_found_base_classEPNS_19__dynamic_cast_infoEPvi(0, $1, $2, $3); //@line 4373
 } else {
  $8 = HEAP32[$0 + 8 >> 2] | 0; //@line 4376
  FUNCTION_TABLE_viiii[HEAP32[(HEAP32[$8 >> 2] | 0) + 28 >> 2] & 3]($8, $1, $2, $3); //@line 4380
 }
 return;
}
function __ZNK10__cxxabiv117__class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib($0, $1, $2, $3, $4, $5) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 $2 = $2 | 0;
 $3 = $3 | 0;
 $4 = $4 | 0;
 $5 = $5 | 0;
 if (__ZN10__cxxabiv18is_equalEPKSt9type_infoS2_b($0, HEAP32[$1 + 8 >> 2] | 0, $5) | 0) {
  __ZNK10__cxxabiv117__class_type_info29process_static_type_above_dstEPNS_19__dynamic_cast_infoEPKvS4_i(0, $1, $2, $3, $4); //@line 3918
 }
 return;
}
function ___stdio_close($0) {
 $0 = $0 | 0;
 var $5 = 0, $vararg_buffer = 0, sp = 0;
 sp = STACKTOP; //@line 3209
 STACKTOP = STACKTOP + 16 | 0; //@line 3210
 $vararg_buffer = sp; //@line 3211
 HEAP32[$vararg_buffer >> 2] = _dummy_738(HEAP32[$0 + 60 >> 2] | 0) | 0; //@line 3215
 $5 = ___syscall_ret(___syscall6(6, $vararg_buffer | 0) | 0) | 0; //@line 3217
 STACKTOP = sp; //@line 3218
 return $5 | 0; //@line 3218
}
function __ZNK10__cxxabiv117__class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi($0, $1, $2, $3) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 $2 = $2 | 0;
 $3 = $3 | 0;
 if (__ZN10__cxxabiv18is_equalEPKSt9type_infoS2_b($0, HEAP32[$1 + 8 >> 2] | 0, 0) | 0) {
  __ZNK10__cxxabiv117__class_type_info24process_found_base_classEPNS_19__dynamic_cast_infoEPvi(0, $1, $2, $3); //@line 3993
 }
 return;
}
function __ZNK10__cxxabiv117__class_type_info29process_static_type_below_dstEPNS_19__dynamic_cast_infoEPKvi($0, $1, $2, $3) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 $2 = $2 | 0;
 $3 = $3 | 0;
 var $7 = 0;
 if ((HEAP32[$1 + 4 >> 2] | 0) == ($2 | 0)) {
  $7 = $1 + 28 | 0; //@line 4054
  if ((HEAP32[$7 >> 2] | 0) != 1) {
   HEAP32[$7 >> 2] = $3; //@line 4058
  }
 }
 return;
}
function ___strdup($0) {
 $0 = $0 | 0;
 var $$0 = 0, $2 = 0, $3 = 0;
 $2 = (_strlen($0) | 0) + 1 | 0; //@line 3765
 $3 = _malloc($2) | 0; //@line 3766
 if (!$3) {
  $$0 = 0; //@line 3769
 } else {
  _memcpy($3 | 0, $0 | 0, $2 | 0) | 0; //@line 3771
  $$0 = $3; //@line 3772
 }
 return $$0 | 0; //@line 3774
}
function dynCall_viiiiii(index, a1, a2, a3, a4, a5, a6) {
 index = index | 0;
 a1 = a1 | 0;
 a2 = a2 | 0;
 a3 = a3 | 0;
 a4 = a4 | 0;
 a5 = a5 | 0;
 a6 = a6 | 0;
 FUNCTION_TABLE_viiiiii[index & 3](a1 | 0, a2 | 0, a3 | 0, a4 | 0, a5 | 0, a6 | 0); //@line 5071
}
function ___syscall_ret($0) {
 $0 = $0 | 0;
 var $$0 = 0;
 if ($0 >>> 0 > 4294963200) {
  HEAP32[(___errno_location() | 0) >> 2] = 0 - $0; //@line 3374
  $$0 = -1; //@line 3375
 } else {
  $$0 = $0; //@line 3377
 }
 return $$0 | 0; //@line 3379
}
function dynCall_viiiii(index, a1, a2, a3, a4, a5) {
 index = index | 0;
 a1 = a1 | 0;
 a2 = a2 | 0;
 a3 = a3 | 0;
 a4 = a4 | 0;
 a5 = a5 | 0;
 FUNCTION_TABLE_viiiii[index & 3](a1 | 0, a2 | 0, a3 | 0, a4 | 0, a5 | 0); //@line 5050
}
function __ZNK10__cxxabiv123__fundamental_type_info9can_catchEPKNS_16__shim_type_infoERPv($0, $1, $2) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 $2 = $2 | 0;
 return __ZN10__cxxabiv18is_equalEPKSt9type_infoS2_b($0, $1, 0) | 0; //@line 4412
}
function dynCall_viiii(index, a1, a2, a3, a4) {
 index = index | 0;
 a1 = a1 | 0;
 a2 = a2 | 0;
 a3 = a3 | 0;
 a4 = a4 | 0;
 FUNCTION_TABLE_viiii[index & 3](a1 | 0, a2 | 0, a3 | 0, a4 | 0); //@line 5078
}
function stackAlloc(size) {
 size = size | 0;
 var ret = 0;
 ret = STACKTOP; //@line 4
 STACKTOP = STACKTOP + size | 0; //@line 5
 STACKTOP = STACKTOP + 15 & -16; //@line 6
 return ret | 0; //@line 8
}
function dynCall_iiii(index, a1, a2, a3) {
 index = index | 0;
 a1 = a1 | 0;
 a2 = a2 | 0;
 a3 = a3 | 0;
 return FUNCTION_TABLE_iiii[index & 7](a1 | 0, a2 | 0, a3 | 0) | 0; //@line 5043
}
function _fputs($0, $1) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 var $2 = 0;
 $2 = _strlen($0) | 0; //@line 3657
 return ((_fwrite($0, 1, $2, $1) | 0) != ($2 | 0)) << 31 >> 31 | 0; //@line 3661
}
function establishStackSpace(stackBase, stackMax) {
 stackBase = stackBase | 0;
 stackMax = stackMax | 0;
 STACKTOP = stackBase; //@line 20
 STACK_MAX = stackMax; //@line 21
}
function __ZN10__cxxabiv123__fundamental_type_infoD0Ev($0) {
 $0 = $0 | 0;
 __ZN10__cxxabiv116__shim_type_infoD2Ev($0); //@line 4401
 __ZdlPv($0); //@line 4402
 return;
}
function __ZN10__cxxabiv121__vmi_class_type_infoD0Ev($0) {
 $0 = $0 | 0;
 __ZN10__cxxabiv116__shim_type_infoD2Ev($0); //@line 4418
 __ZdlPv($0); //@line 4419
 return;
}
function __ZN10__cxxabiv120__si_class_type_infoD0Ev($0) {
 $0 = $0 | 0;
 __ZN10__cxxabiv116__shim_type_infoD2Ev($0); //@line 4230
 __ZdlPv($0); //@line 4231
 return;
}
function __ZN10__cxxabiv117__class_type_infoD0Ev($0) {
 $0 = $0 | 0;
 __ZN10__cxxabiv116__shim_type_infoD2Ev($0); //@line 3836
 __ZdlPv($0); //@line 3837
 return;
}
function setThrew(threw, value) {
 threw = threw | 0;
 value = value | 0;
 if (!__THREW__) {
  __THREW__ = threw; //@line 28
  threwValue = value; //@line 29
 }
}
function __ZN10__cxxabiv18is_equalEPKSt9type_infoS2_b($0, $1, $2) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 $2 = $2 | 0;
 return ($0 | 0) == ($1 | 0) | 0; //@line 4004
}
function b4(p0, p1, p2, p3, p4, p5) {
 p0 = p0 | 0;
 p1 = p1 | 0;
 p2 = p2 | 0;
 p3 = p3 | 0;
 p4 = p4 | 0;
 p5 = p5 | 0;
 abort(4); //@line 5094
}
function dynCall_ii(index, a1) {
 index = index | 0;
 a1 = a1 | 0;
 return FUNCTION_TABLE_ii[index & 1](a1 | 0) | 0; //@line 5064
}
function b1(p0, p1, p2, p3, p4) {
 p0 = p0 | 0;
 p1 = p1 | 0;
 p2 = p2 | 0;
 p3 = p3 | 0;
 p4 = p4 | 0;
 abort(1); //@line 5085
}
function __GLOBAL__sub_I_bind_cpp() {
 __ZN53EmscriptenBindingInitializer_native_and_builtin_typesC2Ev(0); //@line 52
 return;
}
function dynCall_vi(index, a1) {
 index = index | 0;
 a1 = a1 | 0;
 FUNCTION_TABLE_vi[index & 7](a1 | 0); //@line 5057
}
function b0(p0, p1, p2) {
 p0 = p0 | 0;
 p1 = p1 | 0;
 p2 = p2 | 0;
 abort(0); //@line 5082
 return 0; //@line 5082
}
function b5(p0, p1, p2, p3) {
 p0 = p0 | 0;
 p1 = p1 | 0;
 p2 = p2 | 0;
 p3 = p3 | 0;
 abort(5); //@line 5097
}
function ___getTypeName($0) {
 $0 = $0 | 0;
 return ___strdup(HEAP32[$0 + 4 >> 2] | 0) | 0; //@line 103
}
function _main($0, $1) {
 $0 = $0 | 0;
 $1 = $1 | 0;
 _puts(904) | 0; //@line 46
 return 0; //@line 47
}
function ___errno_location() {
 return (___pthread_self_108() | 0) + 64 | 0; //@line 3386
}
function __ZNK10__cxxabiv116__shim_type_info5noop2Ev($0) {
 $0 = $0 | 0;
 return;
}
function __ZNK10__cxxabiv116__shim_type_info5noop1Ev($0) {
 $0 = $0 | 0;
 return;
}
function setTempRet0(value) {
 value = value | 0;
 tempRet0 = value; //@line 35
}
function b3(p0) {
 p0 = p0 | 0;
 abort(3); //@line 5091
 return 0; //@line 5091
}
function __ZN10__cxxabiv116__shim_type_infoD2Ev($0) {
 $0 = $0 | 0;
 return;
}
function ___pthread_self_108() {
 return _pthread_self() | 0; //@line 3392
}
function stackRestore(top) {
 top = top | 0;
 STACKTOP = top; //@line 15
}
function __ZdlPv($0) {
 $0 = $0 | 0;
 _free($0); //@line 4388
 return;
}
function _dummy_738($0) {
 $0 = $0 | 0;
 return $0 | 0; //@line 3403
}
function _emscripten_get_global_libc() {
 return 3056; //@line 3204
}
function ___lockfile($0) {
 $0 = $0 | 0;
 return 0; //@line 3442
}
function __ZNSt9type_infoD2Ev($0) {
 $0 = $0 | 0;
 return;
}
function getTempRet0() {
 return tempRet0 | 0; //@line 38
}
function stackSave() {
 return STACKTOP | 0; //@line 11
}
function b2(p0) {
 p0 = p0 | 0;
 abort(2); //@line 5088
}
function _pthread_self() {
 return 384; //@line 3397
}
function ___unlockfile($0) {
 $0 = $0 | 0;
 return;
}

// EMSCRIPTEN_END_FUNCS
var FUNCTION_TABLE_iiii = [b0,___stdout_write,___stdio_seek,__ZNK10__cxxabiv117__class_type_info9can_catchEPKNS_16__shim_type_infoERPv,__ZNK10__cxxabiv123__fundamental_type_info9can_catchEPKNS_16__shim_type_infoERPv,___stdio_write,b0,b0];
var FUNCTION_TABLE_viiiii = [b1,__ZNK10__cxxabiv117__class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib,__ZNK10__cxxabiv120__si_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib,__ZNK10__cxxabiv121__vmi_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib];
var FUNCTION_TABLE_vi = [b2,__ZN10__cxxabiv116__shim_type_infoD2Ev,__ZN10__cxxabiv117__class_type_infoD0Ev,__ZNK10__cxxabiv116__shim_type_info5noop1Ev,__ZNK10__cxxabiv116__shim_type_info5noop2Ev,__ZN10__cxxabiv120__si_class_type_infoD0Ev,__ZN10__cxxabiv123__fundamental_type_infoD0Ev,__ZN10__cxxabiv121__vmi_class_type_infoD0Ev];
var FUNCTION_TABLE_ii = [b3,___stdio_close];
var FUNCTION_TABLE_viiiiii = [b4,__ZNK10__cxxabiv117__class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib,__ZNK10__cxxabiv120__si_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib,__ZNK10__cxxabiv121__vmi_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib];
var FUNCTION_TABLE_viiii = [b5,__ZNK10__cxxabiv117__class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi,__ZNK10__cxxabiv120__si_class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi,__ZNK10__cxxabiv121__vmi_class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi];

  return { _main: _main, stackSave: stackSave, setThrew: setThrew, _memset: _memset, _sbrk: _sbrk, _memcpy: _memcpy, dynCall_vi: dynCall_vi, stackAlloc: stackAlloc, getTempRet0: getTempRet0, __GLOBAL__sub_I_bind_cpp: __GLOBAL__sub_I_bind_cpp, setTempRet0: setTempRet0, dynCall_iiii: dynCall_iiii, _emscripten_get_global_libc: _emscripten_get_global_libc, ___getTypeName: ___getTypeName, dynCall_ii: dynCall_ii, dynCall_viiii: dynCall_viiii, ___errno_location: ___errno_location, runPostSets: runPostSets, _free: _free, dynCall_viiiii: dynCall_viiiii, dynCall_viiiiii: dynCall_viiiiii, establishStackSpace: establishStackSpace, stackRestore: stackRestore, _malloc: _malloc };
})
// EMSCRIPTEN_END_ASM
(Module.asmGlobalArg, Module.asmLibraryArg, buffer);

var _malloc = Module["_malloc"] = asm["_malloc"];
var getTempRet0 = Module["getTempRet0"] = asm["getTempRet0"];
var __GLOBAL__sub_I_bind_cpp = Module["__GLOBAL__sub_I_bind_cpp"] = asm["__GLOBAL__sub_I_bind_cpp"];
var _free = Module["_free"] = asm["_free"];
var _main = Module["_main"] = asm["_main"];
var setTempRet0 = Module["setTempRet0"] = asm["setTempRet0"];
var establishStackSpace = Module["establishStackSpace"] = asm["establishStackSpace"];
var stackSave = Module["stackSave"] = asm["stackSave"];
var _memset = Module["_memset"] = asm["_memset"];
var _sbrk = Module["_sbrk"] = asm["_sbrk"];
var _emscripten_get_global_libc = Module["_emscripten_get_global_libc"] = asm["_emscripten_get_global_libc"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var ___getTypeName = Module["___getTypeName"] = asm["___getTypeName"];
var stackAlloc = Module["stackAlloc"] = asm["stackAlloc"];
var setThrew = Module["setThrew"] = asm["setThrew"];
var stackRestore = Module["stackRestore"] = asm["stackRestore"];
var ___errno_location = Module["___errno_location"] = asm["___errno_location"];
var runPostSets = Module["runPostSets"] = asm["runPostSets"];
var dynCall_iiii = Module["dynCall_iiii"] = asm["dynCall_iiii"];
var dynCall_viiiii = Module["dynCall_viiiii"] = asm["dynCall_viiiii"];
var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"];
var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];
var dynCall_viiiiii = Module["dynCall_viiiiii"] = asm["dynCall_viiiiii"];
var dynCall_viiii = Module["dynCall_viiii"] = asm["dynCall_viiii"];
;
Runtime.stackAlloc = Module['stackAlloc'];
Runtime.stackSave = Module['stackSave'];
Runtime.stackRestore = Module['stackRestore'];
Runtime.establishStackSpace = Module['establishStackSpace'];
Runtime.setTempRet0 = Module['setTempRet0'];
Runtime.getTempRet0 = Module['getTempRet0'];


// === Auto-generated postamble setup entry stuff ===

Module['asm'] = asm;



if (memoryInitializer) {
  if (typeof Module['locateFile'] === 'function') {
    memoryInitializer = Module['locateFile'](memoryInitializer);
  } else if (Module['memoryInitializerPrefixURL']) {
    memoryInitializer = Module['memoryInitializerPrefixURL'] + memoryInitializer;
  }
  if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
    var data = Module['readBinary'](memoryInitializer);
    HEAPU8.set(data, Runtime.GLOBAL_BASE);
  } else {
    addRunDependency('memory initializer');
    var applyMemoryInitializer = function(data) {
      if (data.byteLength) data = new Uint8Array(data);
      HEAPU8.set(data, Runtime.GLOBAL_BASE);
      // Delete the typed array that contains the large blob of the memory initializer request response so that
      // we won't keep unnecessary memory lying around. However, keep the XHR object itself alive so that e.g.
      // its .status field can still be accessed later.
      if (Module['memoryInitializerRequest']) delete Module['memoryInitializerRequest'].response;
      removeRunDependency('memory initializer');
    }
    function doBrowserLoad() {
      Module['readAsync'](memoryInitializer, applyMemoryInitializer, function() {
        throw 'could not load memory initializer ' + memoryInitializer;
      });
    }
    if (Module['memoryInitializerRequest']) {
      // a network request has already been created, just use that
      function useRequest() {
        var request = Module['memoryInitializerRequest'];
        if (request.status !== 200 && request.status !== 0) {
          // If you see this warning, the issue may be that you are using locateFile or memoryInitializerPrefixURL, and defining them in JS. That
          // means that the HTML file doesn't know about them, and when it tries to create the mem init request early, does it to the wrong place.
          // Look in your browser's devtools network console to see what's going on.
          console.warn('a problem seems to have happened with Module.memoryInitializerRequest, status: ' + request.status + ', retrying ' + memoryInitializer);
          doBrowserLoad();
          return;
        }
        applyMemoryInitializer(request.response);
      }
      if (Module['memoryInitializerRequest'].response) {
        setTimeout(useRequest, 0); // it's already here; but, apply it asynchronously
      } else {
        Module['memoryInitializerRequest'].addEventListener('load', useRequest); // wait for it
      }
    } else {
      // fetch it from the network ourselves
      doBrowserLoad();
    }
  }
}



/**
 * @constructor
 * @extends {Error}
 */
function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
};
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;

var initialStackTop;
var preloadStartTime = null;
var calledMain = false;

dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!Module['calledRun']) run();
  if (!Module['calledRun']) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
}

Module['callMain'] = Module.callMain = function callMain(args) {

  args = args || [];

  ensureInitRuntime();

  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString(Module['thisProgram']), 'i8', ALLOC_NORMAL) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_NORMAL));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_NORMAL);


  try {

    var ret = Module['_main'](argc, argv, 0);


    // if we're not running an evented main loop, it's time to exit
    exit(ret, /* implicit = */ true);
  }
  catch(e) {
    if (e instanceof ExitStatus) {
      // exit() throws this once it's done to make sure execution
      // has been stopped completely
      return;
    } else if (e == 'SimulateInfiniteLoop') {
      // running an evented main loop, don't immediately exit
      Module['noExitRuntime'] = true;
      return;
    } else {
      var toLog = e;
      if (e && typeof e === 'object' && e.stack) {
        toLog = [e, e.stack];
      }
      Module.printErr('exception thrown: ' + toLog);
      Module['quit'](1, e);
    }
  } finally {
    calledMain = true;
  }
}




/** @type {function(Array=)} */
function run(args) {
  args = args || Module['arguments'];

  if (preloadStartTime === null) preloadStartTime = Date.now();

  if (runDependencies > 0) {
    return;
  }


  preRun();

  if (runDependencies > 0) return; // a preRun added a dependency, run will be called later
  if (Module['calledRun']) return; // run may have just been called through dependencies being fulfilled just in this very frame

  function doRun() {
    if (Module['calledRun']) return; // run may have just been called while the async setStatus time below was happening
    Module['calledRun'] = true;

    if (ABORT) return;

    ensureInitRuntime();

    preMain();


    if (Module['onRuntimeInitialized']) Module['onRuntimeInitialized']();

    if (Module['_main'] && shouldRunNow) Module['callMain'](args);

    postRun();
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      doRun();
    }, 1);
  } else {
    doRun();
  }
}
Module['run'] = Module.run = run;

function exit(status, implicit) {
  if (implicit && Module['noExitRuntime']) {
    return;
  }

  if (Module['noExitRuntime']) {
  } else {

    ABORT = true;
    EXITSTATUS = status;
    STACKTOP = initialStackTop;

    exitRuntime();

    if (Module['onExit']) Module['onExit'](status);
  }

  if (ENVIRONMENT_IS_NODE) {
    process['exit'](status);
  }
  Module['quit'](status, new ExitStatus(status));
}
Module['exit'] = Module.exit = exit;

var abortDecorators = [];

function abort(what) {
  if (Module['onAbort']) {
    Module['onAbort'](what);
  }

  if (what !== undefined) {
    Module.print(what);
    Module.printErr(what);
    what = JSON.stringify(what)
  } else {
    what = '';
  }

  ABORT = true;
  EXITSTATUS = 1;

  var extra = '\nIf this abort() is unexpected, build with -s ASSERTIONS=1 which can give more information.';

  var output = 'abort(' + what + ') at ' + stackTrace() + extra;
  if (abortDecorators) {
    abortDecorators.forEach(function(decorator) {
      output = decorator(output, what);
    });
  }
  throw output;
}
Module['abort'] = Module.abort = abort;

// {{PRE_RUN_ADDITIONS}}

if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}

// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}

Module["noExitRuntime"] = true;

run();

// {{POST_RUN_ADDITIONS}}





// {{MODULE_ADDITIONS}}






//# sourceMappingURL=example.html.map