import { HawkTracker } from '@hawk-tracker/core';

// 直接导入 getIPs 函数
async function getIPs(timeout?: number): Promise<string[]> {
  try {
    // 使用 WebRTC 获取公网IP
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    return new Promise((resolve, reject) => {
      const ips: string[] = [];
      const timeoutId = setTimeout(() => {
        pc.close();
        resolve(ips);
      }, timeout || 500);

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const ip = event.candidate.candidate.split(' ')[4];
          if (ip && !ips.includes(ip)) {
            ips.push(ip);
          }
        }
      };

      pc.createDataChannel('');
      pc.createOffer().then(offer => pc.setLocalDescription(offer));
    });
  } catch (error) {
    console.warn('Failed to get IP address:', error);
    return [];
  }
}

const monitorConfig = {
  dsn: 'http://localhost:3001/api/track',
  appName: 'hawk-tracker-web',
  appVersion: '1.0.0',
  debug: true,
  sampleRate: 1.0,
  timeout: 5000,
  maxQueueLength: 100,
  // 监控配置
  enableClickTracking: true,
  enableScrollTracking: true,
  enableExposureTracking: true,
  enableNetworkTracking: true,
  enableStayTimeTracking: true,
  scrollThreshold: 0.5, // 滚动阈值
  exposureThreshold: 0.5, // 曝光阈值
};

let monitorInstance: any = null;
let sessionId: string = '';
let pageStartTime: number = Date.now();
let lastActivityTime: number = Date.now();
let isTracking = false;

// 生成唯一会话ID
const generateSessionId = () => {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// 生成唯一用户ID
const generateUserId = () => {
  let userId = localStorage.getItem('hawk_user_id');
  if (!userId) {
    userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('hawk_user_id', userId);
  }
  return userId;
};

// 模拟监控实例
const createMockMonitor = () => ({
  track: (type: string, data: any) => {
    console.log('[Mock Monitor] Track:', type, data);
    // 这里可以添加实际的数据发送逻辑
    return Promise.resolve({ success: true });
  },
  config: monitorConfig,
});

// 初始化监控系统
export function initMonitor() {
  try {
    // 使用真实的 HawkTracker 替代模拟实现
    monitorInstance = new HawkTracker({
      dsn: monitorConfig.dsn,
      appName: monitorConfig.appName,
      appVersion: monitorConfig.appVersion,
      debug: monitorConfig.debug,
      sampleRate: monitorConfig.sampleRate,
    });

    // 初始化会话和用户信息
    sessionId = generateSessionId();
    const userId = generateUserId();

    // 记录页面访问 (PV)
    trackPageView();

    // 记录用户访问 (UV)
    trackUserVisit(userId);

    // 启动各种监控
    if (monitorConfig.enableClickTracking) {
      initClickTracking();
    }

    if (monitorConfig.enableScrollTracking) {
      initScrollTracking();
    }

    if (monitorConfig.enableExposureTracking) {
      initExposureTracking();
    }

    if (monitorConfig.enableNetworkTracking) {
      initNetworkTracking();
    }

    if (monitorConfig.enableStayTimeTracking) {
      initStayTimeTracking();
    }

    // 页面卸载时记录停留时间
    window.addEventListener('beforeunload', () => {
      trackPageStayTime();
    });

    isTracking = true;
    console.log('[Monitor] 用户行为监控初始化成功');
    return monitorInstance;
  } catch (error) {
    console.error('[Monitor] 用户行为监控初始化失败:', error);
    return monitorInstance;
  }
}

// 获取监控实例
export function getMonitor() {
  if (!monitorInstance) {
    monitorInstance = initMonitor();
  }
  return monitorInstance;
}

// 上报错误
export function reportError(error: Error, extra?: any) {
  const monitor = getMonitor();
  if (monitor && monitor.track) {
    monitor.track('error', {
      message: error.message,
      stack: error.stack,
      type: 'javascript-error',
      url: window.location.href,
      timestamp: Date.now(),
      ...extra,
    });
  }
}

// 上报自定义事件
export function reportCustomEvent(eventName: string, data: any) {
  const monitor = getMonitor();
  if (monitor && monitor.track) {
    monitor.track('custom', {
      event: eventName,
      ...data,
      timestamp: Date.now(),
    });
  }
}

// 上报用户行为
export function reportUserBehavior(action: string, data: any) {
  const monitor = getMonitor();
  if (monitor && monitor.track) {
    monitor.track('behavior', {
      action,
      url: window.location.href,
      timestamp: Date.now(),
      ...data,
    });
  }
}

// 上报性能数据
export function reportPerformance(metrics: any) {
  const monitor = getMonitor();
  if (monitor) {
    monitor.track('performance', {
      ...metrics,
      timestamp: Date.now(),
    });
  }
}

// 记录页面访问 (PV)
function trackPageView() {
  const monitor = getMonitor();
  if (monitor) {
    monitor.track('pageview', {
      url: window.location.href,
      title: document.title,
      referrer: document.referrer,
      sessionId,
      userId: generateUserId(),
      timestamp: Date.now(),
    });
  }
}

// 记录用户访问 (UV) - 每次进入都算新访问
function trackUserVisit(userId: string) {
  const monitor = getMonitor();
  if (monitor) {
    // 获取用户IP地址
    getIPs().then((ips: string[]) => {
      const userIP = Array.isArray(ips) && ips.length > 0 ? ips[0] : '';

      // 每次调用都记录一次新的访问，UV +1
      monitor.track('uservisit', {
        userId,
        userIP,
        sessionId,
        url: window.location.href,
        timestamp: Date.now(),
        visitType: 'new_visit', // 标记为新访问
        visitCount: 1, // 每次访问计数为1
      });
    }).catch(() => {
      // 如果获取IP失败，仍然记录访问，但不包含IP
      monitor.track('uservisit', {
        userId,
        userIP: 'unknown',
        sessionId,
        url: window.location.href,
        timestamp: Date.now(),
        visitType: 'new_visit',
        visitCount: 1, // 每次访问计数为1
      });
    });
  }
}

// 记录页面停留时间
function trackPageStayTime() {
  const stayTime = Date.now() - pageStartTime;
  const monitor = getMonitor();
  if (monitor) {
    monitor.track('pagestay', {
      url: window.location.href,
      stayTime,
      sessionId,
      userId: generateUserId(),
      timestamp: Date.now(),
    });
  }
}

// 初始化点击监控
function initClickTracking() {
  const monitor = getMonitor();
  if (!monitor || !monitor.track) return;

  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    if (target) {
      monitor.track('click', {
        element: target.tagName.toLowerCase(),
        text: target.textContent?.substring(0, 100) || '',
        className: target.className,
        id: target.id,
        url: window.location.href,
        sessionId,
        timestamp: Date.now(),
      });
    }
  });
}

// 初始化滚动监控
function initScrollTracking() {
  const monitor = getMonitor();
  if (!monitor || !monitor.track) return;

  let hasReportedScroll = false;
  let scrollTimeout: number;
  document.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = window.setTimeout(() => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      const scrollPercentage = scrollTop / (scrollHeight - clientHeight);
      const isAboveThreshold = scrollPercentage >= monitorConfig.scrollThreshold;

      if (isAboveThreshold && !hasReportedScroll) {
        hasReportedScroll = true;
        monitor.track('scroll', {
          scrollTop,
          scrollPercentage,
          scrollHeight,
          clientHeight,
          url: window.location.href,
          event: 'scroll',
          timestamp: Date.now(),
        });
      } else if (!isAboveThreshold && hasReportedScroll) {
        hasReportedScroll = false;
      }
    }, 150);
  });
}

// 初始化曝光监控
const exposureElements = new Map<HTMLElement, { startTime: number, exposeStartTime: number }>();

function initExposureTracking() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const target = entry.target as HTMLElement;
      const elementData = exposureElements.get(target);
      if (!elementData) {
        exposureElements.set(target, {
          startTime: Date.now(),
          exposeStartTime: entry.isIntersecting ? Date.now() : 0
        });
        return
      }

      if (entry.isIntersecting && entry.intersectionRatio >= monitorConfig.exposureThreshold) {
        //开始暴露时间
        if (!elementData.exposeStartTime) {
          elementData.exposeStartTime = Date.now();
        }
        const monitor = getMonitor();
        if (monitor) {
          monitor.track('exposure', {
            element: target.tagName.toLowerCase(),
            text: target.textContent?.substring(0, 100) || '',
            className: target.className,
            id: target.id,
            intersectionRatio: entry.intersectionRatio,
            url: window.location.href,
            event: 'exposure',
            threshold: monitorConfig.exposureThreshold,
            startListenTime: elementData.startTime,
            startExposeTime: elementData.exposeStartTime,
            eventSendTime: Date.now(),
            timestamp: Date.now(),
          });
        }
      } else if (elementData.exposeStartTime) {
        //结束暴露时间
        const endExposeTime = Date.now();
      }
    });
  }, {
    threshold: monitorConfig.exposureThreshold,
  });

  // 监控所有可观察的元素
  document.addEventListener('DOMContentLoaded', () => {
    const elements = document.querySelectorAll('img, video, [data-exposure]');
    elements.forEach(element => observer.observe(element));
  });
}

// 初始化网络请求监控
function initNetworkTracking() {
  // 监控 fetch 请求
  const originalFetch = window.fetch;
  window.fetch = function (...args) {
    const startTime = Date.now();
    let url = '';

    if (typeof args[0] === 'string') {
      url = args[0];
    } else if (args[0] instanceof Request) {
      url = args[0].url;
    } else if (args[0] instanceof URL) {
      url = args[0].href;
    }

    return originalFetch.apply(this, args).then(response => {
      const duration = Date.now() - startTime;
      const monitor = getMonitor();
      if (monitor) {
        monitor.track('network', {
          type: 'fetch',
          url,
          method: 'GET',
          status: response.status,
          duration,
          sessionId,
          timestamp: Date.now(),
        });
      }
      return response;
    }).catch(error => {
      const duration = Date.now() - startTime;
      const monitor = getMonitor();
      if (monitor) {
        monitor.track('network', {
          type: 'fetch',
          url,
          method: 'GET',
          error: error.message,
          duration,
          sessionId,
          timestamp: Date.now(),
        });
      }
      throw error;
    });
  };

  // 监控 XMLHttpRequest
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;

  // 扩展 XMLHttpRequest 类型
  interface ExtendedXMLHttpRequest extends XMLHttpRequest {
    _monitorData?: {
      method: string;
      url: string;
      startTime: number;
    };
  }

  XMLHttpRequest.prototype.open = function (method: string, url: string | URL, async: boolean = true, username?: string | null, password?: string | null) {
    (this as ExtendedXMLHttpRequest)._monitorData = {
      method,
      url: typeof url === 'string' ? url : url.href,
      startTime: Date.now()
    };
    return originalXHROpen.call(this, method, url, async, username, password);
  };

  XMLHttpRequest.prototype.send = function (body?: Document | XMLHttpRequestBodyInit | null) {
    const xhr = this as ExtendedXMLHttpRequest;
    const originalOnReadyStateChange = xhr.onreadystatechange;

    xhr.onreadystatechange = function (event: Event) {
      if (xhr.readyState === 4) {
        const duration = Date.now() - (xhr._monitorData?.startTime || Date.now());
        const monitor = getMonitor();
        if (monitor && xhr._monitorData) {
          monitor.track('network', {
            type: 'xhr',
            url: xhr._monitorData.url,
            method: xhr._monitorData.method,
            status: xhr.status,
            duration,
            sessionId,
            timestamp: Date.now(),
          });
        }
      }

      if (originalOnReadyStateChange) {
        originalOnReadyStateChange.call(xhr, event);
      }
    };

    return originalXHRSend.call(this, body);
  };
}

// 初始化停留时间监控
function initStayTimeTracking() {
  // 定期记录用户活动
  setInterval(() => {
    const currentTime = Date.now();
    const timeSinceLastActivity = currentTime - lastActivityTime;

    // 如果超过5分钟没有活动，记录为非活跃状态
    if (timeSinceLastActivity > 5 * 60 * 1000) {
      const monitor = getMonitor();
      if (monitor) {
        monitor.track('inactivity', {
          duration: timeSinceLastActivity,
          url: window.location.href,
          sessionId,
          timestamp: currentTime,
        });
      }
    }

    lastActivityTime = currentTime;
  }, 60000); // 每分钟检查一次

  // 监听用户活动
  const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
  activityEvents.forEach(eventType => {
    document.addEventListener(eventType, () => {
      lastActivityTime = Date.now();
    });
  });
}

// 手动触发曝光监控
export function trackExposure(element: HTMLElement, data?: any) {
  const monitor = getMonitor();
  if (monitor) {
    monitor.track('exposure', {
      element: element.tagName.toLowerCase(),
      text: element.textContent?.substring(0, 100) || '',
      className: element.className,
      id: element.id,
      intersectionRatio: 1.0,
      url: window.location.href,
      sessionId,
      timestamp: Date.now(),
      ...data,
    });
  }
}

// 手动触发滚动监控
export function trackScroll(scrollPercentage: number, data?: any) {
  const monitor = getMonitor();
  if (monitor) {
    monitor.track('scroll', {
      scrollTop: window.pageYOffset || document.documentElement.scrollTop,
      scrollPercentage,
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: document.documentElement.clientHeight,
      url: window.location.href,
      sessionId,
      timestamp: Date.now(),
      ...data,
    });
  }
}

// 手动触发点击监控
export function trackClick(element: HTMLElement, data?: any) {
  const monitor = getMonitor();
  if (monitor) {
    monitor.track('click', {
      element: element.tagName.toLowerCase(),
      text: element.textContent?.substring(0, 100) || '',
      className: element.className,
      id: element.id,
      url: window.location.href,
      sessionId,
      timestamp: Date.now(),
      ...data,
    });
  }
}

// 获取当前会话ID
export function getSessionId() {
  return sessionId;
}

// 获取当前用户ID
export function getUserId() {
  return generateUserId();
}

// 检查监控状态
export function isMonitorActive() {
  return isTracking;
}

// 重置监控状态
export function resetMonitor() {
  sessionId = generateSessionId();
  pageStartTime = Date.now();
  lastActivityTime = Date.now();
  isTracking = false;

  // 清除所有初始化标记，允许重新初始化
  document.documentElement.removeAttribute('data-click-tracking-initialized');
  document.documentElement.removeAttribute('data-scroll-tracking-initialized');
  document.documentElement.removeAttribute('data-exposure-tracking-initialized');
  document.documentElement.removeAttribute('data-network-tracking-initialized');
  document.documentElement.removeAttribute('data-staytime-tracking-initialized');

  console.log('[Monitor] 监控状态已重置');
}

// 手动记录新的用户访问 (UV +1)
export function trackNewVisit() {
  const userId = generateUserId();
  const monitor = getMonitor();
  if (monitor) {
    // 获取用户IP地址
    getIPs().then((ips: string[]) => {
      const userIP = Array.isArray(ips) && ips.length > 0 ? ips[0] : '';

      // 每次调用都记录一次新的访问，UV +1
      monitor.track('uservisit', {
        userId,
        userIP,
        sessionId,
        url: window.location.href,
        timestamp: Date.now(),
        visitType: 'manual_visit', // 标记为手动触发的访问
        visitCount: 1, // 每次访问计数为1
        source: 'manual_trigger', // 来源：手动触发
      });
    }).catch(() => {
      // 如果获取IP失败，仍然记录访问，但不包含IP
      monitor.track('uservisit', {
        userId,
        userIP: 'unknown',
        sessionId,
        url: window.location.href,
        timestamp: Date.now(),
        visitType: 'manual_visit',
        visitCount: 1,
        source: 'manual_trigger',
      });
    });
  }
}
