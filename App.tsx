
import React, { useState, useEffect, useRef } from 'react';
import { Button } from './components/Button';
import { Modal } from './components/Modal';
import { APP_TITLE, COPYRIGHT, EXAM_CONFIG, EXAM_LINKS as DEFAULT_LINKS, WELCOME_MSG } from './constants';
import { GradeLevel, Rombel, Subject, ExamSchedule, LinkMap } from './types';
import { ArrowLeft, BookOpen, CheckCircle, HelpCircle, Info, LayoutDashboard, Download, Trash2, LogOut, LockKeyhole, FileText, RotateCcw, Calendar, Clock, Settings, AlertCircle, X, Bell, Pencil, Link as LinkIcon, Save, Filter, ChevronDown } from 'lucide-react';

// Interface untuk Data Presensi
interface AttendanceRecord {
  id: number;
  timestamp: string;
  name: string;
  nisn: string;
  grade: string;
  rombel: string;
  subject: string;
  examType: string;
}

// --- Safe Storage Helper for Iframe Embedding ---
const safeStorage = {
  get: (key: string, type: 'local' | 'session' = 'local') => {
    try {
      const s = type === 'local' ? localStorage : sessionStorage;
      return s.getItem(key);
    } catch (e) {
      console.warn(`Storage access blocked (${key}):`, e);
      return null;
    }
  },
  set: (key: string, value: string, type: 'local' | 'session' = 'local') => {
    try {
      const s = type === 'local' ? localStorage : sessionStorage;
      s.setItem(key, value);
    } catch (e) {
      console.warn(`Storage write blocked (${key}):`, e);
    }
  },
  remove: (key: string, type: 'local' | 'session' = 'local') => {
    try {
      const s = type === 'local' ? localStorage : sessionStorage;
      s.removeItem(key);
    } catch (e) {
      console.warn(`Storage remove blocked (${key}):`, e);
    }
  }
};

// Helper untuk Restore State Siswa
const getStoredStudentSession = () => {
  try {
    const sess = safeStorage.get('sas_student_session', 'session');
    return sess ? JSON.parse(sess) : null;
  } catch { return null; }
};

const getStoredFormDraft = () => {
  try {
    const draft = safeStorage.get('sas_student_form_draft', 'session');
    return draft ? JSON.parse(draft) : null;
  } catch { return null; }
};

const App: React.FC = () => {
  // --- 1. State Management & Initialization ---
  
  // Admin Session Persistence
  const [viewMode, setViewMode] = useState<'exam' | 'dashboard'>(() => {
    return safeStorage.get('sas_admin_session') === 'true' ? 'dashboard' : 'exam';
  });

  // Dashboard Tab Persistence
  const [dashboardTab, setDashboardTab] = useState<'attendance' | 'schedule' | 'links'>(() => {
    return (safeStorage.get('sas_dashboard_tab') as 'attendance' | 'schedule' | 'links') || 'attendance';
  });
  
  // Student Flow Persistence
  const storedSession = getStoredStudentSession();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(storedSession?.step || 1);
  
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel | null>(storedSession?.grade || null);
  
  const [selectedRombel, setSelectedRombel] = useState<Rombel | null>(() => {
    if (storedSession?.rombelId && storedSession?.grade) {
       return EXAM_CONFIG.grades[storedSession.grade as GradeLevel]?.rombels.find(r => r.id === storedSession.rombelId) || null;
    }
    return null;
  });
  
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(() => {
    if (storedSession?.subjectId) {
      return EXAM_CONFIG.subjects.find(s => s.id === storedSession.subjectId) || null;
    }
    return null;
  });
  
  // Form Data State (Draft Persistence)
  const storedDraft = getStoredFormDraft();
  const [studentName, setStudentName] = useState(storedDraft?.name || '');
  const [studentNISN, setStudentNISN] = useState(storedDraft?.nisn || '');
  const [examType, setExamType] = useState(storedDraft?.examType || 'Sumatif Akhir Semester (SAS)');

  // Data States (Persistent Lazy Load)
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>(() => {
    try {
      const stored = safeStorage.get('sas_attendance_data');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Failed to load attendance data", e);
      return [];
    }
  });

  const [schedules, setSchedules] = useState<ExamSchedule[]>(() => {
    try {
      const stored = safeStorage.get('sas_exam_schedules');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Failed to load schedules", e);
      return [];
    }
  });

  // Link Management State
  const [examLinks, setExamLinks] = useState<LinkMap>(() => {
    try {
      const stored = safeStorage.get('sas_exam_links');
      return stored ? { ...DEFAULT_LINKS, ...JSON.parse(stored) } : DEFAULT_LINKS;
    } catch {
      return DEFAULT_LINKS;
    }
  });
  
  // Dashboard Filter State (Persistent)
  const [filterGrade, setFilterGrade] = useState(() => {
    try {
        const stored = safeStorage.get('sas_dashboard_filters');
        const filters = JSON.parse(stored || '{}');
        return filters.grade || '';
    } catch { return ''; }
  });
  const [filterRombel, setFilterRombel] = useState(() => {
    try {
        const stored = safeStorage.get('sas_dashboard_filters');
        const filters = JSON.parse(stored || '{}');
        return filters.rombel || '';
    } catch { return ''; }
  });
  const [filterSubject, setFilterSubject] = useState(() => {
    try {
        const stored = safeStorage.get('sas_dashboard_filters');
        const filters = JSON.parse(stored || '{}');
        return filters.subject || '';
    } catch { return ''; }
  });

  // Schedule Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [schedGrade, setSchedGrade] = useState<string>('ALL');
  const [schedSubjectId, setSchedSubjectId] = useState<string>('');
  const [schedDate, setSchedDate] = useState<string>('');
  const [schedStartTime, setSchedStartTime] = useState<string>('');
  const [schedEndTime, setSchedEndTime] = useState<string>('');

  // Link Form State
  const [linkGrade, setLinkGrade] = useState<string>('');
  const [linkRombelId, setLinkRombelId] = useState<string>('');
  const [linkSubjectId, setLinkSubjectId] = useState<string>('');
  const [linkUrl, setLinkUrl] = useState<string>('');

  // Modal States
  const [showInstructions, setShowInstructions] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  // Notification Modal State
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    title: string;
    content: React.ReactNode;
    type: 'success' | 'error' | 'info';
  }>({
    isOpen: false,
    title: '',
    content: null,
    type: 'info'
  });
  
  // Login Form State
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Refs
  const scheduleFormRef = useRef<HTMLDivElement>(null);

  // --- 2. Persistence Effects ---

  // Save Admin Session
  useEffect(() => {
    if (viewMode === 'dashboard') {
      safeStorage.set('sas_admin_session', 'true');
    } else {
      safeStorage.remove('sas_admin_session');
    }
  }, [viewMode]);

  // Save Dashboard Tab
  useEffect(() => {
    safeStorage.set('sas_dashboard_tab', dashboardTab);
  }, [dashboardTab]);

  // Save Filters
  useEffect(() => {
    const filters = { grade: filterGrade, rombel: filterRombel, subject: filterSubject };
    safeStorage.set('sas_dashboard_filters', JSON.stringify(filters));
  }, [filterGrade, filterRombel, filterSubject]);

  // Save Student Session
  useEffect(() => {
    if (viewMode === 'exam') {
      const session = {
        step,
        grade: selectedGrade,
        rombelId: selectedRombel?.id,
        subjectId: selectedSubject?.id
      };
      safeStorage.set('sas_student_session', JSON.stringify(session), 'session');
    }
  }, [step, selectedGrade, selectedRombel, selectedSubject, viewMode]);

  // Save Form Draft
  useEffect(() => {
    if (step === 4) {
      const draft = { name: studentName, nisn: studentNISN, examType };
      safeStorage.set('sas_student_form_draft', JSON.stringify(draft), 'session');
    }
  }, [studentName, studentNISN, examType, step]);

  // Sync Data to Storage automatically
  useEffect(() => {
    safeStorage.set('sas_attendance_data', JSON.stringify(attendanceData));
  }, [attendanceData]);

  useEffect(() => {
    safeStorage.set('sas_exam_schedules', JSON.stringify(schedules));
  }, [schedules]);

  useEffect(() => {
    safeStorage.set('sas_exam_links', JSON.stringify(examLinks));
  }, [examLinks]);

  // --- 3. Handlers ---
  const handleGradeSelect = (grade: GradeLevel) => {
    setSelectedGrade(grade);
    setStep(2);
  };

  const handleRombelSelect = (rombel: Rombel) => {
    setSelectedRombel(rombel);
    setStep(3);
  };

  // Determine if an exam is open, closed (future), or ended (past)
  const getExamStatus = (grade: GradeLevel, subjectId: string): { status: 'open' | 'closed' | 'ended', message?: string } => {
    const relevantSchedules = schedules.filter(s => 
      s.subjectId === subjectId && (s.grade === grade || s.grade === 'ALL')
    );

    if (relevantSchedules.length === 0) return { status: 'open' };

    relevantSchedules.sort((a, b) => {
      const aScore = a.grade === 'ALL' ? 0 : 1;
      const bScore = b.grade === 'ALL' ? 0 : 1;
      return bScore - aScore; 
    });

    const schedule = relevantSchedules[0];
    const now = new Date();
    const startDateTime = new Date(`${schedule.date}T${schedule.startTime}`);
    const endDateTime = new Date(`${schedule.date}T${schedule.endTime}`);

    const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const dateStr = new Date(schedule.date).toLocaleDateString('id-ID', dateOptions);

    if (now < startDateTime) {
      return { 
        status: 'closed', 
        message: `${dateStr}, Pukul ${schedule.startTime} WIB` 
      };
    } else if (now > endDateTime) {
      return { 
        status: 'ended',
        message: `${dateStr}, Pukul ${schedule.endTime} WIB`
      };
    } else {
      return { status: 'open' };
    }
  };

  const handleSubjectSelect = (subject: Subject) => {
    const status = getExamStatus(selectedGrade!, subject.id);
    
    if (status.status === 'closed') {
      setNotification({
        isOpen: true,
        title: 'Ujian Belum Dibuka ⏳',
        type: 'info',
        content: (
          <div className="text-center">
            <p className="mb-4 text-gray-600">Mohon maaf, ujian mata pelajaran <span className="font-bold text-teal-700">{subject.name}</span> belum dimulai.</p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mx-auto max-w-xs">
              <p className="text-xs font-bold text-yellow-600 uppercase mb-1">Jadwal Ujian</p>
              <p className="font-bold text-yellow-800 text-lg">{status.message}</p>
            </div>
            <p className="mt-4 text-sm text-gray-500">Silakan kembali lagi nanti sesuai jadwal ya!</p>
          </div>
        )
      });
      return;
    }
    if (status.status === 'ended') {
      setNotification({
        isOpen: true,
        title: 'Waktu Ujian Habis 🔒',
        type: 'error',
        content: (
          <div className="text-center">
            <div className="text-red-500 mb-2 mx-auto flex justify-center"><X size={48} /></div>
            <p className="mb-2 text-gray-600">Waktu ujian untuk mata pelajaran <span className="font-bold text-red-600">{subject.name}</span> telah berakhir.</p>
            <p className="text-sm text-gray-500 italic">Berakhir pada: {status.message}</p>
          </div>
        )
      });
      return;
    }

    setSelectedSubject(subject);
    setStep(4);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
    }
  };

  const handleReset = () => {
    setStep(1);
    setSelectedGrade(null);
    setSelectedRombel(null);
    setSelectedSubject(null);
    setStudentName('');
    setStudentNISN('');
    // Clear Session Storage
    safeStorage.remove('sas_student_session', 'session');
    safeStorage.remove('sas_student_form_draft', 'session');
  };

  const saveAttendance = () => {
    if (!selectedGrade || !selectedRombel || !selectedSubject) return;

    const newRecord: AttendanceRecord = {
      id: Date.now(),
      timestamp: new Date().toLocaleString('id-ID'),
      name: studentName,
      nisn: studentNISN,
      grade: selectedGrade,
      rombel: selectedRombel.name,
      subject: selectedSubject.name,
      examType: examType
    };

    setAttendanceData(prev => [newRecord, ...prev]);
  };

  const handleStartExam = () => {
    if (!studentName.trim()) {
      alert("Harap isi Nama Lengkap!");
      return;
    }
    if (!studentNISN.trim()) {
      alert("Harap isi NISN!");
      return;
    }

    if (!selectedGrade || !selectedRombel || !selectedSubject) return;

    const status = getExamStatus(selectedGrade, selectedSubject.id);
    if (status.status !== 'open') {
      setNotification({
        isOpen: true,
        title: 'Akses Ditolak',
        type: 'error',
        content: <p>Maaf, waktu ujian tidak valid saat ini.</p>
      });
      return;
    }

    saveAttendance();

    // Clear draft after success
    safeStorage.remove('sas_student_form_draft', 'session');

    // Dynamic Link Lookup
    const specificKey = `${selectedGrade}-${selectedRombel.id}-${selectedSubject.id}`;
    const url = examLinks[specificKey] || examLinks['default'];
    
    window.open(url, '_blank');
  };

  // --- Schedule Logic ---

  const handleSaveSchedule = () => {
    if (!schedSubjectId || !schedDate || !schedStartTime || !schedEndTime) {
      setNotification({
        isOpen: true,
        title: 'Data Tidak Lengkap',
        type: 'error',
        content: <p>Mohon lengkapi semua data jadwal (Mapel, Tanggal, dan Waktu).</p>
      });
      return;
    }

    const newScheduleData = {
      grade: schedGrade as GradeLevel | 'ALL',
      subjectId: schedSubjectId,
      date: schedDate,
      startTime: schedStartTime,
      endTime: schedEndTime
    };

    let updatedSchedules = [...schedules];

    // Conflict Resolution
    updatedSchedules = updatedSchedules.filter(s => {
      const isConflict = s.grade === newScheduleData.grade && s.subjectId === newScheduleData.subjectId;
      const isSelf = editingId ? s.id === editingId : false;
      return !isConflict && !isSelf;
    });

    updatedSchedules.push({
      id: editingId || Date.now().toString(),
      ...newScheduleData
    });

    updatedSchedules.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setSchedules(updatedSchedules);
    
    setNotification({
      isOpen: true,
      title: editingId ? 'Jadwal Diperbarui' : 'Jadwal Ditambahkan',
      type: 'success',
      content: <p>{editingId ? 'Jadwal berhasil diperbarui.' : 'Jadwal ujian baru berhasil ditambahkan.'}</p>
    });

    handleCancelEdit();
  };

  const handleEditSchedule = (schedule: ExamSchedule) => {
    setEditingId(schedule.id);
    setSchedGrade(schedule.grade);
    setSchedSubjectId(schedule.subjectId);
    setSchedDate(schedule.date);
    setSchedStartTime(schedule.startTime);
    setSchedEndTime(schedule.endTime);
    
    setTimeout(() => {
      scheduleFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setSchedSubjectId('');
    setSchedDate('');
    setSchedStartTime('');
    setSchedEndTime('');
    setSchedGrade('ALL');
  };

  const handleDeleteSchedule = (id: string) => {
    if(confirm("Apakah Anda yakin ingin menghapus jadwal ini?")) {
      setSchedules(prev => prev.filter(s => s.id !== id));
      if (editingId === id) {
        handleCancelEdit();
      }
    }
  };

  // --- Link Management Logic ---
  const handleSaveLink = () => {
    if (!linkUrl) {
      alert("Masukkan URL Google Form!");
      return;
    }

    let key = 'default';
    // If all specific fields are selected, create a specific key
    if (linkGrade && linkRombelId && linkSubjectId) {
      key = `${linkGrade}-${linkRombelId}-${linkSubjectId}`;
    } else if (linkGrade || linkRombelId || linkSubjectId) {
      // Partial selection not supported for keys in this simple implementation
      // unless we want to implement complex fallback logic. 
      // For now, enforce either "Default" or "Specific (Grade+Rombel+Subject)"
      alert("Untuk link spesifik, harap pilih Kelas, Rombel, dan Mapel secara lengkap. Atau kosongkan semua untuk mengatur Link Default.");
      return;
    }

    setExamLinks(prev => ({
      ...prev,
      [key]: linkUrl
    }));

    setNotification({
      isOpen: true,
      title: 'Link Disimpan',
      type: 'success',
      content: <p>Link ujian untuk <b>{key === 'default' ? 'Default' : key}</b> berhasil disimpan.</p>
    });
    
    // Clear form
    setLinkUrl('');
  };

  const handleDeleteLink = (key: string) => {
     if (confirm(`Hapus link khusus untuk ${key}? Link akan kembali ke Default.`)) {
        setExamLinks(prev => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
     }
  };

  // --- Dashboard & Login Handlers ---
  const handleEnterDashboard = () => {
    setShowLoginModal(true);
  };

  const handleLoginSubmit = () => {
    if (loginUsername === 'Admin' && loginPassword === 'Admin') {
      setShowLoginModal(false);
      setViewMode('dashboard');
      setLoginUsername('');
      setLoginPassword('');
    } else {
      alert("Username atau Password salah! Silakan coba lagi.");
    }
  };

  const handleExitDashboard = () => {
    setViewMode('exam');
  };

  const handleClearData = () => {
    if (confirm("Apakah Anda yakin ingin menghapus SEMUA data presensi? Data tidak dapat dikembalikan.")) {
      setAttendanceData([]);
    }
  };

  const handleResetFilters = () => {
      setFilterGrade('');
      setFilterRombel('');
      setFilterSubject('');
  };

  // Filtering Logic
  const filteredAttendanceData = attendanceData.filter((item) => {
    const matchGrade = filterGrade ? item.grade === filterGrade : true;
    const matchRombel = filterRombel ? item.rombel.includes(filterRombel) : true;
    const matchSubject = filterSubject ? item.subject === filterSubject : true;
    return matchGrade && matchRombel && matchSubject;
  });

  const handleExportCSV = () => {
    if (filteredAttendanceData.length === 0) {
      alert("Belum ada data untuk diekspor.");
      return;
    }

    const headers = ["Waktu", "Nama", "NISN", "Kelas", "Rombel", "Mapel", "Jenis Ujian"];
    const csvContent = [
      headers.join(","),
      ...filteredAttendanceData.map(row => [
        `"${row.timestamp}"`,
        `"${row.name}"`,
        `"${row.nisn}"`,
        `"${row.grade}"`,
        `"${row.rombel}"`,
        `"${row.subject}"`,
        `"${row.examType}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Presensi_SAS_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    // @ts-ignore
    if (!window.jspdf) {
        alert("Library PDF belum dimuat. Silakan refresh halaman.");
        return;
    }

    if (filteredAttendanceData.length === 0) {
        alert("Tidak ada data untuk diekspor ke PDF.");
        return;
    }

    // @ts-ignore
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Laporan Presensi Ujian SAS", 14, 20);
    doc.setFontSize(11);
    doc.text(`Tanggal Cetak: ${new Date().toLocaleString('id-ID')}`, 14, 28);

    let filterInfo = [];
    if(filterGrade) filterInfo.push(`Kelas: ${filterGrade}`);
    if(filterRombel) filterInfo.push(`Rombel: ${filterRombel}`);
    if(filterSubject) filterInfo.push(`Mapel: ${filterSubject}`);
    const filterText = filterInfo.length > 0 ? `Filter: ${filterInfo.join(', ')}` : "Filter: Semua Data";
    doc.text(filterText, 14, 34);

    // @ts-ignore
    doc.autoTable({
        startY: 40,
        head: [['Waktu', 'Nama', 'NISN', 'Kelas', 'Rombel', 'Mapel']],
        body: filteredAttendanceData.map(row => [
            row.timestamp,
            row.name,
            row.nisn,
            row.grade,
            row.rombel,
            row.subject
        ]),
        theme: 'grid',
        headStyles: { fillColor: [13, 148, 136] },
    });

    doc.save(`Laporan_Presensi_SAS_${Date.now()}.pdf`);
  };

  const uniqueGrades = ['4', '5', '6'];
  const uniqueRombels = Array.from(new Set(attendanceData.map(item => item.rombel))).sort();
  const uniqueSubjects = Array.from(new Set(attendanceData.map(item => item.subject))).sort();

  // --- Render Helpers ---

  const renderHeader = () => (
    <header className="text-center mb-8">
      <div className="inline-block bg-white p-4 rounded-full shadow-lg mb-4 border-4 border-primary">
        <BookOpen size={48} className="text-primary" />
      </div>
      <h1 className="text-3xl md:text-4xl font-extrabold text-primary drop-shadow-sm mb-2">
        {APP_TITLE}
      </h1>
      <p className="text-gray-600 font-semibold text-lg">{WELCOME_MSG}</p>
    </header>
  );

  const renderStep1Classes = () => (
    <div className="animate-fade-in-up">
      <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">Pilih Kelas Kamu</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {(Object.keys(EXAM_CONFIG.grades) as GradeLevel[]).map((grade) => (
          <button
            key={grade}
            onClick={() => handleGradeSelect(grade)}
            className="bg-white border-b-8 border-primary hover:border-sky-400 rounded-3xl p-8 shadow-xl transform transition-all duration-300 hover:-translate-y-2 group"
          >
            <div className="text-6xl font-black text-primary mb-2 group-hover:scale-110 transition-transform">
              {grade}
            </div>
            <div className="text-gray-500 font-bold text-xl group-hover:text-sky-500">Kelas</div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep2Rombels = () => {
    if (!selectedGrade) return null;
    const rombels = EXAM_CONFIG.grades[selectedGrade].rombels;

    return (
      <div className="animate-fade-in-up">
        <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">
          Pilih Rombel Kelas <span className="text-primary">{selectedGrade}</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {rombels.map((rombel) => (
            <Button
              key={rombel.id}
              onClick={() => handleRombelSelect(rombel)}
              variant="secondary"
              size="lg"
              className="flex flex-col items-center justify-center py-8 text-2xl border-b-4 border-emerald-400 hover:border-emerald-500"
            >
              <span>{rombel.name}</span>
            </Button>
          ))}
        </div>
      </div>
    );
  };

  const renderStep3Subjects = () => (
    <div className="animate-fade-in-up">
      <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">
        Pilih Mata Pelajaran
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {EXAM_CONFIG.subjects.map((subject) => {
          const examStatus: { status: 'open' | 'closed' | 'ended'; message?: string } = selectedGrade 
            ? getExamStatus(selectedGrade, subject.id) 
            : { status: 'open' };
          let opacityClass = '';
          let statusIcon = null;

          if (examStatus.status === 'closed') {
            opacityClass = 'opacity-70 grayscale-[0.5]';
            statusIcon = <div className="absolute top-2 right-2 bg-yellow-100 text-yellow-700 p-1 rounded-full shadow-sm z-10"><LockKeyhole size={16} /></div>;
          } else if (examStatus.status === 'ended') {
            opacityClass = 'opacity-70 grayscale';
            statusIcon = <div className="absolute top-2 right-2 bg-red-100 text-red-700 p-1 rounded-full shadow-sm z-10"><X size={16} /></div>;
          }

          return (
            <button
              key={subject.id}
              onClick={() => handleSubjectSelect(subject)}
              className={`relative ${subject.color} p-4 rounded-2xl shadow-md hover:shadow-lg transform transition-all hover:scale-105 border-2 border-white/50 ${opacityClass}`}
            >
              {statusIcon}
              <div className="text-4xl mb-2">{subject.icon}</div>
              <div className="font-bold text-gray-700 leading-tight">{subject.name}</div>
              {examStatus.status === 'closed' && (
                <div className="mt-2 text-[10px] font-bold text-yellow-800 bg-yellow-50/80 rounded px-1 py-0.5">
                   {examStatus.message?.split(',')[0]} {examStatus.message?.split('Pukul')[1]}
                </div>
              )}
              {examStatus.status === 'ended' && (
                <div className="mt-2 text-[10px] font-bold text-red-800 bg-red-50/80 rounded px-1 py-0.5">
                   Selesai
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderStep4Form = () => {
    if (!selectedGrade || !selectedRombel || !selectedSubject) return null;

    return (
      <div className="animate-fade-in-up max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl border-4 border-secondary overflow-hidden">
        <div className="bg-secondary p-6 text-center">
          <h2 className="text-2xl font-bold text-teal-900">Daftar Hadir Peserta</h2>
        </div>
        <div className="p-8">
          <div className="flex justify-center gap-2 mb-8 pb-6 border-b border-gray-200 flex-wrap">
             <div className="bg-blue-50 px-4 py-2 rounded-lg text-blue-700 font-bold text-sm">Kelas {selectedGrade}</div>
             <div className="bg-green-50 px-4 py-2 rounded-lg text-green-700 font-bold text-sm">{selectedRombel.name}</div>
             <div className="bg-yellow-50 px-4 py-2 rounded-lg text-yellow-800 font-bold text-sm">{selectedSubject.name}</div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 font-bold mb-2 text-sm">Nama Lengkap</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-sky-100 transition-all"
                placeholder="Tulis nama lengkapmu..."
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-2 text-sm">NISN</label>
              <input 
                type="number" 
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-sky-100 transition-all"
                placeholder="Contoh: 1234567890"
                value={studentNISN}
                onChange={(e) => setStudentNISN(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-2 text-sm">Kelas & Rombel (Otomatis)</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
                value={`${selectedGrade} - ${selectedRombel.name}`}
                disabled
              />
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-2 text-sm">Jenis Ujian</label>
              <select 
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-sky-100 transition-all cursor-pointer"
                value={examType}
                onChange={(e) => setExamType(e.target.value)}
              >
                <option>Sumatif Akhir Semester (SAS)</option>
                <option>Penilaian Tengah Semester (PTS)</option>
                <option>Penilaian Harian (PH)</option>
                <option>Ujian Sekolah (US)</option>
              </select>
            </div>
          </div>

          <div className="mt-8">
            <Button 
              onClick={handleStartExam} 
              variant="primary" 
              size="lg" 
              fullWidth 
              className="text-xl py-4 shadow-xl shadow-sky-200 border-b-8 border-sky-600 hover:border-sky-500"
            >
              Simpan & Mulai Ujian 🚀
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderDashboard = () => (
    <div className="animate-fade-in-up w-full max-w-6xl mx-auto">
      <div className="bg-white rounded-3xl shadow-2xl border-4 border-secondary overflow-hidden min-h-[600px]">
        
        <div className="bg-teal-700 p-6 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <LayoutDashboard size={32} />
            <h2 className="text-2xl font-bold">Dasbor Admin</h2>
          </div>
          <Button onClick={handleExitDashboard} variant="outline" className="bg-white/10 text-white border-white/50 hover:bg-white/20 text-sm">
            <LogOut size={16} className="mr-2 inline" /> Keluar
          </Button>
        </div>

        <div className="flex border-b border-gray-200 overflow-x-auto">
          <button 
            onClick={() => setDashboardTab('attendance')}
            className={`flex-1 min-w-fit px-4 py-4 text-center font-bold transition-colors ${dashboardTab === 'attendance' ? 'bg-teal-50 text-teal-700 border-b-4 border-teal-500' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <div className="flex items-center justify-center gap-2">
              <FileText size={20} /> <span className="hidden sm:inline">Data Presensi</span><span className="sm:hidden">Presensi</span>
            </div>
          </button>
          <button 
            onClick={() => setDashboardTab('schedule')}
            className={`flex-1 min-w-fit px-4 py-4 text-center font-bold transition-colors ${dashboardTab === 'schedule' ? 'bg-teal-50 text-teal-700 border-b-4 border-teal-500' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <div className="flex items-center justify-center gap-2">
              <Calendar size={20} /> <span className="hidden sm:inline">Atur Jadwal</span><span className="sm:hidden">Jadwal</span>
            </div>
          </button>
          <button 
            onClick={() => setDashboardTab('links')}
            className={`flex-1 min-w-fit px-4 py-4 text-center font-bold transition-colors ${dashboardTab === 'links' ? 'bg-teal-50 text-teal-700 border-b-4 border-teal-500' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <div className="flex items-center justify-center gap-2">
              <LinkIcon size={20} /> <span className="hidden sm:inline">Link Soal</span><span className="sm:hidden">Link</span>
            </div>
          </button>
        </div>
        
        <div className="p-6">
          {dashboardTab === 'attendance' && (
            <div className="animate-fade-in-up">
              <div className="bg-white p-5 rounded-2xl shadow-sm mb-6 border border-slate-200">
                <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                  <Filter size={20} className="text-teal-600" />
                  <span className="font-bold text-slate-700">Filter Data Presensi</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Grade Filter */}
                  <div className="relative">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Kelas</label>
                      <div className="relative">
                        <select
                          className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all appearance-none"
                          value={filterGrade}
                          onChange={(e) => setFilterGrade(e.target.value)}
                        >
                            <option value="">Semua Kelas</option>
                            {uniqueGrades.map(g => <option key={g} value={g}>Kelas {g}</option>)}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                          <ChevronDown size={16} />
                        </div>
                      </div>
                  </div>

                  {/* Rombel Filter */}
                  <div className="relative">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Rombel</label>
                      <div className="relative">
                        <select
                          className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all appearance-none"
                          value={filterRombel}
                          onChange={(e) => setFilterRombel(e.target.value)}
                        >
                            <option value="">Semua Rombel</option>
                            {uniqueRombels.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                         <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                          <ChevronDown size={16} />
                        </div>
                      </div>
                  </div>

                  {/* Subject Filter */}
                  <div className="relative">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Mapel</label>
                      <div className="relative">
                        <select
                          className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all appearance-none"
                          value={filterSubject}
                          onChange={(e) => setFilterSubject(e.target.value)}
                        >
                            <option value="">Semua Mapel</option>
                            {uniqueSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                          <ChevronDown size={16} />
                        </div>
                      </div>
                  </div>

                  {/* Reset Button */}
                  <div className="flex items-end">
                      <Button onClick={handleResetFilters} variant="outline" fullWidth className="h-[44px] border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-red-500 hover:border-red-200 transition-colors">
                          <RotateCcw size={18} className="mr-2" /> Reset Filter
                      </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div className="text-gray-600 font-semibold">
                  Total Presensi: <span className="text-teal-700 text-xl">{filteredAttendanceData.length}</span> / {attendanceData.length} Siswa
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleExportPDF} className="bg-red-500 hover:bg-red-600 shadow-red-200" size="sm">
                    <FileText size={16} className="mr-2 inline" /> PDF
                  </Button>
                  <Button onClick={handleExportCSV} variant="secondary" size="sm">
                    <Download size={16} className="mr-2 inline" /> CSV
                  </Button>
                  <Button onClick={handleClearData} className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200 shadow-none" size="sm">
                    <Trash2 size={16} className="mr-2 inline" /> Hapus
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 uppercase text-xs font-bold tracking-wider">
                      <th className="p-4">Waktu</th>
                      <th className="p-4">Nama Lengkap</th>
                      <th className="p-4">NISN</th>
                      <th className="p-4">Kelas/Rombel</th>
                      <th className="p-4">Mapel</th>
                      <th className="p-4">Jenis Ujian</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-slate-100 bg-white">
                    {filteredAttendanceData.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-400 italic">Data tidak ditemukan.</td>
                      </tr>
                    ) : (
                      filteredAttendanceData.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 text-gray-500 whitespace-nowrap">{row.timestamp}</td>
                          <td className="p-4 font-bold text-gray-800">{row.name}</td>
                          <td className="p-4 text-gray-600 font-mono">{row.nisn}</td>
                          <td className="p-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {row.grade} - {row.rombel}
                            </span>
                          </td>
                          <td className="p-4 text-gray-700">{row.subject}</td>
                          <td className="p-4 text-gray-500">{row.examType}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {dashboardTab === 'schedule' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up">
               {/* Form */}
               <div className="lg:col-span-1 bg-slate-50 p-6 rounded-2xl border border-slate-200 h-fit" ref={scheduleFormRef}>
                  <h3 className="font-bold text-lg text-slate-700 mb-4 flex items-center gap-2">
                    <Settings size={20} /> {editingId ? 'Edit Jadwal' : 'Tambah Jadwal'}
                  </h3>
                  {editingId && (
                    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg mb-4 text-sm text-yellow-800 flex justify-between items-center">
                      <span>Sedang mengedit...</span>
                      <button onClick={handleCancelEdit} className="text-xs underline font-bold hover:text-yellow-900">Batal</button>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                     <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Kelas</label>
                        <select 
                          className="w-full p-2 rounded-lg border border-gray-300"
                          value={schedGrade}
                          onChange={(e) => setSchedGrade(e.target.value)}
                        >
                          <option value="ALL">Semua Kelas</option>
                          <option value="4">Kelas 4</option>
                          <option value="5">Kelas 5</option>
                          <option value="6">Kelas 6</option>
                        </select>
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Mata Pelajaran</label>
                        <select 
                          className="w-full p-2 rounded-lg border border-gray-300"
                          value={schedSubjectId}
                          onChange={(e) => setSchedSubjectId(e.target.value)}
                        >
                          <option value="">Pilih Mapel</option>
                          {EXAM_CONFIG.subjects.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Tanggal</label>
                        <input 
                          type="date" 
                          className="w-full p-2 rounded-lg border border-gray-300"
                          value={schedDate}
                          onChange={(e) => setSchedDate(e.target.value)} 
                        />
                     </div>
                     <div className="grid grid-cols-2 gap-2">
                       <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Jam Mulai</label>
                          <input 
                            type="time" 
                            className="w-full p-2 rounded-lg border border-gray-300"
                            value={schedStartTime}
                            onChange={(e) => setSchedStartTime(e.target.value)} 
                          />
                       </div>
                       <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Jam Selesai</label>
                          <input 
                            type="time" 
                            className="w-full p-2 rounded-lg border border-gray-300"
                            value={schedEndTime}
                            onChange={(e) => setSchedEndTime(e.target.value)} 
                          />
                       </div>
                     </div>
                     <div className="pt-2">
                       <Button onClick={handleSaveSchedule} fullWidth>
                         {editingId ? 'Update Jadwal' : 'Simpan Jadwal'}
                       </Button>
                     </div>
                     <p className="text-xs text-gray-500 mt-2 italic">*Jika jadwal tidak dibuat, ujian dianggap BUKA setiap saat.</p>
                  </div>
               </div>

               {/* List */}
               <div className="lg:col-span-2">
                 <h3 className="font-bold text-lg text-slate-700 mb-4 flex items-center gap-2">
                    <Calendar size={20} /> Daftar Jadwal Aktif
                 </h3>
                 <div className="space-y-3">
                   {schedules.length === 0 ? (
                     <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 text-yellow-800 flex items-center gap-3">
                       <Info size={24} />
                       <div>
                         <p className="font-bold">Belum ada jadwal diatur.</p>
                         <p className="text-sm">Siswa dapat mengakses semua ujian kapan saja.</p>
                       </div>
                     </div>
                   ) : (
                     schedules.map((sch) => {
                       const subjName = EXAM_CONFIG.subjects.find(s => s.id === sch.subjectId)?.name || sch.subjectId;
                       const isEditing = editingId === sch.id;
                       return (
                         <div key={sch.id} className={`bg-white p-4 rounded-xl shadow-sm border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${isEditing ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200'}`}>
                           <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${sch.grade === 'ALL' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                  {sch.grade === 'ALL' ? 'Semua Kelas' : `Kelas ${sch.grade}`}
                                </span>
                                <h4 className="font-bold text-gray-800">{subjName}</h4>
                              </div>
                              <div className="text-gray-600 text-sm flex items-center gap-4 mt-1">
                                <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(sch.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                <span className="flex items-center gap-1"><Clock size={14} /> {sch.startTime} - {sch.endTime}</span>
                              </div>
                           </div>
                           <div className="flex gap-2 self-end sm:self-center">
                             <button onClick={() => handleEditSchedule(sch)} className="p-2 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-100 transition-colors" title="Edit"><Pencil size={16} /></button>
                             <button onClick={() => handleDeleteSchedule(sch.id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors" title="Hapus"><Trash2 size={16} /></button>
                           </div>
                         </div>
                       );
                     })
                   )}
                 </div>
               </div>
            </div>
          )}

          {dashboardTab === 'links' && (
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up">
                {/* Link Form */}
                <div className="lg:col-span-1 bg-slate-50 p-6 rounded-2xl border border-slate-200 h-fit">
                    <h3 className="font-bold text-lg text-slate-700 mb-4 flex items-center gap-2">
                       <LinkIcon size={20} /> Atur Link Soal
                    </h3>
                    <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-4 text-xs text-blue-800">
                       <p className="font-bold mb-1">Cara Menggunakan:</p>
                       <ul className="list-disc list-inside">
                          <li>Biarkan Kelas/Rombel/Mapel kosong untuk mengubah <b>Default Link</b>.</li>
                          <li>Pilih semua opsi untuk mengatur link spesifik.</li>
                       </ul>
                    </div>
                    
                    <div className="space-y-4">
                       <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Kelas</label>
                          <select 
                            className="w-full p-2 rounded-lg border border-gray-300"
                            value={linkGrade}
                            onChange={(e) => setLinkGrade(e.target.value)}
                          >
                            <option value="">-- Default / Pilih --</option>
                            {uniqueGrades.map(g => <option key={g} value={g}>Kelas {g}</option>)}
                          </select>
                       </div>
                       <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Rombel (Misal: A)</label>
                          <select
                            className="w-full p-2 rounded-lg border border-gray-300"
                            value={linkRombelId}
                            onChange={(e) => setLinkRombelId(e.target.value)}
                          >
                            <option value="">-- Default / Pilih --</option>
                            <option value="A">Rombel A</option>
                            <option value="B">Rombel B</option>
                            <option value="C">Rombel C</option>
                          </select>
                       </div>
                       <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Mata Pelajaran</label>
                          <select 
                            className="w-full p-2 rounded-lg border border-gray-300"
                            value={linkSubjectId}
                            onChange={(e) => setLinkSubjectId(e.target.value)}
                          >
                            <option value="">-- Default / Pilih --</option>
                            {EXAM_CONFIG.subjects.map(s => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                       </div>
                       <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">URL Google Form</label>
                          <input 
                            type="url" 
                            placeholder="https://docs.google.com/forms/..."
                            className="w-full p-2 rounded-lg border border-gray-300"
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)} 
                          />
                       </div>
                       <div className="pt-2">
                          <Button onClick={handleSaveLink} fullWidth>
                            <Save size={16} className="mr-2 inline" /> Simpan Link
                          </Button>
                       </div>
                    </div>
                </div>

                {/* Link List */}
                <div className="lg:col-span-2">
                    <h3 className="font-bold text-lg text-slate-700 mb-4 flex items-center gap-2">
                       <LinkIcon size={20} /> Daftar Link Tersimpan
                    </h3>
                    <div className="space-y-3">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-200 flex flex-col gap-1">
                             <div className="flex items-center gap-2">
                                <span className="px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-700">DEFAULT</span>
                                <span className="text-sm text-gray-500 font-mono break-all">{examLinks['default']}</span>
                             </div>
                        </div>

                        {Object.keys(examLinks).filter(k => k !== 'default').length === 0 && (
                            <p className="text-sm text-gray-400 italic p-2">Belum ada link khusus yang diatur.</p>
                        )}

                        {Object.keys(examLinks).filter(k => k !== 'default').map(key => {
                            const [g, r, sId] = key.split('-');
                            const sName = EXAM_CONFIG.subjects.find(subj => subj.id === sId)?.name || sId;
                            return (
                                <div key={key} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex justify-between items-start gap-4">
                                    <div className="overflow-hidden">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <span className="px-2 py-1 rounded text-xs font-bold bg-emerald-100 text-emerald-700">Kelas {g}-{r}</span>
                                            <span className="font-bold text-gray-700 text-sm">{sName}</span>
                                        </div>
                                        <div className="text-gray-500 text-xs font-mono truncate">{examLinks[key]}</div>
                                    </div>
                                    <button onClick={() => handleDeleteLink(key)} className="text-red-400 hover:text-red-600 p-1" title="Hapus/Reset">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );

  // --- 4. Main Render ---

  return (
    <>
      {viewMode === 'exam' && (
        <>
          <div className="flex justify-between items-center mb-6 w-full">
            <div className="w-24">
              {step > 1 && (
                <button 
                  onClick={handleBack}
                  className="flex items-center text-primary font-bold bg-white px-4 py-2 rounded-full shadow-sm hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft size={20} className="mr-2" /> Kembali
                </button>
              )}
            </div>
            <div className="flex gap-2 items-center">
              <button 
                onClick={handleEnterDashboard}
                className="bg-gradient-to-r from-teal-400 to-emerald-500 text-white font-bold px-5 py-2 rounded-full shadow-lg hover:shadow-xl hover:scale-105 hover:from-teal-500 hover:to-emerald-600 transition-all flex items-center gap-2 mr-2 animate-pop-up"
                title="Masuk Halaman Guru"
              >
                <LockKeyhole size={16} /> <span className="hidden sm:inline">Login Guru</span>
              </button>
              <button onClick={() => setShowInstructions(true)} className="bg-white text-accent-dark p-2 rounded-full shadow-sm hover:bg-yellow-50 transition-colors border border-white/50 text-yellow-500">
                <HelpCircle size={24} />
              </button>
              <button onClick={() => setShowAbout(true)} className="bg-white text-primary p-2 rounded-full shadow-sm hover:bg-sky-50 transition-colors border border-white/50 text-sky-500">
                <Info size={24} />
              </button>
            </div>
          </div>

          {renderHeader()}

          <main className="w-full flex-grow">
            {step === 1 && renderStep1Classes()}
            {step === 2 && renderStep2Rombels()}
            {step === 3 && renderStep3Subjects()}
            {step === 4 && renderStep4Form()}
          </main>

          <footer className="mt-12 text-center text-gray-500 font-semibold py-4 w-full">
            <p>{COPYRIGHT}</p>
            {step > 1 && (
              <button onClick={handleReset} className="mt-2 text-sm text-red-400 hover:text-red-600 underline flex items-center justify-center w-full gap-1">
                 <RotateCcw size={12} /> Batalkan dan Kembali ke Awal
              </button>
            )}
          </footer>
        </>
      )}

      {viewMode === 'dashboard' && renderDashboard()}

      {/* Modals */}
      <Modal isOpen={showInstructions} onClose={() => setShowInstructions(false)} title="Petunjuk Penggunaan">
        <ul className="space-y-3">
          <li className="flex items-start"><CheckCircle size={20} className="text-green-500 mr-2 mt-1" /> <span>Pilih <b>Kelas</b>, <b>Rombel</b>, dan <b>Mapel</b>.</span></li>
          <li className="flex items-start"><CheckCircle size={20} className="text-green-500 mr-2 mt-1" /> <span>Isi <b>Formulir Daftar Hadir</b> (Nama & NISN).</span></li>
          <li className="flex items-start"><CheckCircle size={20} className="text-green-500 mr-2 mt-1" /> <span>Klik <b>Mulai Ujian</b>.</span></li>
          <li className="flex items-start"><CheckCircle size={20} className="text-green-500 mr-2 mt-1" /> <span>Kerjakan soal dengan jujur.</span></li>
        </ul>
      </Modal>

      <Modal isOpen={showAbout} onClose={() => setShowAbout(false)} title="Tentang SAS">
        <p className="mb-4">Portal ini dibuat untuk memudahkan siswa-siswi SD Ceria dalam mengakses soal Sumatif Akhir Semester.</p>
        <p className="mb-4">Pastikan data diri diisi dengan benar sebelum memulai ujian.</p>
        <div className="bg-blue-50 p-3 rounded-lg text-center text-blue-800 font-bold text-sm">Versi 1.6.0 (Dynamic Links)</div>
      </Modal>

      {/* Login Modal (Custom because no close button usually) */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-pop-up border-4 border-secondary">
            <div className="bg-secondary p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-teal-800">Login Guru / Admin</h3>
              <button onClick={() => setShowLoginModal(false)} className="text-teal-800 hover:bg-white/20 rounded-full p-1 transition-colors"><X size={24} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-gray-700 font-bold mb-2">Username</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 rounded-xl border-2 border-slate-200 focus:border-primary focus:outline-none"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2">Password</label>
                <input 
                  type="password" 
                  className="w-full px-4 py-2 rounded-xl border-2 border-slate-200 focus:border-primary focus:outline-none"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>
              <Button onClick={handleLoginSubmit} fullWidth>Masuk</Button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      <Modal isOpen={notification.isOpen} onClose={() => setNotification({...notification, isOpen: false})} title={notification.title}>
        {notification.content}
      </Modal>
    </>
  );
};

export default App;
