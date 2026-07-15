import React, { useEffect, useState } from 'react';
import { db } from './firebase'; 
import { collection, onSnapshot, doc, deleteDoc, updateDoc, writeBatch, getDocs } from 'firebase/firestore';

interface UserTask {
  id: string;
  name: string;
  taskDate: string;
  taskTime: string;
  taskText: string;
  email: string;
  phone: string;
}

const GetData: React.FC = () => {
  const [tasks, setTasks] = useState<UserTask[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // 🔔 حالة لتخزين معرفات المهام التي حان وقت تنبيهها حالياً لملء اللون والايرباك
  const [activeAlarms, setActiveAlarms] = useState<string[]>([]);

  const [actionStatus, setActionStatus] = useState({
    isLoading: false, isSuccess: false, message: '', successMessage: '', colorClass: 'primary', iconClass: 'bi-check-circle-fill'
  });

  const [confirmModal, setConfirmModal] = useState<{
    show: boolean; title: string; message: string; type: 'single' | 'all'; targetId?: string;
  }>({ show: false, title: '', message: '', type: 'single' });

  const [selectedTask, setSelectedTask] = useState<UserTask | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Omit<UserTask, 'id'>>({
    name: '', taskDate: '', taskTime: '', taskText: '', email: '', phone: ''
  });

  // 1. جلب البيانات من الفايربيس
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (querySnapshot) => {
      const formattedData: UserTask[] = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          taskDate: data.taskDate || '',
          taskTime: data.taskTime || '',
          taskText: data.taskText || '',
          email: data.email || '',
          phone: data.phone || '-'
        };
      });
      setTasks(formattedData);
      setLoading(false);
    }, (error) => {
      console.error(error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 🌟 2. مراقبة الوقت حياً (كل ثانية) لإطلاق المنبه والاهتزاز
  useEffect(() => {
    const checkAlarmClock = setInterval(() => {
      const now = new Date();
      
      // تحويل التاريخ الحالي إلى صيغة YYYY-MM-DD المطابقة لمدخلات الـ input date
      const currentDateStr = now.toISOString().split('T')[0];
      
      // تحويل الوقت الحالي إلى صيغة HH:MM المطابقة لمدخلات الـ input time
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;

      tasks.forEach((task) => {
        // إذا تطابق تاريخ ووقت المهمة مع الوقت الحالي وجهاز المستخدم
        if (task.taskDate === currentDateStr && task.taskTime === currentTimeStr) {
          
          // تأكيد عدم تكرار إضافة التنبيه إذا كان مفعلاً بالفعل في الـ state
          if (!activeAlarms.includes(task.id)) {
            setActiveAlarms((prev) => [...prev, task.id]);
            
            // 🔊 تشغيل تنبيه صوتي رقمي محاكي متوافق مع كافة المتصفحات
            try {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const oscillator = audioCtx.createOscillator();
              const gainNode = audioCtx.createGain();
              oscillator.connect(gainNode);
              gainNode.connect(audioCtx.destination);
              oscillator.type = 'sine';
              oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // تردد الصوت (نغمة حادة)
              gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
              oscillator.start();
              oscillator.stop(audioCtx.currentTime + 1.5); // مدة رنة المنبه ثانية ونصف
            } catch (e) {
              console.log("Audio Context control error:", e);
            }
          }
        }
      });
    }, 1000);

    return () => clearInterval(checkAlarmClock);
  }, [tasks, activeAlarms]);

  const triggerDeleteSingle = (id: string, name: string) => {
    setConfirmModal({
      show: true,
      title: '🗑️ تأكيد حذف المهمة',
      message: `هل أنت متأكد من مسح مهمة "${name}" نهائياً؟`,
      type: 'single',
      targetId: id
    });
  };

  const triggerDeleteAll = () => {
    setConfirmModal({
      show: true,
      title: '⚠️ تحذير صارم: مسح الكل',
      message: 'هل أنت متأكد من مسح جميع المهام من قاعدة البيانات نهائياً؟ لا يمكن التراجع عن هذا الإجراء.',
      type: 'all'
    });
  };

  const handleConfirmAction = async () => {
    const { type, targetId } = confirmModal;
    setConfirmModal(prev => ({ ...prev, show: false })); 

    if (type === 'single' && targetId) {
      try {
        setActionStatus({ isLoading: true, isSuccess: false, message: 'جاري حذف المهمة حالياً...', successMessage: 'تم الحذف بنجاح', colorClass: 'danger', iconClass: 'bi-trash3-fill' });
        await deleteDoc(doc(db, "users", targetId));
        // إزالة المهمة من قائمة المنبهات النشطة في حال حذفها
        setActiveAlarms(prev => prev.filter(id => id !== targetId));
        setTimeout(() => {
          setActionStatus(prev => ({ ...prev, isLoading: false, isSuccess: true }));
          setTimeout(() => setActionStatus(prev => ({ ...prev, isSuccess: false })), 1200);
        }, 800);
      } catch (err) {
        setActionStatus(prev => ({ ...prev, isLoading: false }));
      }
    } else if (type === 'all') {
      try {
        setActionStatus({ isLoading: true, isSuccess: false, message: 'جاري مسح وتنظيف قاعدة البيانات...', successMessage: 'تم مسح الكل بنجاح', colorClass: 'danger', iconClass: 'bi-x-circle-fill' });
        const querySnapshot = await getDocs(collection(db, "users"));
        const batch = writeBatch(db);
        querySnapshot.docs.forEach((document) => batch.delete(doc(db, "users", document.id)));
        await batch.commit();
        setActiveAlarms([]);
        setTimeout(() => {
          setActionStatus(prev => ({ ...prev, isLoading: false, isSuccess: true }));
          setTimeout(() => setActionStatus(prev => ({ ...prev, isSuccess: false })), 1200);
        }, 1000);
      } catch (err) {
        setActionStatus(prev => ({ ...prev, isLoading: false }));
      }
    }
  };

  const startEdit = (task: UserTask) => {
    setEditingId(task.id);
    setEditFormData({ name: task.name, taskDate: task.taskDate, taskTime: task.taskTime, taskText: task.taskText, email: task.email, phone: task.phone });
  };

  const handleUpdate = async (id: string) => {
    try {
      setActionStatus({ isLoading: true, isSuccess: false, message: 'جاري حفظ التعديلات حياً...', successMessage: 'تم التعديل بنجاح', colorClass: 'success', iconClass: 'bi-check-circle-fill' });
      await updateDoc(doc(db, "users", id), { ...editFormData });
      setEditingId(null);
      // تصفير منبه البطاقة عند تعديل بياناتها لأوقات جديدة
      setActiveAlarms(prev => prev.filter(item => item !== id));
      setTimeout(() => {
        setActionStatus(prev => ({ ...prev, isLoading: false, isSuccess: true }));
        setTimeout(() => setActionStatus(prev => ({ ...prev, isSuccess: false })), 1200);
      }, 800);
    } catch (err) {
      setActionStatus(prev => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <div className="container my-5" dir="rtl">
      
      {/* 🌟 كود حقن تأثير الاهتزاز الاحترافي في الصفحة انسيابياً بدون ملف خارجي */}
      <style>{`
        @keyframes shakeEffect {
          0% { transform: translate(1px, 1px) rotate(0deg); }
          10% { transform: translate(-1px, -2px) rotate(-1deg); }
          20% { transform: translate(-3px, 0px) rotate(1deg); }
          30% { transform: translate(0px, 2px) rotate(0deg); }
          40% { transform: translate(1px, -1px) rotate(1deg); }
          50% { transform: translate(-1px, 2px) rotate(-1deg); }
          60% { transform: translate(-3px, 1px) rotate(0deg); }
          70% { transform: translate(2px, 1px) rotate(-1deg); }
          80% { transform: translate(-1px, -1px) rotate(1deg); }
          90% { transform: translate(2px, 2px) rotate(0deg); }
          100% { transform: translate(1px, -2px) rotate(-1deg); }
        }
        .vibrate-active {
          animation: shakeEffect 0.5s infinite;
        }
      `}</style>

      {/* النافذة المنبثقة للتفاصيل الكاملة */}
      {selectedTask && (
        <>
          <div className="modal-backdrop fade show" style={{ zIndex: 1060 }} onClick={() => setSelectedTask(null)}></div>
          <div className="modal fade show d-block d-flex align-items-center" tabIndex={-1} style={{ zIndex: 1070, background: 'rgba(0,0,0,0.1)' }} onClick={() => setSelectedTask(null)}>
            <div className="modal-dialog modal-dialog-centered mx-auto" style={{ maxWidth: '550px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-content border-0 shadow-lg rounded-3 overflow-hidden">
                <div className="modal-header text-white py-3" style={{ backgroundColor: activeAlarms.includes(selectedTask.id) ? '#198754' : '#1e3a8a' }}>
                  <h5 className="modal-title fw-bold m-0">
                    <i className="bi bi-search me-2"></i> 
                    {activeAlarms.includes(selectedTask.id) ? '🔔 تنبيه نشط حالياً!' : 'تفاصيل المهمة الكاملة'}
                  </h5>
                  <button type="button" className="btn-close btn-close-white ms-0 me-auto" onClick={() => setSelectedTask(null)}></button>
                </div>
                <div className="modal-body p-4 bg-light">
                  <div className="bg-white p-3 rounded-3 shadow-sm mb-3">
                    <p className="mb-2"><strong><i className="bi bi-person-fill text-primary me-1"></i> المسؤول:</strong> {selectedTask.name}</p>
                    <p className="mb-2"><strong><i className="bi bi-calendar3 text-primary me-1"></i> التاريخ:</strong> {selectedTask.taskDate}</p>
                    <p className="mb-2"><strong><i className="bi bi-clock-fill text-primary me-1"></i> الزمن:</strong> {selectedTask.taskTime}</p>
                  </div>
                  <div className="bg-white p-3 rounded-3 shadow-sm mb-3 border-start border-3" style={{ borderColor: '#1e3a8a' }}>
                    <h6 className="fw-bold text-secondary mb-2"><i className="bi bi-file-text-fill text-primary me-1"></i> نص المهمة:</h6>
                    <p className="mb-0 text-dark small" style={{ lineHeight: '1.6', whiteSpace: 'pre-line' }}>{selectedTask.taskText}</p>
                  </div>
                  <div className="bg-white p-3 rounded-3 shadow-sm mb-0">
                    <p className="mb-2"><strong><i className="bi bi-envelope-fill text-primary me-1"></i> البريد الإلكتروني:</strong> <a href={`mailto:${selectedTask.email}`} className="text-decoration-none">{selectedTask.email}</a></p>
                    <p className="mb-0"><strong><i className="bi bi-telephone-fill text-primary me-1"></i> رقم الهاتف:</strong> {selectedTask.phone}</p>
                  </div>
                </div>
                <div className="modal-footer bg-light border-0 p-3 d-flex justify-content-between">
                  <div className="d-flex gap-2">
                    <button className="btn btn-warning btn-sm fw-bold px-3 text-dark" onClick={() => { startEdit(selectedTask); setSelectedTask(null); }}><i className="bi bi-pencil-square"></i> تعديل</button>
                    <button className="btn btn-danger btn-sm fw-bold px-3 text-white" onClick={() => { triggerDeleteSingle(selectedTask.id, selectedTask.name); setSelectedTask(null); }}><i className="bi bi-trash3-fill"></i> حذف</button>
                  </div>
                  <button type="button" className="btn btn-outline-secondary btn-sm px-3" onClick={() => setSelectedTask(null)}>إلغاء</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* الـ Modals المعتادة لإشعار المزامنة والتأكيد */}
      {confirmModal.show && (
        <>
          <div className="modal-backdrop fade show" style={{ zIndex: 1080 }}></div>
          <div className="modal fade show d-block d-flex align-items-center" style={{ zIndex: 1090 }} tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered mx-auto" style={{ maxWidth: '450px', width: '90%' }}>
              <div className="modal-content border-0 shadow-lg rounded-3">
                <div className={`modal-header ${confirmModal.type === 'all' ? 'bg-danger' : 'bg-warning text-dark'} text-white py-3`}>
                  <h5 className="modal-title fw-bold m-0">{confirmModal.title}</h5>
                </div>
                <div className="modal-body p-4 text-center bg-light">
                  <p className="fw-semibold text-dark mb-0 fs-6">{confirmModal.message}</p>
                </div>
                <div className="modal-footer bg-light border-0 p-3 justify-content-start gap-2">
                  <button type="button" className={`btn ${confirmModal.type === 'all' ? 'btn-danger' : 'btn-warning text-dark'} fw-bold px-4`} onClick={handleConfirmAction}>تأكيد المسح</button>
                  <button type="button" className="btn btn-outline-secondary px-3" onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}>إلغاء</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {(actionStatus.isLoading || actionStatus.isSuccess) && (
        <>
          <div className="modal-backdrop fade show" style={{ zIndex: 1100 }}></div>
          <div className="modal fade show d-block d-flex align-items-center">
            <div className="modal-dialog modal-dialog-centered mx-auto" style={{ maxWidth: '400px', width: '90%' }}>
              <div className="modal-content border-0 shadow-lg text-center rounded-3 p-5 bg-white">
                {actionStatus.isLoading && (
                  <>
                    <div className="spinner-border mb-4" role="status" style={{ width: '3.5rem', height: '3.5rem', borderWidth: '5px', color: '#1e3a8a' }}></div>
                    <h5 className="fw-extrabold text-secondary mb-0">{actionStatus.message}</h5>
                  </>
                )}
                {actionStatus.isSuccess && (
                  <>
                    <div className={`text-${actionStatus.colorClass} mb-3`} style={{ fontSize: '4.5rem', lineHeight: '1' }}><i className={`bi ${actionStatus.iconClass}`}></i></div>
                    <h4 className={`fw-extrabold text-${actionStatus.colorClass} mb-1`}>{actionStatus.successMessage}</h4>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* التحكم العلوي */}
      <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <h4 className="fw-bold text-dark d-flex align-items-center gap-2 m-0">
          <i className="bi bi-clipboard-data-fill" style={{ color: '#1e3a8a' }}></i> لوحة عرض المهام الحالية
          <span className="badge rounded-pill px-3 py-1.5 fs-7 shadow-sm text-white fw-bold" style={{ backgroundColor: '#1e3a8a' }}>
            {tasks.length} {tasks.length >= 3 && tasks.length <= 10 ? 'مهام' : 'مهمة'}
          </span>
        </h4>
        {tasks.length > 0 && (
          <button className="btn btn-danger btn-sm d-flex align-items-center gap-2 fw-bold px-3 py-2 rounded-3 shadow-sm border-0" onClick={triggerDeleteAll} style={{ background: 'linear-gradient(135deg, #dc3545 0%, #bd2130 100%)' }}>
            <i className="bi bi-trash3-fill"></i><span>مسح كل القائمة</span>
          </button>
        )}
      </div>

      {/* عرض كروت المهام */}
      {tasks.length === 0 ? (
        <div className="text-center py-5 border rounded-3 bg-white shadow-sm">
          <div className="mb-3" style={{ fontSize: '3rem', color: '#1e3a8a', opacity: 0.4 }}><i className="bi bi-inbox"></i></div>
          <h4 className="fw-extrabold text-dark mb-2">لا توجد مهام مضافة حالياً</h4>
        </div>
      ) : (
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4">
          {tasks.map((task) => {
            // 🌟 فحص إذا كان الكرت الحالي تحت طائلة التنبيه لتخصيص الستايل
            const isAlarmTriggered = activeAlarms.includes(task.id);

            return (
              <div className="col" key={task.id}>
                <div 
                  // 🌟 إرفاق كلاس الاهتزاز vibration-active تلقائياً إذا حان التنبيه
                  className={`card h-100 border-0 shadow rounded-3 overflow-hidden position-relative ${isAlarmTriggered ? 'vibrate-active' : ''}`} 
                  onClick={() => editingId !== task.id && setSelectedTask(task)}
                  style={{ 
                    // 🌟 قلب لون الترويسة العلوي للأخضر والباك جراوند لأخضر شفاف عند التنبيه
                    borderTop: isAlarmTriggered ? '4px solid #198754' : '4px solid #1e3a8a',
                    backgroundColor: isAlarmTriggered ? 'rgba(25, 135, 84, 0.12)' : '#ffffff',
                    cursor: editingId === task.id ? 'default' : 'pointer',
                    transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s ease, background-color 0.5s ease'
                  }}
                  onMouseEnter={(e) => {
                    if(editingId !== task.id) {
                      e.currentTarget.style.transform = 'translateY(-6px)';
                      e.currentTarget.style.boxShadow = isAlarmTriggered ? '0 1rem 3rem rgba(25, 135, 84, 0.25)' : '0 1rem 3rem rgba(30, 58, 138, 0.15)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 .5rem 1rem rgba(0,0,0,.05)';
                  }}
                >
                  
                  {/* وضعية التعديل */}
                  {editingId === task.id ? (
                    <div className="card-body p-3 d-flex flex-column gap-2 bg-light" onClick={(e) => e.stopPropagation()}>
                      <span className="badge bg-warning text-dark align-self-start mb-1"><i className="bi bi-gear-wide-connected"></i> وضعية التعديل</span>
                      <input type="text" className="form-control form-control-sm border-2" value={editFormData.name} onChange={(e) => setEditFormData({...editFormData, name: e.target.value})} placeholder="الاسم" />
                      <input type="date" className="form-control form-control-sm border-2" value={editFormData.taskDate} onChange={(e) => setEditFormData({...editFormData, taskDate: e.target.value})} />
                      <input type="time" className="form-control form-control-sm border-2" value={editFormData.taskTime} onChange={(e) => setEditFormData({...editFormData, taskTime: e.target.value})} />
                      <textarea className="form-control form-control-sm border-2" rows={2} value={editFormData.taskText} onChange={(e) => setEditFormData({...editFormData, taskText: e.target.value})} placeholder="نص المهمة"></textarea>
                      <input type="email" className="form-control form-control-sm border-2" value={editFormData.email} onChange={(e) => setEditFormData({...editFormData, email: e.target.value})} placeholder="الإيميل" />
                      <input type="text" className="form-control form-control-sm border-2" value={editFormData.phone} onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})} placeholder="الهاتف" />
                      <div className="d-flex gap-2 mt-2">
                        <button className="btn btn-success btn-sm w-50 fw-bold" onClick={() => handleUpdate(task.id)}><i className="bi bi-check-lg"></i> حفظ</button>
                        <button className="btn btn-secondary btn-sm w-50" onClick={() => setEditingId(null)}>إلغاء</button>
                      </div>
                    </div>
                  ) : (
                    // وضعية العرض الافتراضية للكرت
                    <div className="card-body p-4 d-flex flex-column justify-content-between">
                      <div>
                        {/* 🌟 إذا الكرت منبه حالياً، نغير لون الأيقونة والاسم */}
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h5 className={`card-title fw-bold m-0 fs-6 ${isAlarmTriggered ? 'text-success' : 'text-dark'}`}>
                            <i className={`bi ${isAlarmTriggered ? 'bi-bell-fill text-success' : 'bi-person text-secondary'} me-1`}></i> {task.name}
                          </h5>
                          <span className={`badge ${isAlarmTriggered ? 'bg-success text-white' : 'bg-light text-secondary border'} px-2 py-1 rounded-pill small`} style={{ fontSize: '0.72rem' }}>
                            <i className="bi bi-calendar4-event me-1"></i> {task.taskDate}
                          </span>
                        </div>
                        
                        <div className="text-muted mb-3 small d-flex align-items-center gap-1" style={{ fontSize: '0.8rem' }}>
                          <i className={`bi bi-clock me-1 ${isAlarmTriggered ? 'text-success' : 'text-primary'}`}></i> 
                          <span>الوقت: {task.taskTime}</span>
                        </div>

                        <div className="p-2.5 rounded-3 mb-3 border-start border-3" style={{ backgroundColor: 'rgba(0,0,0,0.02)', borderColor: isAlarmTriggered ? '#198754' : '#1e3a8a' }}>
                          <p className="card-text text-secondary mb-0 small text-truncate">
                            <i className="bi bi-list-task me-1"></i> {task.taskText}
                          </p>
                        </div>
                      </div>

                      <div className="border-top pt-2 mt-2 small text-muted">
                        <div className="text-truncate mb-1"><i className="bi bi-envelope me-1"></i> {task.email}</div>
                        <div className="text-truncate mb-3"><i className="bi bi-telephone me-1"></i> {task.phone}</div>

                        <div className="d-flex justify-content-between align-items-center border-top pt-2" onClick={(e) => e.stopPropagation()}>
                          {/* زر لإيقاف منبه الكرت يدوياً بعد سماعه */}
                          {isAlarmTriggered ? (
                            <button className="btn btn-xs btn-success text-white fw-bold py-0.5 px-2 rounded-2" style={{ fontSize: '0.7rem' }} onClick={() => setActiveAlarms(prev => prev.filter(id => id !== task.id))}>
                              🔕 إيقاف التنبيه
                            </button>
                          ) : <div />}
                          
                          <div className="d-flex gap-2">
                            <button className="btn btn-sm btn-outline-primary border-0 rounded-circle" onClick={() => startEdit(task)} title="تعديل" style={{ width: '32px', height: '32px', padding: 0 }}>
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button className="btn btn-sm btn-outline-danger border-0 rounded-circle" onClick={() => triggerDeleteSingle(task.id, task.name)} title="حذف" style={{ width: '32px', height: '32px', padding: 0 }}>
                              <i className="bi bi-trash3"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default GetData;