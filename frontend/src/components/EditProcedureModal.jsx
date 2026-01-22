import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-toastify';
import procedureService from '../services/procedureService';

function EditProcedureModal({ procedure, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (procedure) {
      setFormData({
        name: procedure.name || '',
        description: procedure.description || '',
        isPublic: procedure.isPublic || false,
      });
    }
  }, [procedure]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData = {
        name: formData.name,
        description: formData.description,
        isPublic: formData.isPublic,
      };

      await procedureService.update(procedure.id, updateData);
      toast.success('Procedura aggiornata con successo');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Errore aggiornamento procedura');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Modifica Procedura</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome Procedura *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrizione
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> Per modificare il contenuto della procedura, scarica il file, modificalo e caricalo nuovamente dalla dashboard principale.
            </p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPublic"
              checked={formData.isPublic}
              onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isPublic" className="ml-2 text-sm text-gray-700">
              Procedura pubblica (visibile a tutti)
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              disabled={loading}
            >
              Annulla
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Salvataggio...' : 'Salva Modifiche'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProcedureModal;
