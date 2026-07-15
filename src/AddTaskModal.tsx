import React, { useState } from 'react';
import { db } from './firebase'; 
import { collection, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom'; 

interface AddTaskModalProps {
  show: boolean;
  onClose: () => void;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({ show, onClose }) => {
  const navigate = useNavigate(); 

  const [formData, setFormData] = useState({
    name: '',
    taskDate: '',
    taskTime: '',
    taskText: '',
    email: '',
    phone: ''
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!show) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true); 

    try {
      const dataToSend = {
        name: formData.name,
        taskDate: formData.taskDate,
        taskTime: formData.taskTime,
        taskText: formData.taskText,
        email: formData.email,
        phone: formData.phone,
        createdAt: new Date()
      };

      await addDoc(collection(db, "users"), dataToSend);
      setFormData({ name: '', taskDate: '', taskTime: '', taskText: '', email: '', phone: '' });

      setTimeout(() => {
        setLoading(false);
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          onClose();
          navigate('/getdata');
        }, 1500); 
      }, 1000); 

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "فشل إرسال البيانات");
      setLoading(false);
    }
  };

  return (
    <>
      <div className="modal-backdrop fade show" onClick={loading || isSuccess ? undefined : onClose} style={{ zIndex: 1040 }}></div>
      
      <div className="modal fade show d-block d-flex align-items-center" tabIndex={-1} role="dialog" style={{ zIndex: 1050 }}>
        <div className="modal-dialog modal-dialog-centered" role="document" style={{ width: '100%', maxWidth: '600px' }}>
          <div className="modal-content border-0 shadow-lg rounded-3 overflow-hidden">
            
            <div className="modal-header text-white py-3" dir="rtl" style={{ backgroundColor: '#1e3a8a' }}>
              <h5 className="modal-title fw-bold">➕ إضافة مهمة ومستخدم جديد</h5>
              {!loading && !isSuccess && (
                <button type="button" className="btn-close btn-close-white ms-0 me-auto" onClick={onClose}></button>
              )}
            </div>
            
            {loading && (
              <div className="modal-body p-5 text-center bg-white d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '350px' }}>
                <div className="spinner-border mb-3" role="status" style={{ width: '3.5rem', height: '3.5rem', borderWidth: '5px', color: '#1e3a8a' }}>
                  <span className="visually-hidden">جاري الحفظ...</span>
                </div>
                <h5 className="fw-bold text-secondary">جاري معالجة وحفظ البيانات حياً...</h5>
              </div>
            )}

            {isSuccess && (
              <div className="modal-body p-5 text-center bg-white d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '350px' }}>
                <div className="text-success mb-3" style={{ fontSize: '4.5rem', lineHeight: '1' }}>
                  <i className="bi bi-check-circle-fill"></i>
                </div>
                <h4 className="fw-extrabold text-success mb-2">تم إضافة المهمة بنجاح</h4>
                <p className="text-muted small">جاري نقلك لتحديث الواجهة حياً...</p>
              </div>
            )}

            {!loading && !isSuccess && (
              <form onSubmit={handleSubmit} dir="rtl">
                <div className="modal-body p-4 bg-light">
                  {errorMessage && <div className="alert alert-danger text-center fw-bold py-2" role="alert">❌ {errorMessage}</div>}

                  <div className="mb-3">
                    <label className="form-label fw-bold text-secondary fs-7">اسم الشخص بالكامل</label>
                    <input type="text" className="form-control border-2" name="name" value={formData.name} onChange={handleChange} placeholder="أدخل اسم الشخص المسؤول" style={{ borderRadius: '6px' }} required />
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold text-secondary fs-7">التاريخ</label>
                      <input type="date" className="form-control border-2" name="taskDate" value={formData.taskDate} onChange={handleChange} style={{ borderRadius: '6px' }} required />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold text-secondary fs-7">الزمن (الوقت)</label>
                      <input type="time" className="form-control border-2" name="taskTime" value={formData.taskTime} onChange={handleChange} style={{ borderRadius: '6px' }} required />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold text-secondary fs-7">نص تفاصيل المهمة</label>
                    <textarea className="form-control border-2" name="taskText" value={formData.taskText} onChange={handleChange} rows={3} placeholder="اكتب هنا نص أو وصف المهمة المطلوب تنفيذها..." style={{ borderRadius: '6px' }} required></textarea>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-2">
                      <label className="form-label fw-bold text-secondary fs-7">البريد الإلكتروني</label>
                      <input type="email" className="form-control border-2" name="email" value={formData.email} onChange={handleChange} placeholder="name@example.com" style={{ borderRadius: '6px' }} required />
                    </div>
                    <div className="col-md-6 mb-2">
                      <label className="form-label fw-bold text-secondary fs-7">رقم الهاتف</label>
                      <input type="text" className="form-control border-2" name="phone" value={formData.phone} onChange={handleChange} placeholder="01xxxxxxxxx" style={{ borderRadius: '6px' }} />
                    </div>
                  </div>

                </div>
                
                <div className="modal-footer bg-light border-0 p-3 justify-content-start gap-2">
                  <button 
                    type="submit" 
                    className="btn text-white px-4 fw-bold shadow-sm border-0"
                    style={{ backgroundColor: '#1e3a8a', borderRadius: '6px', transition: 'all 0.2s ease' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#152a66'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1e3a8a'}
                  >
                    إضافة المهمة الحالية   
                  </button>
                  <button type="button" className="btn btn-outline-secondary px-3" style={{ borderRadius: '6px' }} onClick={onClose}>إلغاء</button>
                </div>
              </form>
            )}
            
          </div>
        </div>
      </div>
    </>
  );
};

export default AddTaskModal;