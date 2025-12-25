interface ISiteMetadataResult {
  siteTitle: string;
  siteUrl: string;
  description: string;
  logo: string;
  navLinks: {
    name: string;
    url: string;
  }[];
}

const getBasePath = () => {
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
      name: '数据分析',
      url: `${getBasePath()}/summary`,
    },
    {
      name: '高驰',
      url: `https://www.coros.com/`,
    },
    {
      name: '马拉松',
      url: `https://www.runchina.org.cn/#/home`,
    },
    {
      name: 'ITRA',
      url: `https://itra.run/`,
    },
    {
      name: 'UTMB',
      url: 'https://utmb.world/',
    },
    {
      name: '感谢yihong',
      url: 'https://github.com/yihong0618/running_page',
    },
  ],
};

export default data;
