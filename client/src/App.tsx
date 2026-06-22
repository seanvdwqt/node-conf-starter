import { useState, useCallback } from 'react';
import SquadWizard from './components/SquadWizard';
import { InstantSquadSearch } from './components/InstantSquadSearch';
import type { TeamSuggestion } from './components/InstantSquadSearch';

function App() {
  const [selectedSuggestion, setSelectedSuggestion] = useState<TeamSuggestion | null>(null);

  const handleSuggestionSelected = useCallback((suggestion: TeamSuggestion) => {
    setSelectedSuggestion(suggestion);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="py-6 text-center">
        <h1 className="text-3xl font-bold text-indigo-700">Rapid Squad Assembly</h1>
        <p className="mt-1 text-sm text-gray-500">Assemble cross-functional squads quickly</p>
      </header>
      <main className="pb-12">
        {/* Instant Squad Search — prominent at the top */}
        <section className="px-4 mb-8" data-testid="search-section">
          <InstantSquadSearch onSuggestionSelected={handleSuggestionSelected} />
        </section>

        {/* Visual separator */}
        <div className="max-w-3xl mx-auto mb-8 flex items-center gap-4 px-4">
          <div className="flex-1 border-t border-gray-300" />
          <span className="text-sm text-gray-400">or use the wizard</span>
          <div className="flex-1 border-t border-gray-300" />
        </div>

        {/* Squad Wizard */}
        <SquadWizard initialSuggestion={selectedSuggestion} />
      </main>
    </div>
  );
}

export default App;
