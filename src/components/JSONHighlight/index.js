import React from 'react';
import styles from './styles.module.css';
import {useColorMode} from '@docusaurus/theme-common';

export default function JSONHighlight({data, highlight = []}) {
  const {colorMode} = useColorMode();

  function renderValue(value, indent = 0) {
    const pad = ' '.repeat(indent);

    if (Array.isArray(value)) {
      return (
        <>
          {pad}[{"\n"}
          {value.map((v, i) => (
            <React.Fragment key={i}>
              {renderValue(v, indent + 2)}
              {i < value.length - 1 ? ',' : ''}
              {"\n"}
            </React.Fragment>
          ))}
          {pad}]
        </>
      );
    }

    if (typeof value === 'object' && value !== null) {
      return (
        <>
          {pad}
          {"{"}
          {"\n"}
          {Object.entries(value).map(([key, val], i) => {
            const isHighlighted = highlight.includes(key);
            return (
              <React.Fragment key={key}>
                <span
                  className={
                    isHighlighted
                      ? colorMode === 'dark'
                        ? styles.dark
                        : styles.light
                      : ''
                  }
                >
                  {pad}  "{key}": {renderSimple(val, indent + 2)}
                </span>
                {i < Object.keys(value).length - 1 ? ',' : ''}
                {"\n"}
              </React.Fragment>
            );
          })}
          {pad}{"}"}
        </>
      );
    }

    return pad + JSON.stringify(value);
  }

  function renderSimple(value, indent) {
    if (typeof value === 'object' && value !== null) {
      return renderValue(value, indent);
    }
    return JSON.stringify(value);
  }

  return <pre className={styles.pre}>{renderValue(data, 0)}</pre>;
}
