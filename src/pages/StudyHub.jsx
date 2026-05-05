import { useState, useEffect } from 'react';
import { getDecks, createDeck, updateDeck, deleteDeck, createFlashcard, updateFlashcard, deleteFlashcard, getDueCards, getAllCards, reviewCard } from '../store/db';
import { useAppContext } from '../AppContext';
import { getTodayStr } from '../store/dateUtils';

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

  useEffect(() => { loadDecks(); }, [timezone]);

  async function loadDecks() {
    const d = await getDecks();
    const withDue = await Promise.all(d.map(async deck => {
      const due = await getDueCards(deck.id, today);
      const all = await getAllCards(deck.id);
      return { ...deck, dueCount: due.length, totalCards: all.length };
    }));
    setDecks(withDue);
  }

  async function startReview(deck) {
    const due = await getDueCards(deck.id, today);
    if (due.length === 0) { alert(t('study.caughtUp')); return; }
    setCurrentDeck(deck);
    setCards(due);
    setCardIndex(0);
    setFlipped(false);
    setSessionDone(0);
    setView('review');
  }

  async function manageDeck(deck) {
    setCurrentDeck(deck);
    const all = await getAllCards(deck.id);
    setAllCards(all);
    setView('manage');
  }

  async function handleRate(quality) {
    await reviewCard(cards[cardIndex].id, quality);
    setSessionDone(s => s + 1);
    if (cardIndex + 1 < cards.length) {
      setCardIndex(i => i + 1);
      setFlipped(false);
    } else {
      setView('done');
    }
  }

  function openNewDeck() { setDeckForm({ name: '', category: '' }); setEditDeck('new'); }
  function openEditDeck(deck) { setDeckForm({ name: deck.name, category: deck.category || '' }); setEditDeck(deck); }
  async function handleSaveDeck() {
    if (!deckForm.name.trim()) return;
    if (editDeck === 'new') { await createDeck(deckForm); }
    else { await updateDeck(editDeck.id, deckForm); }
    setEditDeck(null);
    loadDecks();
  }
  async function handleDeleteDeck(id) {
    if (confirm(t('common.confirmDelete'))) { await deleteDeck(id); setEditDeck(null); loadDecks(); }
  }

  function openNewCard() { setCardForm({ front: '', back: '' }); setEditCard('new'); }
  function openEditCard(card) { setCardForm({ front: card.front, back: card.back }); setEditCard(card); }
  async function handleSaveCard() {
    if (!cardForm.front.trim() || !cardForm.back.trim()) return;
    if (editCard === 'new') { await createFlashcard({ deckId: currentDeck.id, ...cardForm }); }
    else { await updateFlashcard(editCard.id, cardForm); }
    setEditCard(null);
    const all = await getAllCards(currentDeck.id);
    setAllCards(all);
    loadDecks();
  }
  async function handleDeleteCard(id) {
    if (confirm(t('common.confirmDelete'))) {
      await deleteFlashcard(id);
      const all = await getAllCards(currentDeck.id);
      setAllCards(all);
      loadDecks();
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

      {decks.length === 0 ? (
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
