/**
 * 车险多维分析系统 - 性能优化模块
 * 实现缓存策略、分片加载、响应时间优化
 */

import { InsuranceRecord, AnalysisResult, FilterConditions, PerformanceMetrics } from '@/types/insurance';

// 缓存配置
interface CacheConfig {
  maxSize: number;           // 最大缓存条目数
  ttl: number;              // 缓存生存时间（毫秒）
  enableCompression: boolean; // 是否启用压缩
}

// 缓存条目
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  size: number;
  compressed?: boolean;
}

// 分片加载配置
interface ChunkConfig {
  chunkSize: number;        // 每片大小
  maxConcurrent: number;    // 最大并发数
  preloadNext: boolean;     // 是否预加载下一片
}

/**
 * 内存缓存管理器
 */
class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private config: CacheConfig;
  private totalSize = 0;

  constructor(config: CacheConfig = {
    maxSize: 100,
    ttl: 5 * 60 * 1000, // 5分钟
    enableCompression: true
  }) {
    this.config = config;
  }

  /**
   * 生成缓存键
   */
  private generateKey(prefix: string, params: any): string {
    return `${prefix}:${JSON.stringify(params)}`;
  }

  /**
   * 压缩数据（简化实现）
   */
  private compress(data: any): string {
    return JSON.stringify(data);
  }

  /**
   * 解压数据
   */
  private decompress(compressed: string): any {
    return JSON.parse(compressed);
  }

  /**
   * 计算数据大小（字节）
   */
  private calculateSize(data: any): number {
    return JSON.stringify(data).length * 2; // 粗略估算
  }

  /**
   * 清理过期缓存
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.config.ttl) {
        this.totalSize -= entry.size;
        this.cache.delete(key);
      }
    }
  }

  /**
   * 腾出空间
   */
  private makeSpace(requiredSize: number): void {
    // 先清理过期缓存
    this.cleanup();

    // 如果还是不够，删除最旧的条目
    while (this.cache.size >= this.config.maxSize || 
           this.totalSize + requiredSize > this.config.maxSize * 1024 * 1024) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        const entry = this.cache.get(oldestKey);
        if (entry) {
          this.totalSize -= entry.size;
        }
        this.cache.delete(oldestKey);
      } else {
        break;
      }
    }
  }

  /**
   * 设置缓存
   */
  set<T>(prefix: string, params: any, data: T): void {
    const key = this.generateKey(prefix, params);
    const size = this.calculateSize(data);
    
    this.makeSpace(size);

    const entry: CacheEntry<any> = {
      data: this.config.enableCompression ? this.compress(data) : data,
      timestamp: Date.now(),
      size,
      compressed: this.config.enableCompression
    };

    this.cache.set(key, entry);
    this.totalSize += size;
  }

  /**
   * 获取缓存
   */
  get<T>(prefix: string, params: any): T | null {
    const key = this.generateKey(prefix, params);
    const entry = this.cache.get(key);

    if (!entry) return null;

    // 检查是否过期
    if (Date.now() - entry.timestamp > this.config.ttl) {
      this.totalSize -= entry.size;
      this.cache.delete(key);
      return null;
    }

    // 返回数据
    return entry.compressed ? this.decompress(entry.data) : entry.data;
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
    this.totalSize = 0;
  }

  /**
   * 获取缓存统计
   */
  getStats() {
    return {
      size: this.cache.size,
      totalSize: this.totalSize,
      hitRate: 0 // 需要额外统计
    };
  }
}

/**
 * 分片数据加载器
 */
class ChunkLoader<T> {
  private config: ChunkConfig;
  private loadingChunks = new Set<number>();

  constructor(config: ChunkConfig = {
    chunkSize: 1000,
    maxConcurrent: 3,
    preloadNext: true
  }) {
    this.config = config;
  }

  /**
   * 分片加载数据
   */
  async loadChunks(
    data: T[],
    startIndex: number = 0,
    count: number = this.config.chunkSize
  ): Promise<{
    chunk: T[];
    hasMore: boolean;
    nextIndex: number;
  }> {
    const endIndex = Math.min(startIndex + count, data.length);
    const chunk = data.slice(startIndex, endIndex);

    // 预加载下一片
    if (this.config.preloadNext && endIndex < data.length) {
      this.preloadNext(data, endIndex);
    }

    return {
      chunk,
      hasMore: endIndex < data.length,
      nextIndex: endIndex
    };
  }

  /**
   * 预加载下一片数据
   */
  private async preloadNext(data: T[], startIndex: number): Promise<void> {
    const chunkIndex = Math.floor(startIndex / this.config.chunkSize);
    
    if (this.loadingChunks.has(chunkIndex) || 
        this.loadingChunks.size >= this.config.maxConcurrent) {
      return;
    }

    this.loadingChunks.add(chunkIndex);
    
    // 模拟异步预加载
    setTimeout(() => {
      this.loadingChunks.delete(chunkIndex);
    }, 100);
  }

  /**
   * 虚拟滚动计算
   */
  calculateVisibleRange(
    scrollTop: number,
    containerHeight: number,
    itemHeight: number,
    totalItems: number,
    overscan: number = 5
  ): {
    startIndex: number;
    endIndex: number;
    visibleItems: number;
  } {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleItems = Math.ceil(containerHeight / itemHeight);
    const endIndex = Math.min(totalItems - 1, startIndex + visibleItems + overscan * 2);

    return {
      startIndex,
      endIndex,
      visibleItems
    };
  }
}

/**
 * 性能监控器
 */
class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 100;

  /**
   * 开始性能测量
   */
  startMeasure(label: string): () => PerformanceMetrics {
    const startTime = performance.now();
    const startMemory = (performance as any).memory?.usedJSHeapSize || 0;

    return (cacheHit: boolean = false, dataSize: number = 0): PerformanceMetrics => {
      const endTime = performance.now();
      const endMemory = (performance as any).memory?.usedJSHeapSize || 0;

      const metrics: PerformanceMetrics = {
        queryTime: endTime - startTime,
        renderTime: 0, // 需要在渲染完成后设置
        dataSize: dataSize || (endMemory - startMemory),
        cacheHit
      };

      this.addMetrics(metrics);
      return metrics;
    };
  }

  /**
   * 添加性能指标
   */
  private addMetrics(metrics: PerformanceMetrics): void {
    this.metrics.push(metrics);
    
    // 保持最大数量限制
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  /**
   * 获取性能统计
   */
  getStats() {
    if (this.metrics.length === 0) {
      return {
        avgQueryTime: 0,
        avgRenderTime: 0,
        avgDataSize: 0,
        cacheHitRate: 0,
        totalQueries: 0
      };
    }

    const totalQueries = this.metrics.length;
    const cacheHits = this.metrics.filter(m => m.cacheHit).length;

    return {
      avgQueryTime: this.metrics.reduce((sum, m) => sum + m.queryTime, 0) / totalQueries,
      avgRenderTime: this.metrics.reduce((sum, m) => sum + m.renderTime, 0) / totalQueries,
      avgDataSize: this.metrics.reduce((sum, m) => sum + m.dataSize, 0) / totalQueries,
      cacheHitRate: (cacheHits / totalQueries) * 100,
      totalQueries
    };
  }

  /**
   * 检查性能是否达标
   */
  checkPerformance(): {
    queryTimeOk: boolean;
    renderTimeOk: boolean;
    overallOk: boolean;
  } {
    const stats = this.getStats();
    const queryTimeOk = stats.avgQueryTime < 2000; // 2秒内
    const renderTimeOk = stats.avgRenderTime < 1000; // 1秒内
    
    return {
      queryTimeOk,
      renderTimeOk,
      overallOk: queryTimeOk && renderTimeOk
    };
  }
}

/**
 * 数据优化工具
 */
class DataOptimizer {
  /**
   * 数据去重
   */
  static deduplicate<T>(data: T[], keyFn?: (item: T) => string): T[] {
    if (!keyFn) {
      return Array.from(new Set(data));
    }

    const seen = new Set<string>();
    return data.filter(item => {
      const key = keyFn(item);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * 数据压缩（移除空字段）
   */
  static compress<T extends Record<string, any>>(data: T[]): T[] {
    return data.map(item => {
      const compressed = {} as T;
      for (const [key, value] of Object.entries(item)) {
        if (value !== null && value !== undefined && value !== '') {
          compressed[key as keyof T] = value;
        }
      }
      return compressed;
    });
  }

  /**
   * 数据分组优化
   */
  static groupBy<T>(
    data: T[],
    keyFn: (item: T) => string,
    maxGroupSize: number = 1000
  ): Map<string, T[]> {
    const groups = new Map<string, T[]>();
    
    for (const item of data) {
      const key = keyFn(item);
      const group = groups.get(key) || [];
      
      if (group.length < maxGroupSize) {
        group.push(item);
        groups.set(key, group);
      }
    }
    
    return groups;
  }
}

// 创建全局实例
export const memoryCache = new MemoryCache();
export const chunkLoader = new ChunkLoader<InsuranceRecord>();
export const performanceMonitor = new PerformanceMonitor();

// 导出类和工具
export {
  MemoryCache,
  ChunkLoader,
  PerformanceMonitor,
  DataOptimizer
};

// 导出类型
export type {
  CacheConfig,
  ChunkConfig,
  CacheEntry
};