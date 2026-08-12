/**
 * Automated Component Mounting & Render Smoke Tests for ALL 20+ Pages in Second Brain.
 * This test mounts each page component in jsdom to detect any runtime ReferenceErrors,
 * un-imported hooks, or rendering crashes before production deployment.
 */
import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { AppProvider } from '../../AppContext';

// Import all 20+ Pages
import Dashboard from '../Dashboard';
import Notes from '../Notes';
import Tasks from '../Tasks';
import Calendar from '../Calendar';
import StudyHub from '../StudyHub';
import Journal from '../Journal';
import SearchPage from '../SearchPage';
import Settings from '../Settings';
import Courses from '../Courses';
import Expenses from '../Expenses';
import PowerHub from '../PowerHub';
import Health from '../Health';
import PomodoroTimer from '../PomodoroTimer';
import CareerHub from '../CareerHub';
import NetworkHub from '../NetworkHub';
import SelfActualizationHub from '../SelfActualizationHub';
import ChillPomodoro from '../ChillPomodoro';
import ChillSchedules from '../ChillSchedules';
import ChillPlanner from '../ChillPlanner';
import ChillStats from '../ChillStats';

const renderWithContext = (ui) => {
  return render(
    <AppProvider>
      {ui}
    </AppProvider>
  );
};

describe('Page Component Render Smoke Tests', () => {
  it('renders Dashboard without crashing', () => {
    expect(() => renderWithContext(<Dashboard />)).not.toThrow();
  });

  it('renders Notes without crashing', () => {
    expect(() => renderWithContext(<Notes />)).not.toThrow();
  });

  it('renders Tasks without crashing', () => {
    expect(() => renderWithContext(<Tasks />)).not.toThrow();
  });

  it('renders Calendar without crashing', () => {
    expect(() => renderWithContext(<Calendar />)).not.toThrow();
  });

  it('renders StudyHub without crashing', () => {
    expect(() => renderWithContext(<StudyHub />)).not.toThrow();
  });

  it('renders Journal without crashing', () => {
    expect(() => renderWithContext(<Journal />)).not.toThrow();
  });

  it('renders SearchPage without crashing', () => {
    expect(() => renderWithContext(<SearchPage />)).not.toThrow();
  });

  it('renders Settings without crashing', () => {
    expect(() => renderWithContext(<Settings />)).not.toThrow();
  });

  it('renders Courses without crashing (totalCreditsForGpa check)', () => {
    expect(() => renderWithContext(<Courses />)).not.toThrow();
  });

  it('renders Expenses without crashing', () => {
    expect(() => renderWithContext(<Expenses />)).not.toThrow();
  });

  it('renders PowerHub without crashing', () => {
    expect(() => renderWithContext(<PowerHub />)).not.toThrow();
  });

  it('renders Health without crashing', () => {
    expect(() => renderWithContext(<Health />)).not.toThrow();
  });

  it('renders PomodoroTimer without crashing', () => {
    expect(() => renderWithContext(<PomodoroTimer />)).not.toThrow();
  });

  it('renders CareerHub without crashing', () => {
    expect(() => renderWithContext(<CareerHub />)).not.toThrow();
  });

  it('renders NetworkHub without crashing', () => {
    expect(() => renderWithContext(<NetworkHub />)).not.toThrow();
  });

  it('renders SelfActualizationHub without crashing', () => {
    expect(() => renderWithContext(<SelfActualizationHub />)).not.toThrow();
  });

  it('renders ChillPomodoro without crashing (useApp check)', () => {
    expect(() => renderWithContext(<ChillPomodoro />)).not.toThrow();
  });

  it('renders ChillSchedules without crashing', () => {
    expect(() => renderWithContext(<ChillSchedules />)).not.toThrow();
  });

  it('renders ChillPlanner without crashing', () => {
    expect(() => renderWithContext(<ChillPlanner />)).not.toThrow();
  });

  it('renders ChillStats without crashing', () => {
    expect(() => renderWithContext(<ChillStats />)).not.toThrow();
  });
});
