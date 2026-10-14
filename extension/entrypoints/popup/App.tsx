import { useState, useEffect } from 'react';
import { parseCSVorTableText, parseXLSXBuffer, downloadTemplateExcel, type ParsedLessonRow, type ParsedWorkbookSheet } from '../../utils/excel-parser';
import {
  fetchTeacherClassesFromSiage,
  clearSavedClasses,
  filterValidClasses,
  formatLessonDateWithWeekday,
  getWeekdayIndex,
  TEMPO_OPTIONS,
  formatTemposLabel,
  normalizeTemposList,
  type SiageFetchedClass,
  type SiageAttendanceHistoryItem,
} from '../../utils/siage-api';
import './style.css';

interface StudentCallItem {
  id: string;
  formacaoTurmaAlunoId: string;
  matriculaAvulsaId?: string;
  name: string;
  matricula?: string;
  present: boolean;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'today' | 'call' | 'excel'>('today');
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);

  // Turmas Reais do SIAGE
  const [siageClasses, setSiageClasses] = useState<SiageFetchedClass[]>([]);

  // Senha de Confirmação do SIAGE
  const [siagePassword, setSiagePassword] = useState('');
  const [isPassSaved, setIsPassSaved] = useState(false);

  // Estado da Chamada Real & Segura
  const [callStudents, setCallStudents] = useState<StudentCallItem[]>([]);
  const [callLessons, setCallLessons] = useState<string[]>([]);
  const [callHistory, setCallHistory] = useState<SiageAttendanceHistoryItem[]>([]);
  const [selectedLessonDate, setSelectedLessonDate] = useState<string>('');
  const [isLoadingCall, setIsLoadingCall] = useState<boolean>(false);
  const [showCallConfirmModal, setShowCallConfirmModal] = useState<boolean>(false);
  const [isSavingCall, setIsSavingCall] = useState<boolean>(false);

  // Edição de Tempos e Lançamento em Lote / Dia da Semana
  const [selectedTempos, setSelectedTempos] = useState<string[]>(['TEMPO_3']);
  const [weekdayFilter, setWeekdayFilter] = useState<'ALL' | 'PENDING' | number>('ALL');
  const [callMode, setCallMode] = useState<'single' | 'batch'>('single');
  const [batchSelectedDates, setBatchSelectedDates] = useState<string[]>([]);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; isRunning: boolean }>({
    current: 0,
    total: 0,
    isRunning: false,
  });

  const [callTurmaMeta, setCallTurmaMeta] = useState<{
    formacaoTurmaId: string;
    componenteCurricularId: string;
    matrizCurricularBnccComponenteId?: string | null;
    matrizItinerarioComponenteId?: string | null;
    label: string;
  }>({
    formacaoTurmaId: '5495f10a-e789-41d5-9452-b7c51c32b833',
    componenteCurricularId: 'a5aad79d-cecd-4b43-8c2a-89fe92a778e2',
    matrizCurricularBnccComponenteId: null,
    matrizItinerarioComponenteId: 'c08da697-379c-410f-bab0-24468d908ceb',
    label: '1ª Série A - INFORMÁTICA • Linguagem de Programação I',
  });

  // Carregar turmas, senha e plano Excel salvos do storage local ao abrir
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['siageClasses', 'siagePassword', 'savedPlan', 'savedSheets'], (result) => {
        if (result.siageClasses && Array.isArray(result.siageClasses) && result.siageClasses.length > 0) {
          const sanitized = filterValidClasses(result.siageClasses);
          setSiageClasses(sanitized);
          if (sanitized.length !== result.siageClasses.length) {
            chrome.storage.local.set({ siageClasses: sanitized });
          }
        }
        if (result.siagePassword) {
          setSiagePassword(result.siagePassword);
        }
        if (result.savedPlan && Array.isArray(result.savedPlan) && result.savedPlan.length > 0) {
          setParsedLessons(result.savedPlan);
        }
      });
    }
  }, []);

  const handleSavePassword = (pass: string) => {
    setSiagePassword(pass);
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.set({ siagePassword: pass }, () => {
        setIsPassSaved(true);
        setTimeout(() => setIsPassSaved(false), 2000);
      });
    }
  };

  const handleSyncClassesNow = async () => {
    setIsLoadingClasses(true);
    try {
      let classes = await fetchTeacherClassesFromSiage();

      if (!classes || classes.length === 0) {
        if (typeof chrome !== 'undefined' && chrome.tabs) {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab?.id && tab.url?.includes('professor.see.pb.gov.br')) {
            classes = await chrome.tabs.sendMessage(tab.id, { action: 'SYNC_TURMAS' }).catch(() => []);
          }
        }
      }

      if (classes && classes.length > 0) {
        const sanitized = filterValidClasses(classes);
        setSiageClasses(sanitized);
        if (typeof chrome !== 'undefined' && chrome.storage?.local) {
          chrome.storage.local.set({ siageClasses: sanitized });
        }
        alert(`✅ ${sanitized.length} turma(s) encontradas e sincronizadas com sucesso do SIAGE!`);
      } else {
        alert('Nenhuma turma encontrada no momento.\n\nPor favor: Recarregue a página do SIAGE (F5) no seu navegador e tente novamente.');
      }
    } catch (err) {
      console.error(err);
      alert('Por favor, recarregue a página do SIAGE (F5) no seu navegador para ativar a conexão da extensão.');
    } finally {
      setIsLoadingClasses(false);
    }
  };

  const handleInjectToActiveTab = async (action: string, payload: any) => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id && tab.url?.includes('professor.see.pb.gov.br')) {
          await chrome.tabs.sendMessage(tab.id, { action, payload });
        } else {
          alert('Abra a página do SIAGE no seu navegador para preencher os formulários automaticamente.');
        }
      } catch (err) {
        alert('Por favor, recarregue a página do SIAGE (F5) para ativar os comandos da extensão.');
      }
    }
  };

  // Carregador seguro dos dados de chamada
  const loadCallData = async () => {
    setIsLoadingCall(true);
    try {
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id && tab.url?.includes('professor.see.pb.gov.br')) {
          const resp = await chrome.tabs.sendMessage(tab.id, { action: 'GET_ATTENDANCE_DATA' }).catch(() => null);
          if (resp && resp.success) {
            setCallTurmaMeta({
              formacaoTurmaId: resp.formacaoTurmaId,
              componenteCurricularId: resp.componenteCurricularId,
              matrizCurricularBnccComponenteId: resp.matrizCurricularBnccComponenteId,
              matrizItinerarioComponenteId: resp.matrizItinerarioComponenteId,
              label: resp.classInfo?.label || '1ª Série A - INFORMÁTICA • Linguagem de Programação I',
            });
            if (resp.history && Array.isArray(resp.history)) {
              setCallHistory(resp.history);
              if (resp.history.length > 0 && resp.history[0]?.tempos?.length > 0) {
                setSelectedTempos(normalizeTemposList(resp.history[0].tempos));
              }
            }
            if (resp.lessons && Array.isArray(resp.lessons) && resp.lessons.length > 0) {
              // Limpar rigorosamente duplicatas e normalizar estritamente para YYYY-MM-DD
              const cleanLessons = Array.from(new Set(
                resp.lessons
                  .filter((d: string) => d && d.length >= 8)
                  .map((d: string) => {
                    if (d.includes('/')) {
                      const parts = d.split('/');
                      return `${parts[2]}-${parts[1]}-${parts[0]}`;
                    }
                    return d.slice(0, 10);
                  })
              )).sort((a: string, b: string) => b.localeCompare(a));

              setCallLessons(cleanLessons);
              if (cleanLessons.length > 0) {
                setSelectedLessonDate(prev => cleanLessons.includes(prev) ? prev : cleanLessons[0]);
              }
            }
            if (resp.students && Array.isArray(resp.students) && resp.students.length > 0) {
              const mapped = resp.students.map((s: any) => ({
                id: s.id,
                formacaoTurmaAlunoId: s.formacaoTurmaAlunoId || s.id,
                matriculaAvulsaId: s.matriculaAvulsaId || '',
                name: s.name,
                matricula: s.enrollmentNumber || '',
                present: true,
              }));
              setCallStudents(mapped);
              return;
            }
          }
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar dados de chamada:', e);
    } finally {
      setIsLoadingCall(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'call' && callStudents.length === 0) {
      loadCallData();
    }
  }, [activeTab]);

  // Sincronizar tempos caso a aula selecionada já possua tempos registrados no SIAGE
  useEffect(() => {
    if (selectedLessonDate && callHistory.length > 0) {
      const match = callHistory.find(h => h.data?.startsWith(selectedLessonDate));
      if (match && match.tempos && match.tempos.length > 0) {
        setSelectedTempos(normalizeTemposList(match.tempos));
      }
    }
  }, [selectedLessonDate, callHistory]);

  // Estado da Planilha Importada (ChatGPT / Excel)
  const [excelInput, setExcelInput] = useState('');
  const [parsedLessons, setParsedLessons] = useState<ParsedLessonRow[]>([]);
  const [workbookSheets, setWorkbookSheets] = useState<ParsedWorkbookSheet[]>([]);
  const [selectedSheetName, setSelectedSheetName] = useState<string>('');
  const [promptCopied, setPromptCopied] = useState(false);

  // Carregar dados salvos de planilhas ao abrir
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get(['savedSheets', 'savedPlan'], res => {
        if (res.savedSheets && Array.isArray(res.savedSheets) && res.savedSheets.length > 0) {
          setWorkbookSheets(res.savedSheets);
          setSelectedSheetName(res.savedSheets[0].sheetName);
          setParsedLessons(res.savedSheets[0].lessons);
        } else if (res.savedPlan && Array.isArray(res.savedPlan)) {
          setParsedLessons(res.savedPlan);
        }
      });
    }
  }, []);

  const toggleStudent = (id: string) => {
    setCallStudents(prev =>
      prev.map(s => (s.id === id ? { ...s, present: !s.present } : s))
    );
  };

  const handleParseExcel = (text: string) => {
    setExcelInput(text);
    const result = parseCSVorTableText(text);
    setParsedLessons(result);
    setWorkbookSheets([]);
    setSelectedSheetName('');
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.set({ savedPlan: result, savedSheets: [] });
    }
  };

  const copyChatGptPrompt = () => {
    const prompt = `Atue como um professor especialista da Rede Estadual da Paraíba. Crie um plano de aulas detalhado para a disciplina de [NOME DA MATÉRIA] (Turma: [TURMA]) contendo [NÚMERO] aulas para o ano letivo de 2026.
IMPORTANTE: As aulas acontecem nas [DIAS DA SEMANA, ex: Terças-feiras].
Retorne ESTRITAMENTE em formato de tabela (compatível com Excel) contendo exatamente estas 5 colunas:
Aula	Data	Conteúdo	Metodologia	Observações

Regras obrigatórias:
1. Coluna Data no formato brasileiro rigoroso: DD/MM/AAAA (ex: 10/02/2026).
2. Não pule datas e respeite rigorosamente os dias da semana da disciplina.
3. Conteúdo focado nos Objetos de Conhecimento oficiais da BNCC / Currículo da Paraíba.
4. Metodologia descrevendo a estratégia pedagógica (ex: Aula dialogada, Resolução de problemas, Estudo de caso).`;
    navigator.clipboard.writeText(prompt);
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 2000);
  };

  const absencesCount = callStudents.filter(s => !s.present).length;
  const presentCount = callStudents.length - absencesCount;
  const existingRecord = callHistory.find(h => h.data?.startsWith(selectedLessonDate));

  // Filtragem de aulas pelo dia da semana
  const filteredLessons = callLessons.filter(dateStr => {
    if (weekdayFilter === 'ALL') return true;
    if (weekdayFilter === 'PENDING') {
      return !callHistory.some(h => h.data?.startsWith(dateStr));
    }
    const wIdx = getWeekdayIndex(dateStr);
    return wIdx === weekdayFilter;
  });

  const handleOpenConfirmModal = () => {
    if (callStudents.length === 0) {
      alert('Nenhum aluno carregado. Abra a página da sua turma no SIAGE e tente novamente.');
      return;
    }
    if (!selectedLessonDate) {
      alert('Selecione uma data de aula registrada para realizar a chamada.');
      return;
    }
    if (selectedTempos.length === 0) {
      alert('Selecione ao menos um tempo de aula (ex: 3º Tempo ou 6º e 7º Tempos).');
      return;
    }
    setShowCallConfirmModal(true);
  };

  const handleConfirmSaveAttendance = async () => {
    if (selectedTempos.length === 0) {
      alert('Por favor, selecione ao menos um tempo de aula.');
      return;
    }
    setIsSavingCall(true);
    try {
      const payload = {
        id: existingRecord?.id, // se houver id, faz PUT seguro
        formacaoTurmaId: callTurmaMeta.formacaoTurmaId,
        componenteCurricularId: callTurmaMeta.componenteCurricularId,
        matrizCurricularBnccComponenteId: callTurmaMeta.matrizCurricularBnccComponenteId,
        matrizItinerarioComponenteId: callTurmaMeta.matrizItinerarioComponenteId,
        dataAula: selectedLessonDate,
        periodo: existingRecord?.periodo || 'PERIODO_4',
        tempos: normalizeTemposList(selectedTempos),
        students: callStudents.map(s => ({
          formacaoTurmaAlunoId: s.formacaoTurmaAlunoId,
          matriculaAvulsaId: s.matriculaAvulsaId,
          nomeAluno: s.name,
          matricula: s.matricula,
          present: s.present,
        })),
      };

      if (typeof chrome !== 'undefined' && chrome.tabs) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id && tab.url?.includes('professor.see.pb.gov.br')) {
          const resp = await chrome.tabs.sendMessage(tab.id, {
            action: 'SUBMIT_ATTENDANCE',
            payload,
          });
          if (resp?.success) {
            setShowCallConfirmModal(false);
            alert(`🎉 Frequência da aula de ${formatLessonDateWithWeekday(selectedLessonDate)} gravada com sucesso no SIAGE!`);
            loadCallData();
            return;
          } else {
            alert(`⚠️ Falha ao salvar no SIAGE: ${resp?.error || 'Erro desconhecido'}`);
          }
        } else {
          alert('Por favor, abra a página do SIAGE no navegador para gravar a frequência.');
        }
      }
    } catch (e: any) {
      alert(`⚠️ Erro: ${e.message || 'Falha de comunicação'}`);
    } finally {
      setIsSavingCall(false);
    }
  };

  const handleBatchSaveAttendance = async () => {
    if (batchSelectedDates.length === 0) {
      alert('Selecione pelo menos uma data para lançar a chamada em lote.');
      return;
    }
    if (selectedTempos.length === 0) {
      alert('Selecione ao menos um tempo de aula (ex: 3º Tempo ou 6º e 7º Tempos).');
      return;
    }

    const confirmMsg = `Deseja gravar a frequência para as ${batchSelectedDates.length} datas selecionadas com ${formatTemposLabel(selectedTempos)}?`;
    if (!window.confirm(confirmMsg)) return;

    setIsSavingCall(true);
    setBatchProgress({ current: 0, total: batchSelectedDates.length, isRunning: true });

    try {
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < batchSelectedDates.length; i++) {
        const dateIso = batchSelectedDates[i];
        setBatchProgress({ current: i + 1, total: batchSelectedDates.length, isRunning: true });

        const existingRec = callHistory.find(h => h.data?.startsWith(dateIso));
        const payload = {
          id: existingRec?.id,
          formacaoTurmaId: callTurmaMeta.formacaoTurmaId,
          componenteCurricularId: callTurmaMeta.componenteCurricularId,
          matrizCurricularBnccComponenteId: callTurmaMeta.matrizCurricularBnccComponenteId,
          matrizItinerarioComponenteId: callTurmaMeta.matrizItinerarioComponenteId,
          dataAula: dateIso,
          periodo: existingRec?.periodo || 'PERIODO_4',
          tempos: normalizeTemposList(selectedTempos),
          students: callStudents.map(s => ({
            formacaoTurmaAlunoId: s.formacaoTurmaAlunoId,
            matriculaAvulsaId: s.matriculaAvulsaId,
            nomeAluno: s.name,
            matricula: s.matricula,
            present: s.present,
          })),
        };

        if (typeof chrome !== 'undefined' && chrome.tabs) {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab?.id) {
            const resp = await chrome.tabs.sendMessage(tab.id, {
              action: 'SUBMIT_ATTENDANCE',
              payload,
            });
            if (resp?.success) {
              successCount++;
            } else {
              failCount++;
            }
          }
        }
      }

      alert(`🎉 Chamada em lote concluída!\n✅ ${successCount} data(s) gravada(s) com sucesso.${failCount > 0 ? `\n⚠️ ${failCount} falha(s).` : ''}`);
      setBatchSelectedDates([]);
      loadCallData();
    } catch (err: any) {
      alert(`Erro durante a gravação em lote: ${err?.message || err}`);
    } finally {
      setIsSavingCall(false);
      setBatchProgress({ current: 0, total: 0, isRunning: false });
    }
  };

  return (
    <div className="popup-container">
      {/* Header */}
      <div className="header">
        <div className="brand">
          <div className="brand-icon">PS</div>
          <div>
            <div className="brand-title">Professor Sync</div>
            <div className="brand-subtitle">SIAGE Assistant v1.0</div>
          </div>
        </div>
        <div className="status-badge">
          <span className="status-dot"></span>
          SIAGE Ativo
        </div>
      </div>

      {/* Tabs */}
      <div className="nav-tabs">
        <button
          className={`tab-btn ${activeTab === 'today' ? 'active' : ''}`}
          onClick={() => setActiveTab('today')}
        >
          🏫 Turmas
        </button>
        <button
          className={`tab-btn ${activeTab === 'call' ? 'active' : ''}`}
          onClick={() => setActiveTab('call')}
        >
          ⚡ Chamada
        </button>
        <button
          className={`tab-btn ${activeTab === 'excel' ? 'active' : ''}`}
          onClick={() => setActiveTab('excel')}
        >
          📊 Excel / IA
        </button>
      </div>

      {/* Body */}
      <div className="content-body">
        {activeTab === 'today' && (
          <>
            <button
              className="btn-secondary"
              style={{ background: 'rgba(52, 211, 153, 0.1)', borderColor: 'rgba(52, 211, 153, 0.3)', color: '#34d399', marginBottom: '8px' }}
              disabled={isLoadingClasses}
              onClick={handleSyncClassesNow}
            >
              {isLoadingClasses ? '⏳ Sincronizando Turmas...' : '🔄 Sincronizar Minhas Turmas do SIAGE'}
            </button>

            {siageClasses.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '0 4px' }}>
                <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 600 }}>
                  📚 {siageClasses.length} turma(s) ativa(s)
                </span>
                <button
                  style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '10px', cursor: 'pointer' }}
                  onClick={async () => {
                    await clearSavedClasses();
                    setSiageClasses([]);
                    alert('Histórico de turmas limpo com sucesso.');
                  }}
                >
                  🗑️ Limpar Lista
                </button>
              </div>
            )}

            {siageClasses.length > 0 ? (
              siageClasses.map((cls, idx) => (
                <div className="card" key={cls.id || idx}>
                  <div className="card-header">
                    <span className="card-title">{cls.name}</span>
                    <span className="card-tag">{cls.studentCount ? `${cls.studentCount} Alunos` : 'Ativa'}</span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#a1a1aa' }}>
                    <strong>Disciplina:</strong> {cls.subjectName} {cls.room ? `(${cls.room})` : ''}
                  </p>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                    <button
                      className="btn-primary"
                      onClick={() => {
                        setCallTurmaMeta({
                          formacaoTurmaId: cls.id,
                          componenteCurricularId: '',
                          label: `${cls.name} • ${cls.subjectName}`,
                        });
                        setActiveTab('call');
                      }}
                    >
                      ⚡ Lançar Frequência
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="card">
                <div className="card-header">
                  <span className="card-title">1ª Série A — INFORMÁTICA</span>
                  <span className="card-tag">Linguagem de Programação I</span>
                </div>
                <p style={{ fontSize: '12px', color: '#a1a1aa' }}>
                  <strong>Horário:</strong> Terças-feiras (6º e 7º Tempos) • 21 Alunos.
                </p>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <button
                    className="btn-primary"
                    onClick={() => setActiveTab('call')}
                  >
                    ⚡ Lançar Frequência
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'call' && (
          <div className="card" style={{ position: 'relative' }}>
            <div className="card-header">
              <div>
                <span className="card-title" style={{ display: 'block', fontSize: '13px' }}>
                  {callTurmaMeta.label}
                </span>
                <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 600 }}>
                  ⚡ {formatTemposLabel(selectedTempos)}
                </span>
              </div>
              <button
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#34d399',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                disabled={isLoadingCall}
                onClick={loadCallData}
              >
                {isLoadingCall ? '⏳ Puxando...' : '🔄 Atualizar'}
              </button>
            </div>

            {/* 1. Seletor Editável de Tempos de Aula */}
            <div style={{ background: '#09090b', padding: '10px', borderRadius: '8px', border: '1px solid #27272a', marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 600 }}>
                  ⏱️ Tempos de Aula: <span style={{ color: '#34d399' }}>{formatTemposLabel(selectedTempos)}</span>
                </label>
              </div>

              {/* Chips interativos dos 9 Tempos */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
                {TEMPO_OPTIONS.map(opt => {
                  const isSelected = selectedTempos.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setSelectedTempos(prev =>
                          isSelected ? prev.filter(t => t !== opt.id) : [...prev, opt.id].sort()
                        );
                      }}
                      style={{
                        padding: '3px 8px',
                        fontSize: '11px',
                        fontWeight: 700,
                        borderRadius: '4px',
                        border: isSelected ? '1px solid #34d399' : '1px solid #27272a',
                        background: isSelected ? 'rgba(52, 211, 153, 0.2)' : '#18181b',
                        color: isSelected ? '#34d399' : '#a1a1aa',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {opt.short}
                    </button>
                  );
                })}
              </div>

              {/* Atalhos Rápidos de Tempos */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: '#71717a' }}>Atalhos:</span>
                <button
                  type="button"
                  onClick={() => setSelectedTempos(['TEMPO_3'])}
                  style={{
                    padding: '2px 6px',
                    fontSize: '10px',
                    borderRadius: '3px',
                    border: '1px solid #27272a',
                    background: selectedTempos.length === 1 && selectedTempos[0] === 'TEMPO_3' ? '#27272a' : '#141416',
                    color: selectedTempos.length === 1 && selectedTempos[0] === 'TEMPO_3' ? '#34d399' : '#a1a1aa',
                    cursor: 'pointer',
                  }}
                >
                  3º Tempo
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTempos(['TEMPO_6', 'TEMPO_7'])}
                  style={{
                    padding: '2px 6px',
                    fontSize: '10px',
                    borderRadius: '3px',
                    border: '1px solid #27272a',
                    background: selectedTempos.length === 2 && selectedTempos.includes('TEMPO_6') && selectedTempos.includes('TEMPO_7') ? '#27272a' : '#141416',
                    color: selectedTempos.length === 2 && selectedTempos.includes('TEMPO_6') && selectedTempos.includes('TEMPO_7') ? '#34d399' : '#a1a1aa',
                    cursor: 'pointer',
                  }}
                >
                  6º e 7º
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTempos(['TEMPO_1', 'TEMPO_2'])}
                  style={{
                    padding: '2px 6px',
                    fontSize: '10px',
                    borderRadius: '3px',
                    border: '1px solid #27272a',
                    background: selectedTempos.length === 2 && selectedTempos.includes('TEMPO_1') && selectedTempos.includes('TEMPO_2') ? '#27272a' : '#141416',
                    color: selectedTempos.length === 2 && selectedTempos.includes('TEMPO_1') && selectedTempos.includes('TEMPO_2') ? '#34d399' : '#a1a1aa',
                    cursor: 'pointer',
                  }}
                >
                  1º e 2º
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTempos(['TEMPO_4', 'TEMPO_5'])}
                  style={{
                    padding: '2px 6px',
                    fontSize: '10px',
                    borderRadius: '3px',
                    border: '1px solid #27272a',
                    background: selectedTempos.length === 2 && selectedTempos.includes('TEMPO_4') && selectedTempos.includes('TEMPO_5') ? '#27272a' : '#141416',
                    color: selectedTempos.length === 2 && selectedTempos.includes('TEMPO_4') && selectedTempos.includes('TEMPO_5') ? '#34d399' : '#a1a1aa',
                    cursor: 'pointer',
                  }}
                >
                  4º e 5º
                </button>
              </div>
            </div>

            {/* 2. Filtro por Dia da Semana e Modo Individual vs Lote */}
            <div style={{ background: '#09090b', padding: '10px', borderRadius: '8px', border: '1px solid #27272a', marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 600 }}>
                  📅 Filtrar Dia da Semana:
                </label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setCallMode('single')}
                    style={{
                      padding: '2px 7px',
                      fontSize: '10px',
                      borderRadius: '4px',
                      border: callMode === 'single' ? '1px solid #34d399' : '1px solid #27272a',
                      background: callMode === 'single' ? 'rgba(52, 211, 153, 0.15)' : '#18181b',
                      color: callMode === 'single' ? '#34d399' : '#71717a',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    🎯 Individual
                  </button>
                  <button
                    type="button"
                    onClick={() => setCallMode('batch')}
                    style={{
                      padding: '2px 7px',
                      fontSize: '10px',
                      borderRadius: '4px',
                      border: callMode === 'batch' ? '1px solid #38bdf8' : '1px solid #27272a',
                      background: callMode === 'batch' ? 'rgba(56, 189, 248, 0.15)' : '#18181b',
                      color: callMode === 'batch' ? '#38bdf8' : '#71717a',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    ⚡ Lote
                  </button>
                </div>
              </div>

              {/* Botões dos Dias da Semana */}
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {[
                  { id: 'ALL', label: 'Todas' },
                  { id: 'PENDING', label: 'Pendentes' },
                  { id: 2, label: 'Terças' },
                  { id: 3, label: 'Quartas' },
                  { id: 4, label: 'Quintas' },
                  { id: 5, label: 'Sextas' },
                  { id: 1, label: 'Segundas' },
                ].map(f => {
                  const active = weekdayFilter === f.id;
                  return (
                    <button
                      key={String(f.id)}
                      type="button"
                      onClick={() => {
                        setWeekdayFilter(f.id as any);
                        setBatchSelectedDates([]);
                      }}
                      style={{
                        padding: '3px 7px',
                        fontSize: '10px',
                        fontWeight: 600,
                        borderRadius: '4px',
                        border: active ? '1px solid #38bdf8' : '1px solid #27272a',
                        background: active ? 'rgba(56, 189, 248, 0.2)' : '#141416',
                        color: active ? '#38bdf8' : '#a1a1aa',
                        cursor: 'pointer',
                      }}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Seleção de Datas: Modo Individual ou Modo Lote */}
            {callMode === 'single' ? (
              <div style={{ background: '#09090b', padding: '10px', borderRadius: '8px', border: '1px solid #27272a', marginBottom: '8px' }}>
                <label style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  📅 Aula Vinculada do Diário:
                </label>
                {filteredLessons.length > 0 ? (
                  <select
                    className="select-field"
                    value={selectedLessonDate}
                    onChange={e => setSelectedLessonDate(e.target.value)}
                  >
                    {filteredLessons.map(dateStr => {
                      const isRegistered = callHistory.some(h => h.data?.startsWith(dateStr));
                      const formattedWithDay = formatLessonDateWithWeekday(dateStr);
                      return (
                        <option key={dateStr} value={dateStr}>
                          📅 {formattedWithDay} {isRegistered ? '• (Chamada Existente)' : '• (Pendente)'}
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  <div style={{ fontSize: '11px', color: '#eab308' }}>
                    {isLoadingCall
                      ? '⏳ Buscando aulas registradas no SIAGE...'
                      : callLessons.length === 0
                      ? 'Nenhuma aula registrada encontrada. Registre as aulas no diário primeiro.'
                      : 'Nenhuma aula encontrada para o filtro selecionado.'}
                  </div>
                )}

                {selectedLessonDate && (
                  <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontWeight: 700,
                        background: existingRecord ? 'rgba(56, 189, 248, 0.15)' : 'rgba(52, 211, 153, 0.15)',
                        color: existingRecord ? '#38bdf8' : '#34d399',
                        border: `1px solid ${existingRecord ? 'rgba(56, 189, 248, 0.3)' : 'rgba(52, 211, 153, 0.3)'}`,
                      }}
                    >
                      {existingRecord
                        ? `🔄 Modo Correção (${existingRecord.presenca}% presença)`
                        : '⚡ Nova Chamada'}
                    </span>

                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: absencesCount > 0 ? '#ef4444' : '#34d399',
                      }}
                    >
                      {presentCount} Presente(s) • {absencesCount} Falta(s)
                    </span>
                  </div>
                )}
              </div>
            ) : (
              /* Modo Lote: Seleção de Múltiplas Datas */
              <div style={{ background: '#09090b', padding: '10px', borderRadius: '8px', border: '1px solid #27272a', marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 600 }}>
                    Selecione as datas para enviar ({batchSelectedDates.length} selecionada(s)):
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setBatchSelectedDates(filteredLessons)}
                      style={{ fontSize: '10px', padding: '2px 6px', background: '#27272a', border: 'none', color: '#34d399', borderRadius: '3px', cursor: 'pointer' }}
                    >
                      Marcar Todas
                    </button>
                    <button
                      type="button"
                      onClick={() => setBatchSelectedDates([])}
                      style={{ fontSize: '10px', padding: '2px 6px', background: '#27272a', border: 'none', color: '#a1a1aa', borderRadius: '3px', cursor: 'pointer' }}
                    >
                      Limpar
                    </button>
                  </div>
                </div>

                <div style={{ maxHeight: '130px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {filteredLessons.map(dateStr => {
                    const isSelected = batchSelectedDates.includes(dateStr);
                    const isRegistered = callHistory.some(h => h.data?.startsWith(dateStr));
                    return (
                      <label
                        key={dateStr}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '6px 8px',
                          borderRadius: '4px',
                          background: isSelected ? 'rgba(56, 189, 248, 0.12)' : '#141416',
                          border: `1px solid ${isSelected ? 'rgba(56, 189, 248, 0.3)' : '#27272a'}`,
                          fontSize: '11px',
                          cursor: 'pointer',
                          color: isSelected ? '#f4f4f5' : '#a1a1aa',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            setBatchSelectedDates(prev =>
                              isSelected ? prev.filter(d => d !== dateStr) : [...prev, dateStr]
                            );
                          }}
                        />
                        <span style={{ fontWeight: 600 }}>📅 {formatLessonDateWithWeekday(dateStr)}</span>
                        <span style={{ fontSize: '10px', color: isRegistered ? '#38bdf8' : '#eab308', marginLeft: 'auto' }}>
                          {isRegistered ? 'Existente' : 'Pendente'}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. Lista dos Alunos */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 600 }}>
                Alunos ({callStudents.length}):
              </span>
              <button
                type="button"
                onClick={() => setCallStudents(prev => prev.map(s => ({ ...s, present: true })))}
                style={{ fontSize: '10px', padding: '2px 6px', background: '#27272a', border: 'none', color: '#34d399', borderRadius: '3px', cursor: 'pointer' }}
              >
                ✅ Marcar Todos Presentes
              </button>
            </div>

            {callStudents.length > 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  maxHeight: '190px',
                  overflowY: 'auto',
                  paddingRight: '4px',
                }}
              >
                {callStudents.map(student => (
                  <div
                    key={student.id}
                    onClick={() => toggleStudent(student.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: student.present
                        ? 'rgba(255,255,255,0.03)'
                        : 'rgba(239, 68, 68, 0.15)',
                      border: `1px solid ${
                        student.present ? '#27272a' : 'rgba(239, 68, 68, 0.4)'
                      }`,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '11px',
                        color: student.present ? '#f4f4f5' : '#fca5a5',
                        fontWeight: student.present ? 500 : 700,
                        textTransform: 'uppercase',
                        maxWidth: '240px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={student.name}
                    >
                      {student.name}
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: student.present ? '#059669' : '#dc2626',
                        color: '#fff',
                        letterSpacing: '0.3px',
                      }}
                    >
                      {student.present ? 'PRESENTE' : 'FALTOU'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 10px', color: '#a1a1aa', fontSize: '12px' }}>
                <p>Nenhum aluno carregado no momento.</p>
                <button
                  className="btn-secondary"
                  style={{ marginTop: '10px' }}
                  onClick={loadCallData}
                >
                  🔄 Puxar Alunos da Turma do SIAGE
                </button>
              </div>
            )}

            {/* Botão de Ação Principal: Individual vs Lote */}
            {callMode === 'single' ? (
              <button
                className="btn-primary"
                style={{ marginTop: '8px' }}
                disabled={callStudents.length === 0 || !selectedLessonDate || isSavingCall}
                onClick={handleOpenConfirmModal}
              >
                🚀 {existingRecord ? 'Atualizar Frequência da Aula' : 'Lançar Frequência da Aula'} ({formatTemposLabel(selectedTempos)})
              </button>
            ) : (
              <button
                className="btn-primary"
                style={{ marginTop: '8px', background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' }}
                disabled={callStudents.length === 0 || batchSelectedDates.length === 0 || isSavingCall}
                onClick={handleBatchSaveAttendance}
              >
                {batchProgress.isRunning
                  ? `⏳ Gravando ${batchProgress.current}/${batchProgress.total} datas no SIAGE...`
                  : `🚀 Gravar Chamada em ${batchSelectedDates.length} Datas (${formatTemposLabel(selectedTempos)})`}
              </button>
            )}

            {/* Modal Seguro de Confirmação Pré-Envio (Modo Individual) */}
            {showCallConfirmModal && (
              <div className="popup-modal-overlay">
                <div className="popup-modal-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>⚠️</span>
                    <strong style={{ color: '#f4f4f5', fontSize: '13px' }}>Confirmar Lançamento de Chamada</strong>
                  </div>

                  <div style={{ fontSize: '11px', color: '#a1a1aa', lineHeight: '1.5', background: '#09090b', padding: '10px', borderRadius: '6px', border: '1px solid #27272a' }}>
                    <p><strong>Turma:</strong> {callTurmaMeta.label}</p>
                    <p><strong>Data da Aula:</strong> {formatLessonDateWithWeekday(selectedLessonDate)} ({formatTemposLabel(selectedTempos)})</p>
                    <p><strong>Resumo:</strong> <span style={{ color: '#34d399' }}>{presentCount} Presente(s)</span> • <span style={{ color: '#ef4444' }}>{absencesCount} Falta(s)</span></p>
                  </div>

                  {absencesCount > 0 ? (
                    <div>
                      <span style={{ fontSize: '11px', color: '#f87171', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                        Alunos com Falta ({absencesCount}):
                      </span>
                      <div style={{ maxHeight: '80px', overflowY: 'auto', background: '#09090b', padding: '6px', borderRadius: '4px', fontSize: '10px', color: '#fca5a5' }}>
                        {callStudents.filter(s => !s.present).map(s => (
                          <div key={s.id}>• {s.name}</div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '11px', color: '#34d399' }}>
                      ✅ Todos os {callStudents.length} alunos marcados como presentes.
                    </div>
                  )}

                  <div style={{ fontSize: '10px', color: '#eab308', background: 'rgba(234, 179, 8, 0.08)', padding: '8px', borderRadius: '4px' }}>
                    {existingRecord
                      ? '🔄 Esta ação atualizará as presenças desta aula no SIAGE (sobrescrita segura).'
                      : '⚠️ Lembrete: O SIAGE grava as presenças desta data com os tempos selecionados.'}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <button
                      className="btn-secondary"
                      style={{ flex: 1 }}
                      disabled={isSavingCall}
                      onClick={() => setShowCallConfirmModal(false)}
                    >
                      ❌ Cancelar
                    </button>
                    <button
                      className="btn-primary"
                      style={{ flex: 1 }}
                      disabled={isSavingCall}
                      onClick={handleConfirmSaveAttendance}
                    >
                      {isSavingCall ? '⏳ Gravando...' : '✅ Confirmar e Salvar'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'excel' && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">Plano de Ensino (Excel / IA)</span>
              <span className="card-tag">Agente GPT • .xlsx</span>
            </div>

            {/* Banner do Agente ChatGPT Especialista */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(59, 130, 246, 0.12) 100%)',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                borderRadius: '8px',
                padding: '10px 12px',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <strong style={{ fontSize: '12px', color: '#f4f4f5', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span>🤖</span> Agente IA no ChatGPT
                </strong>
                <span style={{ fontSize: '10px', color: '#a1a1aa' }}>
                  Gere o plano de aulas da sua disciplina
                </span>
              </div>
              <a
                href="https://chatgpt.com"
                target="_blank"
                rel="noreferrer"
                className="btn-primary"
                style={{
                  fontSize: '11px',
                  padding: '5px 10px',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                Abrir Agente ↗
              </a>
            </div>

            {/* Botão Baixar Modelo Padrão */}
            <button
              type="button"
              className="btn-secondary"
              style={{
                width: '100%',
                fontSize: '11px',
                padding: '7px 10px',
                marginBottom: '8px',
                background: 'rgba(56, 189, 248, 0.1)',
                borderColor: 'rgba(56, 189, 248, 0.3)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
              onClick={downloadTemplateExcel}
            >
              <span>📥</span> Baixar Modelo Oficial de Excel (.xlsx)
            </button>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <label
                className="btn-secondary"
                style={{
                  flex: 1,
                  fontSize: '11px',
                  padding: '8px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  display: 'inline-block',
                }}
              >
                📁 Carregar Planilha Excel (.xlsx / .csv)
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv,.tsv,.txt"
                  style={{ display: 'none' }}
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    const fileName = file.name.toLowerCase();
                    const reader = new FileReader();

                    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
                      reader.onload = ev => {
                        const buffer = ev.target?.result as ArrayBuffer;
                        if (buffer) {
                          const sheets = parseXLSXBuffer(buffer);
                          if (sheets.length > 0) {
                            const allLessons = sheets.flatMap(s => s.lessons);
                            setWorkbookSheets(sheets);
                            setSelectedSheetName(sheets[0].sheetName);
                            setParsedLessons(sheets[0].lessons);
                            if (typeof chrome !== 'undefined' && chrome.storage?.local) {
                              chrome.storage.local.set({ savedPlan: allLessons, savedSheets: sheets });
                            }
                            alert(`✅ Sucesso! ${sheets.length} aba(s) e ${allLessons.length} aula(s) carregadas da sua planilha Excel!`);
                          } else {
                            alert('Nenhuma aula encontrada na planilha. Verifique a estrutura.');
                          }
                        }
                      };
                      reader.readAsArrayBuffer(file);
                    } else {
                      reader.onload = ev => {
                        const text = ev.target?.result as string;
                        if (text) handleParseExcel(text);
                      };
                      reader.readAsText(file);
                    }
                  }}
                />
              </label>
            </div>

            {/* Abas detectadas no arquivo Excel */}
            {workbookSheets.length > 0 && (
              <div style={{ marginBottom: '8px', background: '#09090b', padding: '8px', borderRadius: '6px', border: '1px solid #27272a' }}>
                <span style={{ fontSize: '10px', color: '#a1a1aa', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                  📊 Abas Identificadas na Planilha ({workbookSheets.length}):
                </span>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {workbookSheets.map(s => {
                    const isSelected = selectedSheetName === s.sheetName;
                    return (
                      <button
                        key={s.sheetName}
                        type="button"
                        onClick={() => {
                          setSelectedSheetName(s.sheetName);
                          setParsedLessons(s.lessons);
                        }}
                        style={{
                          padding: '3px 8px',
                          fontSize: '10px',
                          borderRadius: '4px',
                          border: isSelected ? '1px solid #34d399' : '1px solid #27272a',
                          background: isSelected ? 'rgba(52, 211, 153, 0.2)' : '#18181b',
                          color: isSelected ? '#34d399' : '#a1a1aa',
                          cursor: 'pointer',
                          fontWeight: isSelected ? 700 : 400,
                        }}
                      >
                        {s.sheetName} ({s.lessons.length})
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', marginBottom: '4px' }}>
              <label style={{ fontSize: '11px', color: '#a1a1aa' }}>
                Ou cole a tabela do Agente GPT / Excel:
              </label>
              <button
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: promptCopied ? '#34d399' : '#38bdf8',
                  fontSize: '10px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
                onClick={copyChatGptPrompt}
              >
                {promptCopied ? '✅ Copiado!' : '📋 Copiar Prompt'}
              </button>
            </div>

            <textarea
              className="textarea-field"
              style={{ height: '70px' }}
              placeholder="Ex:
Data; Objetos de Conhecimento; Metodologia; Observações
06/10/2026; Variáveis e Estruturas Condicionais; Aula Prática; Acompanhamento dos Alunos"
              value={excelInput}
              onChange={e => handleParseExcel(e.target.value)}
            />

            {parsedLessons.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '6px',
                  }}
                >
                  <span style={{ fontSize: '12px', color: '#34d399', fontWeight: 600 }}>
                    {parsedLessons.length} aula(s) identificada(s) do Plano:
                  </span>
                </div>

                <div
                  style={{
                    maxHeight: '140px',
                    overflowY: 'auto',
                    background: '#09090b',
                    border: '1px solid #27272a',
                    borderRadius: '6px',
                    padding: '6px',
                  }}
                >
                  {parsedLessons.map((lesson, idx) => (
                    <div
                      key={idx}
                      style={{
                        fontSize: '11px',
                        padding: '4px 6px',
                        borderBottom: '1px solid #18181b',
                        color: '#e4e4e7',
                      }}
                    >
                      <strong>Aula {lesson.number || idx + 1} {lesson.date ? `(${lesson.date})` : ''}:</strong> {lesson.topic}
                    </div>
                  ))}
                </div>

                <button
                  className="btn-primary"
                  style={{ marginTop: '10px' }}
                  onClick={() => {
                    // Se houver abas de planilha salvas, não envia o array concatenado;
                    // deixa o script casar automaticamente a turma da tela com sua aba correspondente!
                    const toSend = workbookSheets.length > 0 ? [] : parsedLessons;
                    handleInjectToActiveTab('FILL_LESSON_PLAN', {
                      plan: toSend,
                      lesson: parsedLessons[0],
                    });
                  }}
                >
                  🚀 Inserir Aulas Pendentes no SIAGE
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer / Configuração de Senha */}
      <div className="footer" style={{ flexDirection: 'column', gap: '6px', alignItems: 'stretch' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#a1a1aa' }}>
          <span>Rede Estadual PB — SIAGE</span>
          <span>Modo Extensão Ativo</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
          <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 600, whiteSpace: 'nowrap' }}>
            🔑 Auto-Senha Salvar:
          </span>
          <input
            type="password"
            placeholder="Sua senha do SIAGE (opcional)"
            value={siagePassword}
            onChange={e => handleSavePassword(e.target.value)}
            style={{
              flex: 1,
              background: '#09090b',
              border: '1px solid #27272a',
              borderRadius: '4px',
              padding: '4px 8px',
              color: '#fff',
              fontSize: '11px',
            }}
          />
          {isPassSaved && <span style={{ fontSize: '10px', color: '#34d399' }}>✅ Salva</span>}
        </div>
      </div>
    </div>
  );
}


