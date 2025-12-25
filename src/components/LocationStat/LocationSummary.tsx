import Stat from '@/components/Stat';
import useActivities from '@/hooks/useActivities';

// only support China for now
const LocationSummary = () => {
  const { years, countries, provinces, cities } = useActivities();
  return (
    <div className="cursor-pointer">
      {/* 核心修改：添加 flex + flex-wrap + grid 类实现两列 */}
      <section className="grid grid-cols-2 gap-4 md:gap-6">
        {years ? (
          <Stat value={`${years.length}`} description=" 年里我跑过" />
        ) : null}
        {countries ? (
          <Stat value={countries.length} description=" 个国家" />
        ) : null}
        {provinces ? (
          <Stat value={provinces.length} description=" 个省份" />
        ) : null}
        {cities ? (
          <Stat value={Object.keys(cities).length} description=" 个城市" />
        ) : null}
      </section>
      <hr />
    </div>
  );
};

export default LocationSummary;
