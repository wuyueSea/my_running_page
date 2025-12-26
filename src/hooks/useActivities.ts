import { useMemo } from 'react';
import { locationForRun, titleForRun, titleForRunNoCity } from '@/utils/utils';
import activities from '@/static/activities.json';

// standardize country names for consistency between mapbox and activities data
const standardizeCountryName = (country: string): string => {
  if (country.includes('美利坚合众国')) {
    return '美国';
  }
  if (country.includes('英国')) {
    return '英国';
  }
  if (country.includes('印度尼西亚')) {
    return '印度尼西亚';
  }
  if (country.includes('韩国')) {
    return '韩国';
  }
  if (country.includes('斯里兰卡')) {
    return '斯里兰卡';
  }
  if (country.includes('所罗门群岛')) {
    return '所罗门群岛';
  }
  if (country.includes('拉脱维亚')) {
    return '拉脱维亚';
  }
  if (country.includes('爱沙尼亚')) {
    return '爱沙尼亚';
  }
  if (country.includes('奧地利')) {
    return '奥地利';
  }
  if (country.includes('澳大利亚')) {
    return '澳大利亚';
  } else {
    return country;
  }
};

// 修正：将treadmillItem的const改为let（因为需要重新赋值）
const sortRunPeriod = (runPeriod: Record<string, number>) => {
  // 错误点修复：const → let
  let treadmillItem: [string, number] | null = null; // 跑步机模式条目
  const cityGroups: Record<string, {
    total: number, // 城市总次数
    items: [string, number][] // 该城市下的[类型名, 次数]
  }> = {};

  // 2. 遍历runPeriod，拆分城市和类型，完成分组
  Object.entries(runPeriod).forEach(([fullName, count]) => {
    // 判定跑步机模式：无城市（名称不含空格，或分割后城市为空/为跑步机模式）
    const isTreadmill = !fullName.includes(' ') || fullName.includes('跑步机');

    if (isTreadmill) {
      // 跑步机模式：单独存储（置顶用）
      treadmillItem = [fullName, count];
    } else {
      // 非跑步机模式：按第一个空格分割城市和类型
      const [cityName, typeName] = fullName.split(' ', 2);
      // 初始化城市分组
      if (!cityGroups[cityName]) {
        cityGroups[cityName] = { total: 0, items: [] };
      }
      // 累计城市总次数 + 添加该城市下的类型条目
      cityGroups[cityName].total += count;
      cityGroups[cityName].items.push([fullName, count]);
    }
  });

  // 3. 对城市分组按「总次数降序」排序
  const sortedCityGroups = Object.entries(cityGroups).sort((a, b) => {
    return b[1].total - a[1].total; // 总次数多的城市排前面
  });

  // 4. 对每个城市下的类型按「次数降序」排序，扁平化数组
  const sortedCityItems: [string, number][] = [];
  sortedCityGroups.forEach(([_, groupData]) => {
    const sortedItems = groupData.items.sort((a, b) => b[1] - a[1]); // 同城市内类型次数降序
    sortedCityItems.push(...sortedItems);
  });

  // 5. 组合最终结果：跑步机模式放第一条，然后是排序后的城市条目
  const finalSorted: [string, number][] = [];
  if (treadmillItem) {
    finalSorted.push(treadmillItem);
  }
  finalSorted.push(...sortedCityItems);

  return finalSorted;
};

const useActivities = () => {
  const processedData = useMemo(() => {
    const cities: Record<string, number> = {};
    const runPeriod: Record<string, number> = {};
    const runPeriodNoCity: Record<string, number> = {};
    const provinces: Set<string> = new Set();
    const countries: Set<string> = new Set();
    const years: Set<string> = new Set();

    activities.forEach((run) => {
      const location = locationForRun(run);
      const periodName = titleForRun(run);
      // 获取总的全程马拉松、半程马拉松、越野跑次数（不区分城市）
      const periodNameNoCity = titleForRunNoCity(run);

      // 1. 原有逻辑：统计periodName（含越野跑）的基础次数
      if (periodName) {
        runPeriod[periodName] = runPeriod[periodName] ? runPeriod[periodName] + 1 : 1;

        // 2. 新增核心逻辑：仅当periodName为"越野跑"时，按距离统计全程/半程马拉松
        if (periodNameNoCity === '半程马拉松' || periodNameNoCity === '全程马拉松' || periodNameNoCity === '越野跑') {
          runPeriodNoCity[periodNameNoCity] = runPeriodNoCity[periodNameNoCity] ? runPeriodNoCity[periodNameNoCity] + 1 : 1;
          if (periodNameNoCity === '越野跑') {
            // 处理distance为空的边界情况，兜底为0
            const distanceMeter = run.distance || 0;
            const distanceKm = distanceMeter / 1000; // 转换为公里

            // 全程马拉松：距离 ≥ 42.2km → 全程马拉松次数+1
            if (distanceKm >= 42.2) {
              runPeriodNoCity['全程马拉松'] = runPeriodNoCity['全程马拉松'] ? runPeriodNoCity['全程马拉松'] + 1 : 1;
            }
            // 半程马拉松：距离 ≥21.1km 且 <42.2km → 半程马拉松次数+1（避免重复统计全程）
            else if (distanceKm >= 21.1) {
              runPeriodNoCity['半程马拉松'] = runPeriodNoCity['半程马拉松'] ? runPeriodNoCity['半程马拉松'] + 1 : 1;
            }
          }
        }
      }

      // 3. 原有逻辑：统计城市、省份、国家、年份（完全保留）
      const { city, province, country } = location;
      // drop only one char city
      if (city.length > 1) {
        cities[city] = cities[city] ? cities[city] + (run.distance || 0) : (run.distance || 0);
      }
      if (province) provinces.add(province);
      if (country) countries.add(standardizeCountryName(country));
      const year = run.start_date_local.slice(0, 4);
      years.add(year);
    });

    const yearsArray = [...years].sort().reverse();
    const thisYear = yearsArray[0] || '';

    // 新增：生成排序后的runPeriod数组
    const sortedRunPeriod = sortRunPeriod(runPeriod);

    return {
      activities,
      years: yearsArray,
      countries: [...countries],
      provinces: [...provinces],
      cities,
      runPeriod, // 原始未排序的runPeriod（保留）
      sortedRunPeriod, // 新增：按规则排序后的runPeriod（用于展示）
      runPeriodNoCity,
      thisYear,
    };
  }, []); // Empty dependency array since activities is static

  return processedData;
};

export default useActivities;
