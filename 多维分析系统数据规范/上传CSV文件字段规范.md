# 车险变动成本多维分析系统 - 字段定义与计算规范

**版本**: v3.0 (统一整合版) | **最后更新**: 2025-01-27  
**用途**: 统一车险变动成本分析相关指标口径，整合所有字段定义、计算公式和业务逻辑  
**数据架构**: 17个筛选维度 + 9个绝对值字段 + 7个率值字段 + 2个均值字段 + 1个系数字段

---


## 1. 筛选维度字段（17个）

### 1.1 时间维度
| 中文名称 | 英文字段名 | 数据类型 | 示例值 | 业务含义 |
|----------|------------|----------|--------|---------|
| 数据快照日期 | `snapshot_date` | 日期 | 2025-07-13 | 数据快照日期，用于版本控制 |
| 保单起期年度 | `policy_start_year` | 整数 | 2024, 2025 | 保单起期年度，用于年度分析 |
| 周序号 | `week_number` | 整数 | 28, 29, 30, 31, 33, 34, 35, 36 | 周序号，用于周度分析 |

### 1.2 机构维度
| 中文名称 | 英文字段名 | 数据类型 | 主要选项 | 业务含义 |
|----------|------------|----------|----------|---------|
| 机构层级 | `chengdu_branch` | 字符串 | 成都, 中支 | 机构层级分类 |
| 三级机构 | `third_level_organization` | 字符串 | 乐山, 天府, 宜宾, 德阳等 | 具体经营机构 |

### 1.3 业务维度
| 中文名称 | 英文字段名 | 数据类型 | 主要选项 | 业务含义 |
|----------|------------|----------|----------|---------|
| 业务类型分类 | `business_type_category` | 字符串 | 10吨以上-普货, 非营业客车新车等 | 业务类型细分 |
| 客户三级分类 | `customer_category_3` | 字符串 | 营业货车, 非营业个人客车等 | 客户类型分类 |
| 险种类型 | `insurance_type` | 字符串 | 商业保险, 交强险 | 险种分类 |
| 险别组合 | `coverage_type` | 字符串 | 主全, 交三, 单交 | 险别组合类型 |
| 新续转状态 | `renewal_status` | 字符串 | 新保, 续保, 转保 | 保单续保状态 |
| 投保终端来源 | `terminal_source` | 字符串 | 0101柜面, 0105微信等 | 投保渠道来源 |

### 1.4 车辆属性维度
| 中文名称 | 英文字段名 | 数据类型 | 主要选项 | 业务含义 |
|----------|------------|----------|----------|---------|
| 是否新能源车 | `is_new_energy_vehicle` | 布尔 | True, False | 新能源车标识 |
| 是否过户车 | `is_transferred_vehicle` | 布尔 | True, False | 过户车标识 |

### 1.5 风险评级维度
| 中文名称 | 英文字段名 | 数据类型 | 主要选项 | 业务含义 |
|----------|------------|----------|----------|---------|
| 车险分等级 | `vehicle_insurance_grade` | 字符串 | A, B, C, D, E, F, G, X | 车险风险等级 |
| 高速风险等级 | `highway_risk_grade` | 字符串 | A, B, C, D, E, X | 高速行驶风险等级 |
| 大货车评分 | `large_truck_score` | 字符串 | A, B, C, D, E, X | 大货车风险评分 |
| 小货车评分 | `small_truck_score` | 字符串 | A, B, C, D, E, X | 小货车风险评分 |

---

## 2. 绝对值字段（9个）- 聚合计算基础

### 2.1 签单保费 | `signed_premium_yuan`
- **数据类型**: 浮点数 | **单位**: 元 | **分类标签**: 绝对值字段
- **业务含义**: 保险公司实际承保的保费总额，体现承保规模与业务产能
- **计算公式**: 直接聚合求和 `SUM(signed_premium_yuan)`
- **注意事项**: 用于计算费用率、变动成本率等关键指标的分母

### 2.2 满期保费 | `matured_premium_yuan`
- **数据类型**: 浮点数 | **单位**: 元 | **分类标签**: 绝对值字段
- **业务含义**: 已满期责任对应的净保费，用于计算赔付率和边际贡献
- **计算公式**: 直接聚合求和 `SUM(matured_premium_yuan)`
- **注意事项**: 与签单保费的差异反映退保、批改等影响

### 2.3 商业险折前保费 | `commercial_premium_before_discount_yuan`
- **数据类型**: 浮点数 | **单位**: 元 | **分类标签**: 绝对值字段
- **业务含义**: 商业险优惠前的保费金额，用于计算自主定价系数
- **计算公式**: 直接聚合求和 `SUM(commercial_premium_before_discount_yuan)`
- **注意事项**: 仅适用于商业险，交强险此字段为0

### 2.4 保单件数 | `policy_count`
- **数据类型**: 整数 | **单位**: 件 | **分类标签**: 绝对值字段
- **业务含义**: 保单数量，用于计算单均保费、满期出险率等
- **计算公式**: 直接聚合求和 `SUM(policy_count)`
- **注意事项**: 用于各类均值指标的分母

### 2.5 赔案件数 | `claim_case_count`
- **数据类型**: 整数 | **单位**: 件 | **分类标签**: 绝对值字段
- **业务含义**: 发生理赔的案件总数，用于计算案均赔款、满期出险率
- **计算公式**: 直接聚合求和 `SUM(claim_case_count)`
- **推导公式**: `(reported_claim_payment_yuan × 10000) ÷ average_claim_payment_yuan`

### 2.6 已报告赔款 | `reported_claim_payment_yuan`
- **数据类型**: 浮点数 | **单位**: 元 | **分类标签**: 绝对值字段
- **业务含义**: 已实际支付的累计赔款金额，反映业务风险成本总额
- **计算公式**: 直接聚合求和 `SUM(reported_claim_payment_yuan)`
- **注意事项**: 用于计算满期赔付率、变动成本率的重要组成部分

### 2.7 费用金额 | `expense_amount_yuan`
- **数据类型**: 浮点数 | **单位**: 元 | **分类标签**: 绝对值字段
- **业务含义**: 运营和管理费用总额，用于计算费用率和变动成本率
- **计算公式**: 直接聚合求和 `SUM(expense_amount_yuan)`
- **推导公式**: `signed_premium_yuan × expense_ratio_percent ÷ 100`

### 2.8 保费计划 | `premium_plan_yuan`
- **数据类型**: 浮点数 | **单位**: 元 | **分类标签**: 绝对值字段
- **业务含义**: 预设的保费收入目标，用于计算保费时间进度达成率
- **计算公式**: 直接聚合求和 `SUM(premium_plan_yuan)`
- **注意事项**: 按日计算进度，支持时间进度管理

### 2.9 满期边际贡献额 | `marginal_contribution_amount_yuan`
- **数据类型**: 浮点数 | **单位**: 元 | **分类标签**: 绝对值字段
- **业务含义**: 保费收入扣除变动成本后的绝对金额，直接反映业务盈利能力
- **计算公式**: `SUM(matured_premium_yuan) × (1 - 满期赔付率 - 费用率)`
- **详细计算**: `SUM(matured_premium_yuan) × (1 - SUM(reported_claim_payment_yuan)/SUM(matured_premium_yuan) - SUM(expense_amount_yuan)/SUM(signed_premium_yuan))`
- **重要说明**: 这是满期边际贡献额，并非终极边际贡献额。只有当统计区间内所有车险保单均满期且所有赔案完全结案后，才能计算出终极边际贡献额
- **注意事项**: 用于盈利能力评估、业务价值分析，与边际贡献率相互验证

---

## 3. 率值字段（7个）- 公式计算

### 3.1 费用率 | `expense_ratio_percent`
- **数据类型**: 浮点数 | **单位**: % | **分类标签**: 率值字段
- **业务含义**: 费用占签单保费的比例，衡量费用管控能力
- **计算公式**: `(SUM(expense_amount_yuan) ÷ SUM(signed_premium_yuan)) × 100`
- **展示精度**: 保留1位小数
- **正常范围**: 通常在5%-30%之间

### 3.2 满期率 | `maturity_ratio_percent`
- **数据类型**: 浮点数 | **单位**: % | **分类标签**: 率值字段
- **业务含义**: 满期保费占签单保费的比例，反映保单满期情况
- **计算公式**: `(SUM(matured_premium_yuan) ÷ SUM(signed_premium_yuan)) × 100`
- **展示精度**: 保留1位小数
- **正常范围**: 通常在80%-100%之间

### 3.3 满期出险率 | `claim_frequency_percent`
- **数据类型**: 浮点数 | **单位**: % | **分类标签**: 率值字段
- **业务含义**: 每张保单在满期责任范围内发生赔案的频率
- **计算公式**: `(SUM(claim_case_count) ÷ SUM(policy_count)) × (SUM(matured_premium_yuan) ÷ SUM(signed_premium_yuan)) × 100`
- **展示精度**: 保留1位小数
- **注意事项**: 包含满期率修正系数，更真实反映风险暴露程度

### 3.4 满期赔付率 | `matured_loss_ratio_percent`
- **数据类型**: 浮点数 | **单位**: % | **分类标签**: 率值字段
- **业务含义**: 赔款与满期保费的比率，衡量承保业务的风险成本水平
- **计算公式**: `(SUM(reported_claim_payment_yuan) ÷ SUM(matured_premium_yuan)) × 100`
- **展示精度**: 保留1位小数
- **正常范围**: 通常在40%-80%之间

### 3.5 变动成本率 | `variable_cost_ratio_percent`
- **数据类型**: 浮点数 | **单位**: % | **分类标签**: 率值字段
- **业务含义**: 变动成本占签单保费的比例，衡量业务整体成本水平
- **计算公式**: `(SUM(expense_amount_yuan) ÷ SUM(signed_premium_yuan) + SUM(reported_claim_payment_yuan) ÷ SUM(matured_premium_yuan)) × 100`
- **展示精度**: 保留1位小数
- **组成部分**: (费用金额 ÷ 签单保费) + (已报告赔款 ÷ 满期保费)
- **说明**: 该指标用于精确计算每单位已满期保单的保费收入所对应的变动成本比例，确保公式一致性和计算准确性

### 3.6 边际贡献率 | `marginal_contribution_ratio_percent`
- **数据类型**: 浮点数 | **单位**: % | **分类标签**: 率值字段
- **业务含义**: 保费收入扣除变动成本后的比例，衡量业务盈利空间
- **计算公式**: `(SUM(marginal_contribution_amount_yuan) ÷ SUM(matured_premium_yuan)) × 100`
- **推导公式**: `100 - matured_loss_ratio_percent - (SUM(expense_amount_yuan) / SUM(matured_premium_yuan)) * 100`
- **简化表达**: `1 - 满期赔付率 - 费用率(基于满期保费)`
- **展示精度**: 保留1位小数
- **互补关系**: 与变动成本率（基于满期保费）互补

### 3.7 保费时间进度达成率 | `premium_time_progress_achievement_rate_percent`
- **数据类型**: 浮点数 | **单位**: % | **分类标签**: 率值字段
- **业务含义**: 签单保费与保费时间进度计划的比率，衡量计划执行情况
- **计算公式**: `(SUM(signed_premium_yuan) ÷ SUM(premium_time_progress_plan_yuan)) × 100`
- **展示精度**: 保留1位小数
- **注意事项**: 保费时间进度计划按日计算进度，支持精细化管理

---

## 4. 均值字段（2个）- 公式计算

### 4.1 单均保费 | `average_premium_per_policy_yuan`
- **数据类型**: 浮点数 | **单位**: 元/件 | **分类标签**: 均值字段
- **业务含义**: 平均每张保单的保费金额，反映业务结构和客户质量
- **计算公式**: `SUM(signed_premium_yuan) ÷ SUM(policy_count)`
- **展示精度**: 保留整数
- **应用场景**: 业务结构分析、客户价值评估

### 4.2 案均赔款 | `average_claim_payment_yuan`
- **数据类型**: 浮点数 | **单位**: 元/件 | **分类标签**: 均值字段
- **业务含义**: 平均每个理赔案件的赔款金额，反映案件严重程度
- **计算公式**: `SUM(reported_claim_payment_yuan) ÷ SUM(claim_case_count)`
- **展示精度**: 保留整数
- **应用场景**: 理赔成本分析、风险评估

---

## 5. 系数字段（1个）

### 5.1 商业险自主系数 | `commercial_auto_underwriting_factor`
- **数据类型**: 浮点数 | **单位**: 系数 | **分类标签**: 系数字段
- **业务含义**: 商业险自主定价系数，反映定价策略和风险评估
- **计算公式**: `SUM(signed_premium_yuan) ÷ SUM(commercial_premium_before_discount_yuan)`
- **展示精度**: 保留4位小数
- **适用范围**: 仅适用于商业险，交强险不适用
- **正常范围**: 通常在0.6-1.0之间

---

## 6. 其他推导字段

### 6.1 满期边际贡献额 | `marginal_contribution_amount_yuan`
- **数据类型**: 浮点数 | **单位**: 元
- **业务含义**: 保费收入扣除变动成本后的绝对金额
- **计算公式**: `SUM(matured_premium_yuan) × (1 - 满期赔付率 - 费用率)`
- **重要说明**: 这是满期边际贡献额，并非终极边际贡献额。只有当统计区间内所有车险保单均满期且所有赔案完全结案后，才能计算出终极边际贡献额
- **应用场景**: 盈利能力评估、业务价值分析

### 6.2 保费时间进度计划 | `premium_time_progress_plan_yuan`
- **数据类型**: 浮点数 | **单位**: 元
- **业务含义**: 按日计算的保费时间进度计划
- **计算方式**: 根据年度计划和时间进度按日分解
- **应用场景**: 精细化进度管理、目标达成监控

### 6.3 附加税率 | `additional_tax_ratio_percent`
- **数据类型**: 浮点数 | **单位**: %
- **业务含义**: 附加税费占保费的比例
- **计算公式**: 根据监管要求和税收政策计算
- **应用场景**: 成本分析、税务管理

---

## 7. 计算逻辑与业务规则

### 7.1 核心计算原则
1. **先聚合绝对值，再计算比率**: 确保聚合场景下的计算准确性
2. **代码计算方法**: 使用Python代码进行指标计算
3. **数据验证**: 自动检查数据完整性和格式一致性
4. **分类标签**: 每个字段都有明确的分类标签，便于管理和使用

### 7.2 计算公式代码示例

```python
def calculate_metrics(data):
    """
    计算各类指标的代码示例
    """
    # 基础比率计算
    data['expense_ratio_percent'] = (data['expense_amount_yuan'] / data['signed_premium_yuan']) * 100
    data['matured_loss_ratio_percent'] = (data['reported_claim_payment_yuan'] / data['matured_premium_yuan']) * 100
    data['maturity_ratio_percent'] = (data['matured_premium_yuan'] / data['signed_premium_yuan']) * 100
    
    # 满期出险率（包含满期率修正）
    data['claim_frequency_percent'] = (
        (data['claim_case_count'] / data['policy_count']) * 
        (data['matured_premium_yuan'] / data['signed_premium_yuan']) * 100
    )
    
    # 边际贡献计算
    data['marginal_contribution_amount_yuan'] = (
        data['matured_premium_yuan'] * 
        (1 - data['matured_loss_ratio_percent']/100 - data['expense_ratio_percent']/100)
    )
    data['marginal_contribution_ratio_percent'] = (
        data['marginal_contribution_amount_yuan'] / data['matured_premium_yuan'] * 100
    )
    
    # 均值计算
    data['average_premium_per_policy_yuan'] = data['signed_premium_yuan'] / data['policy_count']
    data['average_claim_payment_yuan'] = np.where(
        data['claim_case_count'] > 0,
        data['reported_claim_payment_yuan'] / data['claim_case_count'],
        0
    )
    
    # 商业险自主定价系数
    data['commercial_auto_underwriting_factor'] = np.where(
        (data['insurance_type'] == '商业保险') & (data['commercial_premium_before_discount_yuan'] > 0),
        data['signed_premium_yuan'] / data['commercial_premium_before_discount_yuan'],
        None
    )
    
    return data
```

### 7.3 字段关联关系
- **费用率 × 签单保费 = 费用金额**
- **满期边际贡献额 = 满期保费 × (1 - 满期赔付率 - 费用率)**
- **边际贡献率 = 边际贡献额 / 满期保费**
- **满期出险率 = (赔案件数 ÷ 保单件数) × 满期率**
- **案均赔款 × 赔案件数 = 已报告赔款**
- **单均保费 × 保单件数 = 签单保费**

### 7.4 数据质量检查
- **范围检查**: 各比率字段应在合理范围内
- **逻辑检查**: 相关字段之间的逻辑关系应一致
- **完整性检查**: 关键字段不应为空或异常值
- **一致性检查**: 聚合结果与明细数据应保持一致

---

## 8. 使用说明

### 8.1 字段选择指南
- **绝对值字段**: 用于聚合分析和作为其他指标的计算基础
- **率值字段**: 用于比率分析和业务表现评估
- **均值字段**: 用于平均水平分析和结构对比
- **系数字段**: 用于定价策略分析和风险评估

### 8.2 计算顺序建议
1. 首先聚合所有绝对值字段
2. 基于绝对值字段计算率值字段
3. 计算均值字段和系数字段
4. 进行数据质量检查和验证

### 8.3 常见应用场景
- **趋势分析**: 使用时间维度进行周度、月度、年度趋势分析
- **对比分析**: 使用机构维度进行机构间业绩对比
- **风险分析**: 使用风险评级维度进行风险分布分析
- **盈利能力分析**: 使用边际贡献率等指标评估业务盈利能力

---