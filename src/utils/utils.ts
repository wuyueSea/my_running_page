import * as mapboxPolyline from '@mapbox/polyline';
import gcoord from 'gcoord';
import { WebMercatorViewport } from '@math.gl/web-mercator';
import { RPGeometry } from '@/static/run_countries';
import { chinaCities } from '@/static/city';
import {
  MAIN_COLOR,
  MUNICIPALITY_CITIES_ARR,
  NEED_FIX_MAP,
  RUN_TITLES,
  RIDE_COLOR,
  VIRTUAL_RIDE_COLOR,
  HIKE_COLOR,
  SWIM_COLOR,
  ROWING_COLOR,
  ROAD_TRIP_COLOR,
  FLIGHT_COLOR,
  RUN_COLOR,
  KAYAKING_COLOR,
  SNOWBOARD_COLOR,
  TRAIL_RUN_COLOR,
  RICH_TITLE,
  MAP_TILE_STYLES,
  MAP_TILE_STYLE_DARK,
  getRuntimeSingleColor,
  MAIN_COLOR_LIGHT,
  RUN_TRAIL_COLOR,
  CYCLING_COLOR,
  HIKING_COLOR,
  WALKING_COLOR,
  SWIMMING_COLOR,
} from './const';
import {
  FeatureCollection,
  LineString,
  Feature,
  GeoJsonProperties,
} from 'geojson';
import { getMapThemeFromCurrentTheme } from '@/hooks/useTheme';

export type Coordinate = [number, number];

export type RunIds = Array<number> | [];

export interface Activity {
  run_id: number;
  name: string;
  distance: number;
  moving_time: string;
  type: string;
  subtype: string;
  start_date: string;
  start_date_local: string;
  location_country?: string | null;
  summary_polyline?: string | null;
  average_heartrate?: number | null;
  elevation_gain: number | null;
  average_speed: number;
  streak: number;
}

const titleForShow = (run: Activity): string => {
  const date = run.start_date_local.slice(0, 11);
  const distance = (run.distance / 1000.0).toFixed(2);
  let name = 'Run';
  if (run.name) {
    name = run.name;
  }
  return `${name} ${date} ${distance} KM ${
    !run.summary_polyline ? '(No map data for this run)' : ''
    }`;
};

const formatPace = (d: number): string => {
  if (Number.isNaN(d) || d == 0) return '0';
  const pace = (1000.0 / 60.0) * (1.0 / d);
  const minutes = Math.floor(pace);
  const seconds = Math.floor((pace - minutes) * 60.0);
  return `${minutes}'${seconds.toFixed(0).toString().padStart(2, '0')}"`;
};

const convertMovingTime2Sec = (moving_time: string): number => {
  if (!moving_time) {
    return 0;
  }
  // moving_time : '2 days, 12:34:56' or '12:34:56';
  const splits = moving_time.split(', ');
  const days = splits.length == 2 ? parseInt(splits[0]) : 0;
  const time = splits.splice(-1)[0];
  const [hours, minutes, seconds] = time.split(':').map(Number);
  const totalSeconds = ((days * 24 + hours) * 60 + minutes) * 60 + seconds;
  return totalSeconds;
};

const formatRunTime = (moving_time: string): string => {
  const totalSeconds = convertMovingTime2Sec(moving_time);
  const seconds = totalSeconds % 60;
  const minutes = (totalSeconds - seconds) / 60;
  if (minutes === 0) {
    return seconds + 's';
  }
  return minutes + 'min';
};

// for scroll to the map
const scrollToMap = () => {
  const mapContainer = document.getElementById('map-container');
  if (mapContainer) {
    mapContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

const extractCities = (str: string): string[] => {
  const locations = [];
  let match;
  const pattern = /([\u4e00-\u9fa5]{2,}(市|自治州|特别行政区|盟|地区))/g;
  while ((match = pattern.exec(str)) !== null) {
    locations.push(match[0]);
  }

  return locations;
};

const extractDistricts = (str: string): string[] => {
  const locations = [];
  let match;
  const pattern = /([\u4e00-\u9fa5]{2,}(区|县))/g;
  while ((match = pattern.exec(str)) !== null) {
    locations.push(match[0]);
  }

  return locations;
};

const extractCoordinate = (str: string): [number, number] | null => {
  const pattern = /'latitude': ([-]?\d+\.\d+).*?'longitude': ([-]?\d+\.\d+)/;
  const match = str.match(pattern);

  if (match) {
    const latitude = parseFloat(match[1]);
    const longitude = parseFloat(match[2]);
    return [longitude, latitude];
  }

  return null;
};

const cities = chinaCities.map((c) => c.name);
const locationCache = new Map<number, ReturnType<typeof locationForRun>>();
// what about oversea?
const locationForRun = (
  run: Activity
): {
  country: string;
  province: string;
  city: string;
  coordinate: [number, number] | null;
} => {
  if (locationCache.has(run.run_id)) {
    return locationCache.get(run.run_id)!;
  }
  let location = run.location_country;
  let [city, province, country] = ['', '', ''];
  let coordinate = null;
  if (location) {
    // Only for Chinese now
    // should filter 臺灣
    const cityMatch = extractCities(location);
    const provinceMatch = location.match(/[\u4e00-\u9fa5]{2,}(省|自治区)/);

    if (cityMatch) {
      city = cities.find((value) => cityMatch.includes(value)) as string;

      if (!city) {
        city = '';
      }
    }
    if (provinceMatch) {
      [province] = provinceMatch;
      // try to extract city coord from location_country info
      coordinate = extractCoordinate(location);
    }
    const l = location.split(',');
    // or to handle keep location format
    let countryMatch = l[l.length - 1].match(
      /[\u4e00-\u9fa5].*[\u4e00-\u9fa5]/
    );
    if (!countryMatch && l.length >= 3) {
      countryMatch = l[2].match(/[\u4e00-\u9fa5].*[\u4e00-\u9fa5]/);
    }
    if (countryMatch) {
      [country] = countryMatch;
    }
  }
  if (MUNICIPALITY_CITIES_ARR.includes(city)) {
    province = city;
    if (location) {
      const districtMatch = extractDistricts(location);
      if (districtMatch.length > 0) {
        city = districtMatch[districtMatch.length - 1];
      }
    }
  }

  // 有一笔数据位置反推数据不对，手动修复
  /*\u8299\u84c9\u4e2d\u8def	芙蓉中路	长沙市的一条核心主干道
    \u57ce\u5357\u8def\u8857\u9053	城南路街道	天心区下辖的街道办
    \u5929\u5fc3\u533a	天心区	长沙市的市辖区（核心城区）
     \u6e56\u5357\u7701	湖南省	省级行政区
       410011	410011	附带编码（非标准行政代码）
        \u4e2d\u56fd	中国	国家*/
  if (location.includes('\u8299\u84c9\u4e2d\u8def')) {
    city = '长沙市';
  }
  const r = { country, province, city, coordinate };
  locationCache.set(run.run_id, r);
  return r;
};

const intComma = (x = '') => {
  if (x.toString().length <= 5) {
    return x;
  }
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const pathForRun = (run: Activity): Coordinate[] => {
  try {
    if (!run.summary_polyline) {
      return [];
    }
    const c = mapboxPolyline.decode(run.summary_polyline);
    // reverse lat long for mapbox
    c.forEach((arr) => {
      [arr[0], arr[1]] = !NEED_FIX_MAP
        ? [arr[1], arr[0]]
        : gcoord.transform([arr[1], arr[0]], gcoord.GCJ02, gcoord.WGS84);
    });
    // try to use location city coordinate instead , if runpath is incomplete
    if (c.length === 2 && String(c[0]) === String(c[1])) {
      const { coordinate } = locationForRun(run);
      if (coordinate?.[0] && coordinate?.[1]) {
        return [coordinate, coordinate];
      }
    }
    return c;
  } catch (_err) {
    return [];
  }
};


/*  高驰适配新增 */
const colorForRun = (run: Activity): string => {
  switch (run.type) {
    case 'Run': {
      if (run.subtype === 'trail') {
        return RUN_TRAIL_COLOR;
      } else if (run.subtype === 'generic') {
        return RUN_COLOR;
      }
      return RUN_COLOR;
    }
    case 'cycling':
      return CYCLING_COLOR;
    case 'hiking':
      return HIKING_COLOR;
    case 'walking':
      return WALKING_COLOR;
    case 'swimming':
      return SWIMMING_COLOR;
    default:
      return MAIN_COLOR;
  }
};

const geoJsonForRuns = (runs: Activity[]): FeatureCollection<LineString> => ({
  type: 'FeatureCollection',
  features: runs.map((run) => {
    const points = pathForRun(run);
    // const color = colorFromType(run.type);
    const color = colorForRun(run);
    return {
      type: 'Feature',
      properties: {
        color: color,
      },
      geometry: {
        type: 'LineString',
        coordinates: points,
        workoutType: run.type,
      },
      name: run.name,
    };
  }),
});

const geoJsonForMap = async (): Promise<FeatureCollection<RPGeometry>> => {
  const [{ chinaGeojson }, worldGeoJson] = await Promise.all([
    import('@/static/run_countries'),
    import('@surbowl/world-geo-json-zh/world.zh.json'),
  ]);

  return {
    type: 'FeatureCollection',
    features: [
      ...worldGeoJson.default.features,
      ...chinaGeojson.features,
    ] as Feature<RPGeometry, GeoJsonProperties>[],
  };
};

const titleForType = (type: string): string => {
  switch (type) {
    case 'Run':
      return RUN_TITLES.RUN_TITLE;
    case 'Full Marathon':
      return RUN_TITLES.FULL_MARATHON_RUN_TITLE;
    case 'Half Marathon':
      return RUN_TITLES.HALF_MARATHON_RUN_TITLE;
    /* 新加高驰运动类型 start*/
    case 'cycling':
      return RUN_TITLES.COROS_RIDE_TITLE;
    case 'hiking':
      return RUN_TITLES.COROS_HIKE_TITLE;
    case 'walking':
      return RUN_TITLES.COROS_WALK_TITLE;
    case 'generic':
      return RUN_TITLES.COROS_GENERIC_TITLE;
    case 'swimming':
      return RUN_TITLES.COROS_SWIM_TITLE;
    case 'trail':
      return RUN_TITLES.COROS_TRAIL_RUN_TITLE;
    case 'track':
      return RUN_TITLES.COROS_TRACK_RUN_TITLE;
    case 'indoor_running':
      return RUN_TITLES.COROS_IDOOR_RUN_TITLE;
    /*  新加高驰运动类型 end */
    case 'Trail Run':
      return RUN_TITLES.TRAIL_RUN_TITLE;
    case 'Ride':
      return RUN_TITLES.RIDE_TITLE;
    case 'Indoor Ride':
      return RUN_TITLES.INDOOR_RIDE_TITLE;
    case 'VirtualRide':
      return RUN_TITLES.VIRTUAL_RIDE_TITLE;
    case 'Hike':
      return RUN_TITLES.HIKE_TITLE;
    case 'Rowing':
      return RUN_TITLES.ROWING_TITLE;
    case 'Swim':
      return RUN_TITLES.SWIM_TITLE;
    case 'RoadTrip':
      return RUN_TITLES.ROAD_TRIP_TITLE;
    case 'Flight':
      return RUN_TITLES.FLIGHT_TITLE;
    case 'Kayaking':
      return RUN_TITLES.KAYAKING_TITLE;
    case 'Snowboard':
      return RUN_TITLES.SNOWBOARD_TITLE;
    case 'Ski':
      return RUN_TITLES.SKI_TITLE;
    default:
      return RUN_TITLES.RUN_TITLE;
  }
};


const typeForRun = (run: Activity): string => {
  const type = run.type;
  const subtype = run.subtype;
  const distance = run.distance / 1000; // 改用const（无重新赋值，更规范）
  const location_country = run.location_country;

  // 打印关键参数和计算结果（方便调试）
  // console.log('===== typeForRun 函数调试信息 =====');

  /*  if (distance > 65) {
      console.log('原始run:', run);
      console.log('原始type:', type);
      console.log('原始subtype:', subtype);
      console.log('计算后距离(km):', distance);
    }*/

  let result: string; // 先定义结果变量，方便后续打印
  switch (type) {
    case 'Run':
      if(subtype == 'trail'){
        result = 'trail';
      } else if(subtype == 'track'){
        result = 'track';
      } else if(subtype == 'indoor_running' || location_country == ''){ // 高驰旧版跑步机无子类别
        result = 'indoor_running';
      } else if (distance >= 42.2) {
        result = 'Full Marathon';
      } else if (distance >= 21.1) {
        result = 'Half Marathon';
      } else {
        result = 'Run';
      }
      break;
    case 'Trail Run':
      if (distance >= 42.2) {
        result = 'Full Marathon';
      } else if (distance >= 21.1) {
        result = 'Half Marathon';
      } else {
        result = 'Trail Run';
      }
      break;
    default:
      result = type;
      break;
  }

  // 打印最终输出结果
  // console.log('函数最终返回值:', result);
  // console.log('====================================\n');
  /*  if (distance > 65) {
      console.log('函数最终返回值:', result);
    }*/
  return result;
};

/*const typeForRun = (run: Activity): string => {
  const type = run.type;
  const subtype = run.subtype;
  var distance = run.distance / 1000;
  switch (type) {
    case 'Run':
      if(subtype == 'trail'){
        return 'trail';
      }
      if(subtype == 'indoor_running'){
        return 'indoor_running';
      }
      if (distance >= 40) {
        return 'Full Marathon';
      } else if (distance > 20) {
        return 'Half Marathon';
      }
      return 'Run';
    case 'Trail Run':
      if (distance >= 40) {
        return 'Full Marathon';
      } else if (distance > 20) {
        return 'Half Marathon';
      }
      return 'Trail Run';
    default:
      return type;
  }
};*/

const titleForRunNoCity = (run: Activity): string => {
    return titleForType(typeForRun(run));
};

const titleForRun = (run: Activity): string => {
  const type = run.type;
  let activity_sport = '';
  if (RICH_TITLE) {
    // 1. try to use user defined name
    if (run.name != '') {
      return run.name;
    }
    // 2. try to use location+type if the location is available, eg. 'Shanghai Run'
    const { city } = locationForRun(run);
    activity_sport = titleForType(typeForRun(run));
    // console.log('activity_sport:', activity_sport);
    if (city && city.length > 0 && activity_sport.length > 0) {
      return `${city} ${activity_sport}`;
    }
    return activity_sport;
  }
  // 3. use time+length if location or type is not available
  /*if (type == 'Run' || type == 'Trail Run') {
    const runDistance = run.distance / 1000;
    if (runDistance >= 40) {
      return RUN_TITLES.FULL_MARATHON_RUN_TITLE;
    } else if (runDistance > 20) {
      return RUN_TITLES.HALF_MARATHON_RUN_TITLE;
    }
  }*/
  //return titleForType(type);
  return activity_sport;
};

const colorFromType = (workoutType: string): string => {
  switch (workoutType) {
    case 'Run':
      return getRuntimeSingleColor(RUN_COLOR);
    case 'Trail Run':
      return getRuntimeSingleColor(TRAIL_RUN_COLOR);
    case 'Ride':
    case 'Indoor Ride':
      return getRuntimeSingleColor(RIDE_COLOR);
    case 'VirtualRide':
      return getRuntimeSingleColor(VIRTUAL_RIDE_COLOR);
    case 'Hike':
      return getRuntimeSingleColor(HIKE_COLOR);
    case 'Rowing':
      return getRuntimeSingleColor(ROWING_COLOR);
    case 'Swim':
      return getRuntimeSingleColor(SWIM_COLOR);
    case 'RoadTrip':
      return getRuntimeSingleColor(ROAD_TRIP_COLOR);
    case 'Flight':
      return getRuntimeSingleColor(FLIGHT_COLOR);
    case 'Kayaking':
      return getRuntimeSingleColor(KAYAKING_COLOR);
    case 'Snowboard':
    case 'Ski':
      return getRuntimeSingleColor(SNOWBOARD_COLOR);
    default:
      return getRuntimeSingleColor();
  }
};

export interface IViewState {
  longitude?: number;
  latitude?: number;
  zoom?: number;
}

const getBoundsForGeoData = (
  geoData: FeatureCollection<LineString>
): IViewState => {
  const { features } = geoData;
  let points: Coordinate[] = [];
  // find first have data
  for (const f of features) {
    if (f.geometry.coordinates.length) {
      points = f.geometry.coordinates as Coordinate[];
      break;
    }
  }
  if (points.length === 0) {
    return { longitude: 20, latitude: 20, zoom: 3 };
  }
  if (points.length === 2 && String(points[0]) === String(points[1])) {
    return { longitude: points[0][0], latitude: points[0][1], zoom: 9 };
  }
  // Calculate corner values of bounds
  const pointsLong = points.map((point) => point[0]) as number[];
  const pointsLat = points.map((point) => point[1]) as number[];
  const cornersLongLat: [Coordinate, Coordinate] = [
    [Math.min(...pointsLong), Math.min(...pointsLat)],
    [Math.max(...pointsLong), Math.max(...pointsLat)],
  ];
  const viewState = new WebMercatorViewport({
    width: 800,
    height: 600,
  }).fitBounds(cornersLongLat, { padding: 200 });
  let { longitude, latitude, zoom } = viewState;
  if (features.length > 1) {
    zoom = 11.5;
  }
  return { longitude, latitude, zoom };
};

const filterYearRuns = (run: Activity, year: string) => {
  if (run && run.start_date_local) {
    return run.start_date_local.slice(0, 4) === year;
  }
  return false;
};

const filterCityRuns = (run: Activity, city: string) => {
  if (run && run.location_country) {
    return run.location_country.includes(city);
  }
  return false;
};
const filterTitleRuns = (run: Activity, title: string) =>
  titleForRun(run) === title;

const filterTypeName = (run: Activity, typeName: string) => {
  /* 适配高驰修改 */
  switch (typeName) {
    case '全程马拉松':
      return (
        (run.type === 'Run' || run.type === 'Trail Run') && run.distance >= 42200
      );
    case '半程马拉松':
      return (
        (run.type === 'Run' || run.type === 'Trail Run') &&
        run.distance < 42200 &&
        run.distance >= 21100
      );
    case '越野跑':
      return (
        run.type === 'Run' && run.subtype === 'trail'
      );
    default:
      return run.type === type;
  }
};

const filterTypeRuns = (run: Activity, type: string) => {
  return run.type === type;
  // console.log('原始run:', run.type);
/*  switch (type) {
    case 'cycling':
      return '骑行';
    case 'hiking':
      return '徒步';
    case 'walking':
      return '健走';
    case 'generic':
      return '户外有氧';
    case 'swimming':
      return '游泳';
    default:
      // 跑步
      return 'Run'
  }*/
};

const filterAndSortRuns = (
  activities: Activity[],
  item: string,
  filterFunc: (_run: Activity, _bvalue: string) => boolean,
  sortFunc: (_a: Activity, _b: Activity) => number,
  item2: string | null,
  filterFunc2: ((_run: Activity, _bvalue: string) => boolean) | null
) => {
  let s = activities;
  if (item !== 'Total') {
    s = activities.filter((run) => filterFunc(run, item));
  }
  if (filterFunc2 != null && item2 != null) {
    s = s.filter((run) => filterFunc2(run, item2));
  }
  return s.sort(sortFunc);
};

const sortDateFunc = (a: Activity, b: Activity) => {
  return (
    new Date(b.start_date_local.replace(' ', 'T')).getTime() -
    new Date(a.start_date_local.replace(' ', 'T')).getTime()
  );
};
const sortDateFuncReverse = (a: Activity, b: Activity) => sortDateFunc(b, a);

const getMapStyle = (vendor: string, styleName: string, token: string) => {
  const style = (MAP_TILE_STYLES as any)[vendor][styleName];
  if (!style) {
    return MAP_TILE_STYLES.default;
  }
  if (vendor === 'maptiler' || vendor === 'stadiamaps') {
    return style + token;
  }
  return style;
};

const isTouchDevice = () => {
  if (typeof window === 'undefined') return false;
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    window.innerWidth <= 768
  ); // Consider small screens as touch devices
};

/**
 * Determines the appropriate map theme based on current settings
 * @returns The map theme style to use
 */
const getMapTheme = (): string => {
  if (typeof window === 'undefined') return MAP_TILE_STYLE_DARK;

  // Check for explicit theme in DOM
  const dataTheme = document.documentElement.getAttribute('data-theme') as
    | 'light'
    | 'dark'
    | null;

  // Check for saved theme in localStorage
  const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;

  // Determine theme based on priority:
  // 1. DOM attribute
  // 2. localStorage
  // 3. Default to dark theme
  if (dataTheme) {
    return getMapThemeFromCurrentTheme(dataTheme);
  } else if (savedTheme) {
    return getMapThemeFromCurrentTheme(savedTheme);
  } else {
    return getMapThemeFromCurrentTheme('dark');
  }
};

export {
  titleForShow,
  formatPace,
  scrollToMap,
  locationForRun,
  intComma,
  pathForRun,
  geoJsonForRuns,
  geoJsonForMap,
  titleForRun,
  titleForRunNoCity,
  typeForRun,
  titleForType,
  filterYearRuns,
  filterCityRuns,
  filterTitleRuns,
  filterAndSortRuns,
  sortDateFunc,
  sortDateFuncReverse,
  getBoundsForGeoData,
  filterTypeRuns,
  filterTypeName,
  colorFromType,
  formatRunTime,
  convertMovingTime2Sec,
  getMapStyle,
  isTouchDevice,
  getMapTheme,
};
