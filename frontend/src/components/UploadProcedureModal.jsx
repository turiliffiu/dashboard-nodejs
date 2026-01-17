import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { toast } from 'react-toastify';
import procedureService from '../services/procedureService';

function UploadProcedureModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    icon: '📄',
    description: '',
    isPublic: true,
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      toast.error('Seleziona un file .txt');
      return;
    }

    setUploading(true);
    
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('icon', formData.icon);
      data.append('description', formData.description);
      data.append('isPublic', formData.isPublic);
      data.append('file', file);

      await procedureService.create(data);
      toast.success('Procedura caricata con successo!');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Errore durante il caricamento');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">📤 Carica Nuova Procedura</h2>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <X size={32} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome Procedura *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Es: Comandi PostgreSQL"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Icona (emoji)
            </label>
            <input
              type="text"
              value={formData.icon}
              onChange={(e) => setFormData({...formData, icon: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="📄"
              maxLength={10}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrizione
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Breve descrizione della procedura"
              rows={3}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isPublic}
              onChange={(e) => setFormData({...formData, isPublic: e.target.checked})}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label className="ml-2 text-sm text-gray-700">
              Procedura pubblica (visibile a tutti)
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              File .txt *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="mx-auto text-gray-400 mb-2" size={48} />
              <input
                type="file"
                accept=".txt"
                onChange={(e) => setFile(e.target.files[0])}
                className="hidden"
                id="file-upload"
              />
              <label 
                htmlFor="file-upload"
                className="cursor-pointer text-blue-600 hover:text-blue-800"
              >
                {file ? file.name : 'Clicca per selezionare un file .txt'}
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {uploading ? 'Caricamento...' : 'Carica'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UploadProcedureModal;
