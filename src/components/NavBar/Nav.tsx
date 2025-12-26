// @/components/NavBar/Nav.tsx
import { useState } from 'react';
import useSiteMetadata from '@/hooks/useSiteMetadata'; // 引用路径不变（只要@别名正确）

const Nav = () => {
  const { navLinks } = useSiteMetadata();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <nav className="flex items-center space-x-2 md:space-x-4">
      {navLinks.map((link, index) => {
        // 渲染普通导航项
        if (!link.isDropdown) {
          return (
            <a
              key={index}
              href={link.url}
              className="px-3 py-2 rounded-lg text-sm md:text-base hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              target={link.url.startsWith('http') ? '_blank' : '_self'}
              rel="noopener noreferrer"
            >
              {link.name}
            </a>
          );
        }

        // 渲染下拉菜单项
        return (
          <div
            key={index}
            className="relative group"
            onMouseEnter={() => setDropdownOpen(true)}
            onMouseLeave={() => setDropdownOpen(false)}
          >
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="px-3 py-2 rounded-lg text-sm md:text-base hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-1"
            >
              {link.name}
              <span className="text-xs">▼</span>
            </button>

            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-900 rounded-lg shadow-lg w-40 z-50 border border-gray-200 dark:border-gray-800">
                {link.dropdownItems.map((item, idx) => (
                  <a
                    key={idx}
                    href={item.url}
                    className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {item.name}
                  </a>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
};

export default Nav;
