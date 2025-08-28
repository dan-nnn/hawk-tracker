export enum LISTEN_TYPES {
  ERROR = 'error',
  UNHANDLEDREJECTION = 'unhandledrejection',
  CONSOLEERROR = 'consoleError',
  CLICK = 'click',
  LOAD = 'load',
  BEFOREUNLOAD = 'beforeunload',
  XHROPEN = 'xhrOpen',
  XHRSEND = 'xhrSend',
  FETCH = 'fetch',
  HASHCHANGE = 'hashchange',
  HISTORYPUSHSTATE = 'history-pushState',
  HISTORYREPLACESTATE = 'history-replaceState',
  SCROLL = 'scroll',
  POPSTATE = 'popstate',
  READYSTATECHANGE = 'readystatechange',
  ONLINE = 'online',
  OFFLINE = 'offline',
}

// 所属监控类型
export enum SEND_TYPES {
  ERROR = 'error',
  PERFORMANCE = 'performance',
  BEHAVIOR = 'behavior',
  CUSTOM = 'custom',
}

// 精确地描述具体的事件对象类型
export enum SEND_SUB_TYPES {
  ERROR = 'error',
  UNHANDLEDREJECTION = 'unhandledrejection',
  CONSOLEERROR = 'consoleError',
  FETCH = 'fetch',
  LOAD = 'load',
  XHR = 'xhr',
  // WHITE_SCREEN = 'whiteScreen',
  // JS = 'js',
  // CORS = 'cors',
  // RESOURCE = 'resource',
  // PROMISE = 'promise',
  // REACT = 'react',
  // VUE = 'vue',
  // ROUTER_CHANGE = 'routerChange',
  // PV = 'pv',
  // FCP = 'fcp',
  // FP = 'fp',
  // LCP = 'lcp',
  // FMP = 'fmp',
  // TRACKER = 'tracker'
}

// export enum EVENT_TARGET {
//   PAGE = 'page',
//   RESOURCE = 'resource',

// }
