import React from 'react';
import { X, Copy } from 'lucide-react';
import { toast } from 'react-toastify';

function ProcedureModal({ procedure, onClose }) {
  if (!procedure) return null;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Comando copiato!');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-5xl mr-4">{procedure.icon}</span>
            <div>
              <h2 className="text-2xl font-bold">{procedure.name}</h2>
              <p className="text-blue-100">{procedure.description}</p>
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
          {procedure.sections && procedure.sections.length > 0 ? (
            procedure.sections.map((section, idx) => (
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
            Proprietario: <span className="font-semibold">{procedure.owner?.username}</span>
          </div>
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProcedureModal;
