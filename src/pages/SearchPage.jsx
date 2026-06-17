import { useState, useEffect, useRef } from 'react';
import { globalSearch } from '../store/db';
import { useAppContext } from '../AppContext';
import logger from '../store/logger';

const MODULE = 'SearchPage';

export default function SearchPage({ navigate, searchQuery, setSearchQuery }) {
  const { t } = useAppContext();
  const [query, setQuery] = useState(searchQuery || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    if (searchQuery) {
      setQuery(searchQuery);
      doSearch(searchQuery);
    }
  }, []);

  async function doSearch(q) {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    setError(null);
    logger.info(MODULE, 'Searching', { query: q });
    try {
      const res = await globalSearch(q);
      setResults(res);
      logger.success(MODULE, 'Search completed', { query: q, resultCount: res.length });
    } catch (err) {
      logger.error(MODULE, 'Search failed', err);
      setError(err.message || 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const q = e.target.value;
    setQuery(q);

    // Debounce search by 300ms
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSearch(q);
    }, 300);
  }

  function handleClick(item) {
    if (item.type === 'note') navigate('notes');
    else if (item.type === 'task') navigate('tasks');
    else if (item.type === 'flashcard') navigate('study');
    else if (item.type === 'event') navigate('calendar');
  }

  const typeIcons = { note: '📝', task: '✅', flashcard: '🃏', event: '📅' };
  const typeLabels = { note: t('nav.notes'), task: t('nav.tasks'), flashcard: t('nav.study'), event: t('nav.calendar') };
  const typeColors = { note: 'accent', task: 'green', flashcard: 'blue', event: 'amber' };

  return (
    <div className="page">
      <div className="page-header">
        <h2>{t('search.title')}</h2>
        <p>{t('search.desc')}</p>
      </div>

      <div className="search-bar" style={{ marginBottom: '28px' }}>
        <span className="icon">🔍</span>
        <input ref={inputRef} placeholder={t('search.placeholder')}
          value={query} onChange={handleChange}
          style={{ fontSize: '1.05rem', padding: '14px 14px 14px 44px' }} />
      </div>

      {loading && <p style={{ color: 'var(--text-muted)' }}>...</p>}

      {error && (
        <div style={{ padding: '12px', marginBottom: '16px', borderRadius: '4px', fontSize: '0.85rem', background: 'rgba(255, 118, 117, 0.1)', color: 'var(--red)' }}>
          {error}
        </div>
      )}

      {query.length >= 2 && results.length === 0 && !loading && !error && (
        <div className="empty-state">
          <div className="icon">🔍</div>
          <p>No results found for "{query}"</p>
        </div>
      )}

      {results.length > 0 && (
        <div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '12px' }}>
            {results.length} {t('search.results')}
          </p>
          {results.map((item, i) => (
            <div key={`${item.type}-${item.id}-${i}`} className="list-item" onClick={() => handleClick(item)}>
              <span style={{ fontSize: '1.2rem' }}>{typeIcons[item.type]}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{highlightMatch(item.title, query)}</div>
                {item.preview && (
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '2px' }}>
                    {highlightMatch(item.preview, query)}
                  </div>
                )}
              </div>
              <span className={`tag tag-${typeColors[item.type]}`}>{typeLabels[item.type]}</span>
            </div>
          ))}
        </div>
      )}

      {query.length < 2 && (
        <div style={{ marginTop: '40px' }}>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>{t('search.tips')}</h3>
          <div style={{ display: 'grid', gap: '10px' }}>
            <div className="list-item" style={{ cursor: 'default' }}>
              <span>📝</span>
              <span>Search across all your <strong>notes</strong> by title and content</span>
            </div>
            <div className="list-item" style={{ cursor: 'default' }}>
              <span>✅</span>
              <span>Find <strong>tasks</strong> by title</span>
            </div>
            <div className="list-item" style={{ cursor: 'default' }}>
              <span>🃏</span>
              <span>Search <strong>flashcards</strong> by front or back content</span>
            </div>
            <div className="list-item" style={{ cursor: 'default' }}>
              <span>📅</span>
              <span>Find <strong>events</strong> by title or description</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function highlightMatch(text, query) {
  if (!query || !text) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: 'var(--accent-glow)', color: 'var(--accent-light)', padding: '1px 2px', borderRadius: '2px' }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}
