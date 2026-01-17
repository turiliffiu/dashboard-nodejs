import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, Shield, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';
import authService from '../services/authService';
import userService from '../services/userService';

function UserManagementPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const user = authService.getCurrentUser();
    
    if (!user || (!user.isSuperuser && user.profile?.role !== 'admin')) {
      toast.error('Accesso negato');
      navigate('/dashboard');
      return;
    }

    setCurrentUser(user);
    loadUsers();
  }, [navigate]);

  const loadUsers = async () => {
    try {
      const response = await userService.getAll();
      setUsers(response.data || []);
    } catch (error) {
      toast.error('Errore nel caricamento utenti');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await userService.updateRole(userId, newRole);
      toast.success('Ruolo aggiornato');
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Errore aggiornamento ruolo');
    }
  };

  const handleToggleActive = async (userId) => {
    try {
      await userService.toggleActive(userId);
      toast.success('Stato utente aggiornato');
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Errore aggiornamento stato');
    }
  };

  const handleDelete = async (userId, username) => {
    if (!window.confirm('Eliminare utente ' + username + '?')) return;

    try {
      await userService.delete(userId);
      toast.success('Utente eliminato');
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Errore eliminazione utente');
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'editor': return 'bg-blue-100 text-blue-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                <Shield className="mr-2" size={32} />
                Gestione Utenti
              </h1>
              <p className="text-gray-600">Totale: {users.length} utenti</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Utente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Ruolo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Stato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Registrato
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.username}
                          {user.isSuperuser && (
                            <span className="ml-2 text-red-600">★</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.firstName} {user.lastName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.isSuperuser ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                        Superuser
                      </span>
                    ) : (
                      <select
                        value={user.profile?.role || 'viewer'}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        disabled={user.id === currentUser?.id}
                        className="text-xs rounded-full px-3 py-1 font-semibold border-0 focus:ring-2 focus:ring-blue-500"
                        style={{
                          backgroundColor: user.profile?.role === 'admin' ? '#fee2e2' : 
                                         user.profile?.role === 'editor' ? '#dbeafe' : '#f3f4f6',
                          color: user.profile?.role === 'admin' ? '#991b1b' : 
                                 user.profile?.role === 'editor' ? '#1e40af' : '#1f2937'
                        }}
                      >
                        <option value="admin">Admin</option>
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleActive(user.id)}
                      disabled={user.isSuperuser || user.id === currentUser?.id}
                      className="disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {user.isActive ? (
                        <CheckCircle className="text-green-600" size={20} />
                      ) : (
                        <XCircle className="text-red-600" size={20} />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString('it-IT')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleDelete(user.id, user.username)}
                      disabled={user.isSuperuser || user.id === currentUser?.id}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

export default UserManagementPage;
