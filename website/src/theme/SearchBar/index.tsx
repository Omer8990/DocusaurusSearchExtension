import React, {useState, useRef, useCallback, useMemo, useEffect} from 'react';
import {createPortal} from 'react-dom';
// @ts-ignore
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
// @ts-ignore
import {useHistory} from '@docusaurus/router';
// @ts-ignore
import {useBaseUrlUtils} from '@docusaurus/useBaseUrl';
// @ts-ignore
import Link from '@docusaurus/Link';
// @ts-ignore
import {isRegexpStringMatch} from '@docusaurus/theme-common';

// Local mock for useSearchPage
function useSearchPage() {
  return {
    generateSearchPageLink: (query: string) => `/search?q=${encodeURIComponent(query)}`,
  };
}

// Local mock for useTypesenseContextualFilters
function useTypesenseContextualFilters() {
  return "";
}

import {
  DocSearchButton,
  useDocSearchKeyboardEvents,
} from 'typesense-docsearch-react';
// @ts-ignore
import Translate, {translate} from '@docusaurus/Translate';
// @ts-ignore
import translations from '@theme/SearchTranslations';

import type {
  DocSearchModal as DocSearchModalType,
  DocSearchModalProps,
} from 'typesense-docsearch-react';
import type {
  InternalDocSearchHit,
  StoredDocSearchHit,
} from 'typesense-docsearch-react/dist/esm/types';
import type {AutocompleteState} from '@algolia/autocomplete-core';

// --- Configuration ---
const AVAILABLE_PROJECTS = [
  { label: 'Project A', value: 'docs-project_a-current' },
  { label: 'Project B', value: 'docs-project_b-current' },
  { label: 'Project C', value: 'docs-project_c-current' },
  { label: 'Community', value: 'docs-community-current' },
  { label: 'Tutorial', value: 'docs-default-current' },
];

type DocSearchProps = Omit<
  DocSearchModalProps,
  'onClose' | 'initialScrollY'
> & {
  contextualSearch?: string;
  externalUrlRegex?: string;
  searchPagePath: boolean | string;
};

// --- In-Modal Filter Bar (Chip + Autocomplete) ---

function FilterBar({ 
  selected, 
  onChange 
}: { 
  selected: string[]; 
  onChange: (s: string[]) => void 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter projects based on query
  const filteredProjects = AVAILABLE_PROJECTS.filter(p => 
    p.label.toLowerCase().includes(query.toLowerCase())
  );

  // Focus input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addProject = (value: string) => {
    if (!selected.includes(value)) {
      onChange([...selected, value]);
    }
    setIsOpen(false);
    setQuery("");
  };

  const removeProject = (value: string) => {
    onChange(selected.filter(s => s !== value));
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className="ProjectFilter-Bar" ref={dropdownRef}>
       {/* Selected Chips */}
       {selected.map(val => {
         const proj = AVAILABLE_PROJECTS.find(p => p.value === val);
         return (
           <div key={val} className="ProjectFilter-Chip" onClick={() => removeProject(val)}>
             {proj?.label || val}
             <span className="ProjectFilter-Chip-Remove">×</span>
           </div>
         );
       })}

       {/* Add Button */}
       <button 
         className="ProjectFilter-AddButton"
         onClick={() => setIsOpen(!isOpen)}
       >
         <span>+ Add Scope</span>
       </button>

       {/* Autocomplete Dropdown */}
       {isOpen && (
         <div className="ProjectFilter-Dropdown">
           <input
             ref={inputRef}
             type="text"
             className="ProjectFilter-SearchInput"
             placeholder="Search projects..."
             value={query}
             onChange={(e) => setQuery(e.target.value)}
             onClick={(e) => e.stopPropagation()} // Prevent closing
           />
           <div className="ProjectFilter-List">
             {/* "Global" Option */}
             {query === "" && selected.length > 0 && (
                <div className="ProjectFilter-Item" onClick={clearAll} style={{ color: 'var(--ifm-color-primary)', fontWeight: 'bold' }}>
                  Clear Filters (Search All)
                </div>
             )}

             {filteredProjects.map(proj => {
               const isSelected = selected.includes(proj.value);
               return (
                 <div 
                   key={proj.value} 
                   className={`ProjectFilter-Item ${isSelected ? 'selected' : ''}`}
                   onClick={() => !isSelected && addProject(proj.value)}
                 >
                   {proj.label}
                   {isSelected && <span>✓</span>}
                 </div>
               );
             })}
             
             {filteredProjects.length === 0 && (
               <div style={{ padding: '10px', color: '#999', fontSize: '0.85rem' }}>
                 No projects found.
               </div>
             )}
           </div>
         </div>
       )}
    </div>
  );
}

// --- Main DocSearch Component ---

let DocSearchModal: typeof DocSearchModalType | null = null;

function DocSearch({
  contextualSearch,
  externalUrlRegex,
  ...props
}: DocSearchProps) {
  const {siteMetadata} = useDocusaurusContext();
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]); 

  // --- Logic to Inject Filter Bar into Modal ---
  const [modalNode, setModalNode] = useState<Element | null>(null);

  const checkForModal = useCallback(() => {
    const modal = document.querySelector('.DocSearch-Modal');
    if (modal && modal !== modalNode) {
      setModalNode(modal);
    }
  }, [modalNode]);

  // --- Search Parameters Logic ---
  const contextualSearchFacetFilters =
    useTypesenseContextualFilters() as string;

  const configFacetFilters: string =
    props.typesenseSearchParameters?.filter_by ?? '';

  const facetFilters = contextualSearch
    ? [contextualSearchFacetFilters, configFacetFilters].filter((e) => e).join(' && ')
    : configFacetFilters;

  let activeFilter = facetFilters;
  if (selectedProjects.length > 0) {
    const joinedValues = selectedProjects.join(',');
    activeFilter = `docusaurus_tag:=[${joinedValues}]`;
  }

  const typesenseSearchParameters = {
    filter_by: activeFilter,
    ...props.typesenseSearchParameters,
  };

  const typesenseServerConfig = props.typesenseServerConfig;
  const typesenseCollectionName = props.typesenseCollectionName;

  const {withBaseUrl} = useBaseUrlUtils();
  const history = useHistory();
  const searchContainer = useRef<HTMLDivElement | null>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState<string | undefined>(
    undefined,
  );

  const importDocSearchModalIfNeeded = useCallback(() => {
    if (DocSearchModal) {
      return Promise.resolve();
    }

    return Promise.all([
      // @ts-ignore
      import('typesense-docsearch-react/modal') as Promise<
        typeof import('typesense-docsearch-react')
      >,
      // @ts-ignore
      import('typesense-docsearch-react/style'),
      // @ts-ignore
      import('./styles.css'),
    ]).then(([{DocSearchModal: Modal}]) => {
      DocSearchModal = Modal;
    });
  }, []);

  const onOpen = useCallback(() => {
    importDocSearchModalIfNeeded().then(() => {
      searchContainer.current = document.createElement('div');
      document.body.insertBefore(
        searchContainer.current,
        document.body.firstChild,
      );
      setIsOpen(true);
      
      const interval = setInterval(checkForModal, 100);
      setTimeout(() => clearInterval(interval), 2000); 
    });
  }, [importDocSearchModalIfNeeded, setIsOpen, checkForModal]);

  const onClose = useCallback(() => {
    setIsOpen(false);
    setModalNode(null); 
    searchContainer.current?.remove();
  }, [setIsOpen]);

  const onInput = useCallback(
    (event: KeyboardEvent) => {
      importDocSearchModalIfNeeded().then(() => {
        setIsOpen(true);
        setInitialQuery(event.key);
      });
    },
    [importDocSearchModalIfNeeded, setIsOpen, setInitialQuery],
  );

  const navigator = useRef({
    navigate({itemUrl}: {itemUrl?: string}) {
      if (isRegexpStringMatch(externalUrlRegex, itemUrl)) {
        window.location.href = itemUrl!;
      } else {
        history.push(itemUrl!);
      }
    },
  }).current;

  const transformItems = useRef<DocSearchModalProps['transformItems']>(
    (items) =>
      items.map((item) => {
        if (isRegexpStringMatch(externalUrlRegex, item.url)) {
          return item;
        }
        const url = new URL(item.url);
        return {
          ...item,
          url: withBaseUrl(`${url.pathname}${url.hash}`),
        };
      }),
  ).current;

  const Hit = ({hit, children}: any) => <Link to={hit.url}>{children}</Link>;
  const ResultsFooter = ({state, onClose}: any) => {
      const {generateSearchPageLink} = useSearchPage();
      return (
        <Link to={generateSearchPageLink(state.query)} onClick={onClose}>
          <Translate id="theme.SearchBar.seeAll" values={{count: state.context.nbHits}}>
            {'See all {count} results'}
          </Translate>
        </Link>
      );
  };

  const resultsFooterComponent = useMemo(
      () => (footerProps: any) => <ResultsFooter {...footerProps} onClose={onClose} />,
      [onClose],
    );

  useDocSearchKeyboardEvents({
    isOpen,
    onOpen,
    onClose,
    onInput,
    searchButtonRef,
  });

  return (
    <>
      <DocSearchButton
        onTouchStart={importDocSearchModalIfNeeded}
        onFocus={importDocSearchModalIfNeeded}
        onMouseOver={importDocSearchModalIfNeeded}
        onClick={onOpen}
        ref={searchButtonRef}
        translations={translations.button}
      />

      {isOpen &&
        DocSearchModal &&
        searchContainer.current &&
        createPortal(
          <>
            <DocSearchModal
              onClose={onClose}
              initialScrollY={window.scrollY}
              initialQuery={initialQuery}
              navigator={navigator}
              transformItems={transformItems}
              hitComponent={Hit}
              {...(props.searchPagePath && { resultsFooterComponent })}
              {...props}
              typesenseSearchParameters={typesenseSearchParameters}
              typesenseServerConfig={typesenseServerConfig}
              typesenseCollectionName={typesenseCollectionName}
              placeholder={translations.placeholder}
              // @ts-ignore
              translations={translations.modal}
            />
            {modalNode && createPortal(
              <FilterBar selected={selectedProjects} onChange={setSelectedProjects} />,
              modalNode
            )}
          </>,
          searchContainer.current,
        )}
    </>
  );
}

export default function SearchBar(): React.ReactElement {
  const {siteConfig} = useDocusaurusContext();
  return (
    <DocSearch {...(siteConfig.themeConfig.typesense as DocSearchProps)} />
  );
}