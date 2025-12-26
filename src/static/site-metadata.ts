interface ISiteMetadataResult {
  siteTitle: string;
  siteUrl: string;
  description: string;
  logo: string;
  navLinks: (
    | {
    name: string;
    url: string;
    isDropdown?: never; // 普通导航项
  }
    | {
    name: string; // 下拉菜单标题
    isDropdown: true;
    dropdownItems: {
      name: string;
      url: string;
    }[]; // 下拉菜单项
  }
    )[];
}

export const getBasePath = () => {
  const baseUrl = import.meta.env.BASE_URL;
  return baseUrl === '/' ? '' : baseUrl;
};

const data: ISiteMetadataResult = {
  siteTitle: "大海的运动旅程",
  siteUrl: 'https://wuyuesea.qzz.io/',
  logo: '/images/logohead.png',
  description: '高驰记录跑步',
  navLinks: [
    {
      name: '高驰',
      url: `https://www.coros.com/`,
    },
    // 合并为下拉菜单
    {
      name: '赛事',
      isDropdown: true,
      dropdownItems: [
        { name: '马拉松', url: `https://www.runchina.org.cn/#/home` },
        { name: 'ITRA', url: `https://itra.run/` },
        { name: 'UTMB', url: 'https://utmb.world/' },
      ],
    },
    {
      name: '感谢',
      isDropdown: true,
      dropdownItems: [
        { name: 'yihong', url: `https://github.com/yihong0618/running_page` },
        { name: 'ben', url: `https://github.com/ben-29/workouts_page` },
        { name: 'flavored', url: 'https://github.com/Flavored4179/running_page' },
      ],
    },
  ],
};

export default data;
