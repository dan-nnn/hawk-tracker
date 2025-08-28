import { BasePlugin, HawkTrackerCore } from '@hawk-tracker/core';

export interface BehaviorPluginOptions {
  enableClickTracking?: boolean;
  enableScrollTracking?: boolean;
  enableExposureTracking?: boolean;
  enableStayTimeTracking?: boolean;
  scrollThreshold?: number;
  exposureThreshold?: number;
  clickDebounceMs?: number;
  scrollThrottleMs?: number;
}

export class BehaviorPlugin extends BasePlugin {
  public readonly name = 'behavior';
  private options: Required<BehaviorPluginOptions>;
  private core: HawkTrackerCore | null = null;
  private isInitialized = false;

  constructor(options: BehaviorPluginOptions = {}) {
    super('behavior' as any);
    this.options = {
      enableClickTracking: true,
      enableScrollTracking: true,
      enableExposureTracking: true,
      enableStayTimeTracking: true,
      scrollThreshold: 0.5,
      exposureThreshold: 0.5,
      clickDebounceMs: 300,
      scrollThrottleMs: 150,
      ...options,
    };
  }

  public install(core: HawkTrackerCore, options: any): void {
    this.core = core;
    this.initialize();
  }

  public uninstall(): void {
    this.cleanup();
    this.core = null;
    this.isInitialized = false;
  }

  private initialize(): void {
    if (this.isInitialized || !this.core) return;

    try {
      if (this.options.enableClickTracking) {
        this.initClickTracking();
      }

      if (this.options.enableScrollTracking) {
        this.initScrollTracking();
      }

      this.isInitialized = true;
      console.log('[BehaviorPlugin] 行为监控插件初始化成功');
    } catch (error) {
      console.error('[BehaviorPlugin] 初始化失败:', error);
    }
  }

  private cleanup(): void {
    // 清理事件监听器
    document.removeEventListener('click', this.handleClick.bind(this));
    window.removeEventListener('scroll', this.handleScroll.bind(this));
  }

  private initClickTracking(): void {
    document.addEventListener('click', this.handleClick.bind(this));
  }

  private initScrollTracking(): void {
    window.addEventListener('scroll', this.handleScroll.bind(this));
  }

  private handleClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target && this.core) {
      this.core.dataSender.sendData('behavior', 'click', {
        element: target.tagName.toLowerCase(),
        text: target.textContent?.substring(0, 100) || '',
        className: target.className,
        id: target.id,
        x: event.clientX,
        y: event.clientY,
        timestamp: Date.now(),
      }, false);
    }
  }

  private handleScroll(): void {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;
    const scrollPercentage = scrollTop / (scrollHeight - clientHeight);

    if (scrollPercentage >= this.options.scrollThreshold && this.core) {
      this.core.dataSender.sendData('behavior', 'scroll', {
        scrollTop,
        scrollPercentage,
        scrollHeight,
        clientHeight,
        timestamp: Date.now(),
      }, false);
    }
  }

  public isActive(): boolean {
    return this.isInitialized;
  }
}

export default BehaviorPlugin;
