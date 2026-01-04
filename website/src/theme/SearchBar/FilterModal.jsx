import React from 'react';
import styles from './SearchBar.module.css';
import { translate } from "@docusaurus/Translate";

export function FilterModal({ isOpen, onClose, availableContexts, selectedContexts, onSelectionChange }) {
  if (!isOpen) return null;

  const handleToggle = (context) => {
    if (selectedContexts.includes(context)) {
      onSelectionChange(selectedContexts.filter(c => c !== context));
    } else {
      onSelectionChange([...selectedContexts, context]);
    }
  };

  const handleSelectAll = () => {
    onSelectionChange([]);
  };

  // Helper to format context names nicely (e.g. "project_a" -> "Project A")
  const formatName = (name) => {
    if (name === 'docs') return 'Tutorials'; // Mapping 'docs' to something more user friendly if needed
    return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Filter Search</h3>
          <button className={styles.closeButton} onClick={onClose}>&times;</button>
        </div>
        <div className={styles.modalBody}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={selectedContexts.length === 0}
              onChange={handleSelectAll}
            />
            <span className={styles.labelText}>Search All</span>
          </label>
          <hr className={styles.divider} />
          {availableContexts.map(context => (
            <label key={context} className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={selectedContexts.includes(context)}
                onChange={() => handleToggle(context)}
              />
              <span className={styles.labelText}>{formatName(context)}</span>
            </label>
          ))}
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.applyButton} onClick={onClose}>Apply</button>
        </div>
      </div>
    </div>
  );
}
