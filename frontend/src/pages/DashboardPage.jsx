import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Plus } from 'lucide-react';
import authService from '../services/authService';
import procedureService from '../services/procedureService';
import searchService from '../services/searchService';
import ProcedureModal from '../components/ProcedureModal';
import SearchBar from '../components/SearchBar';
import UploadProcedureModal from '../components/UploadProcedureModal';

function DashboardPage() {
  const [user, setUser] = useState(null);
  const [procedures, setProcedures] = useState([]);
  const [filteredProcedures, setFilteredProcedures] = useState([]);
  const [selectedProcedure, setSelectedProcedure] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
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
      setFilteredProcedures(response.data || []);
    } catch (error) {
      toast.error('Errore nel caricamento delle procedure');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query) => {
    setSearching(true);
    try {
      const response = await searchService.search(query);
      const procedureIds = response.results.map(r => r.categoryId);
      const uniqueIds = [...new Set(procedureIds)];
      const filtered = procedures.filter(p => uniqueIds.includes(p.id));
      setFilteredProcedures(filtered);
      toast.success(filtered.length + ' risultati trovati');
    } catch (error) {
      toast.error('Errore durante la ricerca');
    } finally {
      setSearching(false);
    }
  };

  const handleClearSearch = () => {
    setFilteredProcedures(procedures);
  };

  const handleCardClick = async (procedure) => {
    try {
      const response = await procedureService.getById(procedure.id);
      setSelectedProcedure(response.data);
    } catch (error) {
      toast.error('Errore nel caricamento dei dettagli');
    }
  };

  const handleUploadSuccess = () => {
    loadProcedures();
  };

  const handleLogout = () => {
    authService.logout();
    toast.success('Logout effettuato');
    navigate('/login');
  };

  const canCreate = user && (user.isSuperuser || ['admin', 'editor'].includes(user.profile?.role));
  const isAdmin = user && (user.isSuperuser || user.profile?.role === 'admin');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">
            📋 Dashboard Procedure
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">
              Ciao, <span className="font-semibold">{user?.username}</span>
            </span>
            {isAdmin && (
              <button
                onClick={() => navigate("/users")}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                👥 Gestione Utenti
              </button>
            )}
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">
              Le tue procedure
            </h2>
            <p className="text-gray-600">
              Totale: {procedures.length} procedure
              {filteredProcedures.length !== procedures.length && (
                <span className="ml-2 text-blue-600">
                  (Mostrati: {filteredProcedures.length})
                </span>
              )}
            </p>
          </div>
          {canCreate && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
            >
              <Plus size={20} />
              <span>Nuova Procedura</span>
            </button>
          )}
        </div>

        <SearchBar onSearch={handleSearch} onClear={handleClearSearch} />

        {searching && (
          <div className="text-center py-4">
            <div className="text-gray-600">Ricerca in corso...</div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProcedures.map((procedure) => (
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
                <span>{procedure.owner?.username || 'N/A'}</span>
                <span>
                  {procedure.isPublic ? '🌐 Pubblico' : '🔒 Privato'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {filteredProcedures.length === 0 && !searching && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              Nessuna procedura trovata
            </p>
          </div>
        )}
      </main>

      {selectedProcedure && (
        <ProcedureModal
          procedure={selectedProcedure}
          onClose={() => setSelectedProcedure(null)}
        />
      )}

      {showUploadModal && (
        <UploadProcedureModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
}

export default DashboardPage;
