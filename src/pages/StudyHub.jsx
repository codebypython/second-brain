import { useState, useEffect } from 'react';
import { getDecks, createDeck, updateDeck, deleteDeck, createFlashcard, updateFlashcard, deleteFlashcard, getDueCards, getAllCards, reviewCard } from '../store/db';
import { useAppContext } from '../AppContext';
import { getTodayStr } from '../store/dateUtils';
import logger from '../store/logger';

const MODULE = 'StudyHub';

export default function StudyHub() {
  const { t, timezone } = useAppContext();
  const today = getTodayStr(timezone);

  const [decks, setDecks] = useState([]);
  const [view, setView] = useState('decks');
  const [currentDeck, setCurrentDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [editDeck, setEditDeck] = useState(null);
  const [editCard, setEditCard] = useState(null);
  const [deckForm, setDeckForm] = useState({ name: '', category: '' });
  const [cardForm, setCardForm] = useState({ front: '', back: '' });
  const [allCards, setAllCards] = useState([]);
  const [sessionDone, setSessionDone] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { loadDecks(); }, [timezone]);

  async function loadDecks() {
    logger.info(MODULE, 'loadDecks');
    setLoading(true);
    setError(null);
    try {
      const d = await getDecks();
      const withDue = await Promise.all(d.map(async deck => {
        const due = await getDueCards(deck.id, today);
        const all = await getAllCards(deck.id);
        return { ...deck, dueCount: due.length, totalCards: all.length };
      }));
      setDecks(withDue);
      logger.success(MODULE, 'loadDecks', `${withDue.length} decks loaded`);
    } catch (err) {
      logger.error(MODULE, 'loadDecks', err);
      setError(t('common.error') || 'Failed to load decks. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function startReview(deck) {
    logger.info(MODULE, 'startReview', deck.name);
    try {
      const due = await getDueCards(deck.id, today);
      if (due.length === 0) { alert(t('study.caughtUp')); return; }
      setCurrentDeck(deck);
      setCards(due);
      setCardIndex(0);
      setFlipped(false);
      setSessionDone(0);
      setView('review');
      logger.success(MODULE, 'startReview', `${due.length} due cards`);
    } catch (err) {
      logger.error(MODULE, 'startReview', err);
      alert(t('common.error') || 'Failed to start review. Please try again.');
    }
  }

  async function manageDeck(deck) {
    logger.info(MODULE, 'manageDeck', deck.name);
    try {
      setCurrentDeck(deck);
      const deckCards = await getAllCards(deck.id);
      setAllCards(deckCards);
      setView('manage');
      logger.success(MODULE, 'manageDeck', `${deckCards.length} cards`);
    } catch (err) {
      logger.error(MODULE, 'manageDeck', err);
      alert(t('common.error') || 'Failed to load deck cards. Please try again.');
    }
  }

  async function handleRate(quality) {
    logger.info(MODULE, 'handleRate', `quality=${quality}`);
    try {
      await reviewCard(cards[cardIndex].id, quality);
      setSessionDone(s => s + 1);
      if (cardIndex + 1 < cards.length) {
        setCardIndex(i => i + 1);
        setFlipped(false);
      } else {
        setView('done');
      }
      logger.success(MODULE, 'handleRate', `rated card quality=${quality}`);
    } catch (err) {
      logger.error(MODULE, 'handleRate', err);
      alert(t('common.error') || 'Failed to save review. Please try again.');
    }
  }

  function openNewDeck() { setDeckForm({ name: '', category: '' }); setEditDeck('new'); }
  function openEditDeck(deck) { setDeckForm({ name: deck.name, category: deck.category || '' }); setEditDeck(deck); }
  async function handleSaveDeck() {
    if (!deckForm.name.trim()) return;
    logger.info(MODULE, 'handleSaveDeck', editDeck === 'new' ? 'creating' : 'updating');
    try {
      if (editDeck === 'new') { await createDeck(deckForm); }
      else { await updateDeck(editDeck.id, deckForm); }
      setEditDeck(null);
      logger.success(MODULE, 'handleSaveDeck');
      loadDecks();
    } catch (err) {
      logger.error(MODULE, 'handleSaveDeck', err);
      alert(t('common.error') || 'Failed to save deck. Please try again.');
    }
  }
  async function handleDeleteDeck(id) {
    if (confirm(t('common.confirmDelete'))) {
      logger.info(MODULE, 'handleDeleteDeck', id);
      try {
        await deleteDeck(id);
        setEditDeck(null);
        logger.success(MODULE, 'handleDeleteDeck', id);
        loadDecks();
      } catch (err) {
        logger.error(MODULE, 'handleDeleteDeck', err);
        alert(t('common.error') || 'Failed to delete deck. Please try again.');
      }
    }
  }

  function openNewCard() { setCardForm({ front: '', back: '' }); setEditCard('new'); }
  function openEditCard(card) { setCardForm({ front: card.front, back: card.back }); setEditCard(card); }
  async function handleSaveCard() {
    if (!cardForm.front.trim() || !cardForm.back.trim()) return;
    logger.info(MODULE, 'handleSaveCard', editCard === 'new' ? 'creating' : 'updating');
    try {
      if (editCard === 'new') { await createFlashcard({ deckId: currentDeck.id, ...cardForm }); }
      else { await updateFlashcard(editCard.id, cardForm); }
      setEditCard(null);
      const updatedCards = await getAllCards(currentDeck.id);
      setAllCards(updatedCards);
      logger.success(MODULE, 'handleSaveCard');
      loadDecks();
    } catch (err) {
      logger.error(MODULE, 'handleSaveCard', err);
      alert(t('common.error') || 'Failed to save card. Please try again.');
    }
  }
  async function handleDeleteCard(id) {
    if (confirm(t('common.confirmDelete'))) {
      logger.info(MODULE, 'handleDeleteCard', id);
      try {
        await deleteFlashcard(id);
        const updatedCards = await getAllCards(currentDeck.id);
        setAllCards(updatedCards);
        logger.success(MODULE, 'handleDeleteCard', id);
        loadDecks();
      } catch (err) {
        logger.error(MODULE, 'handleDeleteCard', err);
        alert(t('common.error') || 'Failed to delete card. Please try again.');
      }
    }
  }

  if (view === 'review' && cards.length > 0) {
    const card = cards[cardIndex];
    return (
      <div className="page">
        <div className="page-header">
          <h2>{t('study.rev.title')} {currentDeck.name}</h2>
          <p>Card {cardIndex + 1}/{cards.length} • Session: {sessionDone} reviewed</p>
        </div>
        <div className="flashcard-container" onClick={() => setFlipped(!flipped)}>
          <div className={`flashcard-inner ${flipped ? 'flipped' : ''}`}>
            <div className="flashcard-face flashcard-front">
              <div className="flashcard-label">{t('study.card.front')}</div>
              <div>{card.front}</div>
              <div style={{ marginTop: '20px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('study.rev.click')}</div>
            </div>
            <div className="flashcard-face flashcard-back">
              <div className="flashcard-label">{t('study.card.back')}</div>
              <div>{card.back}</div>
            </div>
          </div>
        </div>
        {flipped && (
          <div className="flashcard-rating">
            <button className="hard" onClick={() => handleRate(1)}>{t('study.rev.again')}</button>
            <button onClick={() => handleRate(3)}>{t('study.rev.hard')}</button>
            <button onClick={() => handleRate(4)}>{t('study.rev.good')}</button>
            <button className="easy" onClick={() => handleRate(5)}>{t('study.rev.easy')}</button>
          </div>
        )}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button className="btn" onClick={() => { setView('decks'); loadDecks(); }}>← {t('common.back')}</button>
        </div>
      </div>
    );
  }

  if (view === 'done') {
    return (
      <div className="page">
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🎉</div>
          <h2 style={{ marginBottom: '8px' }}>{t('study.done.title')}</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            {t('study.done.desc', { count: sessionDone })}
          </p>
          <button className="btn btn-primary" onClick={() => { setView('decks'); loadDecks(); }}>{t('common.back')}</button>
        </div>
      </div>
    );
  }

  if (view === 'manage') {
    return (
      <div className="page">
        <div className="page-header">
          <h2>📦 {currentDeck.name}</h2>
          <p>{allCards.length} {t('study.cards')}</p>
        </div>
        <div className="toolbar">
          <button className="btn" onClick={() => { setView('decks'); loadDecks(); }}>← {t('common.back')}</button>
          <button className="btn btn-sm" onClick={() => openEditDeck(currentDeck)}>{t('study.deck.edit')}</button>
          <div className="toolbar-spacer" />
          <button className="btn btn-primary" onClick={openNewCard}>{t('study.card.new')}</button>
        </div>

        {allCards.length === 0 ? (
          <div className="empty-state"><div className="icon">📦</div><p>{t('study.empty')}</p></div>
        ) : (
          allCards.map((card, i) => (
            <div key={card.id} className="list-item">
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', width: '30px' }}>#{i + 1}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{card.front}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '4px' }}>{card.back}</div>
              </div>
              <span className="tag tag-accent" style={{ fontSize: '0.65rem' }}>
                reps: {card.repetitions} | ease: {card.ease.toFixed(1)}
              </span>
              <button className="btn btn-ghost btn-sm" onClick={() => openEditCard(card)}>✏️</button>
              <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteCard(card.id)}>🗑️</button>
            </div>
          ))
        )}

        {editCard && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setEditCard(null)}>
            <div className="modal">
              <div className="modal-header">
                <h3>{editCard === 'new' ? t('study.card.new') : t('study.card.edit')}</h3>
                <button className="modal-close" onClick={() => setEditCard(null)}>✕</button>
              </div>
              <div className="form-group">
                <label className="form-label">{t('study.card.front')}</label>
                <textarea className="textarea" placeholder="..." value={cardForm.front}
                  onChange={e => setCardForm({ ...cardForm, front: e.target.value })} autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">{t('study.card.back')}</label>
                <textarea className="textarea" placeholder="..." value={cardForm.back}
                  onChange={e => setCardForm({ ...cardForm, back: e.target.value })} />
              </div>
              <div className="modal-actions">
                {editCard !== 'new' && (
                  <button className="btn btn-danger" onClick={() => { handleDeleteCard(editCard.id); setEditCard(null); }}>{t('common.delete')}</button>
                )}
                <div className="toolbar-spacer" />
                <button className="btn" onClick={() => setEditCard(null)}>{t('common.cancel')}</button>
                <button className="btn btn-primary" onClick={handleSaveCard}>
                  {t('common.save')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>{t('study.title')}</h2>
        <p>{t('study.desc')}</p>
      </div>
      <div className="toolbar">
        <div className="toolbar-spacer" />
        <button className="btn btn-primary" onClick={openNewDeck}>{t('study.btn.deck')}</button>
      </div>

      {error && (
        <div className="empty-state" style={{ color: 'var(--red, #ff6b6b)' }}>
          <p>⚠️ {error}</p>
          <button className="btn btn-sm" onClick={loadDecks} style={{ marginTop: '8px' }}>{t('common.retry') || 'Retry'}</button>
        </div>
      )}

      {loading ? (
        <div className="empty-state"><div className="icon">⏳</div><p>{t('common.loading') || 'Loading...'}</p></div>
      ) : decks.length === 0 && !error ? (
        <div className="empty-state"><div className="icon">🎓</div><p>{t('study.empty')}</p></div>
      ) : (
        <div className="notes-grid">
          {decks.map(deck => (
            <div key={deck.id} className="note-card">
              <h4>{deck.name}</h4>
              <div className="preview">{deck.category || ''}</div>
              <div style={{ marginTop: 'auto', paddingTop: '12px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span className="tag tag-accent">{deck.totalCards} {t('study.cards')}</span>
                {deck.dueCount > 0 && <span className="tag tag-red">{deck.dueCount} {t('study.due')}</span>}
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button className="btn btn-primary btn-sm" onClick={() => startReview(deck)}
                  disabled={deck.dueCount === 0}>
                  {deck.dueCount > 0 ? `${t('study.review')} (${deck.dueCount})` : t('study.caughtUp')}
                </button>
                <button className="btn btn-sm" onClick={() => manageDeck(deck)}>{t('study.manage')}</button>
                <button className="btn btn-sm" onClick={() => openEditDeck(deck)}>✏️</button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDeleteDeck(deck.id)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editDeck && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setEditDeck(null)}>
          <div className="modal" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>{editDeck === 'new' ? t('study.deck.new') : t('study.deck.edit')}</h3>
              <button className="modal-close" onClick={() => setEditDeck(null)}>✕</button>
            </div>
            <div className="form-group">
              <label className="form-label">{t('study.deck.name')}</label>
              <input className="input" placeholder="..." value={deckForm.name}
                onChange={e => setDeckForm({ ...deckForm, name: e.target.value })} autoFocus
                onKeyDown={e => e.key === 'Enter' && handleSaveDeck()} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('study.deck.category')}</label>
              <input className="input" placeholder="..." value={deckForm.category}
                onChange={e => setDeckForm({ ...deckForm, category: e.target.value })} />
            </div>
            <div className="modal-actions">
              {editDeck !== 'new' && (
                <button className="btn btn-danger" onClick={() => handleDeleteDeck(editDeck.id)}>{t('common.delete')}</button>
              )}
              <div className="toolbar-spacer" />
              <button className="btn" onClick={() => setEditDeck(null)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={handleSaveDeck}>{t('common.save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
