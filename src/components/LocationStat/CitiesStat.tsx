import Stat from '@/components/Stat';
import useActivities from '@/hooks/useActivities';

// only support China for now
const CitiesStat = ({ onClick }: { onClick: (_city: string) => void }) => {
  const { cities } = useActivities();

  const citiesArr = Object.entries(cities);
  citiesArr.sort((a, b) => b[1] - a[1]);
  return (
    <div className="cursor-pointer">
      {/* 仅给 section 新增 Grid 两列布局类 */}
      <section className="grid grid-cols-2 row-gap-1 column-gap-3">
        {citiesArr.map(([city, distance]) => (
          <Stat
            key={city}
            value={city}
            description={` ${(distance / 1000).toFixed(0)} KM`}
            citySize={1}
            onClick={() => onClick(city)}
          />
        ))}
      </section>
      <hr />
    </div>
  );
};

export default CitiesStat;
