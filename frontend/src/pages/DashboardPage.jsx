import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import authService from '../services/authService';
import procedureService from '../services/procedureService';
import ProcedureModal from '../components/ProcedureModal';

function DashboardPage() {
  const [user, setUser] = useState(null);
  const [procedures, setProcedures] = useState([]);
  const [selectedProcedure, setSelectedProcedure] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }

    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    loadProcedures();
  }, [navigate]);

  const loadProcedures = async () => {
    try {
      const response = await procedureService.getAll();
      setProcedures(response.data || []);
    } catch (error) {
      toast.error('Errore nel caricamento delle procedure');
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = async (procedure) => {
    try {
      const response = await procedureService.getById(procedure.id);
      setSelectedProcedure(response.data);
    } catch (error) {
      toast.error('Errore nel caricamento dei dettagli');
    }
  };

  const handleLogout = () => {
    authService.logout();
    toast.success('Logout effettuato');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">
            📋 Dashboard Procedure
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">
              Ciao, <span className="font-semibold">{user?.username}</span>
            </span>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">
            Le tue procedure
          </h2>
          <p className="text-gray-600">
            Totale: {procedures.length} procedure
          </p>
        </div>

        {/* Procedure Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {procedures.map((procedure) => (
            <div
              key={procedure.id}
              onClick={() => handleCardClick(procedure)}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition cursor-pointer"
            >
              <div className="flex items-center mb-4">
                <span className="text-4xl mr-3">{procedure.icon}</span>
                <h3 className="text-xl font-semibold text-gray-800">
                  {procedure.name}
                </h3>
              </div>
              <p className="text-gray-600 mb-4">
                {procedure.description || 'Nessuna descrizione'}
              </p>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>
                  {procedure.owner?.username || 'N/A'}
                </span>
                <span>
                  {procedure.isPublic ? '🌐 Pubblico' : '🔒 Privato'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {procedures.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              Nessuna procedura disponibile
            </p>
          </div>
        )}
      </main>

      {/* Modal */}
      {selectedProcedure && (
        <ProcedureModal
          procedure={selectedProcedure}
          onClose={() => setSelectedProcedure(null)}
        />
      )}
    </div>
  );
}

export default DashboardPage;
