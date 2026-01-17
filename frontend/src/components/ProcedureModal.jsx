import React, { useState, useEffect } from 'react';
import { X, Copy, Edit2 } from 'lucide-react';
import { toast } from 'react-toastify';
import authService from '../services/authService';
import procedureService from '../services/procedureService';
import EditProcedureModal from './EditProcedureModal';

function ProcedureModal({ procedure, onClose, onUpdate }) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentProcedure, setCurrentProcedure] = useState(procedure);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    setCurrentProcedure(procedure);
  }, [procedure]);

  if (!currentProcedure) return null;

  const currentUser = authService.getCurrentUser();
  const canEdit = currentUser && (
    currentUser.isSuperuser ||
    currentUser.profile?.role === 'admin' ||
    currentProcedure.ownerId === currentUser.id
  );

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Comando copiato!');
  };

  const handleEditSuccess = async () => {
    // Ricarica i dettagli della procedura aggiornata
    setLoading(true);
    try {
      const response = await procedureService.getById(currentProcedure.id);
      setCurrentProcedure(response.data);
      
      if (onUpdate) {
        onUpdate(); // Aggiorna anche la lista nella dashboard
      }
      
      toast.success('Vista aggiornata!');
    } catch (error) {
      toast.error('Errore nel ricaricare i dettagli');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 flex justify-between items-center">
            <div className="flex items-center">
              <span className="text-5xl mr-4">{currentProcedure.icon}</span>
              <div>
                <h2 className="text-2xl font-bold">{currentProcedure.name}</h2>
                <p className="text-blue-100">{currentProcedure.description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition"
            >
              <X size={32} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-150px)]">
            {loading ? (
              <div className="text-center py-8">
                <div className="text-gray-600">Aggiornamento in corso...</div>
              </div>
            ) : currentProcedure.sections && currentProcedure.sections.length > 0 ? (
              currentProcedure.sections.map((section, idx) => (
                <div key={idx} className="mb-8">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    📌 {section.title}
                  </h3>
                  {section.desc && (
                    <p className="text-gray-600 mb-4">{section.desc}</p>
                  )}
                  {section.commands && section.commands.map((cmd, cmdIdx) => (
                    <div key={cmdIdx} className="mb-4 bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-700">
                          {cmd.label}
                        </h4>
                        <button
                          onClick={() => copyToClipboard(cmd.cmd)}
                          className="text-blue-600 hover:text-blue-800 transition"
                          title="Copia comando"
                        >
                          <Copy size={20} />
                        </button>
                      </div>
                      <pre className="bg-gray-800 text-green-400 p-3 rounded overflow-x-auto text-sm">
                        {cmd.cmd}
                      </pre>
                    </div>
                  ))}
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">
                Nessun contenuto disponibile
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-100 px-6 py-4 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Proprietario: <span className="font-semibold">{currentProcedure.owner?.username}</span>
              {currentProcedure.isPublic ? 
                <span className="ml-3 text-green-600">🌐 Pubblica</span> : 
                <span className="ml-3 text-gray-600">🔒 Privata</span>
              }
            </div>
            <div className="flex space-x-3">
              {canEdit && (
                <button
                  onClick={() => setShowEditModal(true)}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                  disabled={loading}
                >
                  <Edit2 size={18} />
                  <span>Modifica</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      </div>

      {showEditModal && (
        <EditProcedureModal
          procedure={currentProcedure}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
}

export default ProcedureModal;
