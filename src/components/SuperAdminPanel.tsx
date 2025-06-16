import React, { useState, useEffect } from 'react';
import { SuperAdminPanelProps, GlobalConfigOverrides } from '../types';
import { initialGlobalConfigOverrides } from '../constants'; 
import ActionButton from './ActionButton';

export const SuperAdminPanel: React.FC<SuperAdminPanelProps> = ({
  isSuperAdmin,
  currentOverrides: initialOverridesFromApp,
  onSaveOverrides,
  onResetOverrides,
  onSetGlobalAnnouncement,
  addLog,
  onResetAllPlayerActivityUsage, // New prop
}) => {
  const [editableOverrides, setEditableOverrides] = useState<GlobalConfigOverrides>({ ...initialGlobalConfigOverrides, ...initialOverridesFromApp });
  const [announcementMessage, setAnnouncementMessage] = useState('');

  useEffect(() => {
    setEditableOverrides({ ...initialGlobalConfigOverrides, ...initialOverridesFromApp });
  }, [initialOverridesFromApp]);


  const handleOverrideChange = (key: keyof GlobalConfigOverrides, value: string) => {
    const numValue = parseFloat(value);
    setEditableOverrides(prev => ({
      ...prev,
      [key]: isNaN(numValue) ? undefined : numValue, 
    }));
  };

  const handleSave = () => {
    onSaveOverrides(editableOverrides);
    addLog('Đã lưu Cấu Hình Toàn Cục Overrides (Superadmin).', 'text-green-400');
  };

  const handleReset = () => {
    onResetOverrides();
    addLog('Đã reset Cấu Hình Toàn Cục Overrides về mặc định (Superadmin).', 'text-yellow-400');
  };

  const handleSendAnnouncement = () => {
    if (announcementMessage.trim()) {
      onSetGlobalAnnouncement(announcementMessage.trim());
      addLog(`Thông báo toàn cục đã được gửi: "${announcementMessage.trim()}"`, 'text-blue-400');
      setAnnouncementMessage('');
    }
  };

  const handleConfirmResetAllActivity = () => {
    if (window.confirm("BẠN CÓ CHẮC MUỐN RESET LƯỢT HOẠT ĐỘNG CHO TẤT CẢ USER (TRONG LOCALSTORAGE CỦA TRÌNH DUYỆT NÀY)? Hành động này không thể hoàn tác.")) {
        onResetAllPlayerActivityUsage();
    }
  }

  if (!isSuperAdmin) {
    return null;
  }

  const overrideFields: { key: keyof GlobalConfigOverrides, label: string, step?: string, placeholder?: string }[] = [
    { key: 'GLOBAL_TUVI_RATE_MULTIPLIER', label: 'Hệ Số Tu Vi Toàn Cục (Mặc định: 1)', step: "0.1", placeholder: "1.0"},
    { key: 'GACHA_COST_MULTIPLIER', label: 'Hệ Số Giá Gacha (Mặc định: 1)', step: "0.1", placeholder: "1.0"},
    { key: 'EXPLORATION_LT_GAIN_MULTIPLIER', label: 'Hệ Số Linh Thạch Thám Hiểm (Mặc định: 1)', step: "0.1", placeholder: "1.0" },
    { key: 'BOSS_REWARD_MULTIPLIER', label: 'Hệ Số Thưởng Boss (Mặc định: 1)', step: "0.1", placeholder: "1.0" },
  ];

  return (
    <div className="mt-4 p-3 bg-red-900/30 rounded-lg shadow-xl border border-red-700 text-sm">
      <h3 className="text-2xl font-bold text-red-400 border-b border-red-600 pb-2 mb-4">Bảng Điều Khiển SUPER ADMIN</h3>
      
      <div className="space-y-3 mb-6">
        <h4 className="text-lg font-semibold text-yellow-300">Cấu Hình Toàn Cục Overrides</h4>
        {overrideFields.map(field => (
          <div key={field.key}>
            <label className="block text-sm font-medium text-gray-300 mb-0.5">{field.label}:</label>
            <input
              type="number"
              step={field.step || "0.01"}
              placeholder={field.placeholder || (initialGlobalConfigOverrides[field.key] !== undefined ? String(initialGlobalConfigOverrides[field.key]) : '...')}
              value={editableOverrides[field.key] === undefined ? '' : String(editableOverrides[field.key])}
              onChange={e => handleOverrideChange(field.key, e.target.value)}
              className="w-full p-1.5 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-red-500 focus:border-red-500"
            />
          </div>
        ))}
        <div className="flex gap-3 mt-3">
            <ActionButton onClick={handleSave} className="!bg-green-600 hover:!bg-green-500 flex-1">Lưu Overrides</ActionButton>
            <ActionButton onClick={handleReset} className="!bg-yellow-600 hover:!bg-yellow-500 flex-1">Reset Về Mặc Định</ActionButton>
        </div>
        <p className="text-xs text-gray-400 mt-1">
            Lưu ý: Các thay đổi này sẽ được lưu vào localStorage của trình duyệt này.
            Để áp dụng cho tất cả người chơi, cần cơ chế cập nhật riêng hoặc thông báo người chơi khởi động lại game sau khi bạn đã cập nhật mã nguồn chính.
        </p>
      </div>

       <div className="space-y-3 mb-6 pt-4 border-t border-red-600">
          <h4 className="text-lg font-semibold text-yellow-300">Quản Lý Dữ Liệu Toàn Cục (Local Storage)</h4>
           <ActionButton onClick={handleConfirmResetAllActivity} className="!bg-red-700 hover:!bg-red-600">
                Reset Lượt Hoạt Động (Tất cả User - Local)
            </ActionButton>
            <p className="text-xs text-gray-400 mt-1">
                Lưu ý: Hành động này sẽ reset số lượt hoạt động về 0 cho TẤT CẢ tài khoản người chơi được lưu trữ trong Local Storage của trình duyệt này.
            </p>
       </div>

      <div className="space-y-3 pt-4 border-t border-red-600">
        <h4 className="text-lg font-semibold text-yellow-300">Thông Báo Toàn Cục</h4>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-0.5">Nội dung thông báo:</label>
          <textarea
            value={announcementMessage}
            onChange={e => setAnnouncementMessage(e.target.value)}
            placeholder="Nhập nội dung thông báo..."
            rows={2}
            className="w-full p-1.5 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-red-500 focus:border-red-500"
          />
        </div>
        <ActionButton onClick={handleSendAnnouncement} className="!bg-blue-600 hover:!bg-blue-500">Gửi Thông Báo</ActionButton>
         <p className="text-xs text-gray-400 mt-1">
            Thông báo sẽ hiển thị cho người chơi khi họ tải game nếu có trong localStorage của họ.
        </p>
      </div>
    </div>
  );
};
export default SuperAdminPanel;