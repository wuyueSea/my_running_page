import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import useSiteMetadata from '@/hooks/useSiteMetadata';
import { useTheme, Theme } from '@/hooks/useTheme';
import styles from './style.module.css';

const Header = () => {
  const { logo, siteUrl, navLinks } = useSiteMetadata();
  const { theme: currentTheme, setTheme } = useTheme();
  const [currentIconIndex, setCurrentIconIndex] = useState(0);

  const icons = [
    {
      id: 'light',
      svg: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 3.00464V5.25464M18.364 5.64068L16.773 7.23167M21 12.0046H18.75M18.364 18.3686L16.773 16.7776M12 18.7546V21.0046M7.22703 16.7776L5.63604 18.3686M5.25 12.0046H3M7.22703 7.23167L5.63604 5.64068M15.75 12.0046C15.75 14.0757 14.0711 15.7546 12 15.7546C9.92893 15.7546 8.25 14.0757 8.25 12.0046C8.25 9.93357 9.92893 8.25464 12 8.25464C14.0711 8.25464 15.75 9.93357 15.75 12.0046Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      id: 'dark',
      svg: (
        <svg
          width="22"
          height="23"
          viewBox="0 0 22 23"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M21.7519 15.0137C20.597 15.4956 19.3296 15.7617 18 15.7617C12.6152 15.7617 8.25 11.3965 8.25 6.01171C8.25 4.68211 8.51614 3.41468 8.99806 2.25977C5.47566 3.72957 3 7.20653 3 11.2617C3 16.6465 7.36522 21.0117 12.75 21.0117C16.8052 21.0117 20.2821 18.536 21.7519 15.0137Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
  ];

  useEffect(() => {
    if (currentTheme === 'light') {
      setCurrentIconIndex(1);
    } else {
      setCurrentIconIndex(0);
    }
  }, [currentTheme]);

  const handleToggle = () => {
    const targetTheme = currentTheme === 'light' ? 'dark' : 'light';
    setCurrentIconIndex(targetTheme === 'light' ? 0 : 1);
    setTheme(targetTheme as Theme);
  };

  const targetIcon = icons[currentIconIndex];

  return (
    <>
      <nav className="mx-auto mt-12 flex w-full min-w-max max-w-screen-4xl items-center justify-between pl-6 lg:px-16">
        <div className="w-1/4">
          <Link to={siteUrl}>
            <picture>
              <img className="h-16 w-16 rounded-full" alt="logo" src={logo} />
            </picture>
          </Link>
        </div>
        <div className="flex w-3/4 items-center justify-end text-right">
          {navLinks.map((n, i) => {
            if (!n.isDropdown) {
              return (
                <a
                  key={i}
                  href={n.url}
                  className="mr-3 text-lg lg:mr-4 lg:text-base hover:text-[var(--color-brand)] transition-colors"
                  target={n.url.startsWith('http') ? '_blank' : '_self'}
                  rel="noopener noreferrer"
                >
                  {n.name}
                </a>
              );
            }

            return (
              <div
                key={i}
                className="relative group mr-3 lg:mr-4"
              >
                <button
                  className="text-lg lg:text-base bg-transparent border-0 cursor-pointer flex items-center gap-1 hover:text-[var(--color-brand)] transition-colors"
                  aria-haspopup="true"
                  aria-expanded="false"
                >
                  {n.name}
                  <svg className="w-3 h-3 ml-0.5" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 4L6 7L9 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-in-out z-50">
                  <div className="bg-[#f8f9fa] dark:bg-[#2d3748] rounded-md shadow-md border border-gray-200 dark:border-gray-700 w-24 overflow-hidden">
                    {n.dropdownItems.map((item, idx) => (
                      <a
                        key={idx}
                        href={item.url}
                        className="block px-4 py-2.5 text-base text-left text-gray-800 dark:text-gray-200 hover:bg-[var(--color-head-nav)] transition-colors"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {item.name}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

          <div className="ml-4 flex items-center space-x-2">
            <button
              type="button"
              onClick={handleToggle}
              className={`${styles.themeButton} ${styles.themeButtonActive}`}
              aria-label={`Switch to ${targetIcon.id} theme`}
              title={`Switch to ${targetIcon.id} theme`}
            >
              <div className={styles.iconWrapper}>{targetIcon.svg}</div>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Header;
