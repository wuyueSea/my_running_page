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
  siteTitle: "吴越的跑步主页",
  siteUrl: 'https://wuyuesea.qzz.io/',
  logo: '/images/logoHead.jpg',
  description: '高馳记录跑步',
  navLinks: [
    {
      name: 'Summary',
      url: `${getBasePath()}/summary`,
    },
    {
      name: 'About',
      url: 'https://blog.wdoc.top',
    },
  ],
};

export default data;
