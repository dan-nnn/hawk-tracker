import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { useMonitor } from "../hooks/useMonitor";
import {
  trackExposure,
  trackScroll,
  trackClick,
  getSessionId,
  getUserId,
  isMonitorActive,
  trackNewVisit
} from "../monitor";
import { url } from "inspector";

export function meta() {
  return [
    { title: "用户行为监控演示" },
    { name: "description", content: "用户行为监控演示页面" },
  ];
}

function DemoContent() {
  const { monitor, trackError, trackEvent, trackPageView, trackClick: oldTrackClick, trackPerformance } = useMonitor();
  const [logs, setLogs] = useState<Array<{ time: string; type: string; message: string; data: any }>>([]);
  const [sessionId, setSessionId] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(false);


  const addLog = (type: string, message: string, data: any) => {
    setLogs((prev) => [{ time: new Date().toLocaleTimeString(), type, message, data }, ...prev].slice(0, 50));
  };

  useEffect(() => {
    trackPageView("behavior-monitor");

    // 获取当前页面信息
    const currentUrl = window.location.href;
    const pageTitle = document.title;

    addLog("info", "页面加载", {
      事件类型: "pv",
      当前页面Url: currentUrl,
      页面标题: pageTitle
    });

    // 获取监控状态信息
    setSessionId(getSessionId());
    setUserId(getUserId());
    setIsActive(isMonitorActive());
  }, [trackPageView]);

  // 监控功能
  // 点击
  const handleClickTracking = () => {
    const button = document.querySelector('#click-test-button') as HTMLElement;
    if (button) {
      const eventTime = new Date().toLocaleString();
      const currentUrl = window.location.href;
      trackClick(button, {
        customData: "触发点击监控",
        eventType: "click",
        url: currentUrl,
        timestamp: eventTime
      });
      addLog(
        "click", "点击监控测试",
        {
          元素: "button",
          事件类型: "click",
          当前页面Url: currentUrl,
          事件发送时间: eventTime
        }
      );
    }
  };

  const handleUVTracking = () => {
    trackNewVisit();
    addLog(
      "uv", "UV 统计测试",
      {
        事件类型: "new_visit",
        说明: "手动触发新的用户访问，UV +1",
        当前页面Url: window.location.href,
        事件发送时间: new Date().toLocaleString()
      }
    );
  };

  const handleScrollTracking = () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;
    const scrollPercentage = scrollTop / (scrollHeight - clientHeight);

    trackScroll(scrollPercentage, {
      customData: "手动触发滚动监控",
      scrollTop,
      scrollHeight,
      clientHeight,
      url: window.location.href
    })

    addLog("scroll", "滚动监控测试", {
      事件类型: "scroll",
      当前页面Url: window.location.href,
      滚动距离顶部位置: `${scrollTop}px`,
      页面总高度: `${scrollHeight}px`,
      视口高度: `${clientHeight}px`,
      滚动百分比: `${Math.round(scrollPercentage * 100)}%`
    });
  };

  const handleExposureTracking = () => {
    const element = document.querySelector('#exposure-test-element') as HTMLElement;
    if (element) {
      const threshold = 0.5;
      const startTime = Date.now();
      const exposeTime = Date.now() - Math.random() * 5000;

      trackExposure(element, { customData: "手动触发曝光监控", threshold, startTime, exposeTime });
      addLog("exposure", "曝光监控测试", {
        事件类型: "exposure",
        当前页面Url: window.location.href,
        曝光阈值: threshold,
        开始监听时间: new Date(startTime).toLocaleString(),
        开始曝光时间: new Date(exposeTime).toLocaleString()
      });
    }
  };

  const handleNetworkFetch = async () => {
    try {
      const response = await fetch('https://jsonplaceholder.typicode.com/posts/1');
      const data = await response.json();
      addLog("network", "Fetch请求成功", {
        事件类型: "fetch",
        当前页面Url: window.location.href,
        请求Url: response.url,
        请求状态码: response.status,
        请求数据: data,
        说明: "成功获取到数据"
      });
    } catch (error: any) {
      addLog("error", "Fetch请求失败", {
        error: error.message,
        message: "请求过程中发生错误"
      });
    }
  };

  const handleNetworkFetchFail = async () => {
    try {
      const response = await fetch('https://httpstat.us/404');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      addLog("network", "Fetch请求成功", { data });
    } catch (error: any) {
      addLog("error", "Fetch请求失败", {
        事件类型: "fetch_error",
        当前页面Url: window.location.href,
        请求状态码: "404",
        错误信息: error.message,
        请求数据: `请求失败: ${error.message}`,
        说明: "Fetch请求失败"
      });
    }
  };

  const handleNetworkXHR = () => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://jsonplaceholder.typicode.com/posts/2');
    xhr.onload = function () {
      if (xhr.status === 200) {
        try {
          const responseData = JSON.parse(xhr.responseText);
          addLog("network", "XHR请求成功", {
            事件类型: "xhr",
            当前页面Url: window.location.href,
            请求Url: xhr.responseURL,
            请求状态码: xhr.status,
            请求数据: responseData,
            说明: "成功获取到数据"
          });
        } catch (e) {
          addLog("network", "XHR请求成功", {
            事件类型: "xhr",
            当前页面Url: window.location.href,
            请求Url: xhr.responseURL,
            请求状态码: xhr.status,
            请求数据: xhr.responseText,
            说明: "成功获取到数据"
          });
        }
      }
    };
    xhr.send();
  };

  const handleNetworkXHRFail = () => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://httpstat.us/500');
    xhr.onerror = function () {
      addLog("error", "XHR请求错误", {
        事件类型: "xhr_error",
        当前页面Url: window.location.href,
        请求状态码: "500",
        错误信息: "Failed to xhr",
        请求数据: "请求失败: Failed to xhr",
        说明: "XHR请求失败"
      });
    };
    xhr.send();
  };



  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">用户行为监控演示</h1>
          <Link to="/" className="text-sm text-blue-600 hover:underline">返回首页</Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 gap-6">
        {/* 监控功能 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-medium mb-4">🎯 监控功能</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              id="click-test-button"
              onClick={handleClickTracking}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
            >
              测试点击监控
            </button>
            <button onClick={handleScrollTracking} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded">
              测试滚动监控
            </button>
            <button onClick={handleExposureTracking} className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded">
              测试曝光监控
            </button>
            <button onClick={handleUVTracking} className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded">
              测试 UV 统计
            </button>
            <button onClick={handleNetworkFetch} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded">
              测试成功Fetch
            </button>
            <button onClick={handleNetworkFetchFail} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">
              测试失败Fetch
            </button>
            <button onClick={handleNetworkXHR} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded">
              测试成功XHR
            </button>
            <button onClick={handleNetworkXHRFail} className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded">
              测试失败XHR
            </button>
          </div>
        </div>

        {/* 曝光测试元素 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-medium mb-4">👁️ 曝光监控测试元素</h2>
          <div
            id="exposure-test-element"
            className="bg-gradient-to-r from-blue-400 to-purple-500 text-white p-6 rounded-lg text-center"
          >
            <h3 className="text-lg font-medium mb-2">这是一个曝光监控测试元素</h3>
            <p className="text-blue-100">点击上方的"测试曝光监控"按钮来手动触发曝光事件</p>
          </div>
        </div>

        {/* 实时监控数据 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium">📊 实时日志记录</h2>
            <div className="flex items-center space-x-4 text-sm">
              <span className="text-gray-500">
                总计: {logs.length}
              </span>
              <div className="flex space-x-2">

                <button
                  onClick={() => setLogs([])}
                  className="text-red-500 hover:text-red-700 hover:underline"
                >
                  🗑️ 清空日志
                </button>
              </div>
            </div>
          </div>



          {/* 日志列表 */}
          <div className="max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📝</div>
                <div>暂无监控数据</div>
                <div className="text-sm">点击上方按钮开始测试监控功能</div>
              </div>
            ) : (
              <div className="bg-white border rounded-lg overflow-hidden">
                {/* 表头 */}
                <div className="bg-gray-50 px-4 py-3 border-b grid grid-cols-12 gap-4 text-xs font-medium text-gray-600">
                  <div className="col-span-2">事件发送时间</div>
                  <div className="col-span-2">事件类型</div>
                  <div className="col-span-2">消息</div>
                  <div className="col-span-6">数据信息</div>
                </div>

                {/* 列表项 */}
                <div className="divide-y divide-gray-200">
                  {logs.map((log: any, idx: number) => (
                    <div key={idx} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        {/* 时间 */}
                        <div className="col-span-2 text-sm text-gray-600 font-mono">
                          {log.time}
                        </div>

                        {/* 类型 */}
                        <div className="col-span-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${log.type === 'error' ? 'bg-red-100 text-red-800' :
                            log.type === 'click' ? 'bg-purple-100 text-purple-800' :
                              log.type === 'scroll' ? 'bg-indigo-100 text-indigo-800' :
                                log.type === 'exposure' ? 'bg-pink-100 text-pink-800' :
                                  log.type === 'uv' ? 'bg-yellow-100 text-yellow-800' :
                                    log.type === 'network' ? 'bg-teal-100 text-teal-800' :
                                      log.type === 'performance' ? 'bg-green-100 text-green-800' :
                                        log.type === 'system' ? 'bg-gray-100 text-gray-800' :
                                          'bg-blue-100 text-blue-800'
                            }`}>
                            {log.type === 'error' ? '🚨' :
                              log.type === 'click' ? '👆' :
                                log.type === 'scroll' ? '📜' :
                                  log.type === 'exposure' ? '👁️' :
                                    log.type === 'uv' ? '👤' :
                                      log.type === 'network' ? '🌐' :
                                        log.type === 'performance' ? '⚡' :
                                          log.type === 'system' ? '⚙️' :
                                            '📝'} {log.type.toUpperCase()}
                          </span>
                        </div>

                        {/* 消息 */}
                        <div className="col-span-2 text-sm font-medium text-gray-800 truncate" title={log.message}>
                          {log.message}
                        </div>

                        {/* 数据信息 */}
                        <div className="col-span-6">
                          {log.data && Object.keys(log.data).length > 0 ? (
                            <div className="space-y-1">
                              {Object.entries(log.data).map(([key, value]) => (
                                <div key={key} className="text-xs text-gray-600">
                                  <span className="font-medium">{key}:</span>{' '}
                                  <span className="text-gray-800 font-mono break-all">
                                    {typeof value === 'object' ?
                                      JSON.stringify(value)
                                      : String(value)
                                    }
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">无数据</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BehaviorMonitorPage() {
  return (
    <ProtectedRoute>
      <DemoContent />
    </ProtectedRoute>
  );
}


