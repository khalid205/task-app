import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AddTaskModal from './AddTaskModal';

const Navbar: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  return (
    <>
      {/* 💙 الـ Navbar الجديد باللون الأزرق الاحترافي الملكي */}
      <nav 
        className="navbar sticky-top py-2" 
        dir="rtl"
        style={{
          backgroundColor: '#1e3a8a', // الأزرق الملكي المحترف
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <div className="container d-flex justify-content-between align-items-center">
          
          {/* 💎 1. الجهة اليمنى: اللوجو الاحترافي الجديد بتصميم عصري هندسي */}
          <Link 
            className="navbar-brand d-flex align-items-center gap-2 fw-extrabold fs-4 text-white m-0 border-start border-2 ps-3 border-info" 
            to="/"
            style={{ letterSpacing: '-0.3px' }}
          >
            <div 
              className="bg-info bg-opacity-10 rounded-3 text-info d-flex align-items-center justify-content-center shadow-sm" 
              style={{ width: '38px', height: '38px', border: '1px solid rgba(0, 242, 254, 0.2)' }}
            >
              <i className="bi bi-layers-half fs-4"></i>
            </div>
            <span className="font-monospace">Task<span className="text-info">Flow</span></span>
          </Link>

          {/* 🟢 2. الجهة اليسرى: زر الإضافة الدائري باللون الأخضر (أيقونة زائد فقط) */}
          <div>
            <button 
              className="btn btn-success rounded-circle d-flex align-items-center justify-content-center shadow" 
              title="إضافة مهمة جديدة"
              style={{ 
                width: '42px', 
                height: '42px', 
                backgroundColor: '#10b981', // اللون الأخضر الأساسي
                borderColor: '#10b981',
                transition: 'all 0.25s ease-in-out'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#059669'; // تغيير اللون للأخضر الداكن بسلاسة
                e.currentTarget.style.transform = 'scale(1.08)'; // نبض خفيف
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#10b981';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              onClick={() => setIsModalOpen(true)}
            >
              {/* أيقونة زائد فقط */}
              <i className="bi bi-plus-lg fs-4 text-white"></i>
            </button>
          </div>

        </div>
      </nav>

      {/* شاشة إضافة المهمة المنبثقة المستقرة */}
      <AddTaskModal show={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};

export default Navbar;