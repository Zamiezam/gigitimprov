// components/AdminSeedButton.tsx
import { useState } from 'react';
import { Database, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { seedDatabase } from '../scripts/seedDatabase';

export default function AdminSeedButton() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedStatus, setSeedStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const handleSeed = async () => {
    if (!confirm('This will populate the database with demo data. Continue?')) return;
    
    setIsSeeding(true);
    setSeedStatus('idle');
    setStatusMessage('Seeding database...');
    
    try {
      await seedDatabase();
      setSeedStatus('success');
      setStatusMessage('Database seeded successfully! Refresh to see changes.');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Seeding error:', error);
      setSeedStatus('error');
      setStatusMessage('Failed to seed database. Check console for errors.');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={handleSeed}
        disabled={isSeeding}
        className={`group flex items-center gap-2 px-4 py-2 rounded-full shadow-lg transition-all ${
          seedStatus === 'success'
            ? 'bg-green-500 hover:bg-green-600'
            : seedStatus === 'error'
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-primary hover:bg-primary/90'
        } text-white font-medium`}
      >
        {isSeeding ? (
          <Loader size={18} className="animate-spin" />
        ) : seedStatus === 'success' ? (
          <CheckCircle size={18} />
        ) : seedStatus === 'error' ? (
          <AlertCircle size={18} />
        ) : (
          <Database size={18} />
        )}
        <span className="text-sm">
          {isSeeding ? 'Seeding...' : seedStatus === 'success' ? 'Seeded!' : seedStatus === 'error' ? 'Failed' : 'Seed Demo Data'}
        </span>
      </button>
      
      {statusMessage && (
        <div className={`absolute bottom-full right-0 mb-2 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap ${
          seedStatus === 'success' ? 'bg-green-100 text-green-800' :
          seedStatus === 'error' ? 'bg-red-100 text-red-800' :
          'bg-gray-800 text-white'
        }`}>
          {statusMessage}
        </div>
      )}
    </div>
  );
}