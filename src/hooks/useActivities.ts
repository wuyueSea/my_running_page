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
        if (periodNameNoCity === '半程马拉松'|| periodNameNoCity === '全程马拉松'|| periodNameNoCity === '越野跑') {
          runPeriodNoCity[periodNameNoCity] = runPeriodNoCity[periodNameNoCity] ? runPeriodNoCity[periodNameNoCity] + 1 : 1;
          if(periodNameNoCity === '越野跑'){
            // 处理distance为空的边界情况，兜底为0
            const distanceMeter = run.distance || 0;
            const distanceKm = distanceMeter / 1000; // 转换为公里

            // 全程马拉松：距离 > 40km → 全程马拉松次数+1
            if (distanceKm >= 42.2) {
              runPeriodNoCity['全程马拉松'] = runPeriodNoCity['全程马拉松'] ? runPeriodNoCity['全程马拉松'] + 1 : 1;
            }
            // 半程马拉松：距离 > 20km 且 ≤ 40km → 半程马拉松次数+1（避免重复统计全程）
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

    return {
      activities,
      years: yearsArray,
      countries: [...countries],
      provinces: [...provinces],
      cities,
      runPeriod,
      runPeriodNoCity,
      thisYear,
    };
  }, []); // Empty dependency array since activities is static

  return processedData;
};

export default useActivities;
