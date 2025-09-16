'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FilterConditions, InsuranceRecord } from '@/types/insurance';
import { FILTER_DIMENSIONS, DISPLAY_NAMES } from '@/lib/constants';
import { db } from '@/lib/database';
import { ChevronDown, ChevronUp, X, Search } from 'lucide-react';

interface FilterPanelProps {
  filters: FilterConditions;
  onFiltersChange: (filters: FilterConditions) => void;
  loading?: boolean;
}

interface FilterOption {
  value: any;
  label: string;
  count?: number;
}

/**
 * 筛选面板组件
 * 实现17个维度的动态筛选功能
 */
export function FilterPanel({ filters, onFiltersChange, loading = false }: FilterPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['policy_start_year']));
  const [dimensionOptions, setDimensionOptions] = useState<{ [key: string]: FilterOption[] }>({});
  const [searchTerms, setSearchTerms] = useState<{ [key: string]: string }>({});
  const [loadingOptions, setLoadingOptions] = useState<Set<string>>(new Set());

  /**
   * 加载维度选项值
   */
  const loadDimensionOptions = async (dimension: keyof InsuranceRecord) => {
    if (loadingOptions.has(dimension)) return;
    
    setLoadingOptions(prev => new Set(prev).add(dimension));
    
    try {
      const values = await db.getDimensionValues(dimension);
      const options: FilterOption[] = values.map(value => ({
        value,
        label: String(value),
      }));
      
      setDimensionOptions(prev => ({
        ...prev,
        [dimension]: options
      }));
    } catch (error) {
      console.error(`加载维度选项失败 ${dimension}:`, error);
    } finally {
      setLoadingOptions(prev => {
        const newSet = new Set(prev);
        newSet.delete(dimension);
        return newSet;
      });
    }
  };

  /**
   * 切换展开/收起状态
   */
  const toggleSection = (dimension: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(dimension)) {
      newExpanded.delete(dimension);
    } else {
      newExpanded.add(dimension);
      // 首次展开时加载选项
      if (!dimensionOptions[dimension]) {
        loadDimensionOptions(dimension as keyof InsuranceRecord);
      }
    }
    setExpandedSections(newExpanded);
  };

  /**
   * 处理筛选值变化
   */
  const handleFilterChange = (dimension: string, values: any[]) => {
    const newFilters = { ...filters };
    if (values.length === 0) {
      delete newFilters[dimension as keyof FilterConditions];
    } else {
      (newFilters as any)[dimension] = values;
    }
    onFiltersChange(newFilters);
  };

  /**
   * 清除单个筛选条件
   */
  const clearFilter = (dimension: string) => {
    handleFilterChange(dimension, []);
  };

  /**
   * 清除所有筛选条件
   */
  const clearAllFilters = () => {
    onFiltersChange({});
  };

  /**
   * 获取已选择的值
   */
  const getSelectedValues = (dimension: string): any[] => {
    return (filters as any)[dimension] || [];
  };

  /**
   * 处理复选框变化
   */
  const handleCheckboxChange = (dimension: string, value: any, checked: boolean) => {
    const currentValues = getSelectedValues(dimension);
    let newValues: any[];
    
    if (checked) {
      newValues = [...currentValues, value];
    } else {
      newValues = currentValues.filter(v => v !== value);
    }
    
    handleFilterChange(dimension, newValues);
  };

  /**
   * 过滤选项（基于搜索词）
   */
  const getFilteredOptions = (dimension: string): FilterOption[] => {
    const options = dimensionOptions[dimension] || [];
    const searchTerm = searchTerms[dimension]?.toLowerCase() || '';
    
    if (!searchTerm) return options;
    
    return options.filter(option => 
      option.label.toLowerCase().includes(searchTerm)
    );
  };

  /**
   * 获取活跃筛选条件数量
   */
  const getActiveFiltersCount = (): number => {
    return Object.keys(filters).length;
  };

  // 初始化时加载常用维度的选项
  useEffect(() => {
    const commonDimensions = ['policy_start_year', 'chengdu_branch', 'business_type_category'];
    commonDimensions.forEach(dimension => {
      if (!dimensionOptions[dimension]) {
        loadDimensionOptions(dimension as keyof InsuranceRecord);
      }
    });
  }, []);

  return (
    <div className="space-y-4">
      {/* 筛选条件头部 */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">
          筛选条件 {getActiveFiltersCount() > 0 && (
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              {getActiveFiltersCount()}
            </span>
          )}
        </h3>
        {getActiveFiltersCount() > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
            className="text-xs"
          >
            清除全部
          </Button>
        )}
      </div>

      {/* 筛选维度列表 */}
      <div className="space-y-3">
        {FILTER_DIMENSIONS.map((dimension) => {
          const isExpanded = expandedSections.has(dimension);
          const selectedValues = getSelectedValues(dimension);
          const options = getFilteredOptions(dimension);
          const isLoading = loadingOptions.has(dimension);

          return (
            <div key={dimension} className="border rounded-lg">
              {/* 维度标题 */}
              <button
                onClick={() => toggleSection(dimension)}
                className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-gray-50 rounded-t-lg"
                disabled={loading}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {DISPLAY_NAMES[dimension as keyof typeof DISPLAY_NAMES] || dimension}
                  </span>
                  {selectedValues.length > 0 && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                      {selectedValues.length}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {selectedValues.length > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        clearFilter(dimension);
                      }}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </button>

              {/* 维度选项 */}
              {isExpanded && (
                <div className="border-t bg-white rounded-b-lg">
                  {/* 搜索框 */}
                  {options.length > 10 && (
                    <div className="p-3 border-b">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="搜索选项..."
                          value={searchTerms[dimension] || ''}
                          onChange={(e) => setSearchTerms(prev => ({
                            ...prev,
                            [dimension]: e.target.value
                          }))}
                          className="w-full pl-10 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* 选项列表 */}
                  <div className="max-h-60 overflow-y-auto">
                    {isLoading ? (
                      <div className="p-3 text-center text-gray-500 text-sm">
                        加载中...
                      </div>
                    ) : options.length === 0 ? (
                      <div className="p-3 text-center text-gray-500 text-sm">
                        暂无选项
                      </div>
                    ) : (
                      <div className="p-2 space-y-1">
                        {options.slice(0, 100).map((option) => (
                          <label
                            key={option.value}
                            className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedValues.includes(option.value)}
                              onChange={(e) => handleCheckboxChange(
                                dimension,
                                option.value,
                                e.target.checked
                              )}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700 flex-1">
                              {option.label}
                            </span>
                            {option.count && (
                              <span className="text-xs text-gray-500">
                                ({option.count})
                              </span>
                            )}
                          </label>
                        ))}
                        {options.length > 100 && (
                          <div className="p-2 text-center text-gray-500 text-xs">
                            显示前100项，请使用搜索缩小范围
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 快速筛选预设 */}
      <div className="pt-4 border-t">
        <h4 className="text-sm font-medium text-gray-700 mb-2">快速筛选</h4>
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onFiltersChange({ policy_start_year: [2024] })}
            className="w-full justify-start text-xs"
          >
            2024年数据
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onFiltersChange({ 
              policy_start_year: [2024],
              business_type_category: ['车险']
            })}
            className="w-full justify-start text-xs"
          >
            2024年车险
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onFiltersChange({
              policy_start_year: [2024],
              chengdu_branch: ['成都分公司']
            })}
            className="w-full justify-start text-xs"
          >
            成都分公司2024年
          </Button>
        </div>
      </div>
    </div>
  );
}