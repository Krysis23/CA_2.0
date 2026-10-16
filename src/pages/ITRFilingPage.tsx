import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { ArrowLeft, UploadCloud, Loader2, FileText, CheckCircle2, Download, ShieldCheck, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Logo from '@/components/Logo';

interface AnalyzeResult {
  analysis_summary: string;
  itr_form: string;
  checklist: string[];
  missing_info: string[];
}

export default function ITRFilingPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<AnalyzeResult | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsUploading(true);
    setResult(null);

    try {
      // 1. Upload the file to extract data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('context', 'itr');

      const uploadRes = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error('Failed to process document');
      }

      const uploadData = await uploadRes.json();
      const extractedData = uploadData.doc_data || {};

      // 2. Send extracted data for ITR Quick Analysis
      const analyzeRes = await fetch('http://localhost:8000/api/itr/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extracted_data: extractedData }),
      });

      if (!analyzeRes.ok) {
        throw new Error('Failed to analyze ITR requirements');
      }

      const analyzeData: AnalyzeResult = await analyzeRes.json();
      setResult(analyzeData);
      toast.success("Analysis complete! Recommended form classified.");

    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setIsUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    maxFiles: 1,
    disabled: isUploading
  });

  const exportPDF = () => {
    if (!result) return;
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text("FINPILOT - Income Tax Return Checklist", 14, 22);
    
    doc.setFontSize(12);
    doc.text(`Recommended Form: ${result.itr_form}`, 14, 32);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    const splitSummary = doc.splitTextToSize(`Analysis Summary: ${result.analysis_summary}`, 180);
    doc.text(splitSummary, 14, 40);
    
    let currentY = 40 + (splitSummary.length * 5) + 5;
    
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Required Documents:", 14, currentY);
    currentY += 5;
    
    const checklistData = result.checklist.map(item => [item]);
    
    autoTable(doc, {
      startY: currentY,
      head: [['Document Name']],
      body: checklistData,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] },
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 10;
    
    if (result.missing_info.length > 0) {
       doc.setFontSize(14);
       doc.text("Additional Details Needed:", 14, currentY);
       currentY += 5;
       const missingData = result.missing_info.map(item => [item]);
       autoTable(doc, {
         startY: currentY,
         head: [['Detail / Question']],
         body: missingData,
         theme: 'grid',
         headStyles: { fillColor: [245, 158, 11] },
       });
    }

    doc.save(`FINPILOT_Checklist_${result.itr_form || 'Tax'}.pdf`);
  };

  return (
    <div className="min-h-screen bg-[#070B13] text-white p-6 md:p-10 overflow-y-auto scrollbar-thin fin-grid-pattern">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation & Header */}
        <div className="flex flex-col gap-3 pb-4 border-b border-white/[0.08]">
          <Link
            to="/itr-hub"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors w-fit p-1.5 rounded-lg hover:bg-white/5"
          >
            <ArrowLeft size={15} /> Back to ITR Hub
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Logo size="sm" />
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold">
                  INSTANT ANALYSER
                </span>
              </div>
              <h1 className="text-2xl font-black text-white font-display">
                Quick 30-Second ITR Document Analyse
              </h1>
              <p className="text-[10px] font-mono text-emerald-400 uppercase font-semibold">
                MULTI-DOCUMENT FINANCIAL REASONING AND GUIDED TAX FILING
              </p>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-slate-300 font-mono">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>Statutory Rule Engine Active</span>
            </div>
          </div>
        </div>

        {/* Dropzone Upload Area */}
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-3xl p-10 sm:p-14 text-center transition-all cursor-pointer relative overflow-hidden glass-card ${
            isDragActive
              ? 'border-emerald-400 bg-emerald-500/10'
              : 'border-white/15 hover:border-emerald-500/50 hover:bg-[#0E1524]'
          } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />
          
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 text-emerald-400 shadow-xl shadow-emerald-500/10">
            {isUploading ? (
              <Loader2 size={30} className="animate-spin text-emerald-400" />
            ) : (
              <UploadCloud size={30} className="text-emerald-400" />
            )}
          </div>
          
          <h3 className="text-base font-bold text-white mb-1 font-display">
            {isUploading ? 'Auditing & Mapping Taxpayer Document...' : 'Drop your financial statement here'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            {isUploading
              ? 'Extracting structured financial metrics via Gemini 1.5 and mapping to Income Tax Rules'
              : 'Accepts PDF, Form 16, AIS, or Bank Statement images up to 10MB'}
          </p>
          <div className="mt-4 inline-flex items-center gap-2 text-[10px] font-mono px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-slate-400">
            <span>Click or drag file to start</span>
          </div>
        </div>

        {/* Results Area */}
        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-5"
          >
            {/* Form Recommendation Box */}
            <div className="md:col-span-1 glass-card rounded-2xl p-6 border border-emerald-500/30 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500 to-cyan-500" />
              <p className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider mb-2">
                Recommended ITR Form
              </p>
              <div className="text-4xl font-black text-white font-display my-2 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                {result.itr_form}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mt-3 border-t border-white/[0.08] pt-3">
                {result.analysis_summary}
              </p>
            </div>

            {/* Checklist & Missing Info */}
            <div className="md:col-span-2 glass-card rounded-2xl p-6 border border-white/[0.08] shadow-2xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-emerald-400" />
                  <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                    Required Return Disclosures
                  </h3>
                </div>
                <button 
                  onClick={exportPDF}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-xl transition-all border border-emerald-500/30 shadow-sm"
                >
                  <Download size={14} />
                  Download PDF Checklist
                </button>
              </div>
              
              <div>
                {result.checklist.length > 0 ? (
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {result.checklist.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-200 bg-[#0E1524] p-3 rounded-xl border border-white/[0.06]">
                        <CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-400">No specific documents identified.</p>
                )}
              </div>

              {result.missing_info.length > 0 && (
                <div className="pt-4 border-t border-white/[0.08] space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                    <AlertCircle size={14} />
                    <span>Additional Details Needed for Accurate Filing</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-xs text-slate-300">
                    {result.missing_info.map((info, idx) => (
                      <li key={idx} className="text-slate-300">{info}</li>
                    ))}
                  </ul>
                  <p className="text-[11px] text-slate-400 pt-1">
                    For full multi-step guidance, switch to the{' '}
                    <Link to="/itr-chat" className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-2">
                      Guided ITR Copilot
                    </Link>.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
