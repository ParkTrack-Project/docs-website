import React from 'react';
import {useColorMode} from '@docusaurus/theme-common';
import styles from './styles.module.css';

export default function HighlightBlock({children}) {
  const {colorMode} = useColorMode();

  return (
    <div
      className={
        colorMode === 'dark'
          ? styles.dark
          : styles.light
      }
    >
      {children}
    </div>
  );
}
