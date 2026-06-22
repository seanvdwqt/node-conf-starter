import SquadWizard from './components/SquadWizard';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="py-6 text-center">
        <h1 className="text-3xl font-bold text-indigo-700">Rapid Squad Assembly</h1>
        <p className="mt-1 text-sm text-gray-500">Assemble cross-functional squads quickly</p>
      </header>
      <main className="pb-12">
        <SquadWizard />
      </main>
    </div>
  );
}

export default App;
