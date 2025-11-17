import React from 'react';
import {useColorMode} from '@docusaurus/theme-common';
import styles from './styles.module.css';

export default function HighlightParam({children}) {
  const {colorMode} = useColorMode(); // light or dark

  return (
    <span
      className={
        colorMode === 'dark'
          ? styles.darkMode
          : styles.lightMode
      }
    >
      {children}
    </span>
  );
}
