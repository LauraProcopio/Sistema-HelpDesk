import { useEffect, useState } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { 
  FileText, 
  FileDown
} from 'lucide-react';
import { toast } from 'sonner';
import saveAs from 'file-saver'; 
import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, AlignmentType } from 'docx'; 
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const MESES = [
  { label: 'Janeiro', value: 1 }, { label: 'Fevereiro', value: 2 },
  { label: 'Março', value: 3 }, { label: 'Abril', value: 4 },
  { label: 'Maio', value: 5 }, { label: 'Junho', value: 6 },
  { label: 'Julho', value: 7 }, { label: 'Agosto', value: 8 },
  { label: 'Setembro', value: 9 }, { label: 'Outubro', value: 10 },
  { label: 'Novembro', value: 11 }, { label: 'Dezembro', value: 12 }
];

export function Reports() {
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<any[]>([]);
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear] = useState(new Date().getFullYear());
  const [selectedCompanyId, setSelectedCompanyId] = useState('all');

  // 1. Carrega os dados centralizados através do nosso Back-end conectado ao Postgres local
  async function loadData() {
    setLoading(true);
    try {
      // Puxa as empresas para alimentar o select de filtros
      const compResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/companies`);
      if (!compResponse.ok) throw new Error('Falha ao carregar empresas para o relatório.');
      const compData = await compResponse.json();
      setCompanies(compData || []);

      // Bate na rota analítica do back-end passando os parâmetros na URL
      const reportsResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/api/reports/monthly?month=${selectedMonth}&year=${selectedYear}&companyId=${selectedCompanyId}`
      );
      if (!reportsResponse.ok) throw new Error('Falha ao processar o relatório mensal.');
      const reportsData = await reportsResponse.json();

      setFilteredTickets(reportsData || []);
    } catch (error: any) {
      toast.error("Erro na sincronização", { description: error.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { 
    loadData(); 
  }, [selectedMonth, selectedYear, selectedCompanyId]);

  const currentCompany = companies.find(c => c.id === selectedCompanyId);
  const nomeEmpresaDoc = currentCompany?.name || 'Unidade Geral';
  const totalHorasGeral = filteredTickets.reduce((acc, t) => acc + Number(t.estimated_hours || 0), 0);

  // --- EXPORTAÇÃO PDF ---
  const handleExportPDF = () => {
    if (filteredTickets.length === 0) return toast.error("Lista vazia", { description: "Não há chamados no período selecionado." });
    const doc = new jsPDF('l', 'mm', 'a4') as any;
    doc.setFontSize(10);
    doc.text(`Campo Grande, ${new Date().toLocaleDateString('pt-BR')}.`, 14, 20);
    doc.setFont(undefined, 'bold');
    doc.text(`À Direção - ${nomeEmpresaDoc}`, 14, 30);
    
    autoTable(doc, {
      startY: 40,
      head: [['ITEM', 'DATA', 'DESCRIÇÃO', 'HORAS']],
      body: filteredTickets.map((t, i) => [i + 1, new Date(t.created_at).toLocaleDateString('pt-BR'), t.description || t.title, `${t.estimated_hours}h`]),
      foot: [['', '', 'TOTAL GERAL DO MÊS', `${totalHorasGeral}h`]],
      theme: 'grid'
    });

    const finalY = (doc as any).lastAutoTable.finalY;
    doc.text("Atenciosamente,", 14, finalY + 15);
    doc.text("Katia Fernandes - Administrativo Financeiro", 140, finalY + 35, { align: 'center' }); // Mantido o relatório financeiro da Katia Fernandes
    doc.save(`Relatorio_Fechamento_${nomeEmpresaDoc}.pdf`);
  };

  // --- EXPORTAÇÃO WORD ---
  const handleExportWord = () => {
    if (filteredTickets.length === 0) return toast.error("Lista vazia", { description: "Não há dados para gerar o documento." });
    const doc = new Document({
      sections: [{
        properties: { page: { orientation: 'landscape' } as any },
        children: [
          new Paragraph({ text: `Campo Grande, ${new Date().toLocaleDateString('pt-BR')}.` }),
          new Paragraph({ text: `À Direção - ${nomeEmpresaDoc}`, spacing: { before: 400, after: 400 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: ['ITEM', 'DATA', 'DESCRIÇÃO', 'HORAS'].map(h => new TableCell({ children: [new Paragraph({ text: h })] })) }),
              ...filteredTickets.map((t, i) => new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: (i + 1).toString() })] }),
                  new TableCell({ children: [new Paragraph({ text: new Date(t.created_at).toLocaleDateString('pt-BR') })] }),
                  new TableCell({ children: [new Paragraph({ text: t.description || t.title })] }),
                  new TableCell({ children: [new Paragraph({ text: `${t.estimated_hours}h` })] }),
                ]
              }))
            ]
          }),
          new Paragraph({ text: `\nTotal Geral: ${totalHorasGeral}h`, alignment: AlignmentType.RIGHT })
        ]
      }]
    });
    Packer.toBlob(doc).then(blob => saveAs(blob, `Relatorio_Fechamento_${nomeEmpresaDoc}.docx`));
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden flex-col md:flex-row font-sans text-left text-brand-dark">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto scrollbar-hide">
        <header className="mb-8">
          <p className="text-[10px] font-black text-brand-primary uppercase tracking-[4px] mb-2">Agaemetec Intelligence</p>
          <h1 className="text-4xl font-black tracking-tighter italic leading-none">Relatórios & Fechamentos</h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div onClick={handleExportPDF} className="bg-brand-dark p-8 rounded-[40px] text-white shadow-xl hover:shadow-brand-primary/20 transition-all cursor-pointer border border-white/5 group">
             <FileDown size={24} className="mb-6 text-brand-primary" />
             <h3 className="text-xl font-black italic mb-2">PDF Horas Técnicas</h3>
             <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed truncate">Unidade: {nomeEmpresaDoc}</p>
          </div>
          <div onClick={handleExportWord} className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm hover:shadow-2xl transition-all cursor-pointer group">
             <FileText size={24} className="mb-6 text-blue-600" />
             <h3 className="text-xl font-black italic mb-2">Word Demonstrativo</h3>
             <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">Documento Editável</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          <div className="xl:col-span-1 bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 h-fit">
             <h3 className="font-black mb-6 text-[10px] uppercase tracking-[3px]">Filtros</h3>
             <div className="space-y-4">
                <select className="w-full bg-gray-50 border-none rounded-2xl p-4 text-xs font-black uppercase text-brand-dark outline-none cursor-pointer" value={selectedCompanyId} onChange={e => setSelectedCompanyId(e.target.value)}>
                  <option value="all">Todas Unidades</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select className="w-full bg-gray-50 border-none rounded-2xl p-4 text-xs font-black uppercase text-brand-dark outline-none cursor-pointer" value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
                  {MESES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
             </div>
          </div>

          <div className="xl:col-span-3 bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-8 flex justify-between items-center border-b border-gray-50">
                <h2 className="text-xl font-black italic flex items-center gap-3">Prévia do Mês</h2>
                <div className="bg-brand-primary text-white px-5 py-2 rounded-2xl font-black text-[10px] uppercase tracking-widest">Total: {totalHorasGeral}h</div>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead>
                      <tr className="text-[9px] uppercase text-gray-400 font-black border-b border-gray-100">
                         <th className="px-8 py-6">Item</th>
                         <th className="px-8 py-6">Data</th>
                         <th className="px-8 py-6">Descrição</th>
                         <th className="px-8 py-6 text-center">Horas</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                      {loading ? (
                        <tr><td colSpan={4} className="p-20 text-center font-black uppercase text-[10px] tracking-[4px] text-gray-300 animate-pulse">Calculando métricas...</td></tr>
                      ) : filteredTickets.length === 0 ? (
                        <tr><td colSpan={4} className="p-20 text-center font-bold text-sm text-gray-400 italic">Nenhum chamado registrado neste período.</td></tr>
                      ) : filteredTickets.map((t, index) => (
                        <tr key={t.id} className="hover:bg-gray-50/50 transition-all">
                          <td className="px-8 py-6 text-xs font-black text-gray-300">{index + 1}</td>
                          <td className="px-8 py-6 text-xs font-bold">{new Date(t.created_at).toLocaleDateString('pt-BR')}</td>
                          <td className="px-8 py-6 text-sm font-medium text-gray-600 max-w-md truncate">{t.description || t.title}</td>
                          <td className="px-8 py-6 text-center font-black">{t.estimated_hours}h</td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}
