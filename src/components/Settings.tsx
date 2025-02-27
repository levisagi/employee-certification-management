import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, X, User, Lock, Database, Bell } from 'lucide-react';

interface SettingsProps {
  onClose: () => void;
  onSave: (settings: any) => void;
  currentSettings: any;
}

const Settings: React.FC<SettingsProps> = ({ onClose, onSave, currentSettings }) => {
  const [activeTab, setActiveTab] = useState('account');
  const [settings, setSettings] = useState(currentSettings || {
    username: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    notifications: {
      expiringCerts: true,
      missingOJT: true,
      system: true
    },
    backup: {
      autoBackup: false,
      backupInterval: 'weekly'
    }
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSave = () => {
    // validate
    const newErrors: Record<string, string> = {};
    
    if (activeTab === 'password') {
      if (!settings.currentPassword) {
        newErrors.currentPassword = 'יש להזין סיסמה נוכחית';
      }
      if (!settings.newPassword) {
        newErrors.newPassword = 'יש להזין סיסמה חדשה';
      } else if (settings.newPassword.length < 6) {
        newErrors.newPassword = 'הסיסמה צריכה להיות לפחות 6 תווים';
      }
      if (settings.newPassword !== settings.confirmPassword) {
        newErrors.confirmPassword = 'הסיסמאות אינן תואמות';
      }
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      onSave(settings);
      onClose();
    }
  };

  const updateSettings = (path: string, value: any) => {
    const newSettings = { ...settings };
    const parts = path.split('.');
    
    if (parts.length === 1) {
      // @ts-ignore
      newSettings[path] = value;
    } else {
      let current: any = newSettings;
      for (let i = 0; i < parts.length - 1; i++) {
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = value;
    }
    
    setSettings(newSettings);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
          <div className="flex items-center gap-2">
            <SettingsIcon className="text-gray-600" size={20} />
            <h2 className="text-xl font-semibold text-gray-800">הגדרות מערכת</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="flex h-[calc(100%-4rem)]">
          {/* Sidebar */}
          <div className="w-56 border-l bg-gray-50 p-4">
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('account')}
                className={`w-full text-right px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  activeTab === 'account' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <User size={18} />
                <span>פרטי חשבון</span>
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={`w-full text-right px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  activeTab === 'password' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Lock size={18} />
                <span>שינוי סיסמה</span>
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`w-full text-right px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  activeTab === 'notifications' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Bell size={18} />
                <span>התראות</span>
              </button>
              <button
                onClick={() => setActiveTab('backup')}
                className={`w-full text-right px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  activeTab === 'backup' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Database size={18} />
                <span>גיבוי ושחזור</span>
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'account' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">פרטי חשבון</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">שם משתמש</label>
                  <input
                    type="text"
                    value={settings.username}
                    onChange={(e) => updateSettings('username', e.target.value)}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">שם מלא</label>
                  <input
                    type="text"
                    value={settings.fullName || ''}
                    onChange={(e) => updateSettings('fullName', e.target.value)}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">אימייל</label>
                  <input
                    type="email"
                    value={settings.email || ''}
                    onChange={(e) => updateSettings('email', e.target.value)}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            )}

            {activeTab === 'password' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">שינוי סיסמה</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">סיסמה נוכחית</label>
                  <input
                    type="password"
                    value={settings.currentPassword}
                    onChange={(e) => updateSettings('currentPassword', e.target.value)}
                    className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                      errors.currentPassword ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.currentPassword && (
                    <p className="text-red-500 text-xs mt-1">{errors.currentPassword}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">סיסמה חדשה</label>
                  <input
                    type="password"
                    value={settings.newPassword}
                    onChange={(e) => updateSettings('newPassword', e.target.value)}
                    className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                      errors.newPassword ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.newPassword && (
                    <p className="text-red-500 text-xs mt-1">{errors.newPassword}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">אימות סיסמה חדשה</label>
                  <input
                    type="password"
                    value={settings.confirmPassword}
                    onChange={(e) => updateSettings('confirmPassword', e.target.value)}
                    className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                      errors.confirmPassword ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">הגדרות התראות</h3>
                
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications.expiringCerts}
                      onChange={(e) => updateSettings('notifications.expiringCerts', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span>התראות על הסמכות שעומדות לפוג</span>
                  </label>
                  
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications.missingOJT}
                      onChange={(e) => updateSettings('notifications.missingOJT', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span>התראות על OJT חסר</span>
                  </label>
                  
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications.system}
                      onChange={(e) => updateSettings('notifications.system', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span>התראות מערכת</span>
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'backup' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">גיבוי ושחזור</h3>
                
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.backup.autoBackup}
                      onChange={(e) => updateSettings('backup.autoBackup', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span>גיבוי אוטומטי</span>
                  </label>
                  
                  {settings.backup.autoBackup && (
                    <div className="mr-7">
                      <label className="block text-sm font-medium text-gray-700 mb-1">תדירות גיבוי</label>
                      <select
                        value={settings.backup.backupInterval}
                        onChange={(e) => updateSettings('backup.backupInterval', e.target.value)}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="daily">יומי</option>
                        <option value="weekly">שבועי</option>
                        <option value="monthly">חודשי</option>
                      </select>
                    </div>
                  )}
                  
                  <div className="pt-4 space-y-3">
                    <button
                      type="button"
                      className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      גיבוי ידני
                    </button>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">שחזור מגיבוי</label>
                      <div className="flex gap-2">
                        <input
                          type="file"
                          className="block w-full text-sm text-gray-500
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-md file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-blue-50 file:text-blue-600
                                    hover:file:bg-blue-100"
                        />
                        <button
                          type="button"
                          className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          שחזר
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4 border-t bg-gray-50 rounded-b-xl flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
          >
            ביטול
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Save size={18} />
            <span>שמור הגדרות</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;