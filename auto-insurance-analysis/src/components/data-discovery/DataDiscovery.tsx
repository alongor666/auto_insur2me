'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Folder, FileText, Calendar, Database, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataService } from '@/services/dataService';
import { DataCatalog, AvailableYears, AvailableWeeks, InsuranceRecord } from '@/types/insurance';

interface DataDiscoveryProps {
  onDataLoad?: (data: InsuranceRecord[], metadata: { year: number; week?: number }) => void;
  className?: string;
}

/**
 * 数据发现组件 - 自动扫描和加载现有CSV文件
 * 提供年份和周次选择，支持数据预览和批量加载
 */
export function DataDiscovery({ onDataLoad, className = '' }: DataDiscoveryProps) {
  const [dataService] = useState(() => DataService.getInstance());
  const [catalog, setCatalog] = useState<DataCatalog | null>(null);
  const [availableYears, setAvailableYears] = useState<AvailableYears | null>(null);
  const [availableWeeks, setAvailableWeeks] = useState<AvailableWeeks | null>(null);
  
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedData, setLoadedData] = useState<InsuranceRecord[] | null>(null);

  /**
   * 扫描数据目录
   */
  const scanDataDirectory = useCallback(async () => {
    setIsScanning(true);
    setError(null);
    
    try {
      const [catalogData, yearsData, weeksData] = await Promise.all([
        dataService.scanDataDirectory(),
        dataService.getAvailableYears(),
        dataService.getAvailableWeeks()
      ]);
      
      setCatalog(catalogData);
      setAvailableYears(yearsData);
      setAvailableWeeks(weeksData);
      
      // 自动选择最新年份
      if (yearsData.years.length > 0) {
        const latestYear = Math.max(...yearsData.years);
        setSelectedYear(latestYear);
        
        // 自动选择该年份的最新周次
        const weeksForYear = weeksData[latestYear.toString()];
        if (weeksForYear && weeksForYear.length > 0) {
          setSelectedWeek(Math.max(...weeksForYear));
        }
      }
    } catch (err: any) {
      setError(`扫描数据目录失败: ${err.message}`);
    } finally {
      setIsScanning(false);
    }
  }, [dataService]);

  /**
   * 加载指定年份和周次的数据
   */
  const loadData = useCallback(async () => {
    if (!selectedYear) {
      setError('请选择年份');
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoadedData(null);

    try {
      const data = await dataService.loadDataByYearWeek(selectedYear, selectedWeek || undefined);
      setLoadedData(data);
      onDataLoad?.(data, { year: selectedYear, week: selectedWeek || undefined });
    } catch (err: any) {
      setError(`加载数据失败: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [dataService, selectedYear, selectedWeek, onDataLoad]);

  /**
   * 组件初始化时自动扫描
   */
  useEffect(() => {
    scanDataDirectory();
  }, [scanDataDirectory]);

  /**
   * 年份变化时更新可用周次
   */
  useEffect(() => {
    if (selectedYear && availableWeeks) {
      const weeksForYear = availableWeeks[selectedYear.toString()];
      if (weeksForYear && weeksForYear.length > 0) {
        // 如果当前选择的周次在新年份中不存在，则选择最新周次
        if (!selectedWeek || !weeksForYear.includes(selectedWeek)) {
          setSelectedWeek(Math.max(...weeksForYear));
        }
      } else {
        setSelectedWeek(null);
      }
    }
  }, [selectedYear, availableWeeks, selectedWeek]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 标题和刷新按钮 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Database className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">数据发现</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={scanDataDirectory}
          disabled={isScanning}
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
          <span>{isScanning ? '扫描中...' : '刷新'}</span>
        </Button>
      </div>

      {/* 数据目录概览 */}
      {catalog && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-800">可用年份</span>
            </div>
            <p className="text-2xl font-bold text-blue-900 mt-1">{catalog.totalYears}</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-800">数据文件</span>
            </div>
            <p className="text-2xl font-bold text-green-900 mt-1">{catalog.totalFiles}</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center space-x-2">
              <Folder className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-purple-800">最后扫描</span>
            </div>
            <p className="text-sm text-purple-900 mt-1">
              {new Date(catalog.lastScanTime).toLocaleString('zh-CN')}
            </p>
          </div>
        </div>
      )}

      {/* 年份和周次选择 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 年份选择 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            选择年份
          </label>
          <select
            value={selectedYear || ''}
            onChange={(e) => setSelectedYear(e.target.value ? parseInt(e.target.value) : null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!availableYears || availableYears.years.length === 0}
          >
            <option value="">请选择年份</option>
            {availableYears?.years.map(year => (
              <option key={year} value={year}>
                {year}年
                {availableWeeks && availableWeeks[year.toString()] && 
                  ` (${availableWeeks[year.toString()].length}周)`
                }
              </option>
            ))}
          </select>
        </div>

        {/* 周次选择 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            选择周次 (可选)
          </label>
          <select
            value={selectedWeek || ''}
            onChange={(e) => setSelectedWeek(e.target.value ? parseInt(e.target.value) : null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!selectedYear || !availableWeeks || !availableWeeks[selectedYear.toString()]}
          >
            <option value="">全年数据</option>
            {selectedYear && availableWeeks && availableWeeks[selectedYear.toString()]?.map(week => (
              <option key={week} value={week}>
                第{week}周
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            不选择周次将加载整年数据
          </p>
        </div>
      </div>

      {/* 缺失周次提示 */}
      {selectedYear && catalog && catalog.missingWeeks[selectedYear.toString()] && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800">数据缺失提醒</h4>
              <p className="text-sm text-yellow-700 mt-1">
                {selectedYear}年缺失以下周次的数据: {catalog.missingWeeks[selectedYear.toString()].join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 加载按钮 */}
      <div className="flex justify-center">
        <Button
          onClick={loadData}
          disabled={!selectedYear || isLoading}
          className="flex items-center space-x-2 px-6 py-2"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>加载中...</span>
            </>
          ) : (
            <>
              <Database className="w-4 h-4" />
              <span>
                加载数据 ({selectedYear}年{selectedWeek ? `第${selectedWeek}周` : '全年'})
              </span>
            </>
          )}
        </Button>
      </div>

      {/* 错误信息 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-800">加载失败</h4>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* 加载成功信息 */}
      {loadedData && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-800">数据加载成功</h4>
              <p className="text-sm text-green-700 mt-1">
                成功加载 {loadedData.length.toLocaleString()} 条记录
                {selectedYear && ` (${selectedYear}年${selectedWeek ? `第${selectedWeek}周` : '全年'})`}
              </p>
              <div className="mt-2 text-xs text-green-600 space-y-1">
                <p>• 数据时间范围: {loadedData.length > 0 ? `${Math.min(...loadedData.map(r => r.policy_start_year))} - ${Math.max(...loadedData.map(r => r.policy_start_year))}年` : '无数据'}</p>
                <p>• 包含周次: {loadedData.length > 0 ? `第${Math.min(...loadedData.map(r => r.week_number))} - ${Math.max(...loadedData.map(r => r.week_number))}周` : '无数据'}</p>
                <p>• 签单保费总额: {loadedData.reduce((sum, r) => sum + (r.signed_premium_yuan || 0), 0).toLocaleString()}元</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 使用说明 */}
      <div className="text-xs text-gray-500 space-y-1 border-t pt-4">
        <p><strong>数据发现功能:</strong> 自动扫描data目录中的CSV文件</p>
        <p><strong>支持格式:</strong> {'{年份}保单第{周次}周变动成本明细表.csv'}</p>
        <p><strong>加载策略:</strong> 支持单周数据或整年数据加载</p>
        <p><strong>缓存机制:</strong> 已加载的数据会被缓存以提高性能</p>
      </div>
    </div>
  );
}